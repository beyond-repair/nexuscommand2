import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { assignRole, createOffer, createParty } from "./books.ts";
import { commandCenter, setSpendingCeiling, type Sql } from "./company-store.ts";
import { addRelationship, retireRelationship } from "./dependencies.ts";
import { runControlCycle, setControlHalt, setControlPolicy } from "./control-loop.ts";
import { evaluatePriority, loadPriorityPlan, setPriorityObjective, setPriorityPolicy } from "./priority.ts";
import { acceptQuote, addQuoteLine, createQuote, invoiceOrder, issueQuote, openVenture, waiveObligation } from "./venture.ts";

function wrap(db: PGlite): Sql {
  const sql = (async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    const result = await db.query<T>(text, values);
    return result.rows;
  }) as Sql;
  sql.transaction = async <T>(fn: (tx: Sql) => Promise<T>): Promise<T> =>
    db.transaction(async (tx) => {
      const inner = (async <R>(strings: TemplateStringsArray, ...values: unknown[]): Promise<R[]> => {
        let text = strings[0] ?? "";
        for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
        const result = await tx.query<R>(text, values);
        return result.rows;
      }) as Sql;
      return fn(inner);
    });
  return sql;
}

async function migrated(): Promise<{ db: PGlite; sql: Sql }> {
  const db = new PGlite();
  const directory = join(dirname(fileURLToPath(import.meta.url)), "../../../migrations");
  const files = readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) await db.exec(readFileSync(join(directory, name), "utf8"));
  return { db, sql: wrap(db) };
}

async function count(db: PGlite, text: string, params: unknown[] = []): Promise<number> {
  const result = await db.query<{ n: number }>(text, params);
  return Number(result.rows[0]?.n ?? 0);
}

function signature(plan: Awaited<ReturnType<typeof evaluatePriority>>) {
  return plan.sequence.map((item) => [item.recordId, item.classification, item.readiness, item.recommendation, item.positionReason]);
}

test("priority stays explainable, and a finished middle record does not hide the next dependency", async () => {
  const { db, sql } = await migrated();
  const owner = "user_pri";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk with an ordered checklist.", structure: "llc" });
  const prepare = (await db.query<{ id: string; title: string }>(
    "select id, title from obligations where organization_id = $1 and autonomy = 'prepare' order by title, id",
    [orgId],
  )).rows;
  assert.ok(prepare.length >= 4);
  const [low, p0, p1, p2] = prepare;
  assert.ok(low && p0 && p1 && p2);
  const first = await evaluatePriority(sql, orgId);
  const second = await evaluatePriority(sql, orgId);
  assert.deepEqual(signature(second), signature(first));
  assert.equal(first.policyVersion, 1);
  assert.equal(first.items.every((item) => item.completeness === "partial"), true);
  assert.equal(first.items.every((item) => item.factors.some((factor) => factor.name === "deadline" && factor.known === false && factor.value === "unknown" && factor.points === 0)), true);
  assert.equal(first.items.every((item) => item.factors.some((factor) => factor.name === "cash" && factor.known === false && factor.points === 0)), true);
  assert.equal(first.items.some((item) => item.factors.some((factor) => factor.name === "deadline" && factor.points !== 0)), false);
  assert.match(first.deadlineNote, /Nothing is marked overdue/);
  const lowItem = first.items.find((item) => item.recordId === low.id);
  assert.ok(lowItem);
  assert.equal(lowItem.classification === "P0" || lowItem.classification === "P1", false);
  const unassigned = first.sequence.filter((item) => item.classification === "P3" && item.readiness === "unassigned").map((item) => item.label);
  assert.deepEqual(unassigned, [...unassigned].sort((a, b) => a.localeCompare(b) || a.localeCompare(b)));
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p0.id, targetType: "obligation", targetId: p1.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p1.id, targetType: "obligation", targetId: p2.id });
  const chained = await evaluatePriority(sql, orgId);
  const order = chained.sequence.map((item) => item.recordId);
  assert.ok(order.indexOf(p2.id) < order.indexOf(p1.id) && order.indexOf(p1.id) < order.indexOf(p0.id));
  assert.equal(chained.items.find((item) => item.recordId === p0.id)?.readiness, "blocked");
  assert.equal(chained.items.find((item) => item.recordId === p0.id)?.recommendation, "resolve_blocker");
  await waiveObligation(sql, { orgId, actorId: owner, obligationId: p1.id, reason: "The middle record is done." });
  const walked = await evaluatePriority(sql, orgId);
  const held = walked.items.find((item) => item.recordId === p0.id);
  assert.equal(held?.readiness, "blocked");
  assert.match(held?.explanation ?? "", new RegExp(p2.title.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.notEqual(held?.recommendation, "do_now");
  await assert.rejects(setPriorityObjective(sql, {
    orgId, actorId: "svc:nexus", level: "critical", sourceType: "obligation", sourceId: low.id, reason: "An agent must not invent urgency.",
  }), /agent cannot/);
  await db.query("update memberships set role = 'operator' where user_id = $1", [owner]);
  await assert.rejects(setPriorityObjective(sql, {
    orgId, actorId: owner, level: "critical", sourceType: "obligation", sourceId: low.id, reason: "Only the owner can mark this critical.",
  }), /owner/);
  await db.query("update memberships set role = 'owner' where user_id = $1", [owner]);
  await assert.rejects(setPriorityPolicy(sql, { orgId, actorId: "svc:nexus", version: "1" }), /agent cannot/);
  await assert.rejects(setPriorityPolicy(sql, { orgId, actorId: owner, version: "2" }), /version 1/);
  await setPriorityPolicy(sql, { orgId, actorId: owner, version: "1" });
  const plain = await evaluatePriority(sql, orgId);
  assert.notEqual(plain.items.find((item) => item.recordId === low.id)?.classification, "P0");
  await setPriorityObjective(sql, {
    orgId, actorId: owner, level: "critical", sourceType: "obligation", sourceId: low.id,
    reason: "The owner recorded that this checklist stops the desk from opening.",
  });
  const marked = await evaluatePriority(sql, orgId);
  const critical = marked.items.find((item) => item.recordId === low.id);
  assert.equal(critical?.classification, "P0");
  assert.match(critical?.explanation ?? "", /owner recorded a critical objective/);
  assert.equal(critical?.factors.find((factor) => factor.name === "deadline")?.known, false);
  assert.equal(await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1", [orgId]), 0);
  assert.equal((await loadPriorityPlan(sql, orgId)).changes.length, 0);
  await db.close();
});

test("priority cannot authorize work, and a repeated cycle does not duplicate history", async () => {
  const { db, sql } = await migrated();
  const owner = "user_pri_b";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  const other = (await commandCenter(sql, "user_pri_c")).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk with a customer commitment.", structure: "llc" });
  await setSpendingCeiling(sql, owner, "100.00");
  const rows = (await db.query<{ id: string; autonomy: string; title: string }>(
    "select id, autonomy, title from obligations where organization_id = $1 order by title, id",
    [orgId],
  )).rows;
  const prepare = rows.filter((row) => row.autonomy === "prepare");
  const restricted = rows.find((row) => row.autonomy === "restricted");
  const blocked = prepare[0];
  const free = prepare[1];
  assert.ok(blocked && free && restricted);
  const partyId = await createParty(sql, { orgId, actorId: owner, kind: "organization", displayName: "North Client" });
  await assignRole(sql, { orgId, actorId: owner, partyId, role: "customer" });
  await createOffer(sql, { orgId, actorId: owner, kind: "service", name: "Desk install", price: "25" });
  const offerId = (await db.query<{ id: string }>("select id from offers where organization_id = $1", [orgId])).rows[0]?.id;
  assert.ok(offerId);
  const quoteId = await createQuote(sql, { orgId, actorId: owner, partyId, note: "Install the desk." });
  await addQuoteLine(sql, { orgId, actorId: owner, quoteId, offerId, quantity: "1", amount: "25" });
  await issueQuote(sql, { orgId, actorId: owner, quoteId });
  const orderId = await acceptQuote(sql, { orgId, actorId: owner, quoteId });
  const invoiceId = await invoiceOrder(sql, { orgId, actorId: owner, orderId });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: blocked.id, targetType: "order", targetId: orderId });
  const reading = await evaluatePriority(sql, orgId);
  const held = reading.items.find((item) => item.recordId === blocked.id);
  assert.equal(held?.classification, "P1");
  assert.equal(held?.readiness, "blocked");
  assert.equal(held?.recommendation, "resolve_blocker");
  assert.equal(held?.executable, false);
  assert.equal(held?.factors.find((factor) => factor.name === "customer_commitment")?.value, "recorded");
  assert.equal(held?.factors.find((factor) => factor.name === "open_claim")?.value, "recorded");
  assert.match(held?.explanation ?? "", /not cash/);
  assert.ok(reading.sequence.findIndex((item) => item.recordId === orderId) < reading.sequence.findIndex((item) => item.recordId === blocked.id));
  const quiet = reading.items.find((item) => item.recordId === free.id);
  assert.ok(quiet);
  assert.equal(quiet.classification === "P0" || quiet.classification === "P1", false);
  await setPriorityObjective(sql, {
    orgId, actorId: owner, level: "critical", sourceType: "obligation", sourceId: restricted.id,
    reason: "A person still has to file this. Priority must not make it executable.",
  });
  await setPriorityObjective(sql, {
    orgId, actorId: owner, level: "critical", sourceType: "obligation", sourceId: free.id,
    reason: "The owner recorded this research as critical. It is still not authorized.",
  });
  const invoicesBefore = await count(db, "select count(*)::int as n from invoices");
  const assisted = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(assisted.proposed, 0);
  const evaluations = await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1", [orgId]);
  const changes = await count(db, "select count(*)::int as n from priority_changes where organization_id = $1", [orgId]);
  assert.ok(evaluations > 0);
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1", [orgId]), evaluations);
  assert.equal(await count(db, "select count(*)::int as n from priority_changes where organization_id = $1", [orgId]), changes);
  await setControlPolicy(sql, { orgId, actorId: owner, level: "2" });
  await setControlHalt(sql, { orgId, actorId: owner, halted: true });
  assert.equal((await runControlCycle(sql, { orgId, actorId: owner })).proposed, 0);
  await setControlHalt(sql, { orgId, actorId: owner, halted: false });
  const resumed = await runControlCycle(sql, { orgId, actorId: owner });
  assert.ok(resumed.proposed > 0);
  const missionFor = async (obligationId: string) => (await db.query<{ mission_id: string | null; status: string | null }>(
    "select o.mission_id, m.status from obligations o left join missions m on m.id = o.mission_id and m.organization_id = o.organization_id where o.id = $1",
    [obligationId],
  )).rows[0];
  assert.equal((await missionFor(blocked.id))?.mission_id, null);
  assert.equal((await missionFor(restricted.id))?.mission_id, null);
  const proposed = await missionFor(free.id);
  assert.ok(proposed?.mission_id);
  assert.equal(proposed?.status, "PROPOSED");
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and status <> 'PROPOSED'", [orgId]), 0);
  const missionCount = await count(db, "select count(*)::int as n from missions where organization_id = $1", [orgId]);
  const replay = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(replay.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1", [orgId]), missionCount);
  const settled = await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1", [orgId]);
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1", [orgId]), settled);
  const rel = (await db.query<{ id: string }>(
    "select id from organizational_relationships where organization_id = $1 and source_id = $2 and state = 'active'",
    [orgId, blocked.id],
  )).rows[0];
  assert.ok(rel);
  await setControlHalt(sql, { orgId, actorId: owner, halted: true });
  await retireRelationship(sql, { orgId, actorId: owner, relationshipId: rel.id });
  await runControlCycle(sql, { orgId, actorId: owner });
  const changed = await count(db, "select count(*)::int as n from priority_changes where organization_id = $1 and source_id = $2", [orgId, blocked.id]);
  assert.equal(changed, 1);
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from priority_changes where organization_id = $1 and source_id = $2", [orgId, blocked.id]), 1);
  const activeBefore = await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1 and state = 'active'", [orgId]);
  const raced = await Promise.allSettled([
    runControlCycle(sql, { orgId, actorId: owner }),
    runControlCycle(sql, { orgId, actorId: owner }),
  ]);
  assert.equal(raced.filter((item) => item.status === "fulfilled").length, 2);
  assert.equal(await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1 and state = 'active'", [orgId]), activeBefore);
  await assert.rejects(db.query("delete from priority_evaluations where organization_id = $1", [orgId]), /cannot be deleted/);
  await assert.rejects(db.query("delete from priority_changes where organization_id = $1", [orgId]), /cannot be deleted/);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  assert.equal(Number((await db.query<{ spending_ceiling_cents: number }>("select spending_ceiling_cents from portfolio_limits where organization_id = $1", [orgId])).rows[0]?.spending_ceiling_cents), 10000);
  assert.equal(await count(db, "select count(*)::int as n from launch_authorizations"), 0);
  assert.equal(await count(db, "select count(*)::int as n from invoices"), invoicesBefore);
  assert.equal(await count(db, "select count(*)::int as n from invoices where id = $1", [invoiceId]), 1);
  assert.equal(await count(db, "select count(*)::int as n from priority_evaluations where organization_id = $1", [other]), 0);
  assert.equal((await db.query<{ stage: string }>("select stage from ventures where organization_id = $1", [orgId])).rows[0]?.stage, "concept");
  await db.close();
});
