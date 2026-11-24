import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { createParty } from "./books.ts";
import { commandCenter, setSpendingCeiling, type Sql } from "./company-store.ts";
import { runControlCycle, setControlHalt, setControlPolicy } from "./control-loop.ts";
import { addRelationship } from "./dependencies.ts";
import { setPriorityObjective, setPriorityPolicy } from "./priority.ts";
import { acceptSchedule, cancelSchedule, evaluateSchedule, loadSchedule, setSchedulePolicy } from "./schedule.ts";
import { canSchedule } from "./scheduler.ts";
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

function signature(plan: Awaited<ReturnType<typeof evaluateSchedule>>) {
  return plan.items.map((item) => [item.position, item.recordId, item.schedulingStatus, item.priorityClass, item.readiness, item.resourceId, item.duration, item.windowStart]);
}

test("a schedule keeps dependency order and does not invent a time", async () => {
  const { db, sql } = await migrated();
  const owner = "user_sch";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  const other = (await commandCenter(sql, "user_sch_b")).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk with an ordered checklist.", structure: "llc" });
  const prepare = (await db.query<{ id: string; title: string }>(
    "select id, title from obligations where organization_id = $1 and autonomy = 'prepare' order by title, id",
    [orgId],
  )).rows;
  assert.ok(prepare.length >= 9);
  const [p0, p1, p2, bookA, bookB, done, left, right, waiting] = prepare;
  assert.ok(p0 && p1 && p2 && bookA && bookB && done && left && right && waiting);
  const restricted = (await db.query<{ id: string }>(
    "select id from obligations where organization_id = $1 and autonomy = 'restricted' order by title, id limit 1",
    [orgId],
  )).rows[0];
  assert.ok(restricted);
  const first = await evaluateSchedule(sql, orgId);
  const second = await evaluateSchedule(sql, orgId);
  assert.deepEqual(signature(second), signature(first));
  assert.equal(first.underdetermined, true);
  assert.equal(first.availability, "unknown");
  assert.equal(first.policyVersion, 1);
  assert.equal(first.items.every((item) => item.duration === "unknown" && item.windowStart === null && item.windowEnd === null && item.availability === "unknown"), true);
  assert.equal(first.items.some((item) => item.recordType === "order" || item.recordType === "invoice" || item.recordType === "party"), false);
  assert.equal(first.items.every((item) => item.schedulingStatus !== "schedulable"), true);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans"), 0);
  assert.equal((await loadSchedule(sql, orgId)).proposed, null);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans"), 0);

  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p0.id, targetType: "obligation", targetId: p1.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: p1.id, targetType: "obligation", targetId: p2.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: left.id, targetType: "obligation", targetId: right.id });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: right.id, targetType: "obligation", targetId: left.id });
  const partyId = await createParty(sql, { orgId, actorId: owner, kind: "person", displayName: "North Assignee" });
  await addRelationship(sql, { orgId, actorId: owner, relation: "requires_approval", sourceType: "obligation", sourceId: waiting.id, targetType: "party", targetId: partyId });
  await addRelationship(sql, { orgId, actorId: owner, relation: "assigned_to", sourceType: "obligation", sourceId: bookA.id, targetType: "party", targetId: partyId });
  await addRelationship(sql, { orgId, actorId: owner, relation: "assigned_to", sourceType: "obligation", sourceId: bookB.id, targetType: "party", targetId: partyId });
  await setPriorityObjective(sql, {
    orgId, actorId: owner, level: "critical", sourceType: "obligation", sourceId: p0.id,
    reason: "The owner recorded that this checklist item is critical. It still waits.",
  });
  await setPriorityObjective(sql, {
    orgId, actorId: owner, level: "critical", sourceType: "obligation", sourceId: restricted.id,
    reason: "A person still has to do this. The schedule must not make it executable.",
  });
  const missionId = "msn_cancel_sch";
  const taskId = "tsk_cancel_sch";
  const projectId = "prj_cancel_sch";
  await db.query(
    "insert into projects (id, organization_id, name, created_by) values ($1, $2, $3, $4)",
    [projectId, orgId, "Cancelled desk", owner],
  );
  await db.query(
    "insert into missions (id, organization_id, title, objective, status, created_by) values ($1, $2, $3, $4, 'CANCELLED', $5)",
    [missionId, orgId, "Cancelled mission", "Do not schedule this.", owner],
  );
  await db.query(
    "insert into tasks (id, organization_id, project_id, objective, state, created_by) values ($1, $2, $3, $4, 'CANCELLED', $5)",
    [taskId, orgId, projectId, "Cancelled task", owner],
  );
  const foreignMission = "msn_foreign_sch";
  const foreignAgent = "agt_foreign_sch";
  const department = (await db.query<{ id: string }>("select id from departments where organization_id = $1 limit 1", [other])).rows[0];
  assert.ok(department);
  await db.query(
    "insert into agents (id, organization_id, department_id, slug, name, title, responsibility, permission_level) values ($1, $2, $3, $4, $5, $6, $7, 1)",
    [foreignAgent, other, department.id, "outside-agent", "Outside", "Clerk", "Not eligible here."],
  );
  await db.query(
    "insert into missions (id, organization_id, title, objective, status, created_by) values ($1, $2, $3, $4, 'PROPOSED', $5)",
    [foreignMission, orgId, "Proposed only", "This mission is not authorized.", owner],
  );
  await db.query(
    "insert into assignments (id, mission_id, organization_id, agent_slug, department_slug, title, brief, position, status) values ($1, $2, $3, 'outside-agent', 'research', 'Foreign slot', 'Do not use', 1, 'READY')",
    ["asg_foreign_sch", foreignMission, orgId],
  );

  const reading = await evaluateSchedule(sql, orgId);
  const again = await evaluateSchedule(sql, orgId);
  assert.deepEqual(signature(again), signature(reading));
  const pos = (id: string) => reading.items.find((item) => item.recordId === id)?.position ?? -1;
  assert.ok(pos(p2.id) < pos(p1.id) && pos(p1.id) < pos(p0.id));
  const critical = reading.items.find((item) => item.recordId === p0.id);
  assert.equal(critical?.priorityClass, "P0");
  assert.equal(critical?.schedulingStatus, "blocked");
  assert.equal(critical?.executable, false);
  const held = reading.items.find((item) => item.recordId === restricted.id);
  assert.equal(held?.schedulingStatus, "restricted");
  assert.equal(held?.executable, false);
  assert.equal(reading.items.find((item) => item.recordId === waiting.id)?.schedulingStatus, "approval");
  assert.equal(reading.items.find((item) => item.recordId === left.id)?.readiness, "circular");
  assert.equal(reading.items.find((item) => item.recordId === left.id)?.schedulingStatus, "blocked");
  assert.equal(reading.items.find((item) => item.recordId === right.id)?.executable, false);
  assert.equal(reading.items.find((item) => item.recordId === missionId)?.schedulingStatus, "excluded");
  assert.equal(reading.items.find((item) => item.recordId === taskId)?.schedulingStatus, "excluded");
  const proposed = reading.items.find((item) => item.recordId === foreignMission);
  assert.equal(proposed?.schedulingStatus, "proposed");
  assert.equal(proposed?.executable, false);
  assert.match(proposed?.reason ?? "", /outside-agent/);
  assert.equal(reading.items.some((item) => item.resourceId === foreignAgent), false);
  const earlier = [bookA, bookB].sort((leftItem, rightItem) => leftItem.title.localeCompare(rightItem.title) || leftItem.id.localeCompare(rightItem.id))[0];
  const later = earlier?.id === bookA.id ? bookB : bookA;
  assert.equal(reading.items.find((item) => item.recordId === earlier?.id)?.schedulingStatus, "schedulable");
  assert.equal(reading.items.find((item) => item.recordId === later.id)?.schedulingStatus, "conflict");
  assert.equal(reading.conflicts.some((item) => item.recordId === later.id), true);
  assert.equal(reading.items.find((item) => item.recordId === p2.id)?.schedulingStatus, "unassigned");
  assert.equal(canSchedule({
    scheduler: "running", missionStatus: "PROPOSED", assignmentStatus: "READY", parentAccepted: true, missionBusy: false, priorOpen: false,
  }), false);

  await waiveObligation(sql, { orgId, actorId: owner, obligationId: p1.id, reason: "The middle record is done." });
  await waiveObligation(sql, { orgId, actorId: owner, obligationId: done.id, reason: "This checklist item is done." });
  const walked = await evaluateSchedule(sql, orgId);
  assert.equal(walked.items.find((item) => item.recordId === p1.id)?.schedulingStatus, "excluded");
  assert.equal(walked.items.find((item) => item.recordId === done.id)?.schedulingStatus, "excluded");
  const still = walked.items.find((item) => item.recordId === p0.id);
  assert.equal(still?.schedulingStatus, "blocked");
  assert.equal(still?.executable, false);
  assert.ok((still?.position ?? 0) > (walked.items.find((item) => item.recordId === p2.id)?.position ?? 99));
  assert.match(still?.dependencyNote ?? "", new RegExp(p2.title.slice(0, 24).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await assert.rejects(setSchedulePolicy(sql, { orgId, actorId: "svc:nexus", version: "1" }), /agent cannot/);
  await assert.rejects(setSchedulePolicy(sql, { orgId, actorId: owner, version: "2" }), /version 1/);
  await setSchedulePolicy(sql, { orgId, actorId: owner, version: "1" });
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans"), 0);
  await db.close();
});

test("accepting a schedule does not authorize work, and a stopped cycle does not write one", async () => {
  const { db, sql } = await migrated();
  const owner = "user_sch_c";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  const other = (await commandCenter(sql, "user_sch_d")).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk with a proposed order.", structure: "llc" });
  await setSpendingCeiling(sql, owner, "100.00");
  const prepare = (await db.query<{ id: string; autonomy: string }>(
    "select id, autonomy from obligations where organization_id = $1 and autonomy = 'prepare' order by title, id",
    [orgId],
  )).rows;
  assert.ok(prepare.length >= 4);
  const restricted = (await db.query<{ id: string }>(
    "select id from obligations where organization_id = $1 and autonomy = 'restricted' order by title, id limit 1",
    [orgId],
  )).rows[0];
  const blocked = prepare[0];
  const gate = prepare[1];
  assert.ok(blocked && gate && restricted);
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: blocked.id, targetType: "obligation", targetId: gate.id });
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1", [orgId]), 0);
  await loadSchedule(sql, orgId);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1", [orgId]), 0);
  await setControlHalt(sql, { orgId, actorId: owner, halted: true });
  assert.equal((await runControlCycle(sql, { orgId, actorId: owner })).proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1", [orgId]), 0);
  await setControlHalt(sql, { orgId, actorId: owner, halted: false });
  const opened = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(opened.proposed, 0);
  const stored = (await db.query<{ id: string }>("select id from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId])).rows[0];
  assert.ok(stored);
  const events = await count(db, "select count(*)::int as n from schedule_events where organization_id = $1", [orgId]);
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId]), 1);
  assert.equal(await count(db, "select count(*)::int as n from schedule_events where organization_id = $1", [orgId]), events);
  await setControlHalt(sql, { orgId, actorId: owner, halted: true });
  await addRelationship(sql, { orgId, actorId: owner, relation: "depends_on", sourceType: "obligation", sourceId: gate.id, targetType: "obligation", targetId: prepare[2]?.id ?? gate.id });
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal((await db.query<{ id: string }>("select id from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId])).rows[0]?.id, stored.id);
  await setControlHalt(sql, { orgId, actorId: owner, halted: false });
  await runControlCycle(sql, { orgId, actorId: owner });
  const next = (await db.query<{ id: string }>("select id from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId])).rows[0];
  assert.ok(next);
  assert.notEqual(next.id, stored.id);
  assert.equal((await db.query<{ state: string }>("select state from schedule_plans where id = $1", [stored.id])).rows[0]?.state, "superseded");
  await assert.rejects(acceptSchedule(sql, { orgId, actorId: "svc:nexus" }), /agent cannot/);
  await assert.rejects(cancelSchedule(sql, { orgId, actorId: "svc:nexus", which: "proposed" }), /agent cannot/);
  await db.query("update memberships set role = 'operator' where user_id = $1", [owner]);
  await assert.rejects(acceptSchedule(sql, { orgId, actorId: owner }), /owner/);
  await db.query("update memberships set role = 'owner' where user_id = $1", [owner]);
  await assert.rejects(acceptSchedule(sql, { orgId: other, actorId: "user_sch_d" }), /not an open proposal/);
  const invoicesBefore = await count(db, "select count(*)::int as n from invoices");
  await acceptSchedule(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'accepted'", [orgId]), 1);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId]), 0);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and status = 'AUTHORIZED'", [orgId]), 0);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  assert.equal(await count(db, "select count(*)::int as n from launch_authorizations"), 0);
  assert.equal(await count(db, "select count(*)::int as n from invoices"), invoicesBefore);
  assert.equal(Number((await db.query<{ spending_ceiling_cents: number }>("select spending_ceiling_cents from portfolio_limits where organization_id = $1", [orgId])).rows[0]?.spending_ceiling_cents), 10000);
  await addRelationship(sql, { orgId, actorId: owner, relation: "assigned_to", sourceType: "obligation", sourceId: prepare[3]?.id ?? gate.id, targetType: "party", targetId: (await createParty(sql, { orgId, actorId: owner, kind: "person", displayName: "Desk Owner" })) });
  await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'accepted'", [orgId]), 1);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId]), 1);
  await acceptSchedule(sql, { orgId, actorId: owner });
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'accepted'", [orgId]), 1);
  assert.ok(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'superseded'", [orgId]) >= 2);
  await cancelSchedule(sql, { orgId, actorId: owner, which: "accepted" });
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'accepted'", [orgId]), 0);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'cancelled'", [orgId]), 1);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and status <> 'PROPOSED'", [orgId]), 0);
  const activeBefore = await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId]);
  const raced = await Promise.allSettled([
    runControlCycle(sql, { orgId, actorId: owner }),
    runControlCycle(sql, { orgId, actorId: owner }),
  ]);
  assert.equal(raced.filter((item) => item.status === "fulfilled").length, 2);
  const proposedAfter = await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1 and state = 'proposed'", [orgId]);
  assert.equal(proposedAfter, activeBefore === 0 ? 1 : activeBefore);
  await assert.rejects(db.query("delete from schedule_plans where organization_id = $1", [orgId]), /cannot be deleted/);
  await assert.rejects(db.query("delete from schedule_items where organization_id = $1", [orgId]), /cannot be deleted/);
  await assert.rejects(db.query("delete from schedule_events where organization_id = $1", [orgId]), /cannot be deleted/);
  await setControlPolicy(sql, { orgId, actorId: owner, level: "2" });
  const delegated = await runControlCycle(sql, { orgId, actorId: owner });
  assert.ok(delegated.proposed >= 0);
  const missionFor = async (obligationId: string) => (await db.query<{ mission_id: string | null; status: string | null }>(
    "select o.mission_id, m.status from obligations o left join missions m on m.id = o.mission_id and m.organization_id = o.organization_id where o.id = $1",
    [obligationId],
  )).rows[0];
  assert.equal((await missionFor(blocked.id))?.mission_id, null);
  assert.equal((await missionFor(restricted.id))?.mission_id, null);
  assert.equal(await count(db, "select count(*)::int as n from missions where organization_id = $1 and status <> 'PROPOSED'", [orgId]), 0);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  assert.equal(await count(db, "select count(*)::int as n from launch_authorizations"), 0);
  assert.equal(await count(db, "select count(*)::int as n from schedule_plans where organization_id = $1", [other]), 0);
  assert.equal((await db.query<{ stage: string }>("select stage from ventures where organization_id = $1", [orgId])).rows[0]?.stage, "concept");
  assert.equal(await setPriorityPolicy(sql, { orgId, actorId: owner, version: "1" }), undefined);
  await db.close();
});
