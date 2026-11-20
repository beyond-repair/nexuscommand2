import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { assignRole, createOffer, createParty } from "./books.ts";
import { commandCenter, setSpendingCeiling, type Sql } from "./company-store.ts";
import { loadControl, runControlCycle, setControlHalt, setControlPolicy } from "./control-loop.ts";
import {
  acceptQuote,
  addQuoteLine,
  createInvoice,
  createQuote,
  issueInvoice,
  issueQuote,
  openVenture,
} from "./venture.ts";

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
  const rows = await db.query<{ n: number }>(text, params);
  return Number(rows.rows[0]?.n ?? 0);
}

test("assisted notices do not execute, and a later delegation still only proposes", async () => {
  const { db, sql } = await migrated();
  const owner = "user_loop";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  assert.equal((await commandCenter(sql, owner)).control.prepareLevel, 1);
  assert.equal((await commandCenter(sql, owner)).control.halted, false);
  assert.equal((await commandCenter(sql, owner)).control.lastCycle, null);
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk that keeps its own records.", structure: "llc" });

  await assert.rejects(runControlCycle(sql, { orgId, actorId: "svc:nexus" }), /agent cannot/);
  await assert.rejects(setControlPolicy(sql, { orgId, actorId: "svc:nexus", level: "2" }), /agent cannot/);
  await assert.rejects(setControlHalt(sql, { orgId, actorId: "svc:nexus", halted: true }), /agent cannot/);
  await assert.rejects(setControlPolicy(sql, { orgId, actorId: owner, level: "3" }), /Unsupervised/);
  await assert.rejects(setControlPolicy(sql, { orgId, actorId: owner, level: "4" }), /Unsupervised/);
  await db.query("update memberships set role = 'operator' where user_id = $1", [owner]);
  await assert.rejects(runControlCycle(sql, { orgId, actorId: owner }), /Only the owner/);
  await assert.rejects(setControlPolicy(sql, { orgId, actorId: owner, level: "2" }), /Only the owner/);
  await db.query("update memberships set role = 'owner' where user_id = $1", [owner]);

  const first = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(first.proposed, 0);
  assert.ok(first.decided > 0);
  assert.equal(await count(db, "select count(*)::int as n from missions"), 0);
  assert.equal(await count(db, "select count(*)::int as n from obligations where autonomy = 'restricted' and mission_id is not null"), 0);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  const noticed = await count(db, "select count(*)::int as n from control_decisions where organization_id = $1", [orgId]);
  const again = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(again.decided, 0);
  assert.equal(again.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from control_decisions where organization_id = $1", [orgId]), noticed);
  assert.equal(await count(db, "select count(*)::int as n from missions"), 0);
  const loaded = await loadControl(sql, orgId);
  assert.equal(loaded.prepareLevel, 1);
  assert.ok(loaded.lastCycle);
  assert.equal(loaded.lastCycle?.proposed, 0);
  assert.ok(loaded.decisions.every((row) => row.disposition === "notice" && row.requiresHuman && row.missionId === null));

  await setControlPolicy(sql, { orgId, actorId: owner, level: "0" });
  assert.equal((await loadControl(sql, orgId)).prepareLevel, 0);
  const manual = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(manual.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions"), 0);

  const waiting = await count(db, "select count(*)::int as n from obligations where organization_id = $1 and autonomy <> 'restricted' and mission_id is null and state in ('open', 'prepared')", [orgId]);
  assert.ok(waiting > 0);
  await setControlPolicy(sql, { orgId, actorId: owner, level: "2" });
  const delegated = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(delegated.proposed, waiting);
  assert.equal(await count(db, "select count(*)::int as n from missions"), waiting);
  assert.equal(await count(db, "select count(*)::int as n from missions where status <> 'PROPOSED'"), 0);
  assert.equal(await count(db, "select count(*)::int as n from obligations where autonomy = 'restricted' and mission_id is not null"), 0);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  const repeat = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(repeat.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions"), waiting);

  await assert.rejects(
    db.query("update control_events set summary = 'rewritten' where organization_id = $1", [orgId]),
    /cannot be changed/,
  );
  await assert.rejects(
    db.query("delete from control_events where organization_id = $1", [orgId]),
    /cannot be changed/,
  );
  await assert.rejects(
    db.query("delete from control_decisions where organization_id = $1", [orgId]),
    /cannot be changed/,
  );

  const beta = (await commandCenter(sql, "user_beta")).organization.id;
  assert.equal((await loadControl(sql, beta)).decisions.length, 0);
  assert.equal((await loadControl(sql, beta)).lastCycle, null);
  assert.equal(await count(db, "select count(*)::int as n from control_events where organization_id = $1", [beta]), 0);
  assert.equal(await count(db, "select count(*)::int as n from control_decisions where organization_id = $1", [beta]), 0);
  const center = await commandCenter(sql, owner);
  assert.equal(center.control.prepareLevel, 2);
  assert.ok((center.control.lastCycle?.proposed ?? 0) >= 0);
  await db.close();
});

test("a stopped loop, an open claim, and an unlinked order never move money or authority", async () => {
  const { db, sql } = await migrated();
  const owner = "user_halt";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "South Desk", idea: "Sell the desk without letting the loop spend.", structure: "llc" });
  await setSpendingCeiling(sql, owner, "100.00");
  const customer = await createParty(sql, { orgId, actorId: owner, kind: "person", displayName: "Ada Client" });
  await assignRole(sql, { orgId, actorId: owner, partyId: customer, role: "customer" });
  await createOffer(sql, { orgId, actorId: owner, kind: "service", name: "Desk setup", price: "40.00" });
  const offerId = (await db.query<{ id: string }>("select id from offers where organization_id = $1", [orgId])).rows[0]?.id;
  assert.ok(offerId);
  const quoteId = await createQuote(sql, { orgId, actorId: owner, partyId: customer, note: "Setup" });
  await addQuoteLine(sql, { orgId, actorId: owner, quoteId, offerId, quantity: "1", amount: "40.00" });
  await issueQuote(sql, { orgId, actorId: owner, quoteId });
  await acceptQuote(sql, { orgId, actorId: owner, quoteId });
  await createInvoice(sql, { orgId, actorId: owner, direction: "receivable", partyId: customer, offerId, title: "Setup", amount: "40.00" });
  const invoiceId = (await db.query<{ id: string }>("select id from invoices where organization_id = $1", [orgId])).rows[0]?.id;
  assert.ok(invoiceId);
  await issueInvoice(sql, { orgId, actorId: owner, invoiceId });

  await setControlPolicy(sql, { orgId, actorId: owner, level: "2" });
  await setControlHalt(sql, { orgId, actorId: owner, halted: true });
  assert.equal((await loadControl(sql, orgId)).halted, true);
  assert.equal((await loadControl(sql, orgId)).prepareLevel, 2);
  const stopped = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(stopped.proposed, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions"), 0);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  assert.equal(await count(db, "select count(*)::int as n from order_mission_links"), 0);
  assert.equal(await count(db, "select count(*)::int as n from invoices"), 1);
  const reasons = await db.query<{ operation: string }>("select operation from control_decisions where organization_id = $1", [orgId]);
  const ops = new Set(reasons.rows.map((row) => row.operation));
  assert.equal(ops.has("order.unlinked"), true);
  assert.equal(ops.has("invoice.open"), true);
  assert.equal(ops.has("obligation.restricted"), true);
  assert.equal(ops.has("work.propose"), true);

  const waiting = await count(db, "select count(*)::int as n from obligations where organization_id = $1 and autonomy <> 'restricted' and mission_id is null and state in ('open', 'prepared')", [orgId]);
  await setControlHalt(sql, { orgId, actorId: owner, halted: false });
  const resumed = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(resumed.proposed, waiting);
  assert.equal(await count(db, "select count(*)::int as n from missions where status = 'PROPOSED'"), waiting);
  assert.equal(await count(db, "select count(*)::int as n from missions where status <> 'PROPOSED'"), 0);
  assert.equal(await count(db, "select count(*)::int as n from obligations where autonomy = 'restricted' and mission_id is not null"), 0);
  assert.equal(await count(db, "select count(*)::int as n from payments"), 0);
  assert.equal(await count(db, "select count(*)::int as n from order_mission_links"), 0);
  assert.equal(await count(db, "select count(*)::int as n from invoices"), 1);
  const ceiling = await db.query<{ spending_ceiling_cents: number }>("select spending_ceiling_cents from portfolio_limits where organization_id = $1", [orgId]);
  assert.equal(Number(ceiling.rows[0]?.spending_ceiling_cents), 10000);
  const missions = await count(db, "select count(*)::int as n from missions");
  const decisions = await count(db, "select count(*)::int as n from control_decisions where organization_id = $1", [orgId]);
  const replay = await runControlCycle(sql, { orgId, actorId: owner });
  assert.equal(replay.proposed, 0);
  assert.equal(replay.decided, 0);
  assert.equal(await count(db, "select count(*)::int as n from missions"), missions);
  assert.equal(await count(db, "select count(*)::int as n from control_decisions where organization_id = $1", [orgId]), decisions);
  const persisted = await loadControl(sql, orgId);
  assert.equal(persisted.halted, false);
  assert.equal(persisted.prepareLevel, 2);
  assert.ok(persisted.decisions.some((row) => row.disposition === "proposed" && row.missionId));
  assert.ok(persisted.decisions.every((row) => row.requiresHuman));
  await db.close();
});
