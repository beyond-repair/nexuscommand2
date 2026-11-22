import { CompanyError } from "./company.ts";
import type { Sql } from "./company-store.ts";
import { evaluateDependencies, type DependencyPlan } from "./dependencies.ts";
import { evaluatePriority, PRIORITY_POLICY, type PriorityPlan } from "./priority.ts";

/** Version 1 orders recorded work. It does not invent a clock time. */
export const SCHEDULE_POLICY = {
  version: 1,
  document:
    "Version 1. The order comes from the dependency graph, then from priority policy version 1, then from the title, then from the id. A recorded assignee is eligible only inside this company. An agent title is not a capability. Membership alone is not eligibility. Duration and availability are unknown, so this is an order, not a timetable, and the same person is not placed twice. This does not authorize work. The department scheduler is unchanged.",
} as const;

export type SchedulingStatus =
  | "schedulable"
  | "unassigned"
  | "blocked"
  | "approval"
  | "restricted"
  | "proposed"
  | "authorized"
  | "excluded"
  | "conflict";

export type ScheduleItem = {
  recordType: string;
  recordId: string;
  label: string;
  position: number;
  priorityClass: string;
  readiness: string;
  schedulingStatus: SchedulingStatus;
  duration: "unknown";
  windowStart: null;
  windowEnd: null;
  resourceKind: "human" | "agent" | "party" | null;
  resourceId: string | null;
  resourceLabel: string | null;
  availability: "unknown";
  reason: string;
  evidence: string;
  priorityPolicyVersion: number;
  dependencyNote: string;
  priorityEvaluationId: string | null;
  dependencyFindingId: string | null;
  executable: boolean;
};

export type ScheduleConflict = {
  recordType: string;
  recordId: string;
  resourceKind: string | null;
  resourceId: string | null;
  reason: string;
};

export type ScheduleReading = {
  policyVersion: number;
  policyDocument: string;
  underdetermined: true;
  note: string;
  availability: "unknown";
  people: number;
  agents: number;
  items: ScheduleItem[];
  conflicts: ScheduleConflict[];
  fingerprint: string;
};

export type StoredSchedule = {
  id: string;
  version: number;
  state: string;
  fingerprint: string;
  explanation: string;
};

export type ScheduleEvent = {
  id: string;
  kind: string;
  summary: string;
  policyVersion: number;
  createdAt: string;
};

export type ScheduleView = ScheduleReading & {
  proposed: StoredSchedule | null;
  accepted: StoredSchedule | null;
  diverged: boolean;
  events: ScheduleEvent[];
};

type Resource = {
  kind: "agent" | "party";
  id: string;
  label: string;
  ineligible: string | null;
};

const WORK = new Set(["obligation", "mission", "task"]);
const NOTE =
  "Duration and availability are unknown, so no start or end was invented. The schedule is underdetermined as a timetable. Membership does not make a person eligible, and an agent title is not a capability.";

function nid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function nodeKey(type: string, id: string): string {
  return `${type}:${id}`;
}

function refuseAgent(actorId: string, action: string): void {
  if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}

async function assertOwner(sql: Sql, orgId: string, actorId: string, action: string): Promise<void> {
  const rows = await sql<{ role: string }>`select role from memberships
    where organization_id = ${orgId} and user_id = ${actorId} limit 1`;
  if (rows[0]?.role !== "owner") throw new CompanyError(`Only the owner can ${action}.`);
}

async function audit(sql: Sql, orgId: string, actorId: string, action: string, target: string, detail: string): Promise<void> {
  await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${"human"}, ${action}, ${target},
    ${null}, ${null}, ${detail.slice(0, 500)}
  )`;
}

function fingerprintOf(items: ScheduleItem[]): string {
  return `sch:v${SCHEDULE_POLICY.version}:${items.map((item) =>
    [item.position, item.recordType, item.recordId, item.schedulingStatus, item.priorityClass, item.readiness, item.resourceKind ?? "", item.resourceId ?? ""].join(":"),
  ).join("|")}`;
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value ?? "");
}

export async function evaluateSchedule(sql: Sql, orgId: string, existingPlan?: DependencyPlan, existingPriority?: PriorityPlan): Promise<ScheduleReading> {
  const plan = existingPlan ?? await evaluateDependencies(sql, orgId);
  const priority = existingPriority ?? await evaluatePriority(sql, orgId, plan);
  const priorityByKey = new Map(priority.items.map((item) => [nodeKey(item.recordType, item.recordId), item]));
  const rank = new Map(priority.sequence.map((item, index) => [nodeKey(item.recordType, item.recordId), index]));
  const depByKey = new Map(plan.items.map((item) => [nodeKey(item.recordType, item.recordId), item]));
  const obligations = await sql<{ id: string; title: string; autonomy: string; state: string }>`select id, title, autonomy, state
    from obligations where organization_id = ${orgId}`;
  const missions = await sql<{ id: string; title: string; status: string }>`select id, title, status
    from missions where organization_id = ${orgId}`;
  const tasks = await sql<{ id: string; objective: string; state: string }>`select id, objective, state
    from tasks where organization_id = ${orgId}`;
  const parties = await sql<{ id: string; display_name: string; status: string }>`select id, display_name, status
    from parties where organization_id = ${orgId}`;
  const agents = await sql<{ id: string; slug: string; name: string }>`select id, slug, name
    from agents where organization_id = ${orgId}`;
  const memberships = await sql<{ user_id: string }>`select user_id from memberships where organization_id = ${orgId}`;
  const assignments = await sql<{ mission_id: string; agent_slug: string; status: string }>`select mission_id, agent_slug, status
    from assignments where organization_id = ${orgId}`;
  const evaluations = await sql<{ id: string; source_type: string; source_id: string }>`select id, source_type, source_id
    from priority_evaluations where organization_id = ${orgId} and state = ${"active"}`;
  const findings = await sql<{ id: string; source_type: string; source_id: string }>`select id, source_type, source_id
    from dependency_findings where organization_id = ${orgId} and state = ${"active"}`;
  const partyById = new Map(parties.map((row) => [row.id, row]));
  const agentBySlug = new Map(agents.map((row) => [row.slug, row]));
  const evaluationByKey = new Map(evaluations.map((row) => [nodeKey(row.source_type, row.source_id), row.id]));
  const findingByKey = new Map(findings.map((row) => [nodeKey(row.source_type, row.source_id), row.id]));
  const runningAgents = new Set<string>();
  for (const row of assignments) {
    if (row.status !== "RUNNING") continue;
    const agent = agentBySlug.get(row.agent_slug);
    if (agent) runningAgents.add(agent.id);
  }
  const assignmentsByMission = new Map<string, Array<{ agent_slug: string; status: string }>>();
  for (const row of assignments) {
    const list = assignmentsByMission.get(row.mission_id) ?? [];
    list.push(row);
    assignmentsByMission.set(row.mission_id, list);
  }

  const resourceFor = (type: string, id: string): Resource | null => {
    const rel = plan.relationships.find((row) => row.state === "active"
      && (row.relation === "owned_by" || row.relation === "assigned_to")
      && row.sourceType === type && row.sourceId === id && row.targetType === "party");
    if (rel) {
      const party = partyById.get(rel.targetId);
      if (!party || party.status !== "active") {
        return { kind: "party", id: rel.targetId, label: rel.targetLabel, ineligible: "The recorded assignee is not an active party in this company. No substitute was chosen." };
      }
      return { kind: "party", id: party.id, label: party.display_name, ineligible: null };
    }
    if (type !== "mission") return null;
    const named = (assignmentsByMission.get(id) ?? []).find((row) => row.status === "QUEUED" || row.status === "READY" || row.status === "RUNNING");
    if (!named) return null;
    const agent = agentBySlug.get(named.agent_slug);
    if (!agent) {
      return { kind: "agent", id: "", label: named.agent_slug, ineligible: `An assignment names ${named.agent_slug}, who is not an agent in this company. That agent was not scheduled, and no capability was inferred from a title.` };
    }
    return { kind: "agent", id: agent.id, label: agent.name, ineligible: null };
  };

  type Draft = ScheduleItem;
  const drafts: Draft[] = [];
  const seen = new Set<string>();
  const consider = (type: string, id: string, label: string, autonomy: string | null, recordState: string) => {
    const key = nodeKey(type, id);
    if (seen.has(key)) return;
    seen.add(key);
    const dep = depByKey.get(key);
    const scored = priorityByKey.get(key);
    const resource = resourceFor(type, id);
    const readiness = dep?.status ?? (recordState === "CANCELLED" || recordState === "REJECTED" ? "excluded" : "unassigned");
    let schedulingStatus: SchedulingStatus = "unassigned";
    let reason = "No eligible resource is recorded. Availability was not inferred from an empty calendar.";
    const cancelled = recordState === "CANCELLED" || recordState === "REJECTED";
    const completed = readiness === "completed" || recordState === "satisfied" || recordState === "waived"
      || recordState === "ACCEPTED" || recordState === "COMPLETED";
    const failed = recordState === "FAILED";
    if (cancelled) {
      schedulingStatus = "excluded";
      reason = "Cancelled work is not scheduled.";
    } else if (completed) {
      schedulingStatus = "excluded";
      reason = "Completed work is not scheduled.";
    } else if (failed) {
      schedulingStatus = "excluded";
      reason = "A failed task is not scheduled as executable work.";
    } else if (autonomy === "restricted") {
      schedulingStatus = "restricted";
      reason = "Restricted work stays with a person. A schedule cannot hand it to an agent.";
    } else if (readiness === "blocked" || readiness === "missing" || readiness === "circular") {
      schedulingStatus = "blocked";
      reason = readiness === "circular"
        ? "This work is in a dependency cycle. It is not scheduled as executable."
        : readiness === "missing"
          ? "A prerequisite is missing. It is not scheduled as executable."
          : "A prerequisite is unfinished. A higher class does not jump it, and it is not scheduled as executable.";
    } else if (readiness === "approval" || recordState === "WAITING_FOR_APPROVAL" || recordState === "AWAITING_ACCEPTANCE") {
      schedulingStatus = "approval";
      reason = "Waiting for human approval. A schedule does not grant it.";
    } else if (recordState === "PROPOSED" || readiness === "proposed") {
      schedulingStatus = "proposed";
      reason = "This mission is proposed. A schedule does not authorize it.";
    } else if (recordState === "AUTHORIZED" || recordState === "EXECUTING" || recordState === "RUNNING" || recordState === "VALIDATING" || recordState === "RETRY_PENDING") {
      schedulingStatus = "authorized";
      reason = "This work is already authorized. The schedule does not start it and does not change that authority.";
    } else if (resource?.ineligible) {
      schedulingStatus = "unassigned";
      reason = resource.ineligible;
    } else if (resource) {
      schedulingStatus = "schedulable";
      reason = `Recorded assignee ${resource.label}. Availability is unknown, so this is a place in the order, not a time slot.`;
    }
    if (resource?.ineligible && schedulingStatus !== "excluded" && schedulingStatus !== "unassigned") {
      reason = `${reason} ${resource.ineligible}`;
    }
    const visible = resource && !resource.ineligible && resource.id ? resource : null;
    drafts.push({
      recordType: type,
      recordId: id,
      label,
      position: 0,
      priorityClass: scored?.classification ?? "unscored",
      readiness,
      schedulingStatus,
      duration: "unknown",
      windowStart: null,
      windowEnd: null,
      resourceKind: visible ? visible.kind : null,
      resourceId: visible ? visible.id : null,
      resourceLabel: visible ? visible.label : null,
      availability: "unknown",
      reason,
      evidence: `${dep?.evidence ?? "No dependency finding is stored for this record."} ${scored ? `Priority ${scored.classification} under policy version ${scored.policyVersion}.` : "No priority score is stored. None was invented."} ${NOTE}`,
      priorityPolicyVersion: scored?.policyVersion ?? PRIORITY_POLICY.version,
      dependencyNote: dep?.evidence ?? "",
      priorityEvaluationId: evaluationByKey.get(key) ?? null,
      dependencyFindingId: findingByKey.get(key) ?? null,
      executable: false,
    });
  };

  for (const row of obligations) consider("obligation", row.id, row.title, row.autonomy, row.state);
  for (const row of missions) consider("mission", row.id, row.title, null, row.status);
  for (const row of tasks) consider("task", row.id, row.objective.slice(0, 120), null, row.state);
  for (const item of plan.items) {
    if (!WORK.has(item.recordType)) continue;
    consider(item.recordType, item.recordId, item.label, null, item.status);
  }

  drafts.sort((left, right) => {
    const leftOut = left.schedulingStatus === "excluded" ? 1 : 0;
    const rightOut = right.schedulingStatus === "excluded" ? 1 : 0;
    if (leftOut !== rightOut) return leftOut - rightOut;
    const leftRank = rank.get(nodeKey(left.recordType, left.recordId)) ?? 100000;
    const rightRank = rank.get(nodeKey(right.recordType, right.recordId)) ?? 100000;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.label.localeCompare(right.label) || left.recordId.localeCompare(right.recordId);
  });

  const used = new Set<string>([...runningAgents].map((id) => `agent:${id}`));
  const conflicts: ScheduleConflict[] = [];
  for (const item of drafts) {
    if (item.schedulingStatus === "authorized" && item.resourceKind && item.resourceId) used.add(`${item.resourceKind}:${item.resourceId}`);
  }
  for (const item of drafts) {
    if (item.schedulingStatus !== "schedulable" || !item.resourceKind || !item.resourceId) continue;
    const key = `${item.resourceKind}:${item.resourceId}`;
    if (used.has(key)) {
      item.schedulingStatus = "conflict";
      item.reason = `${item.resourceLabel ?? "This resource"} is already placed on other work. Duration is unknown, so a second placement would double-book. Neither slot is a time, and neither is authorization.`;
      conflicts.push({
        recordType: item.recordType,
        recordId: item.recordId,
        resourceKind: item.resourceKind,
        resourceId: item.resourceId,
        reason: item.reason,
      });
      continue;
    }
    used.add(key);
  }
  drafts.forEach((item, index) => {
    item.position = index + 1;
    item.executable = item.schedulingStatus === "schedulable";
  });

  return {
    policyVersion: SCHEDULE_POLICY.version,
    policyDocument: SCHEDULE_POLICY.document,
    underdetermined: true,
    note: NOTE,
    availability: "unknown",
    people: memberships.length,
    agents: agents.length,
    items: drafts,
    conflicts,
    fingerprint: fingerprintOf(drafts),
  };
}

function stored(row: { id: string; version: unknown; state: string; fingerprint: string; explanation: string } | undefined): StoredSchedule | null {
  if (!row) return null;
  return { id: row.id, version: Number(row.version), state: row.state, fingerprint: row.fingerprint, explanation: row.explanation };
}

export async function loadSchedule(sql: Sql, orgId: string): Promise<ScheduleView> {
  const reading = await evaluateSchedule(sql, orgId);
  const plans = await sql<{ id: string; version: unknown; state: string; fingerprint: string; explanation: string }>`
    select id, version, state, fingerprint, explanation from schedule_plans
    where organization_id = ${orgId} and state in (${"proposed"}, ${"accepted"})
    order by version desc`;
  const events = await sql<{ id: string; kind: string; summary: string; policy_version: unknown; created_at: unknown }>`
    select id, kind, summary, policy_version, created_at from schedule_events
    where organization_id = ${orgId} order by created_at desc limit 8`;
  const proposed = stored(plans.find((row) => row.state === "proposed"));
  return {
    ...reading,
    proposed,
    accepted: stored(plans.find((row) => row.state === "accepted")),
    diverged: Boolean(proposed && proposed.fingerprint !== reading.fingerprint),
    events: events.map((row) => ({
      id: row.id,
      kind: row.kind,
      summary: row.summary,
      policyVersion: Number(row.policy_version),
      createdAt: iso(row.created_at),
    })),
  };
}

async function writeItems(sql: Sql, orgId: string, planId: string, reading: ScheduleReading): Promise<void> {
  for (const item of reading.items) {
    await sql`insert into schedule_items (
      id, organization_id, plan_id, source_type, source_id, position, priority_class, readiness, scheduling_status,
      duration, window_start, window_end, resource_kind, resource_id, resource_label, availability, reason, evidence,
      priority_policy_version, dependency_note, priority_evaluation_id, dependency_finding_id
    ) values (
      ${nid("sit")}, ${orgId}, ${planId}, ${item.recordType}, ${item.recordId}, ${item.position}, ${item.priorityClass},
      ${item.readiness}, ${item.schedulingStatus}, ${"unknown"}, ${null}, ${null}, ${item.resourceKind}, ${item.resourceId},
      ${item.resourceLabel}, ${"unknown"}, ${item.reason.slice(0, 500)}, ${item.evidence.slice(0, 1200)},
      ${item.priorityPolicyVersion}, ${item.dependencyNote.slice(0, 500)}, ${item.priorityEvaluationId}, ${item.dependencyFindingId}
    )`;
  }
  for (const conflict of reading.conflicts) {
    await sql`insert into schedule_conflicts (
      id, organization_id, plan_id, source_type, source_id, resource_kind, resource_id, reason
    ) values (
      ${nid("scf")}, ${orgId}, ${planId}, ${conflict.recordType}, ${conflict.recordId},
      ${conflict.resourceKind}, ${conflict.resourceId}, ${conflict.reason.slice(0, 500)}
    )`;
  }
}

export async function syncSchedule(sql: Sql, orgId: string, actorId: string, cycleId: string, reading: ScheduleReading): Promise<void> {
  refuseAgent(actorId, "write a schedule");
  await sql`insert into schedule_policies (id, organization_id, version, document, created_by)
    values (${nid("spo")}, ${orgId}, ${SCHEDULE_POLICY.version}, ${SCHEDULE_POLICY.document}, ${actorId})
    on conflict (organization_id, version) do nothing`;
  const current = await sql<{ id: string; version: unknown; fingerprint: string }>`select id, version, fingerprint from schedule_plans
    where organization_id = ${orgId} and state = ${"proposed"} limit 1`;
  if (current[0]?.fingerprint === reading.fingerprint) return;
  const previousItems = current[0]
    ? await sql<{ source_type: string; source_id: string; scheduling_status: string }>`select source_type, source_id, scheduling_status
        from schedule_items where organization_id = ${orgId} and plan_id = ${current[0].id}`
    : [];
  if (current[0]) {
    await sql`update schedule_plans set state = ${"superseded"}
      where id = ${current[0].id} and organization_id = ${orgId} and state = ${"proposed"}`;
    await sql`insert into schedule_events (
      id, organization_id, plan_id, previous_plan_id, kind, summary, policy_version, cycle_id, created_by
    ) values (
      ${nid("sev")}, ${orgId}, ${current[0].id}, ${null}, ${"superseded"},
      ${"The previous proposal was kept and marked superseded. No mission was authorized."},
      ${SCHEDULE_POLICY.version}, ${cycleId}, ${actorId}
    )`;
  }
  const versionRow = await sql<{ n: unknown }>`select coalesce(max(version), 0)::int as n from schedule_plans where organization_id = ${orgId}`;
  const version = Number(versionRow[0]?.n ?? 0) + 1;
  const planId = nid("spl");
  const diff = previousItems.length === 0
    ? "First proposed order. Duration and availability are unknown, so this is not a timetable."
    : difference(previousItems, reading.items);
  const accepted = await sql<{ version: unknown }>`select version from schedule_plans
    where organization_id = ${orgId} and state = ${"accepted"} limit 1`;
  const beside = accepted[0] ? ` Accepted version ${Number(accepted[0].version)} was left in place.` : "";
  const explanation = `Proposed schedule version ${version}. ${diff}${beside} No mission was authorized and no money moved.`.slice(0, 1200);
  await sql`insert into schedule_plans (
    id, organization_id, cycle_id, version, policy_version, state, fingerprint, explanation, underdetermined, created_by
  ) values (
    ${planId}, ${orgId}, ${cycleId}, ${version}, ${SCHEDULE_POLICY.version}, ${"proposed"}, ${reading.fingerprint},
    ${explanation}, ${true}, ${actorId}
  )`;
  await writeItems(sql, orgId, planId, reading);
  await sql`insert into schedule_events (
    id, organization_id, plan_id, previous_plan_id, kind, summary, policy_version, cycle_id, created_by
  ) values (
    ${nid("sev")}, ${orgId}, ${planId}, ${current[0]?.id ?? null}, ${"proposed"}, ${explanation.slice(0, 500)},
    ${SCHEDULE_POLICY.version}, ${cycleId}, ${actorId}
  )`;
  await audit(sql, orgId, actorId, "schedule.proposed", planId, explanation);
}

function difference(
  previous: Array<{ source_type: string; source_id: string; scheduling_status: string }>,
  next: ScheduleItem[],
): string {
  const prior = new Map(previous.map((row) => [nodeKey(row.source_type, row.source_id), row.scheduling_status]));
  const lines: string[] = [];
  for (const item of next) {
    if (item.schedulingStatus === "excluded") continue;
    const before = prior.get(nodeKey(item.recordType, item.recordId));
    if (!before) lines.push(`${item.label} entered as ${item.schedulingStatus}.`);
    else if (before !== item.schedulingStatus) lines.push(`${item.label} was ${before} and is now ${item.schedulingStatus}.`);
    if (lines.length >= 4) break;
  }
  return lines.join(" ") || "The order changed. Duration and availability are still unknown.";
}

export async function acceptSchedule(sql: Sql, input: { orgId: string; actorId: string }): Promise<void> {
  refuseAgent(input.actorId, "accept a schedule");
  await assertOwner(sql, input.orgId, input.actorId, "accept a schedule");
  if (!sql.transaction) throw new CompanyError("The schedule lock is unavailable. Nothing was accepted.");
  await sql.transaction(async (tx) => {
    await tx`select id from organizations where id = ${input.orgId} for update`;
    const proposed = await tx<{ id: string; version: unknown }>`select id, version from schedule_plans
      where organization_id = ${input.orgId} and state = ${"proposed"} limit 1`;
    if (!proposed[0]) throw new CompanyError("That schedule is not an open proposal in this company.");
    const previous = await tx<{ id: string }>`select id from schedule_plans
      where organization_id = ${input.orgId} and state = ${"accepted"} limit 1`;
    if (previous[0]) {
      await tx`update schedule_plans set state = ${"superseded"}
        where id = ${previous[0].id} and organization_id = ${input.orgId} and state = ${"accepted"}`;
      await tx`insert into schedule_events (
        id, organization_id, plan_id, previous_plan_id, kind, summary, policy_version, cycle_id, created_by
      ) values (
        ${nid("sev")}, ${input.orgId}, ${previous[0].id}, ${null}, ${"superseded"},
        ${"The accepted schedule was kept and marked superseded. Missions were not changed."},
        ${SCHEDULE_POLICY.version}, ${null}, ${input.actorId}
      )`;
    }
    await tx`update schedule_plans set state = ${"accepted"}, decided_by = ${input.actorId}, decided_at = now()
      where id = ${proposed[0].id} and organization_id = ${input.orgId} and state = ${"proposed"}`;
    const summary = `Accepted schedule version ${Number(proposed[0].version)}. No mission was authorized, no task was started, and no money moved.`;
    await tx`insert into schedule_events (
      id, organization_id, plan_id, previous_plan_id, kind, summary, policy_version, cycle_id, created_by
    ) values (
      ${nid("sev")}, ${input.orgId}, ${proposed[0].id}, ${previous[0]?.id ?? null}, ${"accepted"}, ${summary},
      ${SCHEDULE_POLICY.version}, ${null}, ${input.actorId}
    )`;
    await audit(tx, input.orgId, input.actorId, "schedule.accepted", proposed[0].id, summary);
  });
}

export async function cancelSchedule(sql: Sql, input: { orgId: string; actorId: string; which: string }): Promise<void> {
  refuseAgent(input.actorId, "cancel a schedule");
  await assertOwner(sql, input.orgId, input.actorId, "cancel a schedule");
  if (input.which !== "proposed" && input.which !== "accepted") throw new CompanyError("Cancel the proposed schedule or the accepted schedule.");
  if (!sql.transaction) throw new CompanyError("The schedule lock is unavailable. Nothing was cancelled.");
  await sql.transaction(async (tx) => {
    await tx`select id from organizations where id = ${input.orgId} for update`;
    const rows = await tx<{ id: string; version: unknown }>`update schedule_plans
      set state = ${"cancelled"}, decided_by = ${input.actorId}, decided_at = now()
      where organization_id = ${input.orgId} and state = ${input.which}
      returning id, version`;
    if (!rows[0]) throw new CompanyError("That schedule is not in this company.");
    const summary = `Cancelled ${input.which} schedule version ${Number(rows[0].version)}. The row stays. No mission was authorized or withdrawn.`;
    await tx`insert into schedule_events (
      id, organization_id, plan_id, previous_plan_id, kind, summary, policy_version, cycle_id, created_by
    ) values (
      ${nid("sev")}, ${input.orgId}, ${rows[0].id}, ${null}, ${"cancelled"}, ${summary},
      ${SCHEDULE_POLICY.version}, ${null}, ${input.actorId}
    )`;
    await audit(tx, input.orgId, input.actorId, "schedule.cancelled", rows[0].id, summary);
  });
}

export async function setSchedulePolicy(sql: Sql, input: { orgId: string; actorId: string; version: string }): Promise<void> {
  refuseAgent(input.actorId, "change the schedule policy");
  await assertOwner(sql, input.orgId, input.actorId, "change the schedule policy");
  if (input.version !== String(SCHEDULE_POLICY.version)) {
    throw new CompanyError("Only schedule policy version 1 is defined. Missing duration and availability were not given a weight.");
  }
  await sql`insert into schedule_policies (id, organization_id, version, document, created_by)
    values (${nid("spo")}, ${input.orgId}, ${SCHEDULE_POLICY.version}, ${SCHEDULE_POLICY.document}, ${input.actorId})
    on conflict (organization_id, version) do nothing`;
  await audit(sql, input.orgId, input.actorId, "schedule.policy", String(SCHEDULE_POLICY.version), "Policy version 1 confirmed. This does not authorize work.");
}
