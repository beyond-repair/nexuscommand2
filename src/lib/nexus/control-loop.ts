import { CompanyError } from "./company.ts";
import type { Sql } from "./company-store.ts";
import { evaluateDependencies, syncDependencyFindings, type PlanItem } from "./dependencies.ts";
import { staffObligation } from "./venture.ts";

const PROPOSE = "work.propose";

export type ControlSnapshot = {
  prepareLevel: 0 | 1 | 2;
  halted: boolean;
  lastCycle: { observed: number; decided: number; proposed: number; createdAt: string } | null;
  decisions: Array<{
    id: string;
    operation: string;
    disposition: string;
    reason: string;
    summary: string;
    requiresHuman: boolean;
    missionId: string | null;
  }>;
};

type Observation = {
  operation: string;
  eventType: string;
  sourceType: string;
  sourceId: string;
  summary: string;
  key: string;
  obligationId?: string;
  delegable: boolean;
  hold?: PlanItem;
};

function nid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function refuseAgent(actorId: string, action: string): void {
  if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

async function assertOwner(sql: Sql, orgId: string, actorId: string): Promise<void> {
  const rows = await sql<{ role: string }>`select role from memberships
    where organization_id = ${orgId} and user_id = ${actorId} limit 1`;
  if (rows[0]?.role !== "owner") throw new CompanyError("Only the owner can run the control loop.");
}

async function policyOf(sql: Sql, orgId: string): Promise<{ level: 0 | 1 | 2; halted: boolean }> {
  const rows = await sql<{ level: unknown; halted: unknown }>`select level, halted from control_policies
    where organization_id = ${orgId} and operation = ${PROPOSE} limit 1`;
  const level = Number(rows[0]?.level ?? 1);
  return {
    level: level === 0 || level === 2 ? level : 1,
    halted: rows[0] ? asBool(rows[0].halted) : false,
  };
}

export async function setControlPolicy(sql: Sql, input: { orgId: string; actorId: string; level: string }): Promise<void> {
  refuseAgent(input.actorId, "change the control loop");
  await assertOwner(sql, input.orgId, input.actorId);
  if (input.level !== "0" && input.level !== "1" && input.level !== "2") {
    throw new CompanyError("Choose manual, assisted, or delegated. Unsupervised execution is not available.");
  }
  const level = Number(input.level);
  await sql`insert into control_policies (organization_id, operation, level, updated_by)
    values (${input.orgId}, ${PROPOSE}, ${level}, ${input.actorId})
    on conflict (organization_id, operation) do update
      set level = ${level}, updated_by = ${input.actorId}, updated_at = now()`;
}

export async function setControlHalt(sql: Sql, input: { orgId: string; actorId: string; halted: boolean }): Promise<void> {
  refuseAgent(input.actorId, "stop the control loop");
  await assertOwner(sql, input.orgId, input.actorId);
  const current = await policyOf(sql, input.orgId);
  await sql`insert into control_policies (organization_id, operation, level, halted, updated_by)
    values (${input.orgId}, ${PROPOSE}, ${current.level}, ${input.halted}, ${input.actorId})
    on conflict (organization_id, operation) do update
      set halted = ${input.halted}, updated_by = ${input.actorId}, updated_at = now()`;
}

async function observe(sql: Sql, orgId: string, delegate: boolean): Promise<Observation[]> {
  const found: Observation[] = [];
  const obligations = await sql<{ id: string; autonomy: string; title: string }>`
    select id, autonomy, title from obligations
    where organization_id = ${orgId} and state in (${"open"}, ${"prepared"}) and mission_id is null
    order by created_at`;
  for (const row of obligations) {
    if (row.autonomy === "restricted") {
      found.push({
        operation: "obligation.restricted",
        eventType: "obligation.restricted",
        sourceType: "obligation",
        sourceId: row.id,
        summary: row.title,
        key: `obligation.restricted:${row.id}`,
        delegable: false,
      });
      continue;
    }
    found.push({
      operation: PROPOSE,
      eventType: "work.unassigned",
      sourceType: "obligation",
      sourceId: row.id,
      summary: row.title,
      key: delegate ? `work.propose:${row.id}:delegate` : `work.propose:${row.id}`,
      obligationId: row.id,
      delegable: true,
    });
  }
  const orders = await sql<{ id: string; name: string }>`
    select o.id, p.display_name as name
    from orders o
    join parties p on p.id = o.party_id and p.organization_id = o.organization_id
    where o.organization_id = ${orgId} and o.status = ${"accepted"}
      and not exists (
        select 1 from order_mission_links l
        where l.organization_id = o.organization_id and l.order_id = o.id
      )
    order by o.created_at`;
  for (const row of orders) {
    found.push({
      operation: "order.unlinked",
      eventType: "order.unlinked",
      sourceType: "order",
      sourceId: row.id,
      summary: `${row.name} has an accepted order with no mission.`,
      key: `order.unlinked:${row.id}`,
      delegable: false,
    });
  }
  const invoices = await sql<{ id: string; number: string | null; amount_cents: unknown; allocated: unknown }>`
    select i.id, i.number, i.amount_cents,
      coalesce((
        select sum(amount_cents) from invoice_allocations a
        where a.invoice_id = i.id and a.organization_id = i.organization_id
      ), 0)::int as allocated
    from invoices i
    where i.organization_id = ${orgId} and i.status = ${"issued"}
    order by i.created_at`;
  for (const row of invoices) {
    const open = Number(row.amount_cents ?? 0) - Number(row.allocated ?? 0);
    if (open <= 0) continue;
    const label = row.number ?? "An invoice";
    found.push({
      operation: "invoice.open",
      eventType: "invoice.open",
      sourceType: "invoice",
      sourceId: row.id,
      summary: `${label} still has an open claim.`,
      key: `invoice.open:${row.id}`,
      delegable: false,
    });
  }
  return found;
}

export async function runControlCycle(sql: Sql, input: { orgId: string; actorId: string }): Promise<{ observed: number; decided: number; proposed: number }> {
  refuseAgent(input.actorId, "run the control loop");
  await assertOwner(sql, input.orgId, input.actorId);
  if (!sql.transaction) throw new CompanyError("The control lock is unavailable. Nothing was decided.");
  return sql.transaction(async (tx) => {
    await tx`select id from organizations where id = ${input.orgId} for update`;
    const policy = await policyOf(tx, input.orgId);
    const delegate = policy.level === 2 && !policy.halted;
    const plan = await evaluateDependencies(tx, input.orgId);
    await syncDependencyFindings(tx, input.orgId, input.actorId, plan);
    const held = new Map<string, PlanItem>();
    for (const item of plan.items) {
      if (item.recordType !== "obligation") continue;
      if (item.status === "blocked" || item.status === "missing" || item.status === "approval" || item.status === "circular") {
        held.set(item.recordId, item);
      }
    }
    const observations = await observe(tx, input.orgId, delegate);
    for (const item of observations) {
      const hold = item.delegable && item.obligationId ? held.get(item.obligationId) : undefined;
      if (!hold || policy.halted) continue;
      item.key = `work.hold:${item.obligationId}:${hold.status}`;
      item.eventType = "dependency.held";
      item.operation = "dependency.held";
      item.delegable = false;
      item.hold = hold;
    }
    const cycleId = nid("cyc");
    let decided = 0;
    let proposed = 0;
    await tx`insert into control_cycles (id, organization_id, actor_id, observed, decided, proposed)
      values (${cycleId}, ${input.orgId}, ${input.actorId}, ${observations.length}, ${0}, ${0})`;
    for (const item of observations) {
      const inserted = await tx<{ id: string }>`insert into control_events (
        id, organization_id, event_type, source_type, source_id, summary, idempotency_key, created_by
      ) values (
        ${nid("cev")}, ${input.orgId}, ${item.eventType}, ${item.sourceType}, ${item.sourceId},
        ${item.summary.slice(0, 500)}, ${item.key}, ${input.actorId}
      ) on conflict (organization_id, idempotency_key) do nothing returning id`;
      const eventId = inserted[0]?.id ?? (await tx<{ id: string }>`select id from control_events
        where organization_id = ${input.orgId} and idempotency_key = ${item.key} limit 1`)[0]?.id;
      if (!eventId) throw new CompanyError("The observation was not recorded. Nothing else was decided.");
      const existing = await tx<{ id: string }>`select id from control_decisions
        where organization_id = ${input.orgId} and event_id = ${eventId} limit 1`;
      if (existing[0]) continue;
      let missionId: string | null = null;
      let disposition: "notice" | "proposed" = "notice";
      let reason = "Noticed. No mission was opened, no money moved, and nothing was filed.";
      if (item.delegable && delegate && item.obligationId) {
        missionId = await staffObligation(tx, { orgId: input.orgId, actorId: input.actorId, obligationId: item.obligationId });
        disposition = "proposed";
        reason = "A proposed mission was opened. It is not authorized to execute.";
        proposed += 1;
      } else if (item.hold) {
        reason = `${item.hold.summary} ${item.hold.evidence} No mission was opened.`.slice(0, 500);
      } else if (policy.halted && item.delegable) {
        reason = "The loop is stopped. No mission was opened. Resume it only if you want a proposal. A proposal is still not authorization.";
      } else if (item.operation === "obligation.restricted") {
        reason = "A person has to do this outside NEXUS. The loop will not open a mission.";
      } else if (item.operation === "invoice.open") {
        reason = "A claim is open. Record a receipt yourself if money arrived. The loop did not.";
      } else if (item.operation === "order.unlinked") {
        reason = "An accepted order has no mission. Linking one would not authorize it. The loop did not link or invoice.";
      } else if (item.delegable && policy.level === 0) {
        reason = "Waiting for you. The loop does not open missions while this is manual.";
      } else if (item.delegable) {
        reason = "Recommendation only. Raise this to delegated if a proposed mission should be opened. It would still not be authorized.";
      }
      await tx`insert into control_decisions (
        id, organization_id, cycle_id, event_id, operation, disposition, reason, mission_id, requires_human
      ) values (
        ${nid("cde")}, ${input.orgId}, ${cycleId}, ${eventId}, ${item.operation}, ${disposition},
        ${reason}, ${missionId}, ${true}
      )`;
      decided += 1;
    }
    await tx`update control_cycles set observed = ${observations.length}, decided = ${decided}, proposed = ${proposed}
      where id = ${cycleId} and organization_id = ${input.orgId}`;
    await tx`insert into audit_events (
      id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
    ) values (
      ${nid("aud")}, ${input.orgId}, ${null}, ${null}, ${input.actorId}, ${"human"}, ${"control.cycle"}, ${cycleId},
      ${null}, ${null}, ${`Observed ${observations.length}, decided ${decided}, proposed ${proposed}. No mission was authorized and no money moved.`.slice(0, 500)}
    )`;
    return { observed: observations.length, decided, proposed };
  });
}

export async function loadControl(sql: Sql, orgId: string): Promise<ControlSnapshot> {
  const policy = await policyOf(sql, orgId);
  const cycles = await sql<{ observed: unknown; decided: unknown; proposed: unknown; created_at: unknown }>`
    select observed, decided, proposed, created_at from control_cycles
    where organization_id = ${orgId} order by created_at desc limit 1`;
  const decisions = await sql<{
    id: string; operation: string; disposition: string; reason: string; summary: string;
    requires_human: boolean; mission_id: string | null;
  }>`
    select d.id, d.operation, d.disposition, d.reason, e.summary, d.requires_human, d.mission_id
    from control_decisions d
    join control_events e on e.id = d.event_id and e.organization_id = d.organization_id
    where d.organization_id = ${orgId}
    order by d.created_at desc limit 8`;
  const cycle = cycles[0];
  return {
    prepareLevel: policy.level,
    halted: policy.halted,
    lastCycle: cycle
      ? {
          observed: Number(cycle.observed ?? 0),
          decided: Number(cycle.decided ?? 0),
          proposed: Number(cycle.proposed ?? 0),
          createdAt: cycle.created_at instanceof Date ? cycle.created_at.toISOString() : String(cycle.created_at ?? ""),
        }
      : null,
    decisions: decisions.map((row) => ({
      id: row.id,
      operation: row.operation,
      disposition: row.disposition,
      reason: row.reason,
      summary: row.summary,
      requiresHuman: asBool(row.requires_human),
      missionId: row.mission_id,
    })),
  };
}
