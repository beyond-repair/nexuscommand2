import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { canSchedule, claimTick, eligibleMissionId, releaseTick, schedulerTick } from "./scheduler.ts";
import { runBounded } from "./sandbox-host.ts";
import type { Sql } from "./company-store.ts";

function wrap(db: PGlite): Sql {
  return (async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    const result = await db.query<T>(text, values);
    return result.rows;
  }) as Sql;
}

test("the scheduler cannot start work that is not authorized", () => {
  assert.equal(canSchedule({
    scheduler: "running",
    missionStatus: "PLANNED",
    assignmentStatus: "READY",
    parentAccepted: true,
    missionBusy: false,
    priorOpen: false,
  }), false);
  assert.equal(canSchedule({
    scheduler: "paused",
    missionStatus: "AUTHORIZED",
    assignmentStatus: "READY",
    parentAccepted: true,
    missionBusy: false,
    priorOpen: false,
  }), false);
  assert.equal(canSchedule({
    scheduler: "running",
    missionStatus: "AUTHORIZED",
    assignmentStatus: "READY",
    parentAccepted: false,
    missionBusy: false,
    priorOpen: false,
  }), false);
  assert.equal(canSchedule({
    scheduler: "running",
    missionStatus: "EXECUTING",
    assignmentStatus: "READY",
    parentAccepted: true,
    missionBusy: false,
    priorOpen: false,
  }), true);
});

test("two ticks cannot hold the lock and a restart still sees a running scheduler", async () => {
  const db = new PGlite();
  await db.exec(`
    create table organizations (id text primary key, owner_user_id text);
    create table missions (
      id text primary key,
      organization_id text not null references organizations (id),
      status text not null,
      depends_on text,
      priority integer not null default 50,
      budget_cents integer,
      updated_at timestamptz not null default now()
    );
    create table assignments (
      id text primary key,
      mission_id text not null references missions (id),
      organization_id text not null,
      status text not null,
      position integer not null
    );
    create table portfolio_limits (
      organization_id text primary key,
      max_concurrent integer not null default 1,
      spending_ceiling_cents integer
    );
    create table spec_impacts (
      mission_id text,
      revalidation text
    );
    create table payments (
      organization_id text,
      mission_id text,
      amount_cents integer,
      voided_at timestamptz,
      direction text not null default 'expenditure'
    );
    create table commitments (
      organization_id text,
      mission_id text,
      amount_cents integer,
      status text,
      kind text
    );
    create table scheduler_state (
      organization_id text primary key references organizations (id),
      status text not null,
      last_tick_at timestamptz,
      tick_lock_until timestamptz,
      last_error text not null default '',
      updated_at timestamptz not null default now()
    );
    insert into organizations (id, owner_user_id) values ('org_a', 'user_a');
    insert into missions (id, organization_id, status) values
      ('msn_plan', 'org_a', 'PLANNED'),
      ('msn_wait', 'org_a', 'AUTHORIZED'),
      ('msn_go', 'org_a', 'AUTHORIZED');
    update missions set depends_on = 'msn_plan' where id = 'msn_wait';
    insert into assignments (id, mission_id, organization_id, status, position) values
      ('asg_plan', 'msn_plan', 'org_a', 'READY', 0),
      ('asg_wait', 'msn_wait', 'org_a', 'READY', 0),
      ('asg_go', 'msn_go', 'org_a', 'READY', 0);
    insert into scheduler_state (organization_id, status) values ('org_a', 'paused');
  `);
  const sql = wrap(db);
  assert.equal(await eligibleMissionId(sql, "org_a"), "msn_go");
  assert.equal(await claimTick(sql, "org_a"), false);
  await db.exec("update scheduler_state set status = 'running' where organization_id = 'org_a'");
  const again = await db.query<{ status: string }>("select status from scheduler_state where organization_id = 'org_a'");
  assert.equal(again.rows[0]?.status, "running");
  assert.equal(await claimTick(sql, "org_a"), true);
  assert.equal(await claimTick(sql, "org_a"), false);
  await releaseTick(sql, "org_a");
  assert.equal(await claimTick(sql, "org_a"), true);
  await db.exec(`
    insert into missions (id, organization_id, status, priority, updated_at) values
      ('msn_low', 'org_a', 'AUTHORIZED', 10, now() - interval '1 hour'),
      ('msn_high', 'org_a', 'AUTHORIZED', 90, now());
    insert into assignments (id, mission_id, organization_id, status, position) values
      ('asg_low', 'msn_low', 'org_a', 'READY', 0),
      ('asg_high', 'msn_high', 'org_a', 'READY', 0);
  `);
  assert.equal(await eligibleMissionId(sql, "org_a"), "msn_high");
  await db.exec("update assignments set status = 'RUNNING' where id = 'asg_high'");
  assert.equal(await eligibleMissionId(sql, "org_a"), null);
  await db.close();
});

test("unresolved specification review and an exhausted ceiling are not scheduled", async () => {
  const db = new PGlite();
  await db.exec(`
    create table organizations (id text primary key, owner_user_id text);
    create table missions (
      id text primary key, organization_id text not null, status text not null,
      depends_on text, priority integer not null default 50, budget_cents integer,
      updated_at timestamptz not null default now()
    );
    create table assignments (
      id text primary key, mission_id text not null, organization_id text not null,
      status text not null, position integer not null
    );
    create table portfolio_limits (
      organization_id text primary key, max_concurrent integer not null default 1, spending_ceiling_cents integer
    );
    create table spec_impacts (mission_id text, revalidation text);
    create table payments (organization_id text, mission_id text, amount_cents integer, voided_at timestamptz, direction text not null default 'expenditure');
    create table commitments (organization_id text, mission_id text, amount_cents integer, status text, kind text);
    insert into organizations (id, owner_user_id) values ('org_a', 'user_a');
    insert into missions (id, organization_id, status) values ('msn_go', 'org_a', 'AUTHORIZED');
    insert into assignments (id, mission_id, organization_id, status, position) values ('asg_go', 'msn_go', 'org_a', 'READY', 0);
    insert into spec_impacts (mission_id, revalidation) values ('msn_go', 'awaiting_owner');
  `);
  const sql = wrap(db);
  assert.equal(await eligibleMissionId(sql, "org_a"), null);
  await db.exec("update spec_impacts set revalidation = 'authorized'");
  assert.equal(await eligibleMissionId(sql, "org_a"), "msn_go");
  await db.exec("insert into portfolio_limits (organization_id, max_concurrent, spending_ceiling_cents) values ('org_a', 1, 100)");
  await db.exec("insert into payments (organization_id, mission_id, amount_cents) values ('org_a', 'msn_go', 100)");
  assert.equal(await eligibleMissionId(sql, "org_a"), null);
  await db.exec("update payments set direction = 'receipt'");
  assert.equal(await eligibleMissionId(sql, "org_a"), "msn_go");
  await db.close();
});

test("a sandboxed process cannot grow a file, open the network, or leave its temp directory", async () => {
  const disk = await runBounded(process.execPath, ["-e", "require('fs').writeFileSync('big.bin','x'.repeat(2000000)); console.log('wrote')"]);
  assert.equal(disk.cleaned, true);
  assert.equal(existsSync(disk.dir), false);
  assert.notEqual(disk.code, 0);

  const net = await runBounded(process.execPath, ["-e", "const s=require('net').connect(80,'1.1.1.1'); s.on('connect',()=>process.exit(0)); s.on('error',()=>process.exit(2)); setTimeout(()=>process.exit(3),800)"]);
  assert.notEqual(net.code, 0);
  assert.equal(existsSync(net.dir), false);

  const memory = await runBounded(process.execPath, ["-e", "const b=Buffer.alloc(450*1024*1024); let n=0; for (let i=0;i<b.length;i+=4096){b[i]=1;n+=b[i];} console.log(n)"]);
  assert.notEqual(memory.code, 0);
  assert.equal(memory.killed, true);
  assert.equal(existsSync(memory.dir), false);
});

test("a running scheduler delivers pending events without a page view, and a stopped scheduler does not", async () => {
  const db = new PGlite();
  const sql = wrap(db);
  await db.exec(`
    create table organizations (id text primary key, owner_user_id text);
    insert into organizations (id, owner_user_id) values ('org_a', 'owner');
    create table execution_jobs (
      id text primary key, organization_id text, mission_id text, assignment_id text, fence text,
      status text, leased_until timestamptz, updated_at timestamptz default now()
    );
    create table assignments (
      id text primary key, mission_id text, organization_id text, status text, position integer,
      run_token text, model text, error text, updated_at timestamptz default now()
    );
    create table missions (
      id text primary key, organization_id text, title text, status text, depends_on text, parent_id text,
      priority integer default 50, budget_cents integer, updated_at timestamptz default now()
    );
    create table portfolio_limits (organization_id text primary key, max_concurrent integer, spending_ceiling_cents integer);
    create table spec_impacts (mission_id text, revalidation text);
    create table payments (mission_id text, organization_id text, amount_cents integer, voided_at timestamptz, direction text not null default 'expenditure');
    create table commitments (mission_id text, organization_id text, amount_cents integer, status text, kind text);
    create table defects (mission_id text, status text);
    create table knowledge_entries (id text primary key, organization_id text, title text, state text, confidence text);
    create table findings (
      id text primary key, organization_id text, mission_id text, finding_key text, severity text, title text,
      evidence text, recommendation text, confidence text, owner_required boolean, status text, updated_at timestamptz default now()
    );
    create table scheduler_state (
      organization_id text primary key, status text, tick_lock_until timestamptz, last_tick_at timestamptz, last_error text, updated_at timestamptz default now()
    );
    insert into scheduler_state (organization_id, status) values ('org_a', 'stopped');
    create table outbox_events (
      id text primary key, organization_id text, event_type text, schema_version integer default 1,
      correlation_id text default '', causation_id text default '', idempotency_key text unique, aggregate_type text,
      aggregate_id text, payload jsonb, actor_id text, status text, attempt integer default 0, max_attempts integer default 5,
      lease_fence text default '', leased_until timestamptz, available_at timestamptz default now(), last_error text default '',
      error_class text default '', created_at timestamptz default now(), updated_at timestamptz default now(), completed_at timestamptz
    );
    create table outbox_deliveries (event_id text primary key, organization_id text, effect text, created_at timestamptz default now());
    insert into outbox_events (
      id, organization_id, event_type, idempotency_key, aggregate_type, aggregate_id, payload, actor_id, status
    ) values (
      'obx_wait', 'org_a', 'mission.authorized', 'wait', 'mission', 'mis_1', '{"effect":"record","summary":"authorized"}'::jsonb, 'owner', 'pending'
    );
  `);
  await schedulerTick(sql, async () => ({ text: "", model: "" }));
  const stopped = await db.query<{ status: string }>("select status from outbox_events where id = 'obx_wait'");
  assert.equal(stopped.rows[0]?.status, "pending");
  await db.exec("update scheduler_state set status = 'running', tick_lock_until = null where organization_id = 'org_a'");
  const result = await schedulerTick(sql, async () => ({ text: "", model: "" }));
  assert.equal(result.ran, 0);
  const running = await db.query<{ status: string }>("select status from outbox_events where id = 'obx_wait'");
  const receipts = await db.query<{ count: number }>("select count(*)::int as count from outbox_deliveries");
  assert.equal(running.rows[0]?.status, "completed");
  assert.equal(Number(receipts.rows[0]?.count), 1);
  await db.close();
});

