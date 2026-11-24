import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { createParty } from "./books.ts";
import { commandCenter, setSpendingCeiling, type Sql } from "./company-store.ts";
import { runControlCycle, setControlHalt, setControlPolicy } from "./control-loop.ts";
import { addRelationship, evaluateDependencies, loadDependencyPlan, retireRelationship } from "./dependencies.ts";
import { openVenture, waiveObligation } from "./venture.ts";

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

test("a dependency stays inside the company and cannot be duplicated or self-referential", async () => {
  const { db, sql } = await migrated();
  const owner = "user_dep";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  const other = (await commandCenter(sql, "user_dep_b")).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk with an ordered checklist.", structure: "llc" });
  await openVenture(sql, { orgId: other, actorId: "user_dep_b", name: "Other Desk", idea: "Another company's checklist.", structure: "llc" });
  const own = (await db.query<{ id: string }>("select id from obligations where organization_id = $1 and autonomy = 'prepare' order by created_at, id", [orgId])).rows;
  const foreign = (await db.query<{ id: string }>("select id from obligations where organization_id = $1 limit 1", [other])).rows[0];
  assert.ok(own[0] && own[1] && foreign);
  await assert.rejects(addRelationship(sql, {
    orgId, actorId: "svc:nexus", relation: "depends_on", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: own[1].id,
  }), /agent cannot/);
  await db.query("update memberships set role = 'operator' where user_id = $1", [owner]);
  await assert.rejects(addRelationship(sql, {
    orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: own[1].id,
  }), /owner/);
  await db.query("update memberships set role = 'owner' where user_id = $1", [owner]);
  await assert.rejects(addRelationship(sql, {
    orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: own[0].id,
  }), /itself/);
  await assert.rejects(addRelationship(sql, {
    orgId, actorId: owner, relation: "depends_on", sourceType: "widget", sourceId: own[0].id, targetType: "obligation", targetId: own[1].id,
  }), /record type/);
  await assert.rejects(addRelationship(sql, {
    orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: foreign.id,
  }), /not in this company/);
  await assert.rejects(addRelationship(sql, {
    orgId, actorId: owner, relation: "invented", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: own[1].id,
  }), /not one this company/);
  const id = await addRelationship(sql, {
    orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: own[1].id,
  });
  await assert.rejects(addRelationship(sql, {
    orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: own[1].id,
  }), /already active/);
  const raced = await Promise.allSettled([
    addRelationship(sql, {
      orgId, actorId: owner, relation: "related_to", sourceType: "obligation", sourceId: own[2].id, targetType: "obligation", targetId: own[3].id,
    }),
    addRelationship(sql, {
      orgId, actorId: owner, relation: "related_to", sourceType: "obligation", sourceId: own[2].id, targetType: "obligation", targetId: own[3].id,
    }),
  ]);
  assert.equal(raced.filter((item) => item.status === "fulfilled").length, 1);
  assert.equal(await count(db, "select count(*)::int as n from organizational_relationships where organization_id = $1 and relation = 'related_to' and state = 'active'", [orgId]), 1);
  await assert.rejects(retireRelationship(sql, { orgId, actorId: "svc:nexus", relationshipId: id }), /agent cannot/);
  await retireRelationship(sql, { orgId, actorId: owner, relationshipId: id });
  assert.equal(await count(db, "select count(*)::int as n from organizational_relationships where id = $1 and state = 'retired'", [id]), 1);
  await assert.rejects(db.query("delete from organizational_relationships where id = $1", [id]), /cannot be deleted/);
  const again = await addRelationship(sql, {
    orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: own[0].id, targetType: "obligation", targetId: own[1].id,
  });
  assert.notEqual(again, id);
  assert.equal((await loadDependencyPlan(sql, other)).relationships.length, 0);
  assert.equal(await count(db, "select count(*)::int as n from organizational_relationships where organization_id = $1", [other]), 0);
  await db.close();
});

test("dependencies explain order, and the control loop still cannot authorize work", async () => {
  const { db, sql } = await migrated();
  const owner = "user_plan";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  const other = (await commandCenter(sql, "user_plan_b")).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk with an ordered checklist.", structure: "llc" });
  await setSpendingCeiling(sql, owner, "100.00");
  const rows = (await db.query<{ id: string; autonomy: string; title: string }>(
    "select id, autonomy, title from obligations where organization_id = $1 order by created_at, id",
    [orgId],
  )).rows;
  const prepare = rows.filter((row) => row.autonomy === "prepare");
  const restricted = rows.find((row) => row.autonomy === "restricted");
  assert.ok(prepare.length >= 9 && restricted);
  const [p0, p1, p2, p3, p4, p5, p6, p7, p8] = prepare;
  assert.ok(p0 && p1 && p2 && p3 && p4 && p5 && p6 && p7 && p8);
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings where organization_id = $1", [orgId]), 0);
  const partyId = await createParty(sql, { orgId, actorId: owner, kind: "person", displayName: "Ada Owner" });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p0.id, targetType: "obligation", targetId: p1.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p1.id, targetType: "obligation", targetId: p2.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p3.id, targetType: "obligation", targetId: p4.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p4.id, targetType: "obligation", targetId: p3.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "requires_approval", sourceType: "obligation", sourceId: p5.id, targetType: "party", targetId: partyId });
  await addRelationship(sql, { orgId, actorId: owner, relation: "blocks", sourceType: "obligation", sourceId: p8.id, targetType: "obligation", targetId: p7.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "related_to", sourceType: "obligation", sourceId: p2.id, targetType: "party", targetId: partyId });
  const venture = (await db.query<{ id: string }>("select id from ventures where organization_id = $1", [orgId])).rows[0];
  assert.ok(venture);
  await db.query(
    "insert into obligations (id, organization_id, venture_id, domain, autonomy, title) values ('obl_extra', $1, $2, 'product', 'prepare', 'Extra prerequisite')",
    [orgId, venture.id],
  );
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p6.id, targetType: "obligation", targetId: "obl_extra" });
  await db.query("delete from obligations where id = 'obl_extra' and organization_id = $1", [orgId]);
  await db.query(
    "insert into projects (id, organization_id, name, created_by) values ('prj_dep', $1, 'Checklist', $2)",
    [orgId, owner],
  );
  await db.query(
    "insert into tasks (id, organization_id, project_id, objective, state, created_by) values ('tsk_dep', $1, 'prj_dep', 'Write the checklist', 'READY', $2)",
    [orgId, owner],
  );
  await db.query(
    "insert into missions (id, organization_id, title, objective, status, created_by) values ('msn_wait', $1, 'Waiting packet', 'Wait for the owner.', 'AWAITING_ACCEPTANCE', $2)",
    [orgId, owner],
  );
  const first = await evaluateDependencies(sql, orgId);
  const order = first.sequence.map((step) => step.recordId);
  assert.ok(order.indexOf(p2.id) >= 0 && order.indexOf(p2.id) < order.indexOf(p1.id) && order.indexOf(p1.id) < order.indexOf(p0.id));
  assert.equal(order.includes(p3.id), false);
  assert.equal(first.items.find((item) => item.recordId === p0.id)?.status, "blocked");
  assert.equal(first.items.find((item) => item.recordId === p1.id)?.status, "blocked");
  assert.equal(first.items.find((item) => item.recordId === p3.id)?.status, "circular");
  assert.equal(first.items.find((item) => item.recordId === p4.id)?.status, "circular");
  assert.equal(first.items.find((item) => item.recordId === p5.id)?.status, "approval");
  assert.equal(first.items.find((item) => item.recordId === p7.id)?.status, "blocked");
  assert.equal(first.items.find((item) => item.recordId === p6.id)?.status, "missing");
  assert.equal(first.items.find((item) => item.recordId === p2.id)?.status, "unassigned");
  assert.equal(first.items.find((item) => item.recordId === "msn_wait")?.status, "approval");
  assert.ok(first.items.find((item) => item.recordId === p0.id)?.evidence.includes(p1.title) || first.items.find((item) => item.recordId === p0.id)?.evidence.includes("Unfinished"));
  assert.match(first.deadlineNote, /No reliable deadline/);
  assert.equal(first.items.some((item) => item.status === "ready" && item.evidence.toLowerCase().includes("overdue")), false);
  const again = await loadDependencyPlan(sql, orgId);
  assert.deepEqual(again.sequence.map((step) => step.recordId), first.sequence.map((step) => step.recordId));
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings"), 0);

  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p2.id, targetType: "task", targetId: "tsk_dep" });
  assert.equal((await evaluateDependencies(sql, orgId)).items.find((item) => item.recordId === p2.id)?.status, "blocked");
  await db.query("update tasks set state = 'COMPLETED' where id = 'tsk_dep'");
  assert.notEqual((await evaluateDependencies(sql, orgId)).items.find((item) => item.recordId === p2.id)?.status, "blocked");

  const noticed = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(noticed.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and id <> 'msn_wait'", [orgId]), 0);
  const blockedKey = `dep:blocked:obligation:${p0.id}`;
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings where organization_id = $1 and idempotency_key = $2 and state = 'active'", [orgId, blockedKey]), 1);
  const findings = await count(db, "select count(*)::int as n from dependency_findings where organization_id = $1", [orgId]);
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings where organization_id = $1", [orgId]), findings);
  await waiveObligation(sql, { orgId, actorId: owner, obligationId: p1.id, reason: "The middle record is satisfied." });
  const stillBlocked = await evaluateDependencies(sql, orgId);
  assert.equal(stillBlocked.items.find((item) => item.recordId === p0.id)?.status, "blocked");
  assert.match(stillBlocked.items.find((item) => item.recordId === p0.id)?.evidence ?? "", /Unfinished/);
  assert.ok((stillBlocked.items.find((item) => item.recordId === p0.id)?.evidence ?? "").includes(p2.title));
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings where idempotency_key = $1 and state = 'active'", [blockedKey]), 1);
  await waiveObligation(sql, { orgId, actorId: owner, obligationId: p2.id, reason: "The further prerequisite is satisfied." });
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings where idempotency_key = $1 and state = 'retired'", [blockedKey]), 1);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and id <> 'msn_wait'", [orgId]), 0);

  await setControlPolicy(sql, { orgId, actorId: owner, level: "2" });
  await setControlHalt(sql, { orgId, actorId: owner, halted: true });
  const stopped = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(stopped.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and id <> 'msn_wait'", [orgId]), 0);
  await setControlHalt(sql, { orgId, actorId: owner, halted: false });
  const resumed = await runControlCycle(sql, { orgId, actorId: owner });
  assert.ok(resumed.proposed > 0);
  const missionFor = async (obligationId: string) => (await db.query<{ mission_id: string | null; status: string | null }>(
    "select o.mission_id, m.status from obligations o left join missions m on m.id = o.mission_id where o.id = $1",
    [obligationId],
  )).rows[0];
  assert.equal((await missionFor(p7.id))?.mission_id, null);
  assert.equal((await missionFor(p6.id))?.mission_id, null);
  assert.equal((await missionFor(p3.id))?.mission_id, null);
  assert.equal((await missionFor(p5.id))?.mission_id, null);
  assert.equal((await missionFor(restricted.id))?.mission_id, null);
  const proposed = await missionFor(p0.id);
  assert.ok(proposed?.mission_id);
  assert.equal(proposed?.status, "PROPOSED");
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and status <> 'PROPOSED' and id <> 'msn_wait'", [orgId]), 0);
  const missionCount = await count(db, "select count(*)::int as n from missions where organization_id = $1", [orgId]);
  const findingCount = await count(db, "select count(*)::int as n from dependency_findings where organization_id = $1", [orgId]);
  const replay = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(replay.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1", [orgId]), missionCount);
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings where organization_id = $1", [orgId]), findingCount);
  await assert.rejects(db.query("delete from dependency_findings where organization_id = $1", [orgId]), /cannot be deleted/);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  assert.equal(Number((await db.query<{ spending_ceiling_cents: number }>("select spending_ceiling_cents from portfolio_limits where organization_id = $1", [orgId])).rows[0]?.spending_ceiling_cents), 10000);
  assert.equal((await db.query<{ stage: string }>("select stage from ventures where organization_id = $1", [orgId])).rows[0]?.stage, "concept");
  assert.equal(await count(db, "select count(*)::int as n from launch_authorizations"), 0);
  assert.equal(await count(db, "select count(*)::int as n from invoices"), 0);
  assert.equal((await loadDependencyPlan(sql, other)).relationships.length, 0);
  assert.equal(await count(db, "select count(*)::int as n from dependency_findings where organization_id = $1", [other]), 0);
  await db.close();
});
