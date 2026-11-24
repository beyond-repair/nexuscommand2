import { CompanyError } from "./company.ts";
import type { Sql } from "./company-store.ts";

export const RELATIONS = [
  "depends_on",
  "blocks",
  "requires_approval",
  "owned_by",
  "assigned_to",
  "produces",
  "satisfies",
  "derived_from",
  "related_to",
] as const;

export const RECORD_TYPES = ["obligation", "mission", "task", "order", "invoice", "party"] as const;

export type RelationName = (typeof RELATIONS)[number];
export type RecordTypeName = (typeof RECORD_TYPES)[number];
export type PlanStatus = "ready" | "blocked" | "missing" | "approval" | "circular" | "unassigned" | "proposed" | "completed";

export type PlanItem = {
  recordType: string;
  recordId: string;
  label: string;
  status: PlanStatus;
  summary: string;
  evidence: string;
  dependsOn: string[];
};

export type DependencyPlan = {
  items: PlanItem[];
  sequence: Array<{ recordType: string; recordId: string; label: string; because: string }>;
  relationships: Array<{
    id: string;
    relation: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    sourceLabel: string;
    targetLabel: string;
    state: "active" | "retired";
  }>;
  records: Array<{ type: string; id: string; label: string }>;
  retired: number;
  deadlineNote: string;
};

type Node = {
  type: string;
  id: string;
  label: string;
  done: boolean;
  missing: boolean;
  approval: boolean;
  work: boolean;
  proposed: boolean;
  stateLabel: string;
};

type RelRow = {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation: string;
  state: "active" | "retired";
  metadata: string;
};

const DEADLINE_NOTE = "No reliable deadline is stored on these records. Nothing is marked overdue.";

function nid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function refuseAgent(actorId: string, action: string): void {
  if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}

function isUnique(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("duplicate") || message.includes("23505") || message.toLowerCase().includes("unique");
}

function nodeKey(type: string, id: string): string {
  return `${type}:${id}`;
}

function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function assertOwner(sql: Sql, orgId: string, actorId: string): Promise<void> {
  const rows = await sql<{ role: string }>`select role from memberships
    where organization_id = ${orgId} and user_id = ${actorId} limit 1`;
  if (rows[0]?.role !== "owner") throw new CompanyError("Only the owner can change a dependency.");
}

async function audit(sql: Sql, orgId: string, actorId: string, action: string, target: string, detail: string): Promise<void> {
  await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${"human"}, ${action}, ${target},
    ${null}, ${null}, ${detail.slice(0, 500)}
  )`;
}

export async function requireRecord(sql: Sql, orgId: string, type: string, id: string): Promise<string> {
  if (!RECORD_TYPES.includes(type as RecordTypeName)) throw new CompanyError("That record type cannot take a dependency.");
  const cleanId = id.trim();
  if (!cleanId) throw new CompanyError("Name the record.");
  let rows: Array<{ label: string }> = [];
  if (type === "obligation") {
    rows = await sql<{ label: string }>`select title as label from obligations
      where id = ${cleanId} and organization_id = ${orgId} limit 1`;
  } else if (type === "mission") {
    rows = await sql<{ label: string }>`select title as label from missions
      where id = ${cleanId} and organization_id = ${orgId} limit 1`;
  } else if (type === "task") {
    rows = await sql<{ label: string }>`select objective as label from tasks
      where id = ${cleanId} and organization_id = ${orgId} limit 1`;
  } else if (type === "order") {
    rows = await sql<{ label: string }>`select id as label from orders
      where id = ${cleanId} and organization_id = ${orgId} limit 1`;
  } else if (type === "invoice") {
    rows = await sql<{ label: string }>`select coalesce(number, title) as label from invoices
      where id = ${cleanId} and organization_id = ${orgId} limit 1`;
  } else {
    rows = await sql<{ label: string }>`select display_name as label from parties
      where id = ${cleanId} and organization_id = ${orgId} limit 1`;
  }
  if (!rows[0]) throw new CompanyError("That record is not in this company.");
  return rows[0].label;
}

export async function addRelationship(sql: Sql, input: {
  orgId: string;
  actorId: string;
  relation: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  metadata?: string;
}): Promise<string> {
  refuseAgent(input.actorId, "add a dependency");
  await assertOwner(sql, input.orgId, input.actorId);
  if (!RELATIONS.includes(input.relation as RelationName)) throw new CompanyError("That relationship is not one this company records.");
  if (input.sourceType === input.targetType && input.sourceId.trim() === input.targetId.trim()) {
    throw new CompanyError("A record cannot depend on itself.");
  }
  if (!sql.transaction) throw new CompanyError("The dependency lock is unavailable. Nothing was linked.");
  const metadata = (input.metadata ?? "").trim().slice(0, 500);
  return sql.transaction(async (tx) => {
    await tx`select id from organizations where id = ${input.orgId} for update`;
    await requireRecord(tx, input.orgId, input.sourceType, input.sourceId);
    await requireRecord(tx, input.orgId, input.targetType, input.targetId);
    const id = nid("rel");
    try {
      await tx`insert into organizational_relationships (
        id, organization_id, source_type, source_id, target_type, target_id, relation, metadata, created_by
      ) values (
        ${id}, ${input.orgId}, ${input.sourceType}, ${input.sourceId.trim()}, ${input.targetType}, ${input.targetId.trim()},
        ${input.relation}, ${metadata}, ${input.actorId}
      )`;
    } catch (error) {
      if (isUnique(error)) throw new CompanyError("That relationship is already active.");
      throw error;
    }
    await audit(tx, input.orgId, input.actorId, "dependency.added", id, `${input.relation} recorded. This does not authorize work or move money.`);
    return id;
  });
}

export async function retireRelationship(sql: Sql, input: { orgId: string; actorId: string; relationshipId: string }): Promise<void> {
  refuseAgent(input.actorId, "retire a dependency");
  await assertOwner(sql, input.orgId, input.actorId);
  if (!sql.transaction) throw new CompanyError("The dependency lock is unavailable. Nothing was retired.");
  await sql.transaction(async (tx) => {
    await tx`select id from organizations where id = ${input.orgId} for update`;
    const rows = await tx<{ id: string }>`update organizational_relationships
      set state = ${"retired"}, retired_at = now(), retired_by = ${input.actorId}
      where id = ${input.relationshipId} and organization_id = ${input.orgId} and state = ${"active"}
      returning id`;
    if (!rows[0]) throw new CompanyError("That active relationship is not in this company.");
    await audit(tx, input.orgId, input.actorId, "dependency.retired", rows[0].id, "Retired. The row stays. Nothing was authorized.");
  });
}

async function loadGraph(sql: Sql, orgId: string): Promise<{ nodes: Map<string, Node>; rels: RelRow[] }> {
  const obligations = await sql<{ id: string; title: string; state: string; mission_id: string | null }>`
    select id, title, state, mission_id from obligations where organization_id = ${orgId}`;
  const missions = await sql<{ id: string; title: string; status: string }>`
    select id, title, status from missions where organization_id = ${orgId}`;
  const tasks = await sql<{ id: string; objective: string; state: string }>`
    select id, objective, state from tasks where organization_id = ${orgId}`;
  const orders = await sql<{ id: string; status: string; name: string | null }>`
    select o.id, o.status, p.display_name as name
    from orders o
    left join parties p on p.id = o.party_id and p.organization_id = o.organization_id
    where o.organization_id = ${orgId}`;
  const invoices = await sql<{ id: string; title: string; number: string | null; status: string; amount_cents: unknown; allocated: unknown }>`
    select i.id, i.title, i.number, i.status, i.amount_cents,
      coalesce((select sum(amount_cents) from invoice_allocations a
        where a.invoice_id = i.id and a.organization_id = i.organization_id), 0)::int as allocated
    from invoices i where i.organization_id = ${orgId}`;
  const parties = await sql<{ id: string; display_name: string; status: string }>`
    select id, display_name, status from parties where organization_id = ${orgId}`;
  const rels = await sql<RelRow>`select id, source_type, source_id, target_type, target_id, relation, state, metadata
    from organizational_relationships where organization_id = ${orgId} order by created_at, id`;
  const missionStatus = new Map(missions.map((row) => [row.id, row.status]));
  const nodes = new Map<string, Node>();
  const add = (node: Node) => nodes.set(nodeKey(node.type, node.id), node);
  for (const row of obligations) {
    const mission = row.mission_id ? missionStatus.get(row.mission_id) : undefined;
    add({
      type: "obligation",
      id: row.id,
      label: row.title,
      done: row.state === "satisfied" || row.state === "waived",
      missing: false,
      approval: false,
      work: row.state === "open" || row.state === "prepared" || row.state === "authorized",
      proposed: mission === "PROPOSED",
      stateLabel: row.state,
    });
  }
  for (const row of missions) {
    add({
      type: "mission",
      id: row.id,
      label: row.title,
      done: row.status === "ACCEPTED",
      missing: false,
      approval: row.status === "AWAITING_ACCEPTANCE",
      work: row.status !== "ACCEPTED" && row.status !== "CANCELLED" && row.status !== "REJECTED",
      proposed: row.status === "PROPOSED",
      stateLabel: row.status,
    });
  }
  for (const row of tasks) {
    const terminal = row.state === "COMPLETED" || row.state === "CANCELLED" || row.state === "REJECTED";
    add({
      type: "task",
      id: row.id,
      label: row.objective.slice(0, 120),
      done: row.state === "COMPLETED",
      missing: false,
      approval: row.state === "WAITING_FOR_APPROVAL",
      work: !terminal,
      proposed: false,
      stateLabel: row.state,
    });
  }
  for (const row of orders) {
    add({
      type: "order",
      id: row.id,
      label: row.name ? `${row.name} order` : "Order",
      done: row.status === "fulfilled",
      missing: false,
      approval: false,
      work: row.status === "accepted",
      proposed: false,
      stateLabel: row.status,
    });
  }
  for (const row of invoices) {
    const open = num(row.amount_cents) - num(row.allocated);
    add({
      type: "invoice",
      id: row.id,
      label: row.number ?? row.title,
      done: row.status === "issued" && open <= 0,
      missing: false,
      approval: false,
      work: row.status === "issued" && open > 0,
      proposed: false,
      stateLabel: row.status,
    });
  }
  for (const row of parties) {
    add({
      type: "party",
      id: row.id,
      label: row.display_name,
      done: row.status === "active",
      missing: false,
      approval: false,
      work: false,
      proposed: false,
      stateLabel: row.status,
    });
  }
  return { nodes, rels };
}

function placeholder(type: string, id: string): Node {
  return {
    type,
    id,
    label: `${type} ${id}`,
    done: false,
    missing: true,
    approval: false,
    work: false,
    proposed: false,
    stateLabel: "missing",
  };
}

export async function evaluateDependencies(sql: Sql, orgId: string): Promise<DependencyPlan> {
  const { nodes, rels } = await loadGraph(sql, orgId);
  const active = rels.filter((row) => row.state === "active");
  const adj = new Map<string, string[]>();
  const direct = new Map<string, string[]>();
  const approvalFrom = new Map<string, string[]>();
  const owned = new Set<string>();
  const linked = new Set<string>();
  const link = (from: string, to: string) => {
    const list = adj.get(from) ?? [];
    list.push(to);
    adj.set(from, list);
    const names = direct.get(from) ?? [];
    const node = nodes.get(to);
    names.push(node?.label ?? to);
    direct.set(from, names);
  };
  for (const rel of active) {
    const source = nodeKey(rel.source_type, rel.source_id);
    const target = nodeKey(rel.target_type, rel.target_id);
    if (!nodes.has(source)) nodes.set(source, placeholder(rel.source_type, rel.source_id));
    if (!nodes.has(target)) nodes.set(target, placeholder(rel.target_type, rel.target_id));
    linked.add(source);
    linked.add(target);
    if (rel.relation === "depends_on") link(source, target);
    else if (rel.relation === "blocks") link(target, source);
    else if (rel.relation === "requires_approval") {
      const list = approvalFrom.get(source) ?? [];
      list.push(nodes.get(target)?.label ?? target);
      approvalFrom.set(source, list);
    } else if (rel.relation === "owned_by" || rel.relation === "assigned_to") owned.add(source);
  }
  const circular = new Set<string>();
  const color = new Map<string, number>();
  const stack: string[] = [];
  const visit = (key: string) => {
    color.set(key, 1);
    stack.push(key);
    for (const next of adj.get(key) ?? []) {
      if (color.get(next) === 1) {
        const at = stack.indexOf(next);
        for (const item of stack.slice(at)) circular.add(item);
      } else if (color.get(next) !== 2) visit(next);
    }
    stack.pop();
    color.set(key, 2);
  };
  for (const key of nodes.keys()) if (color.get(key) !== 2) visit(key);
  const reachesCircular = (key: string): boolean => {
    const seen = new Set<string>();
    const queue = [...(adj.get(key) ?? [])];
    while (queue.length) {
      const next = queue.shift();
      if (!next || seen.has(next)) continue;
      seen.add(next);
      if (circular.has(next)) return true;
      for (const child of adj.get(next) ?? []) queue.push(child);
    }
    return false;
  };
  const chainOf = (key: string): { missing: boolean; labels: string[] } => {
    const labels: string[] = [];
    const seen = new Set<string>();
    const queue = [...(adj.get(key) ?? [])];
    let missing = false;
    while (queue.length && labels.length < 6) {
      const next = queue.shift();
      if (!next || seen.has(next)) continue;
      seen.add(next);
      const node = nodes.get(next);
      if (!node || node.missing) {
        missing = true;
        labels.push(node?.label ?? next);
        continue;
      }
      if (node.done) {
        for (const child of adj.get(next) ?? []) queue.push(child);
        continue;
      }
      labels.push(`${node.label} (${node.stateLabel})`);
      for (const child of adj.get(next) ?? []) queue.push(child);
    }
    return { missing, labels };
  };
  const items: PlanItem[] = [];
  for (const [key, node] of nodes) {
    const inPlan = node.work || node.done || linked.has(key) || node.approval || node.proposed;
    if (!inPlan) continue;
    if (node.type === "party" && !linked.has(key)) continue;
    if (node.type === "invoice" && !linked.has(key) && !node.work) continue;
    if (node.type === "order" && !linked.has(key) && !node.work) continue;
    if (node.type === "task" && !linked.has(key) && !node.approval) continue;
    const chain = chainOf(key);
    const approvers = approvalFrom.get(key) ?? [];
    let status: PlanStatus = "ready";
    let summary = `${node.label} has no unfinished prerequisite.`;
    let evidence = "No active depends-on or blocks edge is unfinished. This is not authorization.";
    if (circular.has(key)) {
      status = "circular";
      summary = `${node.label} is in a dependency cycle.`;
      evidence = `Cycle includes ${(direct.get(key) ?? [node.label]).join(", ")}. Cyclic work is not treated as executable.`;
    } else if (chain.missing) {
      status = "missing";
      summary = `${node.label} is missing a prerequisite.`;
      evidence = `These records are not in this company: ${chain.labels.join(", ")}.`;
    } else if (node.approval || approvers.length > 0) {
      status = "approval";
      summary = `${node.label} is waiting for a person.`;
      const who = approvers.length
        ? `Requires approval from ${approvers.join(", ")}. The relationship is still active, so approval is not recorded.`
        : `The record state is ${node.stateLabel}. That is waiting for a person. A proposal would not grant it.`;
      evidence = chain.labels.length ? `${who} Also unfinished: ${chain.labels.join("; ")}.` : who;
    } else if (chain.labels.length > 0 || reachesCircular(key)) {
      status = "blocked";
      summary = `${node.label} is blocked.`;
      evidence = chain.labels.length
        ? `Unfinished prerequisite: ${chain.labels.join("; ")}.`
        : "A prerequisite is in a dependency cycle. This record is not treated as executable.";
    } else if (node.proposed) {
      status = "proposed";
      summary = `${node.label} has a proposed mission.`;
      evidence = "The mission is proposed. It is not authorized.";
    } else if (node.done) {
      status = "completed";
      summary = `${node.label} is complete on the record.`;
      evidence = `State ${node.stateLabel}. Completion is the stored state, not an inference.`;
    } else if ((node.type === "obligation" || node.type === "mission" || node.type === "task") && node.work && !owned.has(key)) {
      status = "unassigned";
      summary = `${node.label} has no owner on a relationship.`;
      evidence = "No active owned-by or assigned-to relationship points at this record. No owner was invented.";
    }
    if (!node.work && !node.done && !node.approval && status === "ready") continue;
    items.push({
      recordType: node.type,
      recordId: node.id,
      label: node.label,
      status,
      summary,
      evidence,
      dependsOn: direct.get(key) ?? [],
    });
  }
  items.sort((a, b) => a.label.localeCompare(b.label) || a.recordId.localeCompare(b.recordId));
  const rank = new Map(items.map((item) => [nodeKey(item.recordType, item.recordId), item]));
  const sequenceNodes = items.filter((item) => {
    if (item.status !== "ready" && item.status !== "unassigned" && item.status !== "proposed" && item.status !== "blocked") return false;
    const key = nodeKey(item.recordType, item.recordId);
    return !(adj.get(key) ?? []).some((next) => circular.has(next) || nodes.get(next)?.missing);
  });
  const indegree = new Map<string, number>();
  const forward = new Map<string, string[]>();
  for (const item of sequenceNodes) indegree.set(nodeKey(item.recordType, item.recordId), 0);
  for (const item of sequenceNodes) {
    const from = nodeKey(item.recordType, item.recordId);
    for (const next of adj.get(from) ?? []) {
      if (!indegree.has(next)) continue;
      forward.set(next, [...(forward.get(next) ?? []), from]);
      indegree.set(from, (indegree.get(from) ?? 0) + 1);
    }
  }
  const ready = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([key]) => key);
  ready.sort((a, b) => (rank.get(a)?.label ?? a).localeCompare(rank.get(b)?.label ?? b));
  const sequence: DependencyPlan["sequence"] = [];
  while (ready.length) {
    const current = ready.shift();
    if (!current) break;
    const item = rank.get(current);
    if (!item) continue;
    const prereqs = (adj.get(current) ?? []).map((key) => rank.get(key)?.label).filter((label): label is string => Boolean(label));
    sequence.push({
      recordType: item.recordType,
      recordId: item.recordId,
      label: item.label,
      because: prereqs.length ? `After ${prereqs.join(", ")}.` : "No unfinished prerequisite.",
    });
    for (const child of forward.get(current) ?? []) {
      indegree.set(child, (indegree.get(child) ?? 1) - 1);
      if (indegree.get(child) === 0) {
        ready.push(child);
        ready.sort((a, b) => (rank.get(a)?.label ?? a).localeCompare(rank.get(b)?.label ?? b));
      }
    }
  }
  const records = [...nodes.values()]
    .filter((node) => !node.missing)
    .map((node) => ({ type: node.type, id: node.id, label: node.label }))
    .sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
  return {
    items,
    sequence,
    relationships: rels.map((row) => ({
      id: row.id,
      relation: row.relation,
      sourceType: row.source_type,
      sourceId: row.source_id,
      targetType: row.target_type,
      targetId: row.target_id,
      sourceLabel: nodes.get(nodeKey(row.source_type, row.source_id))?.label ?? row.source_id,
      targetLabel: nodes.get(nodeKey(row.target_type, row.target_id))?.label ?? row.target_id,
      state: row.state,
    })),
    records,
    retired: rels.filter((row) => row.state === "retired").length,
    deadlineNote: DEADLINE_NOTE,
  };
}

export async function syncDependencyFindings(sql: Sql, orgId: string, actorId: string, plan: DependencyPlan): Promise<void> {
  const wanted = new Map<string, PlanItem>();
  for (const item of plan.items) {
    if (item.status === "proposed" || item.status === "completed") continue;
    wanted.set(`dep:${item.status}:${item.recordType}:${item.recordId}`, item);
  }
  const existing = await sql<{ id: string; idempotency_key: string; state: string }>`
    select id, idempotency_key, state from dependency_findings where organization_id = ${orgId}`;
  const byKey = new Map(existing.map((row) => [row.idempotency_key, row]));
  for (const [key, item] of wanted) {
    const row = byKey.get(key);
    if (!row) {
      await sql`insert into dependency_findings (
        id, organization_id, kind, source_type, source_id, summary, evidence, idempotency_key, created_by
      ) values (
        ${nid("dfn")}, ${orgId}, ${item.status}, ${item.recordType}, ${item.recordId},
        ${item.summary.slice(0, 500)}, ${item.evidence.slice(0, 1000)}, ${key}, ${actorId}
      )`;
      continue;
    }
    await sql`update dependency_findings
      set state = ${"active"}, summary = ${item.summary.slice(0, 500)}, evidence = ${item.evidence.slice(0, 1000)}, retired_at = ${null}
      where id = ${row.id} and organization_id = ${orgId}`;
  }
  for (const row of existing) {
    if (row.state === "active" && !wanted.has(row.idempotency_key)) {
      await sql`update dependency_findings set state = ${"retired"}, retired_at = now()
        where id = ${row.id} and organization_id = ${orgId} and state = ${"active"}`;
    }
  }
}

export async function loadDependencyPlan(sql: Sql, orgId: string): Promise<DependencyPlan> {
  return evaluateDependencies(sql, orgId);
}
