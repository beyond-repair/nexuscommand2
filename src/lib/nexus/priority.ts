import { CompanyError } from "./company.ts";
import type { Sql } from "./company-store.ts";
import { evaluateDependencies, requireRecord, type DependencyPlan, type PlanStatus } from "./dependencies.ts";

export const PRIORITY_POLICY = {
  version: 1,
  document:
    "Version 1. Points come only from recorded evidence: each unfinished downstream record is 2 points, capped at 3 records; a recorded customer commitment is 6; an open claim is 2 and is not cash; a documented open obligation is 1. An owner mark of high adds 3. Low subtracts 2. Defer applies only when no customer commitment is recorded. P0 exists only when an owner records a critical objective and a reason. Unknown factors, including deadlines and cash, add nothing. This does not authorize work.",
  points: { downstreamEach: 2, downstreamCap: 3, customerCommitment: 6, openClaim: 2, documentedObligation: 1, explicitHigh: 3, explicitLow: 2 },
  bands: { p1: 6, p2: 3, p3: 1 },
} as const;

export type PriorityClass = "P0" | "P1" | "P2" | "P3" | "P4";
export type RecommendationName =
  | "do_now"
  | "do_next"
  | "prepare"
  | "await_approval"
  | "resolve_blocker"
  | "assign_ownership"
  | "defer";

export type PriorityFactor = {
  name: string;
  value: string;
  known: boolean;
  points: number;
  evidence: string;
};

export type PriorityItem = {
  recordType: string;
  recordId: string;
  label: string;
  classification: PriorityClass;
  readiness: PlanStatus;
  recommendation: RecommendationName;
  explanation: string;
  positionReason: string;
  factors: PriorityFactor[];
  support: string[];
  division: string | null;
  statusLabel: string;
  ownerLabel: string | null;
  restricted: boolean;
  executable: boolean;
  human: string;
  policyVersion: number;
  completeness: "partial";
  downstream: number;
};

export type PriorityObjective = {
  id: string;
  recordType: string;
  recordId: string;
  label: string;
  level: string;
  reason: string;
};

export type PriorityChange = {
  id: string;
  recordType: string;
  recordId: string;
  previous: string | null;
  next: string;
  reason: string;
  policyVersion: number;
  createdAt: string;
};

export type PriorityPlan = {
  policyVersion: number;
  policyDocument: string;
  items: PriorityItem[];
  sequence: PriorityItem[];
  objectives: PriorityObjective[];
  changes: PriorityChange[];
  deadlineNote: string;
};

type ObjectiveRow = { id: string; source_type: string; source_id: string; level: string; reason: string };

const CLASS_RANK: Record<PriorityClass, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

function nid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function nodeKey(type: string, id: string): string {
  return `${type}:${id}`;
}

function refuseAgent(actorId: string, action: string): void {
  if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}

async function assertOwner(sql: Sql, orgId: string, actorId: string): Promise<void> {
  const rows = await sql<{ role: string }>`select role from memberships
    where organization_id = ${orgId} and user_id = ${actorId} limit 1`;
  if (rows[0]?.role !== "owner") throw new CompanyError("Only the owner can change priority.");
}

async function audit(sql: Sql, orgId: string, actorId: string, action: string, target: string, detail: string): Promise<void> {
  await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${"human"}, ${action}, ${target},
    ${null}, ${null}, ${detail.slice(0, 500)}
  )`;
}

function downstreamOf(plan: DependencyPlan): Map<string, number> {
  const enables = new Map<string, string[]>();
  const add = (from: string, to: string) => {
    const list = enables.get(to) ?? [];
    list.push(from);
    enables.set(to, list);
  };
  for (const rel of plan.relationships) {
    if (rel.state !== "active") continue;
    if (rel.relation === "depends_on") add(nodeKey(rel.sourceType, rel.sourceId), nodeKey(rel.targetType, rel.targetId));
    else if (rel.relation === "blocks") add(nodeKey(rel.targetType, rel.targetId), nodeKey(rel.sourceType, rel.sourceId));
  }
  const status = new Map(plan.items.map((item) => [nodeKey(item.recordType, item.recordId), item.status]));
  const counts = new Map<string, number>();
  for (const item of plan.items) {
    const start = nodeKey(item.recordType, item.recordId);
    const seen = new Set<string>();
    const queue = [...(enables.get(start) ?? [])];
    let count = 0;
    while (queue.length) {
      const next = queue.shift();
      if (!next || seen.has(next)) continue;
      seen.add(next);
      if (status.get(next) === "completed") {
        for (const child of enables.get(next) ?? []) queue.push(child);
        continue;
      }
      if (status.has(next)) count += 1;
      for (const child of enables.get(next) ?? []) queue.push(child);
    }
    counts.set(start, count);
  }
  return counts;
}

function tied(plan: DependencyPlan, key: string, targets: Set<string>): boolean {
  if (targets.has(key)) return true;
  for (const rel of plan.relationships) {
    if (rel.state !== "active") continue;
    const source = nodeKey(rel.sourceType, rel.sourceId);
    const target = nodeKey(rel.targetType, rel.targetId);
    if ((source === key && targets.has(target)) || (target === key && targets.has(source))) return true;
  }
  return false;
}

function recommend(readiness: PlanStatus, classification: PriorityClass): RecommendationName {
  if (readiness === "blocked" || readiness === "missing" || readiness === "circular") return "resolve_blocker";
  if (readiness === "approval") return "await_approval";
  if (readiness === "unassigned") return "assign_ownership";
  if (classification === "P0" || classification === "P1") return "do_now";
  if (classification === "P2") return "do_next";
  if (classification === "P3") return "prepare";
  return "defer";
}

function classify(points: number, objective: ObjectiveRow | undefined, commitment: boolean): { classification: PriorityClass; because: string } {
  if (objective?.level === "critical") {
    return {
      classification: "P0",
      because: `P0 because an owner recorded a critical objective: ${objective.reason}. The engine did not invent this urgency.`,
    };
  }
  if (objective?.level === "defer" && !commitment) {
    return {
      classification: "P4",
      because: "P4 because an owner recorded that this can wait, and no customer commitment is recorded on it.",
    };
  }
  let classification: PriorityClass = "P4";
  if (points >= PRIORITY_POLICY.bands.p1) classification = "P1";
  else if (points >= PRIORITY_POLICY.bands.p2) classification = "P2";
  else if (points >= PRIORITY_POLICY.bands.p3) classification = "P3";
  const deferred = objective?.level === "defer" && commitment
    ? " An owner asked to defer this, but a customer commitment is recorded, so that deferral was not applied."
    : "";
  return {
    classification,
    because: `${classification} from ${points} points on recorded evidence. Unknown factors added nothing.${deferred}`,
  };
}

function orderSequence(items: PriorityItem[], plan: DependencyPlan): PriorityItem[] {
  const rank = new Map(items.map((item) => [nodeKey(item.recordType, item.recordId), item]));
  const completed = new Set(plan.items.filter((item) => item.status === "completed").map((item) => nodeKey(item.recordType, item.recordId)));
  const full = new Map<string, string[]>();
  const link = (from: string, to: string) => {
    const list = full.get(from) ?? [];
    list.push(to);
    full.set(from, list);
  };
  for (const rel of plan.relationships) {
    if (rel.state !== "active") continue;
    if (rel.relation === "depends_on") link(nodeKey(rel.sourceType, rel.sourceId), nodeKey(rel.targetType, rel.targetId));
    else if (rel.relation === "blocks") link(nodeKey(rel.targetType, rel.targetId), nodeKey(rel.sourceType, rel.sourceId));
  }
  const unresolved = (start: string): string[] => {
    const found: string[] = [];
    const seen = new Set<string>();
    const queue = [...(full.get(start) ?? [])];
    while (queue.length) {
      const next = queue.shift();
      if (!next || seen.has(next)) continue;
      seen.add(next);
      if (rank.has(next)) found.push(next);
      else if (completed.has(next)) for (const child of full.get(next) ?? []) queue.push(child);
    }
    return found;
  };
  const adj = new Map<string, string[]>();
  for (const item of items) adj.set(nodeKey(item.recordType, item.recordId), unresolved(nodeKey(item.recordType, item.recordId)));
  const indegree = new Map<string, number>();
  const forward = new Map<string, string[]>();
  for (const item of items) indegree.set(nodeKey(item.recordType, item.recordId), 0);
  for (const [from, nexts] of adj) {
    for (const next of nexts) {
      if (!indegree.has(next)) continue;
      forward.set(next, [...(forward.get(next) ?? []), from]);
      indegree.set(from, (indegree.get(from) ?? 0) + 1);
    }
  }
  const sortKeys = (keys: string[]) => keys.sort((a, b) => {
    const left = rank.get(a);
    const right = rank.get(b);
    return CLASS_RANK[left?.classification ?? "P4"] - CLASS_RANK[right?.classification ?? "P4"]
      || (left?.label ?? a).localeCompare(right?.label ?? b)
      || a.localeCompare(b);
  });
  const ready = sortKeys([...indegree.entries()].filter(([, degree]) => degree === 0).map(([key]) => key));
  const sequence: PriorityItem[] = [];
  const placed = new Set<string>();
  while (ready.length) {
    const current = ready.shift();
    if (!current || placed.has(current)) continue;
    const item = rank.get(current);
    if (!item) continue;
    placed.add(current);
    const prereqs = (adj.get(current) ?? []).map((key) => rank.get(key)?.label).filter((label): label is string => Boolean(label));
    const waiting = item.readiness === "blocked" || item.readiness === "missing" || item.readiness === "circular" || item.readiness === "approval";
    sequence.push({
      ...item,
      positionReason: prereqs.length
        ? `After ${prereqs.join(", ")}. A higher class does not jump an unfinished prerequisite.`
        : waiting
          ? "Not ready. Priority does not clear the blocker, the cycle, or the approval."
          : `${item.classification} among work with no unfinished prerequisite. Equal evidence is ordered by title, then id.`,
    });
    for (const child of forward.get(current) ?? []) {
      indegree.set(child, (indegree.get(child) ?? 1) - 1);
      if (indegree.get(child) === 0) {
        ready.push(child);
        sortKeys(ready);
      }
    }
  }
  const rest = sortKeys([...rank.keys()].filter((key) => !placed.has(key)));
  for (const key of rest) {
    const item = rank.get(key);
    if (!item) continue;
    sequence.push({
      ...item,
      positionReason: "Kept out of the dependency order. A cycle or a missing record is not treated as ready.",
    });
  }
  return sequence;
}

export async function evaluatePriority(sql: Sql, orgId: string, existing?: DependencyPlan): Promise<PriorityPlan> {
  const plan = existing ?? await evaluateDependencies(sql, orgId);
  const objectives = await sql<ObjectiveRow>`select id, source_type, source_id, level, reason from priority_objectives
    where organization_id = ${orgId} and state = ${"active"}`;
  const objectiveByKey = new Map(objectives.map((row) => [nodeKey(row.source_type, row.source_id), row]));
  const orders = await sql<{ id: string }>`select id from orders
    where organization_id = ${orgId} and status = ${"accepted"}`;
  const invoices = await sql<{ id: string; amount_cents: unknown; allocated: unknown; order_id: string | null }>`select i.id, i.amount_cents, i.order_id,
      coalesce((select sum(amount_cents) from invoice_allocations a
        where a.invoice_id = i.id and a.organization_id = i.organization_id), 0)::int as allocated
    from invoices i where i.organization_id = ${orgId} and i.status = ${"issued"}`;
  const obligations = await sql<{ id: string; domain: string; autonomy: string; state: string }>`select id, domain, autonomy, state
    from obligations where organization_id = ${orgId}`;
  const missions = await sql<{ id: string; status: string }>`select id, status from missions where organization_id = ${orgId}`;
  const tasks = await sql<{ id: string; state: string }>`select id, state from tasks where organization_id = ${orgId}`;
  const orderStates = await sql<{ id: string; status: string }>`select id, status from orders where organization_id = ${orgId}`;
  const invoiceStates = await sql<{ id: string; status: string }>`select id, status from invoices where organization_id = ${orgId}`;
  const commitment = new Set(orders.map((row) => nodeKey("order", row.id)));
  const claims = new Set<string>();
  for (const row of invoices) {
    if (Number(row.amount_cents ?? 0) - Number(row.allocated ?? 0) <= 0) continue;
    claims.add(nodeKey("invoice", row.id));
    if (row.order_id) claims.add(nodeKey("order", row.order_id));
  }
  const obligationById = new Map(obligations.map((row) => [row.id, row]));
  const statusLabel = new Map<string, string>();
  for (const row of obligations) statusLabel.set(nodeKey("obligation", row.id), row.state);
  for (const row of missions) statusLabel.set(nodeKey("mission", row.id), row.status);
  for (const row of tasks) statusLabel.set(nodeKey("task", row.id), row.state);
  for (const row of orderStates) statusLabel.set(nodeKey("order", row.id), row.status);
  for (const row of invoiceStates) statusLabel.set(nodeKey("invoice", row.id), row.status);
  const downstream = downstreamOf(plan);
  const items: PriorityItem[] = [];
  for (const item of plan.items) {
    if (item.status === "completed" || item.recordType === "party") continue;
    const key = nodeKey(item.recordType, item.recordId);
    const obligation = item.recordType === "obligation" ? obligationById.get(item.recordId) : undefined;
    const objective = objectiveByKey.get(key);
    const ownerRel = plan.relationships.find((rel) => rel.state === "active"
      && (rel.relation === "owned_by" || rel.relation === "assigned_to")
      && rel.sourceType === item.recordType && rel.sourceId === item.recordId);
    const down = downstream.get(key) ?? 0;
    const downPoints = Math.min(down, PRIORITY_POLICY.points.downstreamCap) * PRIORITY_POLICY.points.downstreamEach;
    const hasCommitment = tied(plan, key, commitment);
    const hasClaim = tied(plan, key, claims);
    const documented = Boolean(obligation && obligation.state !== "satisfied" && obligation.state !== "waived");
    const restricted = obligation?.autonomy === "restricted";
    const factors: PriorityFactor[] = [
      {
        name: "downstream",
        value: String(down),
        known: true,
        points: downPoints,
        evidence: down === 0 ? "No unfinished record depends on this." : `Unfinished records that depend on this: ${down}.`,
      },
      {
        name: "customer_commitment",
        value: hasCommitment ? "recorded" : "none_recorded",
        known: true,
        points: hasCommitment ? PRIORITY_POLICY.points.customerCommitment : 0,
        evidence: hasCommitment ? "A customer commitment is recorded on an accepted order." : "No customer commitment is recorded on this item.",
      },
      {
        name: "open_claim",
        value: hasClaim ? "recorded" : "none_recorded",
        known: true,
        points: hasClaim ? PRIORITY_POLICY.points.openClaim : 0,
        evidence: hasClaim ? "An open claim is recorded. It is not cash and it is not a bank balance." : "No open claim is recorded on this item. None was assumed.",
      },
      {
        name: "documented_obligation",
        value: documented ? "recorded" : "none_recorded",
        known: true,
        points: documented ? PRIORITY_POLICY.points.documentedObligation : 0,
        evidence: documented ? `Documented obligation in ${obligation?.domain ?? "this company"}.` : "This is not an open documented obligation.",
      },
      {
        name: "ownership",
        value: ownerRel ? "recorded" : "gap",
        known: true,
        points: 0,
        evidence: ownerRel ? `Owner or assignee recorded: ${ownerRel.targetLabel}.` : "No owner or assignee is recorded. None was invented. A gap is not a blocker.",
      },
      {
        name: "deadline",
        value: "unknown",
        known: false,
        points: 0,
        evidence: "No reliable deadline is stored. Nothing is marked overdue.",
      },
      {
        name: "cash",
        value: "unknown",
        known: false,
        points: 0,
        evidence: "Cash is not on these records. An invoice was not treated as payment.",
      },
      {
        name: "explicit_objective",
        value: objective ? `${objective.level}:${objective.reason}` : "none_recorded",
        known: true,
        points: objective?.level === "high" ? PRIORITY_POLICY.points.explicitHigh : objective?.level === "low" ? -PRIORITY_POLICY.points.explicitLow : 0,
        evidence: objective ? `Owner objective ${objective.level}: ${objective.reason}` : "No owner priority objective is recorded.",
      },
      {
        name: "restricted",
        value: restricted ? "restricted" : "not_restricted",
        known: true,
        points: 0,
        evidence: restricted ? "Restricted. A person must do this. Priority does not make it executable." : "Not marked restricted.",
      },
    ];
    const points = factors.reduce((sum, factor) => sum + factor.points, 0);
    const decision = classify(points, objective, hasCommitment);
    const recommendation = recommend(item.status, decision.classification);
    const executable = !restricted && (recommendation === "do_now" || recommendation === "do_next" || recommendation === "prepare")
      && item.status !== "blocked" && item.status !== "missing" && item.status !== "circular" && item.status !== "approval";
    const support = [
      ...item.dependsOn,
      hasCommitment ? "Accepted order" : "",
      hasClaim ? "Open claim" : "",
      objective ? `Objective ${objective.level}` : "",
    ].filter(Boolean);
    items.push({
      recordType: item.recordType,
      recordId: item.recordId,
      label: item.label,
      classification: decision.classification,
      readiness: item.status,
      recommendation,
      explanation: `${item.label}. ${decision.because} ${item.evidence} ${factors.map((factor) => factor.evidence).join(" ")} This is not an assignment and not an authorization.`.slice(0, 1200),
      positionReason: "",
      factors,
      support,
      division: obligation?.domain ?? null,
      statusLabel: statusLabel.get(key) ?? item.status,
      ownerLabel: ownerRel?.targetLabel ?? null,
      restricted,
      executable,
      human: restricted
        ? "A person has to do this outside NEXUS. Priority does not reclassify it."
        : item.status === "approval"
          ? "Waiting for human approval. Priority does not grant it."
          : item.status === "blocked" || item.status === "missing" || item.status === "circular"
            ? "A person has to resolve the blocker. Priority does not clear it."
            : !ownerRel && (item.recordType === "obligation" || item.recordType === "mission" || item.recordType === "task")
              ? "No owner is recorded. Assigning one is not done by this recommendation."
              : "A person still decides. This recommendation is not authorization.",
      policyVersion: PRIORITY_POLICY.version,
      completeness: "partial",
      downstream: down,
    });
  }
  items.sort((a, b) => CLASS_RANK[a.classification] - CLASS_RANK[b.classification] || a.label.localeCompare(b.label) || a.recordId.localeCompare(b.recordId));
  const sequence = orderSequence(items, plan);
  const labels = new Map(plan.records.map((record) => [nodeKey(record.type, record.id), record.label]));
  const changes = await sql<{ id: string; source_type: string; source_id: string; previous: string | null; next: string; reason: string; policy_version: number; created_at: unknown }>`
    select id, source_type, source_id, previous, next, reason, policy_version, created_at from priority_changes
    where organization_id = ${orgId}
      and cycle_id = (select cycle_id from priority_changes where organization_id = ${orgId} order by created_at desc limit 1)
    order by created_at, id`;
  return {
    policyVersion: PRIORITY_POLICY.version,
    policyDocument: PRIORITY_POLICY.document,
    items,
    sequence,
    objectives: objectives.map((row) => ({
      id: row.id,
      recordType: row.source_type,
      recordId: row.source_id,
      label: labels.get(nodeKey(row.source_type, row.source_id)) ?? row.source_id,
      level: row.level,
      reason: row.reason,
    })),
    changes: changes.map((row) => ({
      id: row.id,
      recordType: row.source_type,
      recordId: row.source_id,
      previous: row.previous,
      next: row.next,
      reason: row.reason,
      policyVersion: Number(row.policy_version),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ""),
    })),
    deadlineNote: "No reliable deadline is stored on these records. Nothing is marked overdue.",
  };
}

export async function loadPriorityPlan(sql: Sql, orgId: string): Promise<PriorityPlan> {
  return evaluatePriority(sql, orgId);
}

function fingerprint(item: PriorityItem): string {
  const factors = item.factors.map((factor) => `${factor.name}=${factor.known ? factor.value : "unknown"}:${factor.points}`).join(",");
  return `pri:v${item.policyVersion}:${item.recordType}:${item.recordId}:${item.classification}:${item.readiness}:${item.recommendation}:${factors}`;
}

export async function syncPriority(sql: Sql, orgId: string, actorId: string, cycleId: string, plan: PriorityPlan): Promise<void> {
  await sql`insert into priority_policies (id, organization_id, version, document, created_by)
    values (${nid("ppl")}, ${orgId}, ${PRIORITY_POLICY.version}, ${PRIORITY_POLICY.document}, ${actorId})
    on conflict (organization_id, version) do nothing`;
  const existing = await sql<{ id: string; idempotency_key: string; state: string; source_type: string; source_id: string; classification: string }>`
    select id, idempotency_key, state, source_type, source_id, classification from priority_evaluations
    where organization_id = ${orgId}`;
  const byKey = new Map(existing.map((row) => [row.idempotency_key, row]));
  const wanted = new Set<string>();
  for (const item of plan.items) {
    const key = fingerprint(item);
    wanted.add(key);
    const recordKey = nodeKey(item.recordType, item.recordId);
    const active = existing.filter((row) => row.state === "active" && nodeKey(row.source_type, row.source_id) === recordKey);
    const same = active.find((row) => row.idempotency_key === key);
    if (same) continue;
    const previous = active[0]?.classification ?? null;
    for (const row of active) {
      await sql`update priority_evaluations set state = ${"retired"}, retired_at = now()
        where id = ${row.id} and organization_id = ${orgId} and state = ${"active"}`;
      row.state = "retired";
    }
    if (previous) {
      await sql`insert into priority_changes (
        id, organization_id, cycle_id, source_type, source_id, previous, next, reason, policy_version
      ) values (
        ${nid("pch")}, ${orgId}, ${cycleId}, ${item.recordType}, ${item.recordId}, ${previous}, ${item.classification},
        ${`Priority ${previous} became ${item.classification}. Readiness is ${item.readiness}. ${item.explanation}`.slice(0, 500)},
        ${item.policyVersion}
      )`;
    }
    const prior = byKey.get(key);
    if (prior) {
      await sql`update priority_evaluations set state = ${"active"}, retired_at = ${null}, cycle_id = ${cycleId},
        explanation = ${item.explanation.slice(0, 1200)}, factors = ${JSON.stringify(item.factors)}
        where id = ${prior.id} and organization_id = ${orgId}`;
      prior.state = "active";
      continue;
    }
    const id = nid("pev");
    await sql`insert into priority_evaluations (
      id, organization_id, cycle_id, policy_version, source_type, source_id, classification, readiness,
      recommendation, explanation, factors, idempotency_key, created_by
    ) values (
      ${id}, ${orgId}, ${cycleId}, ${item.policyVersion}, ${item.recordType}, ${item.recordId}, ${item.classification},
      ${item.readiness}, ${item.recommendation}, ${item.explanation.slice(0, 1200)}, ${JSON.stringify(item.factors)},
      ${key}, ${actorId}
    )`;
    byKey.set(key, { id, idempotency_key: key, state: "active", source_type: item.recordType, source_id: item.recordId, classification: item.classification });
    existing.push({ id, idempotency_key: key, state: "active", source_type: item.recordType, source_id: item.recordId, classification: item.classification });
  }
  for (const row of existing) {
    if (row.state === "active" && !wanted.has(row.idempotency_key)) {
      await sql`update priority_evaluations set state = ${"retired"}, retired_at = now()
        where id = ${row.id} and organization_id = ${orgId} and state = ${"active"}`;
      await sql`insert into priority_changes (
        id, organization_id, cycle_id, source_type, source_id, previous, next, reason, policy_version
      ) values (
        ${nid("pch")}, ${orgId}, ${cycleId}, ${row.source_type}, ${row.source_id}, ${row.classification}, ${"cleared"},
        ${"The record left the reading. The evaluation was retired, not deleted."}, ${PRIORITY_POLICY.version}
      )`;
      row.state = "retired";
    }
  }
}

export async function setPriorityObjective(sql: Sql, input: {
  orgId: string;
  actorId: string;
  level: string;
  sourceType: string;
  sourceId: string;
  reason: string;
}): Promise<void> {
  refuseAgent(input.actorId, "set a priority objective");
  await assertOwner(sql, input.orgId, input.actorId);
  if (!["critical", "high", "low", "defer"].includes(input.level)) throw new CompanyError("Choose critical, high, low, or defer.");
  const reason = input.reason.trim();
  if (reason.length < 12 || reason.length > 500) throw new CompanyError("Record a reason of at least a short sentence. Urgency is not assumed.");
  if (!sql.transaction) throw new CompanyError("The priority lock is unavailable. Nothing was marked.");
  await sql.transaction(async (tx) => {
    await tx`select id from organizations where id = ${input.orgId} for update`;
    const label = await requireRecord(tx, input.orgId, input.sourceType, input.sourceId);
    await tx`update priority_objectives set state = ${"retired"}, retired_at = now(), retired_by = ${input.actorId}
      where organization_id = ${input.orgId} and source_type = ${input.sourceType} and source_id = ${input.sourceId.trim()} and state = ${"active"}`;
    const id = nid("pob");
    await tx`insert into priority_objectives (id, organization_id, source_type, source_id, level, reason, created_by)
      values (${id}, ${input.orgId}, ${input.sourceType}, ${input.sourceId.trim()}, ${input.level}, ${reason}, ${input.actorId})`;
    await audit(tx, input.orgId, input.actorId, "priority.objective", id, `${label} marked ${input.level}. This does not authorize work or clear a dependency.`);
  });
}

export async function retirePriorityObjective(sql: Sql, input: { orgId: string; actorId: string; objectiveId: string }): Promise<void> {
  refuseAgent(input.actorId, "retire a priority objective");
  await assertOwner(sql, input.orgId, input.actorId);
  const rows = await sql<{ id: string }>`update priority_objectives
    set state = ${"retired"}, retired_at = now(), retired_by = ${input.actorId}
    where id = ${input.objectiveId} and organization_id = ${input.orgId} and state = ${"active"}
    returning id`;
  if (!rows[0]) throw new CompanyError("That active priority objective is not in this company.");
  await audit(sql, input.orgId, input.actorId, "priority.objective_retired", rows[0].id, "Retired. The row stays. Nothing was authorized.");
}

export async function setPriorityPolicy(sql: Sql, input: { orgId: string; actorId: string; version: string }): Promise<void> {
  refuseAgent(input.actorId, "change the priority policy");
  await assertOwner(sql, input.orgId, input.actorId);
  if (input.version !== String(PRIORITY_POLICY.version)) {
    throw new CompanyError("Only priority policy version 1 is defined. Missing evidence was not given a weight.");
  }
  await sql`insert into priority_policies (id, organization_id, version, document, created_by)
    values (${nid("ppl")}, ${input.orgId}, ${PRIORITY_POLICY.version}, ${PRIORITY_POLICY.document}, ${input.actorId})
    on conflict (organization_id, version) do nothing`;
  await audit(sql, input.orgId, input.actorId, "priority.policy", String(PRIORITY_POLICY.version), "Policy version 1 confirmed. This does not authorize work.");
}
