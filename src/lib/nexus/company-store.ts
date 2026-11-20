import {
  AGENTS,
  DEPARTMENTS,
  type AssignmentStatus,
  type Check,
  type MissionStatus,
  type PipelineAgent,
  agentBySlug,
  allPassed,
  assertMissionTransition,
  assemblePacket,
  canonicalAssignments,
  CompanyError,
  departmentRank,
  dollarsToCents,
  formatMoney,
  isMissionStatus,
  localDraft,
  localPlan,
  nextDefects,
  nextMemory,
  ownedChecksPass,
  PAYMENT,
  PIPELINE,
  planFromModel,
  renderVerification,
  reworkFrom,
  systemPrompt,
  titleFrom,
  verifyArtifacts,
  walksIntoCycle,
  evidenceStillCovers,
  providerDecision,
  type DataClass,
} from "./company.ts";
import { extractHtml, executeArtifact, sha256, type RuntimeReport } from "./qa-sandbox.ts";
import { atomically, cancelLeases, claimLease, commitLease, expireLeases, failLease, renewLease } from "./company-lease.ts";
import { childBlocksAcceptance, clampPriority, deriveFindings, type IntelMission } from "./intelligence.ts";
import { githubHealth, maintenanceClass, measuredDuration, measuredRate, recommend, requirementVerdict } from "./operate.ts";
import {
  budgetDecision,
  contentHash,
  diffRequirements,
  ownerMaySetCeiling,
  reliabilityOf,
  requirementsOf,
  traceImpact,
  type Observation,
} from "./control.ts";
import {
  connectGithubAccount,
  liveGithubFetch,
  pollDue,
  readCredentialKey,
  readGithub,
  revokeGithubAccount,
  GithubRefusal,
} from "./github.ts";
import { applyTransition } from "./mission-state.ts";
import { linkTaskToMission, missionTaskLinks, requireOwner, unlinkTaskFromMission } from "./mission-link.ts";
import { commandRateSnapshot } from "./command-rate.ts";
import { enqueueOutbox, outboxSnapshot, processOutbox, recoverExpiredOutbox } from "./outbox.ts";
import {
  actionDecision,
  connectionLabel,
  coveredRequirements,
  deviceCommand,
  forecastCost,
  quarantineExternal,
  quoteCost,
  relateRequirements,
  unpricedDispatch,
  type PriceCard,
  type UnknownCostPolicy,
} from "./world.ts";
import { ventureSummary } from "./venture.ts";
import { loadControl, type ControlSnapshot } from "./control-loop.ts";
import {
  addContact,
  archiveParty,
  assignRole,
  createOffer,
  createParty,
  deactivateRole,
  editOffer,
  editParty,
  listOffers,
  listParties,
  reactivateRole,
  retireOffer,
  type OfferRecord,
  type PartyRecord,
} from "./books.ts";

export interface Sql {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  transaction?<T>(fn: (tx: Sql) => Promise<T>): Promise<T>;
}

export type Thinker = (input: { system: string; user: string }) => Promise<{
  text: string;
  model: string;
  unavailable?: boolean;
  outcome?: "succeeded" | "failed" | "timeout" | "withheld";
  durationMs?: number;
  errorCategory?: string;
}>;

export type MissionSummary = {
  id: string;
  title: string;
  objective: string;
  status: MissionStatus;
  updatedAt: string;
  done: number;
  total: number;
  priority: number;
  parentId: string | null;
};

export type FindingView = {
  id: string;
  missionId: string | null;
  severity: string;
  title: string;
  evidence: string;
  recommendation: string;
  confidence: string;
  ownerRequired: boolean;
};

export type CommandCenter = {
  organization: { id: string; name: string; role: string };
  counts: { missions: number; executing: number; awaiting: number; defects: number; recordedCents: number };
  missions: MissionSummary[];
  departments: Array<{ slug: string; name: string; mandate: string; open: number }>;
  awaiting: Array<{ id: string; title: string }>;
  recent: Array<{ id: string; action: string; detail: string; target: string | null; createdAt: string }>;
  disclosure: "local" | "public";
  workers: { leased: number; retry: number; dead: number };
  scheduler: { status: "running" | "paused" | "stopped"; lastTick: string | null; lastError: string; queue: number };
  findings: FindingView[];
  resources: {
    running: number;
    capacity: number;
    queue: number;
    qaPassed: number;
    qaFailed: number;
    dispatches: number;
    avgDurationMs: number | null;
    reused: number;
    contested: number;
    acceptedKnowledge: number;
  };
  handoffs: Array<{ id: string; missionId: string; fromDepartment: string; toDepartment: string; createdAt: string }>;
  changes: Array<{
    id: string;
    missionId: string;
    version: number;
    state: string;
    revalidation: string;
    added: number;
    removed: number;
    affected: number;
  }>;
  finance: {
    ceilingCents: number | null;
    spentCents: number;
    receivedCents: number;
    reservedCents: number;
    estimateCents: number;
    remainingCents: number | null;
    utilization: number | null;
  };
  business: {
    name: string | null;
    stage: string | null;
    openObligations: number;
    restrictedOpen: number;
  };
  control: ControlSnapshot;
  providers: Array<{
    provider: string;
    model: string;
    attempts: number;
    withheld: number;
    unspecified: number;
    successRate: number | null;
    failureRate: number | null;
    timeoutRate: number | null;
    averageMs: number | null;
    p95Ms: number | null;
    periodStart: string | null;
    periodEnd: string | null;
    lastOutcome: string | null;
    measured: boolean;
    note: string;
  }>;
  world: {
    policy: UnknownCostPolicy;
    prices: number;
    unknownCosts: number;
    estimates: number;
    forecast: string;
    integrations: Array<{ id: string; name: string; category: string; label: "connected" | "not connected" }>;
    pendingActions: number;
    devices: Array<{ id: string; name: string; connected: boolean; emergencyStop: boolean; permission: string }>;
    observations: number;
    maintenanceProposed: number;
    maintenanceApplied: number;
    outboxPending: number;
    outboxDead: number;
    github: {
      status: string;
      account: string;
      scopes: string;
      hint: string;
      rate: string;
      lastSuccess: string | null;
      lastFailure: string;
      lastSync: string | null;
      polling: string;
      repos: Array<{ fullName: string; private: boolean }>;
      recent: Array<{ operation: string; resource: string; httpStatus: number; result: string; createdAt: string }>;
    };
  };
};

export type AssignmentView = {
  id: string;
  agent: string;
  agentName: string;
  department: string;
  title: string;
  brief: string;
  position: number;
  status: AssignmentStatus;
  artifact: string;
  evidence: Check[];
  model: string;
  error: string;
};

export type MissionView = {
  mission: {
    id: string;
    title: string;
    objective: string;
    status: MissionStatus;
    strategy: string;
    questions: string[];
    answers: string;
    planSource: string;
    dependsOn: string | null;
    parentId: string | null;
    priority: number;
    milestone: string;
    classification: "internal" | "confidential";
    updatedAt: string;
  };
  assignments: AssignmentView[];
  audit: Array<{ id: string; action: string; detail: string; fromState: string | null; toState: string | null; createdAt: string }>;
  memory: string[];
  defects: Array<{ id: string; name: string; detail: string }>;
  payments: PaymentRow[];
  jobs: Array<{ status: string; attempt: number; lastError: string; updatedAt: string }>;
  qa: {
    status: string;
    sha256: string;
    detail: string;
    executionId: string;
    suite: string;
    current: boolean;
    tests: Array<{ name: string; passed: boolean; detail: string }>;
  } | null;
  peers: Array<{ id: string; title: string; status: MissionStatus }>;
  findings: FindingView[];
  handoffs: Array<{
    id: string;
    fromDepartment: string;
    toDepartment: string;
    completed: string;
    outstanding: string;
    risks: string;
    criteria: string;
    createdAt: string;
  }>;
  taskLinks: Array<{ taskId: string; objective: string; state: string; projectName: string }>;
};

export type WorkforceView = {
  departments: Array<{
    slug: string;
    name: string;
    mandate: string;
    agents: Array<{
      slug: string;
      name: string;
      title: string;
      responsibility: string;
      reportsTo: string | null;
      level: number;
    }>;
  }>;
};

export type OperationsView = {
  scheduler: { status: "running" | "paused" | "stopped"; lastTick: string | null; lastError: string; queue: number };
  capacity: number;
  workers: { leased: number; retry: number; dead: number };
  leases: Array<{ missionId: string; missionTitle: string; agentName: string; until: string }>;
  sandbox: {
    suite: string;
    memoryBytes: number;
    cpuSeconds: number;
    processes: number;
    fileBytes: number;
    network: string;
    filesystem: string;
    enforced: boolean;
    policy: string;
    identity: string;
    capabilities: string;
    proc: string;
    env: string;
    seccomp: string;
  } | null;
  recoveries: Array<{ id: string; detail: string; createdAt: string }>;
  rows: Array<{
    id: string;
    missionId: string;
    missionTitle: string;
    agentName: string;
    title: string;
    status: AssignmentStatus;
    updatedAt: string;
  }>;
  metrics: Array<{ name: string; kind: "measured" | "unavailable"; sample: number; value: number | null; unit: string; note: string }>;
  maintenance: Array<{ id: string; title: string; evidence: string; risk: string; autonomous: boolean; status: string; result: string }>;
  recommendations: string[];
  outbox: {
    pending: number;
    processing: number;
    failed: number;
    dead: number;
    completed: number;
    oldestSeconds: number | null;
  };
  rateLimit: { tracked: number; dropped: number; limit: number; windowMs: number };
};

export type KnowledgeView = {
  entries: Array<{
    id: string;
    kind: string;
    title: string;
    body: string;
    source: string;
    verified: boolean;
    state: string;
    version: number;
    confidence: string;
    missionId: string | null;
    createdAt: string;
  }>;
};

export type GovernanceView = {
  events: Array<{ id: string; action: string; actorId: string; detail: string; target: string | null; fromState: string | null; toState: string | null; createdAt: string }>;
  disclosure: "local" | "public";
  workers: { leased: number; retry: number; dead: number };
  scheduler: { status: "running" | "paused" | "stopped"; lastTick: string | null; lastError: string; queue: number };
};

export type PaymentRow = {
  id: string;
  payer: string;
  amountCents: number;
  method: string;
  destination: string;
  note: string;
  voidedAt: string | null;
  missionId: string | null;
  missionTitle: string | null;
  createdAt: string;
  direction: "receipt" | "expenditure";
};

export type PaymentsView = {
  destination: typeof PAYMENT;
  totalCents: number;
  rows: PaymentRow[];
  missions: Array<{ id: string; title: string }>;
  finance: CommandCenter["finance"];
  parties: PartyRecord[];
  offers: OfferRecord[];
};

type Workspace = { orgId: string; role: string; orgName: string };

const noopThink: Thinker = async () => ({ text: "", model: "" });

export async function commandCenter(sql: Sql, userId: string): Promise<CommandCenter> {
  const ws = await ensureCompany(sql, userId);
  const missions = await listMissions(sql, ws.orgId);
  const departments = await sql<{ slug: string; name: string; mandate: string; open: unknown }>`
    select d.slug, d.name, d.mandate,
      (select count(*)::int from assignments a
        where a.organization_id = d.organization_id and a.department_slug = d.slug
          and a.status in ('READY', 'RUNNING', 'FAILED')) as open
    from departments d where d.organization_id = ${ws.orgId} order by d.name`;
  const awaiting = missions.filter((mission) => mission.status === "AWAITING_ACCEPTANCE");
  const defectRows = await sql<{ open: unknown }>`select count(*)::int as open from defects
    where organization_id = ${ws.orgId} and status = ${"open"}`;
  const paid = await sql<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${ws.orgId} and voided_at is null and direction = ${"receipt"}`;
  await expireLeases(sql);
  const workerRows = await sql<{ status: string; count: unknown }>`
    select status, count(*)::int as count from execution_jobs
    where organization_id = ${ws.orgId} and status in ('leased', 'retry', 'dead')
    group by status`;
  const workers = { leased: 0, retry: 0, dead: 0 };
  for (const row of workerRows) {
    if (row.status === "leased" || row.status === "retry" || row.status === "dead") workers[row.status] = num(row.count);
  }
  const recent = await sql<{ id: string; action: string; detail: string; target: string | null; created_at: unknown }>`
    select id, action, detail, target, created_at from audit_events
    where organization_id = ${ws.orgId} order by created_at desc limit 6`;
  return {
    organization: { id: ws.orgId, name: ws.orgName, role: ws.role },
    counts: {
      missions: missions.length,
      executing: missions.filter((mission) => mission.status === "EXECUTING" || mission.status === "AUTHORIZED").length,
      awaiting: awaiting.length,
      defects: num(defectRows[0]?.open),
      recordedCents: num(paid[0]?.total),
    },
    missions,
    departments: departments.map((row) => ({
      slug: row.slug,
      name: row.name,
      mandate: row.mandate,
      open: num(row.open),
    })).sort((a, b) => departmentRank(a.slug) - departmentRank(b.slug)),
    awaiting: awaiting.map((mission) => ({ id: mission.id, title: mission.title })),
    recent: recent.map((row) => ({
      id: row.id,
      action: row.action,
      detail: row.detail,
      target: row.target,
      createdAt: iso(row.created_at),
    })),
    disclosure: await readDisclosure(sql, ws.orgId),
    workers,
    scheduler: await readScheduler(sql, ws.orgId),
    findings: (await drainOutbox(sql, ws.orgId, userId), await refreshOperate(sql, ws.orgId, userId), await syncFindings(sql, ws.orgId)),
    resources: await resourceSnapshot(sql, ws.orgId),
    handoffs: await recentHandoffs(sql, ws.orgId),
    changes: await recentChanges(sql, ws.orgId),
    finance: await financeSnapshot(sql, ws.orgId),
    business: await ventureSummary(sql, ws.orgId),
    control: await loadControl(sql, ws.orgId),
    providers: await providerSnapshot(sql, ws.orgId),
    world: await worldSnapshot(sql, ws.orgId),
  };
}

export async function missionView(sql: Sql, userId: string, missionId: string): Promise<MissionView> {
  const ws = await ensureCompany(sql, userId);
  const mission = await mustMission(sql, ws.orgId, missionId);
  await releaseStaleRuns(sql, ws, mission.id);
  let assignments = await loadAssignments(sql, mission.id);
  try {
    await offerIfReady(sql, ws, mission, assignments);
    assignments = await loadAssignments(sql, mission.id);
  } catch (error) {
    if (!(error instanceof CompanyError)) throw error;
  }
  const audit = await sql<{
    id: string;
    action: string;
    detail: string;
    from_state: string | null;
    to_state: string | null;
    created_at: unknown;
  }>`select id, action, detail, from_state, to_state, created_at from audit_events
    where organization_id = ${ws.orgId} and target = ${mission.id}
    order by created_at desc limit 12`;
  return {
    mission: {
      id: mission.id,
      title: mission.title,
      objective: mission.objective,
      status: mission.status,
      strategy: mission.strategy,
      questions: readStrings(mission.questions),
      answers: mission.answers,
      planSource: mission.plan_source,
      dependsOn: mission.depends_on,
      parentId: mission.parent_id,
      priority: mission.priority,
      milestone: mission.milestone,
      classification: mission.classification === "confidential" ? "confidential" : "internal",
      updatedAt: iso(mission.updated_at),
    },
    assignments: assignments.map(toAssignment),
    audit: audit.map((row) => ({
      id: row.id,
      action: row.action,
      detail: row.detail,
      fromState: row.from_state,
      toState: row.to_state,
      createdAt: iso(row.created_at),
    })),
    memory: await memoryTitles(sql, ws.orgId, mission.id),
    defects: await openDefects(sql, mission.id),
    payments: await missionPayments(sql, ws.orgId, mission.id),
    jobs: await missionJobs(sql, mission.id),
    qa: await latestQa(sql, ws.orgId, mission.id, extractHtml(assignments.find((row) => row.agent_slug === "developer")?.artifact ?? "")),
    peers: await peerMissions(sql, ws.orgId, mission.id),
    findings: (await syncFindings(sql, ws.orgId)).filter((item) => item.missionId === mission.id || item.missionId === null),
    handoffs: await missionHandoffs(sql, mission.id),
    taskLinks: await missionTaskLinks(sql, ws.orgId, mission.id),
  };
}

export async function workforce(sql: Sql, userId: string): Promise<WorkforceView> {
  const ws = await ensureCompany(sql, userId);
  const departments = await sql<{ id: string; slug: string; name: string; mandate: string }>`
    select id, slug, name, mandate from departments where organization_id = ${ws.orgId} order by name`;
  const agents = await sql<{
    department_id: string;
    slug: string;
    name: string;
    title: string;
    responsibility: string;
    reports_to: string | null;
    permission_level: number;
  }>`select department_id, slug, name, title, responsibility, reports_to, permission_level
    from agents where organization_id = ${ws.orgId} order by name`;
  return {
    departments: departments.map((department) => ({
      slug: department.slug,
      name: department.name,
      mandate: department.mandate,
      agents: agents
        .filter((agent) => agent.department_id === department.id)
        .map((agent) => ({
          slug: agent.slug,
          name: agent.name,
          title: agent.title,
          responsibility: agent.responsibility,
          reportsTo: agent.reports_to ? (agentBySlug(agent.reports_to)?.name ?? agent.reports_to) : null,
          level: Number(agent.permission_level),
        })),
    })).sort((a, b) => departmentRank(a.slug) - departmentRank(b.slug)),
  };
}

export async function drainOutbox(sql: Sql, orgId: string, actorId: string): Promise<void> {
  const recovered = await recoverExpiredOutbox(sql, orgId);
  await processOutbox(sql, orgId, 20);
  if (recovered < 1) return;
  await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${actorId.startsWith("svc:") ? "service" : "human"}, ${"outbox.recovered"}, ${"outbox"},
    ${"processing"}, ${"failed"}, ${`${recovered} expired delivery lease${recovered === 1 ? "" : "s"} returned to the queue. No mission was authorized.`}
  )`;
}

export async function refreshOperate(sql: Sql, orgId: string, actorId: string): Promise<{
  metrics: OperationsView["metrics"];
  maintenance: OperationsView["maintenance"];
  recommendations: string[];
}> {
  const released = await expireLeases(sql);
  const jobs = await sql<{ done: unknown; finished: unknown; retried: unknown }>`select
      count(*) filter (where status = ${"done"})::int as done,
      count(*) filter (where status in ('done', 'dead'))::int as finished,
      count(*) filter (where attempt >= 2)::int as retried
    from execution_jobs where organization_id = ${orgId}`;
  const qa = await sql<{ passed: unknown; failed: unknown; total: unknown }>`select
      count(*) filter (where status = ${"passed"})::int as passed,
      count(*) filter (where status = ${"failed"})::int as failed,
      count(*)::int as total
    from qa_reports where organization_id = ${orgId}`;
  const durations = await sql<{ seconds: unknown }>`select extract(epoch from (updated_at - created_at)) as seconds
    from missions where organization_id = ${orgId} and status = ${"ACCEPTED"}`;
  const blocked = await sql<{ count: unknown }>`select count(*)::int as count from missions m
    where m.organization_id = ${orgId} and m.status in ('AUTHORIZED', 'EXECUTING') and m.depends_on is not null
      and not exists (select 1 from missions parent where parent.id = m.depends_on and parent.organization_id = m.organization_id and parent.status = ${"ACCEPTED"})`;
  const defects = await sql<{ count: unknown }>`select count(*)::int as count from defects where organization_id = ${orgId} and status = ${"open"}`;
  const prices = await sql<{ count: unknown }>`select count(*)::int as count from provider_prices where organization_id = ${orgId} and status = ${"verified"} and review_at <= now()`;
  const github = await sql<{ status: string; last_sync_at: unknown; poll_minutes: unknown }>`select status, last_sync_at, poll_minutes from github_connections
    where organization_id = ${orgId} order by updated_at desc limit 1`;
  const execution = measuredRate(num(jobs[0]?.done), num(jobs[0]?.finished));
  const quality = measuredRate(num(qa[0]?.passed), num(qa[0]?.total));
  const duration = measuredDuration(durations.map((row) => Number(row.seconds)));
  const metrics: OperationsView["metrics"] = [
    { name: "Execution success", kind: execution.kind, sample: execution.sample, value: execution.bps == null ? null : Math.round(execution.bps / 100), unit: "percent", note: execution.note },
    { name: "Quality pass", kind: quality.kind, sample: quality.sample, value: quality.bps == null ? null : Math.round(quality.bps / 100), unit: "percent", note: quality.note },
    { name: "Accepted mission duration", kind: duration.kind, sample: duration.sample, value: duration.seconds, unit: "seconds", note: duration.note },
    { name: "Open defects", kind: "measured", sample: num(defects[0]?.count), value: num(defects[0]?.count), unit: "count", note: "Open defects on record. Zero is a count, not a claim that the work is correct." },
    { name: "Retries at two or more", kind: "measured", sample: num(jobs[0]?.retried), value: num(jobs[0]?.retried), unit: "count", note: "Execution jobs whose stored attempt is two or more." },
  ];
  for (const metric of metrics) {
    await sql`insert into metric_snapshots (id, organization_id, name, sample, value, kind, unit, note)
      values (${nid("met")}, ${orgId}, ${metric.name}, ${metric.sample}, ${metric.value}, ${metric.kind}, ${metric.unit}, ${metric.note})
      on conflict (organization_id, name) do update set sample = ${metric.sample}, value = ${metric.value}, kind = ${metric.kind}, unit = ${metric.unit}, note = ${metric.note}, created_at = now()`;
  }
  const health = githubHealth({
    status: github[0]?.status ?? "",
    lastSyncMs: github[0]?.last_sync_at ? Date.parse(iso(github[0].last_sync_at)) : null,
    pollMinutes: num(github[0]?.poll_minutes) || 60,
    nowMs: Date.now(),
  });
  const proposals: Array<{ key: string; kind: string; title: string; evidence: string; apply: boolean }> = [];
  if (released > 0) {
    proposals.push({ key: "lease:expired", kind: "release_expired_lease", title: "Expired leases were released", evidence: `${released} expired lease${released === 1 ? "" : "s"} moved back to ready.`, apply: true });
  }
  if (num(prices[0]?.count) > 0) {
    proposals.push({ key: "price:review", kind: "finance", title: "A verified price is past its review date", evidence: `${num(prices[0]?.count)} price row${num(prices[0]?.count) === 1 ? "" : "s"} passed the recorded review date. Those prices are not used, and none were invented.`, apply: false });
  }
  if (github[0] && !health.connected) {
    proposals.push({ key: "github:offline", kind: "credential", title: "GitHub is not connected", evidence: health.note, apply: false });
  }
  if (health.stale) {
    proposals.push({ key: "github:stale", kind: "diagnostic", title: "GitHub sync is stale", evidence: health.note, apply: false });
  }
  const chain = await sql<{
    mission_id: string;
    specification_id: string;
    requirement_key: string;
    mission_status: string;
    assignment_id: string | null;
    assignment_status: string | null;
    execution_id: string | null;
    artifact_sha256: string | null;
    qa_id: string | null;
    qa_status: string | null;
    qa_sha: string | null;
  }>`select r.mission_id, r.specification_id, r.requirement_key, m.status as mission_status,
      l.assignment_id, l.assignment_status, l.execution_id, l.artifact_sha256, q.id as qa_id, q.status as qa_status, q.artifact_sha256 as qa_sha
    from requirements r
    join specifications s on s.id = r.specification_id and s.state = ${"accepted"}
    join missions m on m.id = r.mission_id and m.organization_id = r.organization_id
    left join lateral (
      select link.assignment_id, link.execution_id, link.artifact_sha256, a.status as assignment_status
      from requirement_links link
      left join assignments a on a.id = link.assignment_id
      where link.requirement_key = r.requirement_key and link.specification_id = r.specification_id
      order by link.created_at desc limit 1
    ) l on true
    left join lateral (
      select id, status, artifact_sha256 from qa_reports
      where mission_id = r.mission_id and assignment_id = l.assignment_id
      order by created_at desc limit 1
    ) q on true
    where r.organization_id = ${orgId} and r.change <> ${"removed"}
    limit 200`;
  let uncovered = 0;
  for (const row of chain) {
    const verdict = requirementVerdict({
      agentDone: row.assignment_status === "DONE",
      artifactSha: row.artifact_sha256 ?? "",
      qaStatus: row.qa_status === "passed" || row.qa_status === "failed" ? row.qa_status : "missing",
      qaSha: row.qa_sha ?? "",
      accepted: row.mission_status === "ACCEPTED",
    });
    if (!verdict.complete) uncovered += 1;
    await sql`insert into trace_links (
      id, organization_id, mission_id, specification_id, requirement_key, assignment_id, execution_id, artifact_sha256,
      qa_report_id, qa_passed, accepted, complete, reason
    ) values (
      ${nid("trc")}, ${orgId}, ${row.mission_id}, ${row.specification_id}, ${row.requirement_key}, ${row.assignment_id},
      ${row.execution_id ?? ""}, ${row.artifact_sha256 ?? ""}, ${row.qa_id}, ${row.qa_status === "passed"}, ${row.mission_status === "ACCEPTED"},
      ${verdict.complete}, ${verdict.reason}
    ) on conflict (organization_id, mission_id, requirement_key, specification_id) do update set
      assignment_id = ${row.assignment_id}, execution_id = ${row.execution_id ?? ""}, artifact_sha256 = ${row.artifact_sha256 ?? ""},
      qa_report_id = ${row.qa_id}, qa_passed = ${row.qa_status === "passed"}, accepted = ${row.mission_status === "ACCEPTED"},
      complete = ${verdict.complete}, reason = ${verdict.reason}, updated_at = now()`;
  }
  if (uncovered > 0) {
    proposals.push({ key: "trace:open", kind: "diagnostic", title: "Requirements are not fully traced", evidence: `${uncovered} accepted-specification requirement${uncovered === 1 ? "" : "s"} lack a matching quality report and owner acceptance. Unaffected deliverables were not reopened.`, apply: false });
  }
  const prior = await sql<{ action_key: string; status: string }>`select action_key, status from maintenance_actions where organization_id = ${orgId}`;
  const priorStatus = new Map(prior.map((row) => [row.action_key, row.status]));
  const seen = new Set<string>();
  const maintenance: OperationsView["maintenance"] = [];
  for (const proposal of proposals) {
    seen.add(proposal.key);
    const decision = maintenanceClass(proposal.apply ? proposal.kind : proposal.kind);
    const autonomous = proposal.apply && decision.autonomous;
    if (proposal.apply && !decision.autonomous) continue;
    const status = autonomous ? "applied" : "proposed";
    const result = autonomous ? proposal.evidence : "Recorded for the owner. No budget, credential, or accepted outcome was changed.";
    await sql`insert into maintenance_actions (
      id, organization_id, action_key, kind, risk, autonomous, status, title, evidence, result
    ) values (
      ${nid("mnt")}, ${orgId}, ${proposal.key}, ${proposal.kind}, ${decision.risk}, ${decision.autonomous}, ${status}, ${proposal.title}, ${proposal.evidence}, ${result}
    ) on conflict (organization_id, action_key) do update set
      risk = ${decision.risk}, autonomous = ${decision.autonomous}, status = ${status}, title = ${proposal.title}, evidence = ${proposal.evidence}, result = ${result}, updated_at = now()`;
    if (priorStatus.get(proposal.key) !== status) {
      await sql`insert into audit_events (
        id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
      ) values (
        ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${actorId.startsWith("svc:") ? "service" : "human"}, ${"maintenance." + status}, ${proposal.key},
        ${priorStatus.get(proposal.key) ?? null}, ${status}, ${proposal.evidence.slice(0, 500)}
      )`;
    }
    maintenance.push({ id: proposal.key, title: proposal.title, evidence: proposal.evidence, risk: decision.risk, autonomous: decision.autonomous, status, result });
  }
  for (const row of prior) {
    if (row.status === "proposed" && !seen.has(row.action_key)) {
      await sql`update maintenance_actions set status = ${"cleared"}, result = ${"The condition is no longer present."}, updated_at = now()
        where organization_id = ${orgId} and action_key = ${row.action_key} and status = ${"proposed"}`;
    }
  }
  const recommendations = recommend({
    qaFailBps: quality.bps == null ? null : Math.round((num(qa[0]?.failed) / Math.max(1, num(qa[0]?.total))) * 10_000),
    retries: num(jobs[0]?.retried),
    blocked: num(blocked[0]?.count),
  }).map((note) => note.text);
  return { metrics, maintenance, recommendations };
}

export async function linkMissionProject(sql: Sql, userId: string, missionId: string, projectId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  const projects = await sql<{ id: string }>`select id from projects where id = ${projectId} and organization_id = ${ws.orgId} limit 1`;
  if (!projects[0]) throw new CompanyError("That project is not in this company. The mission was not changed.");
  await refreshOperate(sql, ws.orgId, userId);
  const linked = await sql<{ id: string }>`update trace_links set project_id = ${projectId}, updated_at = now()
    where organization_id = ${ws.orgId} and mission_id = ${mission.id}
    returning id`;
  if (!linked[0]) throw new CompanyError("That mission has no accepted requirement to trace. The project was not linked.");
  await audit(sql, ws, userId, "trace.project", mission.id, null, projectId, "The mission trace now points at an existing project. Tasks were not copied and no work was authorized.");
}

export async function linkMissionTask(sql: Sql, userId: string, missionId: string, taskId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  requireOwner(ws.role);
  const mission = await mustMission(sql, ws.orgId, missionId);
  const status = mission.status;
  const result = await linkTaskToMission(sql, {
    orgId: ws.orgId,
    missionId: mission.id,
    taskId: taskId.trim(),
    actorId: userId,
    linkId: nid("lnk"),
  });
  const after = await mustMission(sql, ws.orgId, mission.id);
  if (after.status !== status) throw new CompanyError("The link changed the mission. It was not kept.");
  if (result === "created") {
    await audit(sql, ws, userId, "mission.task_linked", mission.id, null, taskId.trim(), "The owner linked an existing task. The task was not started and the mission was not authorized.");
  }
}

export async function unlinkMissionTask(sql: Sql, userId: string, missionId: string, taskId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  requireOwner(ws.role);
  const mission = await mustMission(sql, ws.orgId, missionId);
  await unlinkTaskFromMission(sql, { orgId: ws.orgId, missionId: mission.id, taskId: taskId.trim(), actorId: userId });
  await mustMission(sql, ws.orgId, mission.id);
  await audit(sql, ws, userId, "mission.task_unlinked", mission.id, taskId.trim(), null, "The owner removed the link. The task and the mission still exist.");
}

export async function operations(sql: Sql, userId: string): Promise<OperationsView> {
  const ws = await ensureCompany(sql, userId);
  await drainOutbox(sql, ws.orgId, userId);
  await expireLeases(sql);
  const rows = await sql<{
    id: string;
    mission_id: string;
    mission_title: string;
    agent_slug: string;
    title: string;
    status: string;
    updated_at: unknown;
  }>`select a.id, a.mission_id, m.title as mission_title, a.agent_slug, a.title, a.status, a.updated_at
    from assignments a join missions m on m.id = a.mission_id
    where a.organization_id = ${ws.orgId}
    order by a.updated_at desc limit 40`;
  const recoveries = await sql<{ id: string; detail: string; created_at: unknown }>`
    select id, detail, created_at from audit_events
    where organization_id = ${ws.orgId} and action = ${"assignment.recovered"}
    order by created_at desc limit 6`;
  const leases = await sql<{ mission_id: string; mission_title: string; agent_slug: string; leased_until: unknown }>`
    select m.id as mission_id, m.title as mission_title, a.agent_slug, j.leased_until
    from execution_jobs j
    join assignments a on a.id = j.assignment_id
    join missions m on m.id = j.mission_id
    where j.organization_id = ${ws.orgId} and j.status = ${"leased"}
    order by j.leased_until asc limit 8`;
  const sandboxRows = await sql<{ suite: string; sandbox: unknown }>`
    select suite, sandbox from qa_reports
    where organization_id = ${ws.orgId}
    order by created_at desc limit 1`;
  const operate = await refreshOperate(sql, ws.orgId, userId);
  return {
    scheduler: await readScheduler(sql, ws.orgId),
    capacity: await readCapacity(sql, ws.orgId),
    workers: await workerCounts(sql, ws.orgId),
    leases: leases.map((row) => ({
      missionId: row.mission_id,
      missionTitle: row.mission_title,
      agentName: agentBySlug(row.agent_slug)?.name ?? row.agent_slug,
      until: iso(row.leased_until),
    })),
    sandbox: readSandbox(sandboxRows[0]?.suite ?? "", sandboxRows[0]?.sandbox),
    recoveries: recoveries.map((row) => ({ id: row.id, detail: row.detail, createdAt: iso(row.created_at) })),
    rows: rows.map((row) => ({
      id: row.id,
      missionId: row.mission_id,
      missionTitle: row.mission_title,
      agentName: agentBySlug(row.agent_slug)?.name ?? row.agent_slug,
      title: row.title,
      status: row.status as AssignmentStatus,
      updatedAt: iso(row.updated_at),
    })),
    metrics: operate.metrics,
    maintenance: operate.maintenance,
    recommendations: operate.recommendations,
    outbox: await outboxSnapshot(sql, ws.orgId),
    rateLimit: commandRateSnapshot(),
  };
}

export async function knowledge(sql: Sql, userId: string): Promise<KnowledgeView> {
  const ws = await ensureCompany(sql, userId);
  const entries = await sql<{
    id: string;
    kind: string;
    title: string;
    body: string;
    source: string;
    verified: boolean;
    state: string;
    version: unknown;
    confidence: string;
    mission_id: string | null;
    created_at: unknown;
  }>`select id, kind, title, body, source, verified, state, version, confidence, mission_id, created_at
    from knowledge_entries where organization_id = ${ws.orgId}
    order by created_at desc limit 40`;
  return {
    entries: entries.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      source: row.source,
      verified: Boolean(row.verified),
      state: row.state || (row.verified ? "accepted" : "proposed"),
      version: num(row.version) || 1,
      confidence: row.confidence || "stated",
      missionId: row.mission_id,
      createdAt: iso(row.created_at),
    })),
  };
}

export async function governance(sql: Sql, userId: string): Promise<GovernanceView> {
  const ws = await ensureCompany(sql, userId);
  const events = await sql<{
    id: string;
    action: string;
    actor_id: string;
    detail: string;
    target: string | null;
    from_state: string | null;
    to_state: string | null;
    created_at: unknown;
  }>`select id, action, actor_id, detail, target, from_state, to_state, created_at
    from audit_events where organization_id = ${ws.orgId}
    order by created_at desc limit 40`;
  return {
    events: events.map((row) => ({
      id: row.id,
      action: row.action,
      actorId: row.actor_id,
      detail: row.detail,
      target: row.target,
      fromState: row.from_state,
      toState: row.to_state,
      createdAt: iso(row.created_at),
    })),
    disclosure: await readDisclosure(sql, ws.orgId),
    workers: await workerCounts(sql, ws.orgId),
    scheduler: await readScheduler(sql, ws.orgId),
  };
}

export async function submitMission(sql: Sql, userId: string, objective: string): Promise<{ missionId: string }> {
  const clean = objective.trim().replace(/\s+/g, " ");
  if (clean.length < 8) throw new CompanyError("Describe the objective in at least a short sentence.");
  if (clean.length > 2000) throw new CompanyError("Keep the objective under 2000 characters.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const id = nid("msn");
  const title = titleFrom(clean);
  await sql`insert into missions (
    id, organization_id, title, objective, status, created_by
  ) values (${id}, ${ws.orgId}, ${title}, ${clean}, ${"PROPOSED"}, ${userId})`;
  await audit(sql, ws, userId, "mission.proposed", id, null, "PROPOSED", clean);
  return { missionId: id };
}

export async function planMission(sql: Sql, userId: string, missionId: string, think: Thinker = noopThink): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") {
    throw new CompanyError("This mission can only be planned before it is authorized.");
  }
  const existing = await loadAssignments(sql, mission.id);
  if (existing.some((row) => row.status === "RUNNING")) {
    throw new CompanyError("Recover the running department before rewriting the plan.");
  }
  if (mission.status !== "REJECTED" && existing.some((row) => row.status === "DONE")) {
    throw new CompanyError("Work has already started. Reject the packet, or cancel the mission, before a new plan.");
  }
  const memory = await memoryBrief(sql, ws.orgId, mission.id);
  await noteReuse(sql, ws.orgId, mission.id, memory.ids);
  const thought = await gatedThink(sql, ws.orgId, think, {
    system:
      "You are the CEO of Atomic Dream Labs inside NEXUS. You write a plan. You do not execute it and you cannot accept it. Return JSON only. Do not contradict verified memory.",
    user: `Objective:\n${mission.objective}\n\nOwner's answer, if any:\n${mission.answers.trim() || "None yet."}\n\nVerified memory from accepted missions:\n${memory.text || "None yet."}\n\nReturn JSON with keys title (string), strategy (markdown), questions (array of at most 2 strings; empty if the objective is specific), assignments (array of {agent, title, brief}). Agents must be chosen from: researcher, product, architect, designer, developer, qa, coo. Briefs are one or two sentences. Do not claim the mission is finished.`,
  }, mission.classification === "confidential" ? "confidential" : "internal");
  const plan = thought.text.trim() ? planFromModel(mission.objective, thought.text) : localPlan(mission.objective);
  const source = thought.text.trim() ? plan.source : thought.unavailable ? "local-orchestrator · model unavailable" : plan.source;
  const strategy = mission.answers.trim()
    ? `${plan.strategy}\n\n## Owner\n${mission.answers.trim()}`
    : plan.strategy;
  if (mission.status === "REJECTED") assertMissionTransition("REJECTED", "PLANNED");
  else if (mission.status === "PROPOSED") assertMissionTransition("PROPOSED", "PLANNED");
  const moved = await atomically(sql, async (tx) => {
    const saved = await tx<{ id: string }>`update missions set
      title = ${plan.title}, strategy = ${strategy}, questions = ${JSON.stringify(plan.questions)}::jsonb,
      plan_source = ${source}, status = ${"PLANNED"}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`;
    if (!saved[0]) return false;
    await tx`delete from assignments where mission_id = ${mission.id} and organization_id = ${ws.orgId}`;
    for (const [index, slot] of plan.assignments.entries()) {
      const agent = agentBySlug(slot.agent);
      await tx`insert into assignments (
        id, mission_id, organization_id, agent_slug, department_slug, title, brief, position, status
      ) values (
        ${nid("asg")}, ${mission.id}, ${ws.orgId}, ${slot.agent}, ${agent?.department ?? "executive"},
        ${slot.title}, ${slot.brief}, ${index}, ${"QUEUED"}
      )`;
    }
    await tx`delete from knowledge_entries
      where organization_id = ${ws.orgId} and mission_id = ${mission.id}
        and verified = ${false} and kind = ${"decision"} and title like ${"Strategy · %"}`;
    await remember(tx, ws.orgId, mission.id, "decision", `Strategy · ${plan.title}`, strategy, "ceo", false);
    await audit(tx, ws, userId, "mission.planned", mission.id, mission.status, "PLANNED", memory.text ? `${source} · used verified memory` : source);
    await enqueueOutbox(tx, {
      orgId: ws.orgId,
      eventType: "assignment.recorded",
      idempotencyKey: `assignment.recorded:${mission.id}:${sha256(plan.assignments.map((slot) => slot.title).join("\n"))}`,
      correlationId: mission.id,
      causationId: userId,
      aggregateType: "mission",
      aggregateId: mission.id,
      actorId: userId,
      summary: `${plan.assignments.length} departments were recorded. None were authorized by this event.`,
    });
    return true;
  });
  if (!moved) throw new CompanyError("The mission changed before the plan could be saved.");
  await drainOutbox(sql, ws.orgId, userId);
}

export async function authorizeMission(sql: Sql, userId: string, missionId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  assertMissionTransition(mission.status, "AUTHORIZED");
  const assignments = await loadAssignments(sql, mission.id);
  if (assignments.length !== canonicalAssignments(mission.objective).length) {
    throw new CompanyError("The plan is incomplete.");
  }
  if (mission.depends_on) {
    const parent = await mustMission(sql, ws.orgId, mission.depends_on);
    if (parent.status !== "ACCEPTED") {
      throw new CompanyError("This mission waits on another mission that is not accepted.");
    }
  }
  await atomically(sql, async (tx) => {
    await moveMission(tx, mission, "AUTHORIZED", ws, userId, "mission.authorized", "Owner authorized the plan");
    await tx`update assignments set status = ${"READY"}, updated_at = now()
      where mission_id = ${mission.id} and position = 0`;
    await enqueueOutbox(tx, {
      orgId: ws.orgId,
      eventType: "mission.authorized",
      idempotencyKey: `mission.authorized:${mission.id}:${nid("rev")}`,
      correlationId: mission.id,
      causationId: userId,
      aggregateType: "mission",
      aggregateId: mission.id,
      actorId: userId,
      summary: "Owner authorized the plan. Delivery does not authorize it again.",
    });
  });
  await drainOutbox(sql, ws.orgId, userId);
}

export async function runNext(
  sql: Sql,
  userId: string,
  missionId: string,
  think: Thinker = noopThink,
): Promise<{ agent: string; stopped: boolean }> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status !== "AUTHORIZED" && mission.status !== "EXECUTING") {
    throw new CompanyError("Authorize the plan before a department can run.");
  }
  await releaseStaleRuns(sql, ws, mission.id);
  let assignments = await loadAssignments(sql, mission.id);
  if (assignments.some((row) => row.status === "RUNNING")) {
    throw new CompanyError("A department is still marked running. Recover it before starting another.");
  }
  const next = assignments.find((row) => row.status !== "DONE");
  if (!next) {
    await offerIfReady(sql, ws, mission, assignments);
    return { agent: "Operations", stopped: true };
  }
  const prior = assignments.filter((row) => row.position < next.position);
  if (prior.some((row) => row.status !== "DONE")) {
    throw new CompanyError("An earlier department has not finished.");
  }
  const token = nid("run");
  let beat: ReturnType<typeof setInterval> | undefined;
  let leaseLost = false;
  try {
    await claimLease(sql, {
      orgId: ws.orgId,
      missionId: mission.id,
      assignmentId: next.id,
      fence: token,
      jobId: nid("job"),
    });
    beat = setInterval(() => {
      renewLease(sql, token).then(
        (held) => {
          if (!held) leaseLost = true;
        },
        () => {
          leaseLost = true;
        },
      );
    }, 20_000);
    if (mission.status === "AUTHORIZED") {
      await moveMission(sql, mission, "EXECUTING", ws, userId, "mission.executing", next.title);
    }
    const memory = await memoryBrief(sql, ws.orgId, mission.id);
    await noteReuse(sql, ws.orgId, mission.id, memory.ids);
    const defects = (await openDefects(sql, mission.id))
      .map((item) => `- ${item.name}: ${item.detail}`)
      .join("\n");
    const produced = await produce(
      sql,
      ws.orgId,
      next,
      mission.objective,
      mission.strategy,
      mission.answers,
      prior,
      think,
      memory.text,
      defects,
      token,
      mission.classification === "confidential" ? "confidential" : "internal",
    );
    const failedQa = next.agent_slug === "qa" && !allPassed(produced.evidence);
    const status = failedQa ? "FAILED" : "DONE";
    const held = !leaseLost && (await renewLease(sql, token));
    if (!held) {
      await sql`update execution_jobs set status = ${"expired"}, updated_at = now()
        where fence = ${token} and status = ${"leased"}`;
      await sql`update assignments set status = ${"READY"}, model = ${""}, run_token = ${""},
          error = ${"The lease expired before the run could save."}, updated_at = now()
        where id = ${next.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"} and run_token = ${token}`;
      return { agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug, stopped: true };
    }
    const saved = await commitLease(sql, token, async (tx) => {
      const row = await tx<{ id: string }>`update assignments set
          status = ${status}, artifact = ${produced.body}, evidence = ${JSON.stringify(produced.evidence)}::jsonb,
          model = ${produced.model}, run_token = ${""}, error = ${failedQa ? "Verification did not pass." : ""}, updated_at = now()
        where id = ${next.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"} and run_token = ${token}
        returning id`;
      if (!row[0]) return null;
      if (produced.runtime) {
        await tx`insert into qa_reports (
          id, organization_id, mission_id, assignment_id, artifact_sha256, status, report, execution_id, suite, sandbox
        ) values (
          ${nid("qa")}, ${ws.orgId}, ${mission.id}, ${next.id}, ${produced.runtime.sha256},
          ${produced.runtime.passed ? "passed" : "failed"}, ${JSON.stringify(produced.runtime)}::jsonb,
          ${token}, ${produced.runtime.suite}, ${JSON.stringify(produced.runtime.sandbox)}::jsonb
        )`;
        await tx`update revalidations set
          state = ${produced.runtime.passed ? "revalidated" : "in_progress"},
          deliverable_sha256 = ${produced.runtime.sha256},
          qa_execution_id = ${token},
          suite = ${produced.runtime.suite},
          result = ${produced.runtime.passed ? "passed" : "failed"},
          updated_at = now()
          where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"authorized"}`;
      }
      const disclosure = await readDisclosure(tx, ws.orgId);
      await tx`insert into model_dispatches (
        id, organization_id, mission_id, execution_id, provider, model, classification, disclosure, outcome, duration_ms, error_category
      ) values (
        ${nid("mdl")}, ${ws.orgId}, ${mission.id}, ${token}, ${produced.provider}, ${produced.model},
        ${mission.classification === "confidential" ? "confidential" : "internal"}, ${disclosure},
        ${produced.outcome}, ${produced.durationMs}, ${produced.errorCategory}
      )`;
      const quote = await pricedQuote(tx, ws.orgId, produced.provider, produced.model, null, null, null);
      await tx`insert into cost_records (
        id, organization_id, mission_id, department_slug, execution_id, provider, model, pricing_id, pricing_version, kind, cents, note
      ) values (
        ${nid("cst")}, ${ws.orgId}, ${mission.id}, ${next.department_slug}, ${token}, ${produced.provider}, ${produced.model},
        ${quote.pricingId}, ${quote.pricingVersion}, ${quote.kind}, ${quote.cents}, ${quote.reason}
      )`;
      await audit(
        tx,
        ws,
        "svc:nexus",
        failedQa ? "assignment.failed" : "assignment.completed",
        mission.id,
        "RUNNING",
        status,
        `${produced.model} · ${next.agent_slug}: ${next.title}`,
      );
      if (next.agent_slug === "qa") {
        if (failedQa) await recordDefects(tx, ws.orgId, mission.id, produced.evidence);
        else await closeDefects(tx, mission.id);
      }
      if (!failedQa) {
        const following = assignments.find((row) => row.position === next.position + 1);
        if (following && following.status === "QUEUED") {
          await tx`update assignments set status = ${"READY"}, updated_at = now()
            where id = ${following.id} and organization_id = ${ws.orgId} and status = ${"QUEUED"}`;
          const completed = produced.body.replace(/\s+/g, " ").trim().slice(0, 500);
          await tx`insert into handoffs (
            id, organization_id, mission_id, from_department, to_department, from_assignment, to_assignment,
            completed, outstanding, risks, criteria
          ) values (
            ${nid("hand")}, ${ws.orgId}, ${mission.id}, ${next.department_slug}, ${following.department_slug},
            ${next.id}, ${following.id}, ${completed || "No artifact text was stored."},
            ${following.brief.slice(0, 500)}, ${""}, ${following.brief.slice(0, 500)}
          )`;
        }
      }
      await enqueueOutbox(tx, {
        orgId: ws.orgId,
        eventType: "execution.completed",
        idempotencyKey: `execution.completed:${token}`,
        correlationId: mission.id,
        causationId: token,
        aggregateType: "execution",
        aggregateId: token,
        actorId: "svc:nexus",
        summary: `${status} ${next.agent_slug}. The event records the committed run and does not run it again.`,
      });
      if (produced.runtime) {
        await enqueueOutbox(tx, {
          orgId: ws.orgId,
          eventType: "qa.recorded",
          idempotencyKey: `qa.recorded:${token}`,
          correlationId: mission.id,
          causationId: token,
          aggregateType: "execution",
          aggregateId: token,
          actorId: "svc:nexus",
          summary: "A quality report was stored with this run. The event does not change its result.",
        });
      }
      await enqueueOutbox(tx, {
        orgId: ws.orgId,
        eventType: "artifact.recorded",
        idempotencyKey: `artifact.recorded:${token}`,
        correlationId: mission.id,
        causationId: token,
        aggregateType: "execution",
        aggregateId: token,
        actorId: "svc:nexus",
        summary: "The department artifact was stored. The event does not accept it.",
      });
      if (failedQa) {
        await enqueueOutbox(tx, {
          orgId: ws.orgId,
          eventType: "defect.recorded",
          idempotencyKey: `defect.recorded:${token}`,
          correlationId: mission.id,
          causationId: token,
          aggregateType: "mission",
          aggregateId: mission.id,
          actorId: "svc:nexus",
          summary: "Verification defects were stored. The event does not close them.",
        });
      }
      return { ok: true as const };
    });
    if (!saved) {
      await sql`update execution_jobs set status = ${"expired"}, updated_at = now()
        where fence = ${token} and status = ${"leased"}`;
      await sql`update assignments set status = ${"READY"}, model = ${""}, run_token = ${""},
          error = ${"The lease expired before the run could save."}, updated_at = now()
        where id = ${next.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"} and run_token = ${token}`;
      return { agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug, stopped: true };
    }
    await drainOutbox(sql, ws.orgId, userId);
    if (failedQa) return { agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug, stopped: true };
    const last = next.position === assignments.length - 1;
    if (last) {
      assignments = await loadAssignments(sql, mission.id);
      await offerIfReady(sql, ws, mission, assignments);
      return { agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug, stopped: true };
    }
    return { agent: agentBySlug(next.agent_slug)?.name ?? next.agent_slug, stopped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The department run failed.";
    await failLease(sql, token, message);
    throw error;
  } finally {
    if (beat) clearInterval(beat);
  }
}

export async function recoverRun(sql: Sql, userId: string, missionId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  const running = await sql<{ id: string }>`select id from assignments
    where mission_id = ${mission.id} and organization_id = ${ws.orgId} and status = ${"RUNNING"}`;
  if (!running[0]) throw new CompanyError("Nothing is stuck in a run.");
  await sql`update execution_jobs set status = ${"cancelled"}, updated_at = now()
    where assignment_id = ${running[0].id} and status = ${"leased"}`;
  await sql`update assignments set status = ${"READY"}, model = ${""}, run_token = ${""}, error = ${"Recovered before an artifact was written."}, updated_at = now()
    where id = ${running[0].id} and status = ${"RUNNING"}`;
  await audit(sql, ws, userId, "assignment.recovered", mission.id, "RUNNING", "READY", "No artifact invented");
}

export async function rework(sql: Sql, userId: string, missionId: string): Promise<{ agent: string }> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status === "AWAITING_ACCEPTANCE") {
    await moveMission(sql, mission, "EXECUTING", ws, userId, "mission.rework", "Owner sent the packet back");
  } else if (mission.status !== "EXECUTING") {
    throw new CompanyError("Only an active mission can be sent back.");
  }
  const assignments = await loadAssignments(sql, mission.id);
  if (assignments.some((row) => row.status === "RUNNING")) {
    throw new CompanyError("Recover the running department before sending work back.");
  }
  const open = await openDefects(sql, mission.id);
  const start = reworkFrom(
    open.map((item) => item.name),
    assignments.filter((row) => row.status === "FAILED").map((row) => row.agent_slug),
  );
  const startAt = PIPELINE.indexOf(start);
  await cancelLeases(sql, mission.id);
  for (const agent of PIPELINE) {
    const index = PIPELINE.indexOf(agent);
    if (index < startAt) continue;
    await sql`update assignments set status = ${index === startAt ? "READY" : "QUEUED"}, artifact = ${""}, evidence = ${"[]"}::jsonb, model = ${""}, run_token = ${""}, error = ${""}, updated_at = now()
      where mission_id = ${mission.id} and agent_slug = ${agent}`;
  }
  await audit(
    sql,
    ws,
    userId,
    "mission.rework",
    mission.id,
    mission.status,
    "EXECUTING",
    `${agentBySlug(start)?.name ?? start} must redo the failed check`,
  );
  return { agent: agentBySlug(start)?.name ?? start };
}

export async function acceptMission(sql: Sql, userId: string, missionId: string, note: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  assertMissionTransition(mission.status, "ACCEPTED");
  const assignments = await loadAssignments(sql, mission.id);
  const qa = assignments.find((row) => row.agent_slug === "qa");
  if (!qa || qa.status !== "DONE" || !allPassed(readChecks(qa.evidence))) {
    throw new CompanyError("Acceptance requires a passing verification record.");
  }
  const reports = await sql<{ status: string; artifact_sha256: string }>`select status, artifact_sha256 from qa_reports
    where organization_id = ${ws.orgId} and mission_id = ${mission.id}
    order by created_at desc limit 1`;
  const implementation = assignments.find((row) => row.agent_slug === "developer")?.artifact ?? "";
  const hash = sha256(extractHtml(implementation));
  if (!reports[0] || !evidenceStillCovers(reports[0].artifact_sha256, hash, reports[0].status)) {
    throw new CompanyError("Acceptance needs a passing report for this exact implementation. A later edit does not keep the old pass.");
  }
  const children = await sql<{ status: string }>`select status from missions
    where organization_id = ${ws.orgId} and parent_id = ${mission.id}`;
  if (childBlocksAcceptance(children.map((row) => row.status))) {
    throw new CompanyError("Subordinate missions are still open. Accept or cancel them before accepting this objective.");
  }
  await atomically(sql, async (tx) => {
    await moveMission(tx, mission, "ACCEPTED", ws, userId, "mission.accepted", note.trim() || "Owner accepted the packet");
    const product = assignments.find((row) => row.agent_slug === "product")?.artifact ?? "";
    const clip = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 700);
    await remember(
      tx,
      ws.orgId,
      mission.id,
      "decision",
      `Accepted · ${mission.title}`,
      [
        note.trim() || mission.objective,
        "",
        "Specification",
        clip(product) || "No specification on record.",
        "",
        "Implementation",
        clip(implementation) || "No implementation on record.",
      ].join("\n"),
      "owner",
      true,
    );
    await recordAcceptedSpecification(tx, ws.orgId, mission.id, userId, mission.strategy, product);
    await enqueueOutbox(tx, {
      orgId: ws.orgId,
      eventType: "mission.accepted",
      idempotencyKey: `mission.accepted:${mission.id}`,
      correlationId: mission.id,
      causationId: userId,
      aggregateType: "mission",
      aggregateId: mission.id,
      actorId: userId,
      summary: "The owner accepted the packet. Replaying the event does not accept it again.",
    });
    await enqueueOutbox(tx, {
      orgId: ws.orgId,
      eventType: "knowledge.promoted",
      idempotencyKey: `knowledge.promoted:${mission.id}`,
      correlationId: mission.id,
      causationId: userId,
      aggregateType: "mission",
      aggregateId: mission.id,
      actorId: userId,
      summary: "Accepted knowledge was stored with the packet. The event does not promote anything else.",
    });
  });
  await drainOutbox(sql, ws.orgId, userId);
}

export async function rejectMission(sql: Sql, userId: string, missionId: string, note: string): Promise<void> {
  const clean = note.trim();
  if (clean.length < 4) throw new CompanyError("Say why it is rejected.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  assertMissionTransition(mission.status, "REJECTED");
  await moveMission(sql, mission, "REJECTED", ws, userId, "mission.rejected", clean);
}

export async function cancelMission(sql: Sql, userId: string, missionId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  assertMissionTransition(mission.status, "CANCELLED");
  await cancelLeases(sql, mission.id);
  await sql`update assignments set status = ${"FAILED"}, error = ${"Mission cancelled."}, model = ${""}, run_token = ${""}, updated_at = now()
    where mission_id = ${mission.id} and organization_id = ${ws.orgId} and status <> ${"DONE"}`;
  await moveMission(sql, mission, "CANCELLED", ws, userId, "mission.cancelled", "Owner cancelled the mission");
}

export async function reopenMission(sql: Sql, userId: string, missionId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  assertMissionTransition(mission.status, "PLANNED");
  await moveMission(sql, mission, "PLANNED", ws, userId, "mission.reopened", "Rejected mission returned to the plan. Departments run again.");
  await cancelLeases(sql, mission.id);
  await sql`update assignments set status = ${"QUEUED"}, artifact = ${""}, evidence = ${"[]"}::jsonb, model = ${""}, run_token = ${""}, error = ${""}, updated_at = now()
    where mission_id = ${mission.id} and organization_id = ${ws.orgId}`;
}

export async function answerMission(sql: Sql, userId: string, missionId: string, note: string): Promise<void> {
  const clean = note.trim().replace(/\s+/g, " ");
  if (clean.length < 4) throw new CompanyError("Write the answer in a sentence.");
  if (clean.length > 1000) throw new CompanyError("Keep the answer under 1000 characters.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") {
    throw new CompanyError("Answers belong on the plan, before execution.");
  }
  const saved = await sql<{ id: string }>`update missions set answers = ${clean}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`;
  if (!saved[0]) throw new CompanyError("The mission changed before the answer could be saved.");
  await audit(sql, ws, userId, "mission.answered", mission.id, mission.status, mission.status, clean);
}

export async function setDependency(sql: Sql, userId: string, missionId: string, dependsOn: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") {
    throw new CompanyError("A dependency can only be set before execution.");
  }
  const target = dependsOn.trim();
  let parentTitle = "none";
  let stored: string | null = null;
  if (target) {
    if (target === mission.id) throw new CompanyError("A mission cannot depend on itself.");
    const parent = await mustMission(sql, ws.orgId, target);
    const links = await sql<{ id: string; depends_on: string | null }>`
      select id, depends_on from missions where organization_id = ${ws.orgId}`;
    const depends = new Map(links.map((row) => [row.id, row.depends_on || null]));
    if (walksIntoCycle(mission.id, parent.id, depends)) {
      throw new CompanyError("That dependency loops back to this mission.");
    }
    stored = parent.id;
    parentTitle = parent.title;
  }
  const saved = await sql<{ id: string }>`update missions set depends_on = ${stored}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`;
  if (!saved[0]) throw new CompanyError("The mission changed before the dependency could be saved.");
  await audit(sql, ws, userId, "mission.dependency", mission.id, mission.status, mission.status, `Depends on ${parentTitle}`);
}

export async function setParent(sql: Sql, userId: string, missionId: string, parentId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") {
    throw new CompanyError("A parent can only be set before execution.");
  }
  const target = parentId.trim();
  let stored: string | null = null;
  let label = "none";
  if (target) {
    if (target === mission.id) throw new CompanyError("A mission cannot contain itself.");
    const parent = await mustMission(sql, ws.orgId, target);
    const links = await sql<{ id: string; parent_id: string | null }>`
      select id, parent_id from missions where organization_id = ${ws.orgId}`;
    const parents = new Map(links.map((row) => [row.id, row.parent_id || null]));
    if (walksIntoCycle(mission.id, parent.id, parents)) {
      throw new CompanyError("That parent loops back to this mission.");
    }
    stored = parent.id;
    label = parent.title;
  }
  const saved = await sql<{ id: string }>`update missions set parent_id = ${stored}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`;
  if (!saved[0]) throw new CompanyError("The mission changed before the parent could be saved.");
  await audit(sql, ws, userId, "mission.parent", mission.id, mission.status, mission.status, `Parent ${label}`);
}

export async function setPriority(sql: Sql, userId: string, missionId: string, raw: string): Promise<void> {
  const priority = clampPriority(Number(raw));
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status === "ACCEPTED" || mission.status === "CANCELLED") {
    throw new CompanyError("Priority is for work that is still open.");
  }
  const saved = await sql<{ id: string }>`update missions set priority = ${priority}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`;
  if (!saved[0]) throw new CompanyError("The mission changed before the priority could be saved.");
  await audit(sql, ws, userId, "mission.priority", mission.id, mission.status, mission.status, `Priority ${priority}`);
}

export async function setMilestone(sql: Sql, userId: string, missionId: string, note: string): Promise<void> {
  const milestone = note.trim().slice(0, 160);
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  const saved = await sql<{ id: string }>`update missions set milestone = ${milestone}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId}
    returning id`;
  if (!saved[0]) throw new CompanyError("The mission changed before the milestone could be saved.");
  await audit(sql, ws, userId, "mission.milestone", mission.id, mission.status, mission.status, milestone || "Milestone cleared");
}

export async function setCapacity(sql: Sql, userId: string, raw: string): Promise<void> {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 8) {
    throw new CompanyError("Capacity is 1 to 8 departments running at once.");
  }
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  await sql`insert into portfolio_limits (organization_id, max_concurrent)
    values (${ws.orgId}, ${value})
    on conflict (organization_id) do update set max_concurrent = ${value}, updated_at = now()`;
  await audit(sql, ws, userId, "portfolio.capacity", ws.orgId, null, String(value), `Concurrent departments set to ${value}. Spend and permissions are unchanged.`);
}

export async function setSpendingCeiling(sql: Sql, userId: string, raw: string): Promise<void> {
  const cents = dollarsToCents(raw);
  if (cents == null) throw new CompanyError("Enter a ceiling like 100 or 100.00.");
  const ws = await ensureCompany(sql, userId);
  if (!ownerMaySetCeiling(ws.role)) throw new CompanyError("Only the owner can set a spending ceiling.");
  await sql`insert into portfolio_limits (organization_id, max_concurrent, spending_ceiling_cents)
    values (${ws.orgId}, 1, ${cents})
    on conflict (organization_id) do update set spending_ceiling_cents = ${cents}, updated_at = now()`;
  await audit(sql, ws, userId, "finance.ceiling", ws.orgId, null, String(cents), `Spending ceiling set to ${formatMoney(cents)}. Past payments stay on the ledger.`);
}

export async function setMissionBudget(sql: Sql, userId: string, missionId: string, raw: string): Promise<void> {
  const cents = raw.trim() ? dollarsToCents(raw) : 0;
  if (cents == null) throw new CompanyError("Enter a mission budget like 40 or 40.00.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  const stored = raw.trim() ? cents : null;
  await sql`update missions set budget_cents = ${stored}, updated_at = now() where id = ${mission.id} and organization_id = ${ws.orgId}`;
  await audit(sql, ws, userId, "finance.mission_budget", mission.id, null, stored == null ? "cleared" : String(stored), stored == null ? "Mission budget cleared." : `Mission budget set to ${formatMoney(stored)}.`);
}

export async function setDepartmentBudget(sql: Sql, userId: string, department: string, raw: string): Promise<void> {
  const slug = department.trim();
  if (!DEPARTMENTS.some((item) => item.slug === slug)) throw new CompanyError("That department is not in this company.");
  const cents = dollarsToCents(raw);
  if (cents == null) throw new CompanyError("Enter a department allocation like 40 or 40.00.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  await sql`insert into department_budgets (organization_id, department_slug, amount_cents)
    values (${ws.orgId}, ${slug}, ${cents})
    on conflict (organization_id, department_slug) do update set amount_cents = ${cents}`;
  await audit(sql, ws, userId, "finance.department_budget", ws.orgId, null, String(cents), `${slug} allocation set to ${formatMoney(cents)}.`);
}

export async function setCostPolicy(sql: Sql, userId: string, policy: string): Promise<void> {
  if (policy !== "record_unknown" && policy !== "refuse") throw new CompanyError("The cost policy is record_unknown or refuse.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  await sql`insert into cost_policy (organization_id, unknown_cost) values (${ws.orgId}, ${policy})
    on conflict (organization_id) do update set unknown_cost = ${policy}`;
  await audit(sql, ws, userId, "finance.cost_policy", ws.orgId, null, policy, policy === "refuse"
    ? "External calls without a verified price are now refused."
    : "External calls may run when the price is unknown. The cost is recorded as unknown, not zero.");
}

export async function recordPrice(sql: Sql, userId: string, input: { provider: string; model: string; inputRate: string; outputRate: string }): Promise<void> {
  const provider = input.provider.trim();
  const model = input.model.trim();
  if (!provider || !model) throw new CompanyError("Name the provider and the model.");
  const inputRate = rateOrNull(input.inputRate);
  const outputRate = rateOrNull(input.outputRate);
  if (input.inputRate.trim() && inputRate == null) throw new CompanyError("Input price must be a whole number of cents per million tokens, or blank if unknown.");
  if (input.outputRate.trim() && outputRate == null) throw new CompanyError("Output price must be a whole number of cents per million tokens, or blank if unknown.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const prior = await sql<{ version: unknown }>`select coalesce(max(version), 0)::int as version from provider_prices
    where organization_id = ${ws.orgId} and provider = ${provider} and model = ${model}`;
  await sql`insert into provider_prices (
    id, organization_id, provider, model, version, input_cents_per_million, output_cents_per_million, cached_cents_per_million,
    source, source_note, status, review_at, created_by
  ) values (
    ${nid("prc")}, ${ws.orgId}, ${provider}, ${model}, ${num(prior[0]?.version) + 1}, ${inputRate}, ${outputRate}, ${null},
    ${"owner"}, ${"Owner entered. This is not an invoice and it was not fetched from a provider."}, ${"verified"},
    now() + interval '90 days', ${userId}
  )`;
  await audit(sql, ws, userId, "finance.price", ws.orgId, null, `${provider}/${model}`, "A pricing version was recorded. Blank dimensions stay unknown.");
}

export async function registerIntegration(sql: Sql, userId: string, input: { name: string; category: string; scopes: string }): Promise<void> {
  const name = input.name.trim();
  if (name.length < 2) throw new CompanyError("Name the service.");
  const category = input.category.trim() || "information";
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  await sql`insert into integrations (
    id, organization_id, name, provider, category, status, scopes
  ) values (
    ${nid("int")}, ${ws.orgId}, ${name}, ${name}, ${category}, ${"unverified"}, ${input.scopes.trim().slice(0, 300)}
  )`;
  await audit(sql, ws, userId, "integration.registered", ws.orgId, null, "unverified", `${name} is on the registry. It is not connected.`);
}

function githubError(error: unknown): never {
  if (error instanceof GithubRefusal) throw new CompanyError(error.message);
  throw error;
}

export async function connectGithub(sql: Sql, userId: string, token: string, allowedRepos: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  try {
    await connectGithubAccount(sql, {
      orgId: ws.orgId,
      userId,
      token,
      allowedRepos,
      key: readCredentialKey(process.env.NEXUS_CREDENTIAL_KEY),
      fetchImpl: liveGithubFetch,
    });
  } catch (error) {
    githubError(error);
  }
}

export async function revokeGithub(sql: Sql, userId: string, mode: "revoked" | "disconnected"): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  try {
    await revokeGithubAccount(sql, { orgId: ws.orgId, userId, mode });
  } catch (error) {
    githubError(error);
  }
}

export async function refreshGithub(sql: Sql, userId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  try {
    await readGithub(sql, {
      orgId: ws.orgId,
      userId,
      operation: "repos",
      resource: "",
      department: "engineering",
      missionId: "",
      key: readCredentialKey(process.env.NEXUS_CREDENTIAL_KEY),
      fetchImpl: liveGithubFetch,
    });
  } catch (error) {
    githubError(error);
  }
}

export async function readGithubForDepartment(sql: Sql, userId: string, input: { operation: string; resource: string; department: string; missionId: string; page: string }): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const page = Number(input.page);
  try {
    await readGithub(sql, {
      orgId: ws.orgId,
      userId,
      operation: input.operation,
      resource: input.resource,
      department: input.department,
      missionId: input.missionId,
      page: Number.isInteger(page) ? page : 1,
      key: readCredentialKey(process.env.NEXUS_CREDENTIAL_KEY),
      fetchImpl: liveGithubFetch,
    });
  } catch (error) {
    githubError(error);
  }
}

export async function requestExternalAction(sql: Sql, userId: string, input: { integrationId: string; operation: string; actionClass: number; classification: string }): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const rows = await sql<{ id: string; status: string; scopes: string }>`select id, status, scopes from integrations
    where id = ${input.integrationId} and organization_id = ${ws.orgId} limit 1`;
  const integration = rows[0];
  if (!integration) throw new CompanyError("That integration is not in this company.");
  const status = integration.status === "verified" || integration.status === "revoked" ? integration.status : "unverified";
  const actionClass = input.actionClass === 2 || input.actionClass === 3 || input.actionClass === 4 ? input.actionClass : 1;
  const classification = input.classification === "confidential" || input.classification === "public" ? input.classification : "internal";
  const decision = actionDecision({
    actionClass,
    integrationStatus: status,
    scopes: integration.scopes.split(",").map((item) => item.trim()).filter(Boolean),
    operation: input.operation.trim(),
    ownerApproved: false,
    confirmed: false,
    classification,
    caller: "owner",
  });
  const key = `${integration.id}:${input.operation.trim()}:${actionClass}`;
  const existing = await sql<{ id: string }>`select id from external_actions where organization_id = ${ws.orgId} and idempotency_key = ${key} limit 1`;
  if (existing[0]) throw new CompanyError("That action was already requested.");
  const stored = decision.allow ? "permitted_not_executed" : decision.pending ? "pending_owner" : "rejected";
  await sql`insert into external_actions (
    id, organization_id, integration_id, operation, action_class, idempotency_key, status, reason, result, created_by
  ) values (
    ${nid("act")}, ${ws.orgId}, ${integration.id}, ${input.operation.trim()}, ${actionClass}, ${key}, ${stored}, ${decision.reason},
    ${decision.allow ? "Not executed. No live connector is configured for this service." : ""}, ${userId}
  )`;
  await audit(sql, ws, userId, "integration.action", integration.id, null, stored, decision.reason);
}

export async function registerDevice(sql: Sql, userId: string, input: { name: string; permission: string }): Promise<void> {
  const name = input.name.trim();
  if (name.length < 2) throw new CompanyError("Name the device.");
  if (input.permission !== "read" && input.permission !== "control") throw new CompanyError("A device is read or control.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  await sql`insert into devices (id, organization_id, name, permission, connected, emergency_stop)
    values (${nid("dev")}, ${ws.orgId}, ${name}, ${input.permission}, ${false}, ${false})`;
  await audit(sql, ws, userId, "device.registered", ws.orgId, null, "disconnected", `${name} is registered. It is not connected, and no reading has been confirmed.`);
}

export async function commandDevice(sql: Sql, userId: string, deviceId: string, operation: string): Promise<void> {
  const op = operation === "control" || operation === "emergency_stop" ? operation : "read";
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const rows = await sql<{ id: string; permission: string; connected: boolean; emergency_stop: boolean }>`
    select id, permission, connected, emergency_stop from devices where id = ${deviceId} and organization_id = ${ws.orgId} limit 1`;
  const device = rows[0];
  if (!device) throw new CompanyError("That device is not in this company.");
  const decision = deviceCommand({
    connected: device.connected === true,
    permission: device.permission === "control" ? "control" : "read",
    operation: op,
    ownerApproved: true,
    emergencyStop: device.emergency_stop === true,
  });
  if (op === "emergency_stop" && decision.allow) {
    await sql`update devices set emergency_stop = ${true}, safe_state = ${"stop-requested"} where id = ${device.id}`;
  }
  await sql`insert into device_commands (id, organization_id, device_id, operation, status, reason, claimed)
    values (${nid("cmd")}, ${ws.orgId}, ${device.id}, ${op}, ${decision.allow ? "requested" : "blocked"}, ${decision.reason}, ${false})`;
  await audit(sql, ws, userId, "device.command", device.id, null, decision.state, decision.reason);
}

export async function recordObservation(sql: Sql, userId: string, missionId: string, source: string, body: string): Promise<void> {
  const cleanSource = source.trim();
  if (cleanSource.length < 3) throw new CompanyError("Name the source.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = missionId.trim() ? await mustMission(sql, ws.orgId, missionId.trim()) : null;
  const quarantined = quarantineExternal(body);
  await sql`insert into observations (
    id, organization_id, mission_id, source, reference, body, content_sha256, classification, status
  ) values (
    ${nid("obs")}, ${ws.orgId}, ${mission?.id ?? null}, ${cleanSource.slice(0, 200)}, ${cleanSource.slice(0, 300)},
    ${quarantined.observation.slice(0, 4000)}, ${contentHash(quarantined.observation)}, ${"internal"}, ${"observed"}
  )`;
  await audit(sql, ws, userId, "observation.recorded", mission?.id ?? ws.orgId, null, "observed", "External text was stored as an observation. It was not accepted as knowledge.");
}

export async function reserveFunds(sql: Sql, userId: string, input: { amount: string; note: string; missionId: string; kind: "reserved" | "estimate" }): Promise<void> {
  const cents = dollarsToCents(input.amount);
  if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  let missionId: string | null = null;
  if (input.missionId.trim()) missionId = (await mustMission(sql, ws.orgId, input.missionId.trim())).id;
  const kind = input.kind === "estimate" ? "estimate" : "reserved";
  await commitCharge(sql, {
    orgId: ws.orgId,
    missionId,
    department: "",
    amountCents: cents,
    kind: kind === "estimate" ? "estimate" : "reserve",
    write: async (tx) => {
      await tx`insert into commitments (
        id, organization_id, mission_id, department_slug, amount_cents, kind, note, status, created_by
      ) values (
        ${nid("cmt")}, ${ws.orgId}, ${missionId}, ${""}, ${cents}, ${kind}, ${input.note.trim().slice(0, 300)}, ${"open"}, ${userId}
      )`;
    },
  });
  await audit(sql, ws, userId, kind === "estimate" ? "finance.estimate" : "finance.reserved", missionId ?? ws.orgId, null, String(cents), `${formatMoney(cents)} ${kind}. This is not a charge.`);
}

export async function proposeSpecification(sql: Sql, userId: string, missionId: string, body: string): Promise<void> {
  const clean = body.trim();
  if (clean.length < 8) throw new CompanyError("The specification needs a line of substance.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  const hash = contentHash(clean);
  const prior = await sql<{ id: string; version: unknown; content_sha256: string; body: string; state: string }>`
    select id, version, content_sha256, body, state from specifications
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"accepted"}
    order by version desc limit 1`;
  if (prior[0]?.content_sha256 === hash) throw new CompanyError("That text matches the accepted specification.");
  const versions = await sql<{ version: unknown }>`select coalesce(max(version), 0)::int as version from specifications where mission_id = ${mission.id}`;
  const version = num(versions[0]?.version) + 1;
  const id = nid("spec");
  await sql`insert into specifications (
    id, organization_id, mission_id, version, content_sha256, body, state, author, supersedes
  ) values (
    ${id}, ${ws.orgId}, ${mission.id}, ${version}, ${hash}, ${clean.slice(0, 12000)}, ${"proposed"}, ${userId}, ${prior[0]?.id ?? null}
  )`;
  const diff = diffRequirements(requirementsOf(prior[0]?.body ?? ""), requirementsOf(clean));
  const assignments = await loadAssignments(sql, mission.id);
  const impact = traceImpact({
    added: diff.added,
    removed: diff.removed,
    assignments: assignments.map((row) => ({
      id: row.id,
      department: row.department_slug,
      position: row.position,
      brief: row.brief,
      artifact: row.artifact,
      status: row.status,
    })),
  });
  const impactId = nid("imp");
  await sql`insert into spec_impacts (
    id, organization_id, mission_id, specification_id, prior_specification_id, added, removed,
    affected_assignments, untouched_assignments, affected_departments, revalidation
  ) values (
    ${impactId}, ${ws.orgId}, ${mission.id}, ${id}, ${prior[0]?.id ?? null},
    ${JSON.stringify(diff.added)}::jsonb, ${JSON.stringify(diff.removed)}::jsonb,
    ${JSON.stringify(impact.affectedIds)}::jsonb, ${JSON.stringify(impact.untouchedIds)}::jsonb,
    ${JSON.stringify(impact.departments)}::jsonb, ${"awaiting_owner"}
  )`;
  for (const assignmentId of impact.affectedIds) {
    await sql`insert into revalidations (
      id, organization_id, mission_id, assignment_id, specification_id, spec_version, state
    ) values (
      ${nid("rev")}, ${ws.orgId}, ${mission.id}, ${assignmentId}, ${id}, ${version}, ${"awaiting_owner"}
    )`;
  }
  await audit(sql, ws, userId, "spec.proposed", mission.id, mission.status, mission.status, `Specification v${version} is proposed. ${impact.affectedIds.length} deliverables need review. Nothing was reopened.`);
  await storeRequirements(sql, ws.orgId, mission.id, id, version, prior[0]?.id ?? null, prior[0]?.body ?? "", clean);
}

export async function acceptSpecification(sql: Sql, userId: string, missionId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  const proposed = await sql<{ id: string; version: unknown; supersedes: string | null }>`
    select id, version, supersedes from specifications
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"proposed"}
    order by version desc limit 1`;
  const next = proposed[0];
  if (!next) throw new CompanyError("There is no proposed specification to accept.");
  if (next.supersedes) {
    await sql`update specifications set state = ${"superseded"}
      where id = ${next.supersedes} and organization_id = ${ws.orgId} and state = ${"accepted"}`;
  }
  const saved = await sql<{ id: string }>`update specifications
    set state = ${"accepted"}, approved_by = ${userId}, accepted_at = now()
    where id = ${next.id} and organization_id = ${ws.orgId} and state = ${"proposed"}
    returning id`;
  if (!saved[0]) throw new CompanyError("The specification changed before it could be accepted.");
  const open = await sql<{ affected_assignments: unknown }>`select affected_assignments from spec_impacts
    where specification_id = ${next.id} order by created_at desc limit 1`;
  const affected = readIdList(open[0]?.affected_assignments);
  const nextState = affected.length > 0 ? "awaiting_owner" : "current";
  await sql`update spec_impacts set revalidation = ${nextState} where specification_id = ${next.id}`;
  await audit(sql, ws, userId, "spec.accepted", mission.id, mission.status, mission.status, `Specification v${num(next.version)} accepted. The mission status was not changed.`);
}

export async function authorizeRevalidation(sql: Sql, userId: string, missionId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status === "ACCEPTED" || mission.status === "CANCELLED") {
    throw new CompanyError("An accepted mission stays accepted. Open a follow-up mission for the new specification.");
  }
  const rows = await sql<{ assignment_id: string }>`select assignment_id from revalidations
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"awaiting_owner"}`;
  if (rows.length === 0) throw new CompanyError("Nothing is waiting on a revalidation decision.");
  await sql`update revalidations set state = ${"authorized"}, updated_at = now()
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and state = ${"awaiting_owner"}`;
  await sql`update spec_impacts set revalidation = ${"authorized"}
    where organization_id = ${ws.orgId} and mission_id = ${mission.id} and revalidation = ${"awaiting_owner"}`;
  const assignments = await loadAssignments(sql, mission.id);
  const ids = new Set(rows.map((row) => row.assignment_id));
  const earliest = assignments.filter((row) => ids.has(row.id)).reduce((min, row) => Math.min(min, row.position), Number.POSITIVE_INFINITY);
  for (const row of assignments) {
    if (!Number.isFinite(earliest) || row.position < earliest || !ids.has(row.id)) continue;
    const status = row.position === earliest ? "READY" : "QUEUED";
    await sql`update assignments set status = ${status}, artifact = ${""}, evidence = ${"[]"}::jsonb, model = ${""}, run_token = ${""}, error = ${""}, updated_at = now()
      where id = ${row.id} and organization_id = ${ws.orgId} and status = ${"DONE"}`;
  }
  if (mission.status === "AWAITING_ACCEPTANCE") {
    await moveMission(sql, mission, "EXECUTING", ws, userId, "mission.revalidation", "Owner authorized revalidation of the affected deliverables");
  }
  await audit(sql, ws, userId, "spec.revalidation", mission.id, mission.status, mission.status, "Affected deliverables may be reviewed. Unaffected work was left as it was. Prior QA reports were not rewritten.");
}

export async function payments(sql: Sql, userId: string): Promise<PaymentsView> {
  const ws = await ensureCompany(sql, userId);
  const rows = await sql<{
    id: string;
    payer: string;
    amount_cents: unknown;
    method: string;
    destination: string;
    note: string;
    voided_at: unknown;
    mission_id: string | null;
    mission_title: string | null;
    created_at: unknown;
    direction: string;
  }>`select p.id, p.payer, p.amount_cents, p.method, p.destination, p.note, p.voided_at, p.mission_id, m.title as mission_title, p.created_at, p.direction
    from payments p
    left join missions m on m.id = p.mission_id and m.organization_id = p.organization_id
    where p.organization_id = ${ws.orgId}
    order by p.created_at desc limit 40`;
  const total = await sql<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${ws.orgId} and voided_at is null and direction = ${"receipt"}`;
  const missions = await listMissions(sql, ws.orgId);
  return {
    destination: PAYMENT,
    totalCents: num(total[0]?.total),
    rows: rows.map(toPayment),
    missions: missions.map((mission) => ({ id: mission.id, title: mission.title })),
    finance: await financeSnapshot(sql, ws.orgId),
    parties: await listParties(sql, ws.orgId),
    offers: await listOffers(sql, ws.orgId),
  };
}

export async function recordPayment(
  sql: Sql,
  userId: string,
  input: { payer: string; amount: string; note: string; missionId: string; department?: string },
): Promise<void> {
  const payer = input.payer.trim().replace(/\s+/g, " ");
  if (payer.length < 2 || payer.length > 80) throw new CompanyError("Name who paid.");
  const cents = dollarsToCents(input.amount);
  if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
  const note = input.note.trim().slice(0, 500);
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  let missionId: string | null = null;
  let missionTitle = "";
  if (input.missionId.trim()) {
    const mission = await mustMission(sql, ws.orgId, input.missionId.trim());
    missionId = mission.id;
    missionTitle = mission.title;
  }
  const requested = (input.department ?? "").trim();
  const department = DEPARTMENTS.some((item) => item.slug === requested) ? requested : "";
  await atomically(sql, async (tx) => {
    await tx`insert into payments (
      id, organization_id, mission_id, payer, amount_cents, method, destination, note, created_by, department_slug, direction
    ) values (
      ${nid("pay")}, ${ws.orgId}, ${missionId}, ${payer}, ${cents}, ${PAYMENT.method}, ${PAYMENT.cashtag}, ${note}, ${userId}, ${department}, ${"receipt"}
    )`;
    await audit(
      tx,
      ws,
      userId,
      "payment.recorded",
      missionId ?? ws.orgId,
      null,
      null,
      `${formatMoney(cents)} from ${payer} via ${PAYMENT.method} ${PAYMENT.cashtag}${missionTitle ? ` · ${missionTitle}` : ""}. A receipt does not consume a spending ceiling.`,
    );
  });
}

export async function recordExpenditure(
  sql: Sql,
  userId: string,
  input: { payer: string; amount: string; note: string; missionId: string; department?: string },
): Promise<void> {
  const payee = input.payer.trim().replace(/\s+/g, " ");
  if (payee.length < 2 || payee.length > 80) throw new CompanyError("Name who was paid.");
  const cents = dollarsToCents(input.amount);
  if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
  const note = input.note.trim().slice(0, 500);
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  let missionId: string | null = null;
  let missionTitle = "";
  if (input.missionId.trim()) {
    const mission = await mustMission(sql, ws.orgId, input.missionId.trim());
    missionId = mission.id;
    missionTitle = mission.title;
  }
  const requested = (input.department ?? "").trim();
  const department = DEPARTMENTS.some((item) => item.slug === requested) ? requested : "";
  await commitCharge(sql, {
    orgId: ws.orgId,
    missionId,
    department,
    amountCents: cents,
    kind: "charge",
    write: async (tx) => {
      await tx`insert into payments (
        id, organization_id, mission_id, payer, amount_cents, method, destination, note, created_by, department_slug, direction
      ) values (
        ${nid("pay")}, ${ws.orgId}, ${missionId}, ${payee}, ${cents}, ${"recorded"}, ${"expenditure"}, ${note}, ${userId}, ${department}, ${"expenditure"}
      )`;
      await audit(
        tx,
        ws,
        userId,
        "payment.spent",
        missionId ?? ws.orgId,
        null,
        null,
        `${formatMoney(cents)} to ${payee}${missionTitle ? ` · ${missionTitle}` : ""}. This counts against the spending ceiling. It is not a bank transfer.`,
      );
    },
  });
}

async function ownerCompany(sql: Sql, userId: string): Promise<Workspace> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  return ws;
}

export async function createCompanyParty(sql: Sql, userId: string, input: { kind: string; displayName: string }): Promise<string> {
  const ws = await ownerCompany(sql, userId);
  return createParty(sql, { orgId: ws.orgId, actorId: userId, kind: input.kind, displayName: input.displayName });
}

export async function editCompanyParty(sql: Sql, userId: string, input: { partyId: string; displayName: string }): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await editParty(sql, { orgId: ws.orgId, actorId: userId, partyId: input.partyId, displayName: input.displayName });
}

export async function archiveCompanyParty(sql: Sql, userId: string, partyId: string): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await archiveParty(sql, { orgId: ws.orgId, actorId: userId, partyId });
}

export async function assignCompanyRole(sql: Sql, userId: string, input: { partyId: string; role: string }): Promise<"created" | "exists"> {
  const ws = await ownerCompany(sql, userId);
  return assignRole(sql, { orgId: ws.orgId, actorId: userId, partyId: input.partyId, role: input.role });
}

export async function deactivateCompanyRole(sql: Sql, userId: string, input: { partyId: string; role: string }): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await deactivateRole(sql, { orgId: ws.orgId, actorId: userId, partyId: input.partyId, role: input.role });
}

export async function reactivateCompanyRole(sql: Sql, userId: string, input: { partyId: string; role: string }): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await reactivateRole(sql, { orgId: ws.orgId, actorId: userId, partyId: input.partyId, role: input.role });
}

export async function addCompanyContact(sql: Sql, userId: string, input: { partyId: string; label: string; value: string }): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await addContact(sql, { orgId: ws.orgId, actorId: userId, partyId: input.partyId, label: input.label, value: input.value });
}

export async function createCompanyOffer(sql: Sql, userId: string, input: { kind: string; name: string; price: string }): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await createOffer(sql, { orgId: ws.orgId, actorId: userId, kind: input.kind, name: input.name, price: input.price });
}

export async function editCompanyOffer(sql: Sql, userId: string, input: { offerId: string; name: string; price: string }): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await editOffer(sql, { orgId: ws.orgId, actorId: userId, offerId: input.offerId, name: input.name, price: input.price });
}

export async function retireCompanyOffer(sql: Sql, userId: string, offerId: string): Promise<void> {
  const ws = await ownerCompany(sql, userId);
  await retireOffer(sql, { orgId: ws.orgId, actorId: userId, offerId });
}

export async function voidPayment(sql: Sql, userId: string, paymentId: string): Promise<void> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const rows = await sql<{ id: string; payer: string; amount_cents: unknown; voided_at: unknown }>`
    select id, payer, amount_cents, voided_at from payments
    where id = ${paymentId} and organization_id = ${ws.orgId} limit 1`;
  const payment = rows[0];
  if (!payment) throw new CompanyError("That payment is not in this company.");
  if (payment.voided_at) throw new CompanyError("That payment is already void.");
  await atomically(sql, async (tx) => {
    const saved = await tx<{ id: string }>`update payments set voided_at = now()
      where id = ${payment.id} and organization_id = ${ws.orgId} and voided_at is null
      returning id`;
    if (!saved[0]) throw new CompanyError("That payment changed before it could be voided.");
    await audit(
      tx,
      ws,
      userId,
      "payment.voided",
      payment.id,
      null,
      null,
      `${formatMoney(num(payment.amount_cents))} from ${payment.payer} voided. This is not a refund.`,
    );
  });
}

async function missionPayments(sql: Sql, orgId: string, missionId: string): Promise<PaymentRow[]> {
  const rows = await sql<{
    id: string;
    payer: string;
    amount_cents: unknown;
    method: string;
    destination: string;
    note: string;
    voided_at: unknown;
    mission_id: string | null;
    mission_title: string | null;
    created_at: unknown;
    direction: string;
  }>`select p.id, p.payer, p.amount_cents, p.method, p.destination, p.note, p.voided_at, p.mission_id, m.title as mission_title, p.created_at, p.direction
    from payments p
    left join missions m on m.id = p.mission_id and m.organization_id = p.organization_id
    where p.organization_id = ${orgId} and p.mission_id = ${missionId}
    order by p.created_at desc limit 20`;
  return rows.map(toPayment);
}

function readSandbox(suite: string, value: unknown): OperationsView["sandbox"] {
  let parsed: Record<string, unknown> = {};
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value) as Record<string, unknown>;
    } catch {
      parsed = {};
    }
  } else if (value && typeof value === "object") {
    parsed = value as Record<string, unknown>;
  }
  if (!suite && Object.keys(parsed).length === 0) return null;
  return {
    suite: suite || (typeof parsed.suite === "string" ? parsed.suite : ""),
    memoryBytes: typeof parsed.memoryBytes === "number" ? parsed.memoryBytes : 0,
    cpuSeconds: typeof parsed.cpuSeconds === "number" ? parsed.cpuSeconds : 0,
    processes: typeof parsed.processes === "number" ? parsed.processes : 0,
    fileBytes: typeof parsed.fileBytes === "number" ? parsed.fileBytes : 0,
    network: typeof parsed.network === "string" ? parsed.network : "",
    filesystem: typeof parsed.filesystem === "string" ? parsed.filesystem : "",
    enforced: parsed.enforced === true,
    policy: typeof parsed.policy === "string" ? parsed.policy : "",
    identity: typeof parsed.identity === "string" ? parsed.identity : "",
    capabilities: typeof parsed.capabilities === "string" ? parsed.capabilities : "",
    proc: typeof parsed.proc === "string" ? parsed.proc : "",
    env: typeof parsed.env === "string" ? parsed.env : "",
    seccomp: typeof parsed.seccomp === "string" ? parsed.seccomp : "",
  };
}

function toPayment(row: {
  id: string;
  payer: string;
  amount_cents: unknown;
  method: string;
  destination: string;
  note: string;
  voided_at: unknown;
  mission_id: string | null;
  mission_title: string | null;
  created_at: unknown;
  direction: string;
}): PaymentRow {
  const voidedAt = iso(row.voided_at);
  return {
    id: row.id,
    payer: row.payer,
    amountCents: num(row.amount_cents),
    method: row.method,
    destination: row.destination,
    note: row.note,
    voidedAt: voidedAt || null,
    missionId: row.mission_id,
    missionTitle: row.mission_title,
    createdAt: iso(row.created_at),
    direction: row.direction === "expenditure" ? "expenditure" : "receipt",
  };
}

async function produce(
  sql: Sql,
  orgId: string,
  next: AssignmentRow,
  objective: string,
  strategy: string,
  answers: string,
  prior: AssignmentRow[],
  think: Thinker,
  memory: string,
  defects: string,
  executionId: string,
  classification: DataClass,
): Promise<{
  body: string;
  model: string;
  provider: "pollinations" | "local";
  evidence: Check[];
  runtime?: RuntimeReport;
  outcome: "succeeded" | "failed" | "timeout" | "withheld";
  durationMs: number | null;
  errorCategory: string;
}> {
  const slug = next.agent_slug as PipelineAgent;
  const priorText = prior
    .map((row) => `### ${row.agent_slug}\n${row.artifact.slice(0, 1200)}`)
    .join("\n\n");
  if (slug === "qa") {
    const artifacts = artifactMap([...prior, next]);
    const html = extractHtml(artifacts.developer ?? "");
    const runtime = await executeArtifact(html, objective, executionId);
    const evidence = [
      ...verifyArtifacts(artifacts),
      {
        name: "Isolated execution",
        passed: runtime.passed && runtime.sandbox.enforced,
        detail: runtime.passed && runtime.sandbox.enforced
          ? `Ran under OS limits. Hash ${runtime.sha256.slice(0, 12)}. Suite ${runtime.suite}.`
          : runtime.detail,
      },
    ];
    return { body: renderVerification(evidence), model: "nexus-verifier", provider: "local", evidence, runtime, outcome: "succeeded", durationMs: null, errorCategory: "" };
  }
  if (slug === "coo") {
    return {
      body: assemblePacket(objective, artifactMap(prior)),
      model: "nexus-assembly",
      provider: "local",
      evidence: [],
      outcome: "succeeded",
      durationMs: null,
      errorCategory: "",
    };
  }
  const agent = agentBySlug(slug);
  const thought = agent
    ? await gatedThink(sql, orgId, think, {
        system: systemPrompt(agent),
        user: `Objective:\n${objective}\n\nOwner's answer:\n${answers.trim() || "None yet."}\n\nStrategy:\n${strategy.slice(0, 1500)}\n\nVerified memory from accepted missions:\n${memory || "None yet."}\n\n${
          defects ? `Open defects. Fix what belongs to you. Do not claim quality passed:\n${defects}\n\n` : ""
        }Your assignment: ${next.title}\n${next.brief}\n\nPrior work:\n${priorText || "None yet."}`,
      }, classification)
    : { text: "", model: "", provider: "local" as const, outcome: "withheld" as const, durationMs: 0, errorCategory: "No agent" };
  let provider: "pollinations" | "local" = thought.provider;
  let body = thought.text.trim().length >= 80 ? thought.text.trim().slice(0, 12000) : localDraft(slug, objective, priorText);
  let model = thought.text.trim().length >= 80 ? thought.model || "gpt-oss-20b" : thought.unavailable ? "local-orchestrator · model unavailable" : "local-orchestrator";
  const trial = { ...artifactMap(prior), [slug]: body };
  if (!ownedChecksPass(slug, trial)) {
    body = localDraft(slug, objective, priorText);
    model = thought.unavailable ? "local-orchestrator · model unavailable" : "local-orchestrator · repaired";
  }
  if (model.startsWith("local-orchestrator") || model === "nexus-assembly" || model === "nexus-verifier") provider = "local";
  return {
    body,
    model,
    provider,
    evidence: [],
    outcome: thought.outcome ?? (thought.unavailable ? "failed" : "succeeded"),
    durationMs: thought.durationMs ?? null,
    errorCategory: thought.errorCategory ?? "",
  };
}

function artifactMap(rows: AssignmentRow[]): Partial<Record<PipelineAgent, string>> {
  const map: Partial<Record<PipelineAgent, string>> = {};
  for (const row of rows) {
    if (PIPELINE.includes(row.agent_slug as PipelineAgent) && row.artifact) {
      map[row.agent_slug as PipelineAgent] = row.artifact;
    }
  }
  return map;
}

async function listMissions(sql: Sql, orgId: string): Promise<MissionSummary[]> {
  const rows = await sql<{
    id: string;
    title: string;
    objective: string;
    status: string;
    updated_at: unknown;
    done: unknown;
    total: unknown;
    priority: unknown;
    parent_id: string | null;
  }>`select m.id, m.title, m.objective, m.status, m.updated_at, m.priority, m.parent_id,
      (select count(*)::int from assignments a where a.mission_id = m.id and a.status = 'DONE') as done,
      (select count(*)::int from assignments a where a.mission_id = m.id) as total
    from missions m where m.organization_id = ${orgId}
    order by m.priority desc, m.updated_at desc`;
  return rows.flatMap((row) => {
    if (!isMissionStatus(row.status)) return [];
    return [
      {
        id: row.id,
        title: row.title,
        objective: row.objective,
        status: row.status,
        updatedAt: iso(row.updated_at),
        done: num(row.done),
        total: num(row.total),
        priority: num(row.priority),
        parentId: row.parent_id || null,
      },
    ];
  });
}

type MissionRow = {
  id: string;
  title: string;
  objective: string;
  status: MissionStatus;
  strategy: string;
  questions: unknown;
  answers: string;
  plan_source: string;
  depends_on: string | null;
  parent_id: string | null;
  priority: number;
  milestone: string;
  classification: string | null;
  updated_at: unknown;
};

async function mustMission(sql: Sql, orgId: string, missionId: string): Promise<MissionRow> {
  const rows = await sql<MissionRow>`select id, title, objective, status, strategy, questions, answers, plan_source, depends_on, parent_id, priority, milestone, classification, updated_at
    from missions where id = ${missionId} and organization_id = ${orgId} limit 1`;
  const mission = rows[0];
  if (!mission || !isMissionStatus(mission.status)) throw new CompanyError("That mission is not in this company.");
  mission.answers = mission.answers ?? "";
  mission.depends_on = mission.depends_on || null;
  mission.parent_id = mission.parent_id || null;
  mission.priority = num(mission.priority);
  mission.milestone = mission.milestone ?? "";
  mission.classification = mission.classification === "confidential" ? "confidential" : "internal";
  return mission;
}

type AssignmentRow = {
  id: string;
  agent_slug: string;
  department_slug: string;
  title: string;
  brief: string;
  position: number;
  status: AssignmentStatus;
  artifact: string;
  evidence: unknown;
  model: string;
  error: string;
};

async function loadAssignments(sql: Sql, missionId: string): Promise<AssignmentRow[]> {
  const rows = await sql<AssignmentRow>`select id, agent_slug, department_slug, title, brief, position, status, artifact, evidence, model, error
    from assignments where mission_id = ${missionId} order by position`;
  return rows.map((row) => ({ ...row, position: Number(row.position) }));
}

function toAssignment(row: AssignmentRow): AssignmentView {
  return {
    id: row.id,
    agent: row.agent_slug,
    agentName: agentBySlug(row.agent_slug)?.name ?? row.agent_slug,
    department: row.department_slug,
    title: row.title,
    brief: row.brief,
    position: row.position,
    status: row.status,
    artifact: row.artifact,
    evidence: readChecks(row.evidence),
    model: row.model.startsWith("run_") ? "" : row.model,
    error: row.error,
  };
}

async function releaseStaleRuns(sql: Sql, ws: Workspace, missionId: string): Promise<void> {
  const expired = await expireLeases(sql, missionId);
  if (expired > 0) {
    await audit(sql, ws, "svc:nexus", "assignment.recovered", missionId, "RUNNING", "READY", "The lease expired before the run could save.");
  }
  const released = await sql<{ id: string }>`update assignments
    set status = ${"READY"}, model = ${""}, run_token = ${""}, error = ${"The run stopped before it wrote an artifact."}, updated_at = now()
    where mission_id = ${missionId} and organization_id = ${ws.orgId} and status = ${"RUNNING"}
      and updated_at < now() - interval '90 seconds'
    returning id`;
  if (!released[0]) return;
  await audit(sql, ws, "svc:nexus", "assignment.recovered", missionId, "RUNNING", "READY", "The run stopped before it wrote an artifact");
}

async function offerIfReady(sql: Sql, ws: Workspace, mission: MissionRow, assignments: AssignmentRow[]): Promise<void> {
  if (mission.status !== "EXECUTING") return;
  if (assignments.length === 0 || assignments.some((row) => row.status !== "DONE")) return;
  const qa = assignments.find((row) => row.agent_slug === "qa");
  if (!qa || !allPassed(readChecks(qa.evidence))) return;
  const reports = await sql<{ status: string; artifact_sha256: string }>`select status, artifact_sha256 from qa_reports
    where organization_id = ${ws.orgId} and mission_id = ${mission.id}
    order by created_at desc limit 1`;
  const implementation = assignments.find((row) => row.agent_slug === "developer")?.artifact ?? "";
  if (!reports[0] || !evidenceStillCovers(reports[0].artifact_sha256, sha256(extractHtml(implementation)), reports[0].status)) return;
  await moveMission(sql, mission, "AWAITING_ACCEPTANCE", ws, "svc:nexus", "mission.awaiting", "Packet ready for the owner");
}

async function moveMission(
  sql: Sql,
  mission: MissionRow,
  to: MissionStatus,
  ws: Workspace,
  actorId: string,
  action: string,
  detail: string,
): Promise<void> {
  assertMissionTransition(mission.status, to);
  const rows = await sql<{ id: string }>`update missions set status = ${to}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`;
  if (!rows[0]) throw new CompanyError("The mission changed before this action could apply.");
  const from = mission.status;
  await audit(sql, ws, actorId, action, mission.id, from, to, detail);
  applyTransition(mission, to, () => undefined);
}

async function openDefects(sql: Sql, missionId: string): Promise<Array<{ id: string; name: string; detail: string }>> {
  const rows = await sql<{ id: string; check_name: string; detail: string }>`
    select id, check_name, detail from defects
    where mission_id = ${missionId} and status = ${"open"}
    order by created_at`;
  return rows.map((row) => ({ id: row.id, name: row.check_name, detail: row.detail }));
}

async function recordDefects(sql: Sql, orgId: string, missionId: string, checks: Check[]): Promise<void> {
  const open = await openDefects(sql, missionId);
  const change = nextDefects(open.map((row) => row.name), checks);
  for (const name of change.close) {
    await sql`update defects set status = ${"closed"}
      where mission_id = ${missionId} and check_name = ${name} and status = ${"open"}`;
  }
  for (const check of checks) {
    if (check.passed || change.create.every((item) => item.name !== check.name)) continue;
    await sql`insert into defects (id, organization_id, mission_id, check_name, detail, status)
      values (${nid("def")}, ${orgId}, ${missionId}, ${check.name}, ${check.detail.slice(0, 500)}, ${"open"})`;
  }
  for (const check of checks) {
    if (check.passed) continue;
    await sql`update defects set detail = ${check.detail.slice(0, 500)}
      where mission_id = ${missionId} and check_name = ${check.name} and status = ${"open"}`;
  }
}

async function closeDefects(sql: Sql, missionId: string): Promise<void> {
  await sql`update defects set status = ${"closed"} where mission_id = ${missionId} and status = ${"open"}`;
}

export async function commitCharge(sql: Sql, input: {
  orgId: string;
  missionId: string | null;
  department: string;
  amountCents: number;
  kind: "charge" | "reserve" | "estimate";
  write: (tx: Sql) => Promise<void>;
}): Promise<void> {
  if (!sql.transaction) throw new CompanyError("The budget lock is unavailable. Nothing was recorded.");
  await sql.transaction(async (tx) => {
    await tx`insert into portfolio_limits (organization_id, max_concurrent) values (${input.orgId}, 1)
      on conflict (organization_id) do nothing`;
    await tx`select spending_ceiling_cents from portfolio_limits where organization_id = ${input.orgId} for update`;
    const ceiling = await tx<{ spending_ceiling_cents: unknown }>`select spending_ceiling_cents from portfolio_limits where organization_id = ${input.orgId}`;
    const companySpent = await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from payments
      where organization_id = ${input.orgId} and voided_at is null and direction = ${"expenditure"}`;
    const companyReserved = await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from commitments
      where organization_id = ${input.orgId} and status = ${"open"} and kind = ${"reserved"}`;
    const missionSpent = input.missionId
      ? await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from payments
          where mission_id = ${input.missionId} and voided_at is null and direction = ${"expenditure"}`
      : [{ total: 0 }];
    const missionReserved = input.missionId
      ? await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from commitments
          where mission_id = ${input.missionId} and status = ${"open"} and kind = ${"reserved"}`
      : [{ total: 0 }];
    const missionBudget = input.missionId
      ? await tx<{ budget_cents: unknown }>`select budget_cents from missions where id = ${input.missionId}`
      : [];
    const departmentBudget = input.department
      ? await tx<{ amount_cents: unknown }>`select amount_cents from department_budgets
          where organization_id = ${input.orgId} and department_slug = ${input.department}`
      : [];
    const departmentSpent = input.department
      ? await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from payments
          where organization_id = ${input.orgId} and department_slug = ${input.department} and voided_at is null and direction = ${"expenditure"}`
      : [{ total: 0 }];
    const departmentReserved = input.department
      ? await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from commitments
          where organization_id = ${input.orgId} and department_slug = ${input.department} and status = ${"open"} and kind = ${"reserved"}`
      : [{ total: 0 }];
    const decision = budgetDecision({
      ceilingCents: ceiling[0]?.spending_ceiling_cents == null ? null : num(ceiling[0]?.spending_ceiling_cents),
      missionBudgetCents: missionBudget[0]?.budget_cents == null ? null : num(missionBudget[0]?.budget_cents),
      departmentBudgetCents: departmentBudget[0] ? num(departmentBudget[0].amount_cents) : null,
      companySpent: num(companySpent[0]?.total),
      companyReserved: num(companyReserved[0]?.total),
      missionSpent: num(missionSpent[0]?.total),
      missionReserved: num(missionReserved[0]?.total),
      departmentSpent: num(departmentSpent[0]?.total),
      departmentReserved: num(departmentReserved[0]?.total),
      amountCents: input.amountCents,
      kind: input.kind,
    });
    if (!decision.allow) throw new CompanyError(decision.reason);
    await input.write(tx);
  });
}

async function financeSnapshot(sql: Sql, orgId: string): Promise<CommandCenter["finance"]> {
  const ceiling = await sql<{ spending_ceiling_cents: unknown }>`select spending_ceiling_cents from portfolio_limits where organization_id = ${orgId}`;
  const spent = await sql<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${orgId} and voided_at is null and direction = ${"expenditure"}`;
  const received = await sql<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from payments
    where organization_id = ${orgId} and voided_at is null and direction = ${"receipt"}`;
  const reserved = await sql<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from commitments
    where organization_id = ${orgId} and status = ${"open"} and kind = ${"reserved"}`;
  const estimates = await sql<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from commitments
    where organization_id = ${orgId} and status = ${"open"} and kind = ${"estimate"}`;
  const ceilingCents = ceiling[0]?.spending_ceiling_cents == null ? null : num(ceiling[0]?.spending_ceiling_cents);
  const spentCents = num(spent[0]?.total);
  const reservedCents = num(reserved[0]?.total);
  return {
    ceilingCents,
    spentCents,
    receivedCents: num(received[0]?.total),
    reservedCents,
    estimateCents: num(estimates[0]?.total),
    remainingCents: ceilingCents == null ? null : ceilingCents - spentCents - reservedCents,
    utilization: ceilingCents != null && ceilingCents > 0 ? (spentCents + reservedCents) / ceilingCents : null,
  };
}

async function recentChanges(sql: Sql, orgId: string): Promise<CommandCenter["changes"]> {
  const rows = await sql<{
    id: string;
    mission_id: string;
    version: unknown;
    state: string;
    revalidation: string;
    added: unknown;
    removed: unknown;
    affected_assignments: unknown;
  }>`select i.id, i.mission_id, s.version, s.state, i.revalidation, i.added, i.removed, i.affected_assignments
    from spec_impacts i
    join specifications s on s.id = i.specification_id
    where i.organization_id = ${orgId}
    order by i.created_at desc limit 8`;
  return rows.map((row) => ({
    id: row.id,
    missionId: row.mission_id,
    version: num(row.version),
    state: row.state,
    revalidation: row.revalidation,
    added: listCount(row.added),
    removed: listCount(row.removed),
    affected: listCount(row.affected_assignments),
  }));
}

async function providerSnapshot(sql: Sql, orgId: string): Promise<CommandCenter["providers"]> {
  const rows = await sql<{ provider: string; model: string; outcome: string; duration_ms: unknown; created_at: unknown }>`
    select provider, model, outcome, duration_ms, created_at from model_dispatches
    where organization_id = ${orgId}
    order by created_at asc limit 200`;
  const groups = new Map<string, { provider: string; model: string; rows: Observation[] }>();
  for (const row of rows) {
    const key = `${row.provider}:${row.model}`;
    const group = groups.get(key) ?? { provider: row.provider, model: row.model, rows: [] };
    const outcome = row.outcome === "succeeded" || row.outcome === "failed" || row.outcome === "timeout" || row.outcome === "withheld" || row.outcome === "unspecified"
      ? row.outcome
      : "unspecified";
    group.rows.push({ outcome, durationMs: row.duration_ms == null ? null : num(row.duration_ms), at: iso(row.created_at) });
    groups.set(key, group);
  }
  if (groups.size === 0) {
    return [{
      provider: "none",
      model: "",
      ...reliabilityOf([]),
    }];
  }
  return [...groups.values()].map((group) => ({ provider: group.provider, model: group.model, ...reliabilityOf(group.rows) }));
}

async function recordAcceptedSpecification(sql: Sql, orgId: string, missionId: string, userId: string, strategy: string, product: string): Promise<void> {
  const body = [strategy.trim(), product.trim()].filter(Boolean).join("\n\n");
  if (body.length < 8) return;
  const hash = contentHash(body);
  const existing = await sql<{ id: string }>`select id from specifications
    where organization_id = ${orgId} and mission_id = ${missionId} and state = ${"accepted"} and content_sha256 = ${hash} limit 1`;
  if (existing[0]) return;
  const prior = await sql<{ id: string }>`select id from specifications
    where organization_id = ${orgId} and mission_id = ${missionId} and state = ${"accepted"} limit 1`;
  if (prior[0]) return;
  const versions = await sql<{ version: unknown }>`select coalesce(max(version), 0)::int as version from specifications where mission_id = ${missionId}`;
  await sql`insert into specifications (
    id, organization_id, mission_id, version, content_sha256, body, state, author, approved_by, accepted_at
  ) values (
    ${nid("spec")}, ${orgId}, ${missionId}, ${num(versions[0]?.version) + 1}, ${hash}, ${body.slice(0, 12000)},
    ${"accepted"}, ${userId}, ${userId}, now()
  )`;
}

function listCount(value: unknown): number {
  const parsed = typeof value === "string" ? safeJson(value) : value;
  return Array.isArray(parsed) ? parsed.length : 0;
}

function readIdList(value: unknown): string[] {
  const parsed = typeof value === "string" ? safeJson(value) : value;
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function rateOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isSafeInteger(value) ? value : null;
}

async function readCostPolicy(sql: Sql, orgId: string): Promise<UnknownCostPolicy> {
  const rows = await sql<{ unknown_cost: string }>`select unknown_cost from cost_policy where organization_id = ${orgId}`;
  return rows[0]?.unknown_cost === "refuse" ? "refuse" : "record_unknown";
}

async function pricedQuote(
  sql: Sql,
  orgId: string,
  provider: string,
  model: string,
  inputTokens: number | null,
  outputTokens: number | null,
  cachedTokens: number | null,
): Promise<{ kind: "estimate" | "unknown"; cents: number | null; pricingVersion: number | null; pricingId: string | null; reason: string }> {
  const rows = await sql<{
    id: string;
    version: unknown;
    status: string;
    review_at: unknown;
    input_cents_per_million: unknown;
    output_cents_per_million: unknown;
    cached_cents_per_million: unknown;
  }>`select id, version, status, review_at, input_cents_per_million, output_cents_per_million, cached_cents_per_million
    from provider_prices
    where organization_id = ${orgId} and provider = ${provider} and model = ${model}
    order by version desc limit 1`;
  const row = rows[0];
  const price: PriceCard | null = row
    ? {
        version: num(row.version),
        status: row.status === "verified" || row.status === "expired" ? row.status : "unverified",
        reviewAt: iso(row.review_at),
        inputCentsPerMillion: row.input_cents_per_million == null ? null : num(row.input_cents_per_million),
        outputCentsPerMillion: row.output_cents_per_million == null ? null : num(row.output_cents_per_million),
        cachedCentsPerMillion: row.cached_cents_per_million == null ? null : num(row.cached_cents_per_million),
      }
    : null;
  const quote = quoteCost({ price, now: new Date().toISOString(), inputTokens, outputTokens, cachedTokens });
  return { kind: quote.kind === "estimate" ? "estimate" : "unknown", cents: quote.cents, pricingVersion: quote.pricingVersion, pricingId: row?.id ?? null, reason: quote.reason };
}

async function storeRequirements(sql: Sql, orgId: string, missionId: string, specificationId: string, version: number, priorId: string | null, before: string, after: string): Promise<void> {
  const priorRows = priorId
    ? await sql<{ requirement_key: string; body: string }>`select requirement_key, body from requirements
        where specification_id = ${priorId} and change <> ${"removed"}`
    : [];
  const beforeLines = priorRows.length > 0
    ? priorRows.map((row) => ({ key: row.requirement_key, text: row.body }))
    : requirementsOf(before).map((row) => ({ key: row.id, text: row.text }));
  const afterLines = requirementsOf(after).map((row) => ({ key: row.id, text: row.text }));
  const related = relateRequirements(beforeLines, afterLines);
  const writes: Array<{ key: string; text: string; change: string; priorKey: string | null }> = [
    ...related.unchanged.map((row) => ({ key: row.key, text: row.text, change: "unchanged", priorKey: null })),
    ...related.modified.map((row) => ({ key: row.key, text: row.text, change: "modified", priorKey: row.priorKey })),
    ...related.added.map((row) => ({ key: row.key, text: row.text, change: "added", priorKey: null })),
    ...related.removed.map((row) => ({ key: row.key, text: row.text, change: "removed", priorKey: row.key })),
    ...related.ambiguous.map((row) => ({ key: row.key, text: row.text, change: "ambiguous", priorKey: null })),
  ];
  for (const row of writes) {
    await sql`insert into requirements (
      id, organization_id, mission_id, specification_id, spec_version, requirement_key, body, change, prior_key
    ) values (
      ${nid("req")}, ${orgId}, ${missionId}, ${specificationId}, ${version}, ${row.key}, ${row.text}, ${row.change}, ${row.priorKey}
    )`;
  }
}

async function githubSnapshot(sql: Sql, orgId: string): Promise<CommandCenter["world"]["github"]> {
  const rows = await sql<{
    id: string;
    status: string;
    account_login: string;
    scopes: string;
    credential_hint: string;
    rate_remaining: string;
    rate_reset: string;
    last_success_at: unknown;
    last_failure: string;
    last_sync_at: unknown;
    poll_minutes: unknown;
  }>`select id, status, account_login, scopes, credential_hint, rate_remaining, rate_reset, last_success_at, last_failure, last_sync_at, poll_minutes
    from github_connections where organization_id = ${orgId} order by updated_at desc limit 1`;
  const row = rows[0];
  if (!row) {
    return {
      status: "not connected",
      account: "",
      scopes: "",
      hint: "",
      rate: "",
      lastSuccess: null,
      lastFailure: "",
      lastSync: null,
      polling: "No GitHub account is connected. Nothing is being polled.",
      repos: [],
      recent: [],
    };
  }
  const repos = await sql<{ owner_name: string; repo_name: string; private: boolean }>`select owner_name, repo_name, private from github_repos
    where connection_id = ${row.id} order by updated_at desc limit 12`;
  const recent = await sql<{ operation: string; resource: string; http_status: unknown; result: string; created_at: unknown }>`
    select operation, resource, http_status, result, created_at from github_reads
    where connection_id = ${row.id} order by created_at desc limit 8`;
  const lastSync = row.last_sync_at ? iso(row.last_sync_at) : null;
  const due = row.status === "connected" && pollDue(lastSync, num(row.poll_minutes) || 60, Date.now());
  return {
    status: row.status,
    account: row.account_login,
    scopes: row.scopes,
    hint: row.credential_hint,
    rate: row.rate_remaining ? `${row.rate_remaining} remaining` : "",
    lastSuccess: row.last_success_at ? iso(row.last_success_at) : null,
    lastFailure: row.last_failure,
    lastSync,
    polling: due
      ? `A refresh is due. It has not run by itself. Interval on record: ${num(row.poll_minutes) || 60} minutes. This is not continuous monitoring.`
      : `Manual refresh. Interval on record: ${num(row.poll_minutes) || 60} minutes. This is not continuous monitoring.`,
    repos: repos.map((repo) => ({ fullName: `${repo.owner_name}/${repo.repo_name}`, private: repo.private === true })),
    recent: recent.map((item) => ({
      operation: item.operation,
      resource: item.resource,
      httpStatus: num(item.http_status),
      result: item.result,
      createdAt: iso(item.created_at),
    })),
  };
}

async function worldSnapshot(sql: Sql, orgId: string): Promise<CommandCenter["world"]> {
  const policy = await readCostPolicy(sql, orgId);
  const prices = await sql<{ count: unknown }>`select count(*)::int as count from provider_prices where organization_id = ${orgId}`;
  const unknownCosts = await sql<{ count: unknown }>`select count(*)::int as count from cost_records where organization_id = ${orgId} and kind = ${"unknown"}`;
  const estimates = await sql<{ count: unknown }>`select count(*)::int as count from cost_records where organization_id = ${orgId} and kind = ${"estimate"}`;
  const samples = await sql<{ cents: unknown }>`select cents from cost_records where organization_id = ${orgId} and kind = ${"estimate"} order by created_at desc limit 20`;
  const forecast = forecastCost(samples.map((row) => ({ cents: row.cents == null ? null : num(row.cents) })));
  const integrations = await sql<{ id: string; name: string; category: string; status: string }>`
    select id, name, category, status from integrations where organization_id = ${orgId} order by created_at desc limit 8`;
  const pending = await sql<{ count: unknown }>`select count(*)::int as count from external_actions where organization_id = ${orgId} and status = ${"pending_owner"}`;
  const devices = await sql<{ id: string; name: string; connected: boolean; emergency_stop: boolean; permission: string }>`
    select id, name, connected, emergency_stop, permission from devices where organization_id = ${orgId} order by created_at desc limit 8`;
  const observations = await sql<{ count: unknown }>`select count(*)::int as count from observations where organization_id = ${orgId}`;
  const proposed = await sql<{ count: unknown }>`select count(*)::int as count from maintenance_actions where organization_id = ${orgId} and status = ${"proposed"}`;
  const applied = await sql<{ count: unknown }>`select count(*)::int as count from maintenance_actions where organization_id = ${orgId} and status = ${"applied"}`;
  const outbox = await outboxSnapshot(sql, orgId);
  return {
    policy,
    prices: num(prices[0]?.count),
    unknownCosts: num(unknownCosts[0]?.count),
    estimates: num(estimates[0]?.count),
    forecast: forecast.note,
    integrations: integrations.map((row) => ({ id: row.id, name: row.name, category: row.category, label: connectionLabel(row.status) })),
    pendingActions: num(pending[0]?.count),
    devices: devices.map((row) => ({
      id: row.id,
      name: row.name,
      connected: row.connected === true,
      emergencyStop: row.emergency_stop === true,
      permission: row.permission,
    })),
    observations: num(observations[0]?.count),
    maintenanceProposed: num(proposed[0]?.count),
    maintenanceApplied: num(applied[0]?.count),
    outboxPending: outbox.pending + outbox.processing + outbox.failed,
    outboxDead: outbox.dead,
    github: await githubSnapshot(sql, orgId),
  };
}

async function readCapacity(sql: Sql, orgId: string): Promise<number> {
  const rows = await sql<{ max_concurrent: unknown }>`select max_concurrent from portfolio_limits where organization_id = ${orgId}`;
  const value = num(rows[0]?.max_concurrent);
  return value >= 1 && value <= 8 ? value : 1;
}

export async function syncFindings(sql: Sql, orgId: string): Promise<FindingView[]> {
  const missions = await sql<{
    id: string;
    title: string;
    status: string;
    priority: unknown;
    parent_id: string | null;
    depends_on: string | null;
    dependency_status: string | null;
    updated_at: unknown;
    open_defects: unknown;
    retries: unknown;
    running: unknown;
  }>`select m.id, m.title, m.status, m.priority, m.parent_id, m.depends_on, dep.status as dependency_status, m.updated_at,
      (select count(*)::int from defects d where d.mission_id = m.id and d.status = ${"open"}) as open_defects,
      (select coalesce(max(j.attempt), 0)::int from execution_jobs j where j.mission_id = m.id) as retries,
      exists(select 1 from assignments a where a.mission_id = m.id and a.status = ${"RUNNING"}) as running
    from missions m
    left join missions dep on dep.id = m.depends_on and dep.organization_id = m.organization_id
    where m.organization_id = ${orgId}`;
  const knowledge = await sql<{ id: string; title: string; state: string; confidence: string }>`
    select id, title, state, confidence from knowledge_entries
    where organization_id = ${orgId} and confidence = ${"contested"} and state <> ${"superseded"}`;
  const facts: IntelMission[] = missions.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    priority: num(row.priority),
    parentId: row.parent_id || null,
    dependsOn: row.depends_on || null,
    dependencyStatus: row.dependency_status,
    updatedAtMs: Date.parse(iso(row.updated_at)) || Date.now(),
    openDefects: num(row.open_defects),
    retries: num(row.retries),
    running: row.running === true || row.running === "t",
  }));
  const drafts = deriveFindings({ nowMs: Date.now(), stallMs: 6 * 60 * 60 * 1000, missions: facts, knowledge });
  const open = await sql<{ id: string; finding_key: string }>`select id, finding_key from findings
    where organization_id = ${orgId} and status = ${"open"}`;
  const live = new Set(drafts.map((item) => item.key));
  for (const row of open) {
    if (!live.has(row.finding_key)) {
      await sql`update findings set status = ${"resolved"}, updated_at = now() where id = ${row.id} and status = ${"open"}`;
    }
  }
  for (const draft of drafts) {
    const existing = open.find((row) => row.finding_key === draft.key);
    if (existing) {
      await sql`update findings set
        severity = ${draft.severity}, title = ${draft.title}, evidence = ${draft.evidence},
        recommendation = ${draft.recommendation}, confidence = ${draft.confidence},
        owner_required = ${draft.ownerRequired}, mission_id = ${draft.missionId}, updated_at = now()
        where id = ${existing.id}`;
    } else {
      await sql`insert into findings (
        id, organization_id, mission_id, finding_key, severity, title, evidence, recommendation, confidence, owner_required, status
      ) values (
        ${nid("find")}, ${orgId}, ${draft.missionId}, ${draft.key}, ${draft.severity}, ${draft.title},
        ${draft.evidence}, ${draft.recommendation}, ${draft.confidence}, ${draft.ownerRequired}, ${"open"}
      )`;
    }
  }
  const rows = await sql<{
    id: string;
    mission_id: string | null;
    severity: string;
    title: string;
    evidence: string;
    recommendation: string;
    confidence: string;
    owner_required: unknown;
  }>`select id, mission_id, severity, title, evidence, recommendation, confidence, owner_required from findings
    where organization_id = ${orgId} and status = ${"open"}
    order by case severity when 'blocking' then 0 when 'watch' then 1 else 2 end, updated_at desc
    limit 12`;
  return rows.map((row) => ({
    id: row.id,
    missionId: row.mission_id,
    severity: row.severity,
    title: row.title,
    evidence: row.evidence,
    recommendation: row.recommendation,
    confidence: row.confidence,
    ownerRequired: row.owner_required === true || row.owner_required === "t",
  }));
}

async function resourceSnapshot(sql: Sql, orgId: string): Promise<CommandCenter["resources"]> {
  const running = await sql<{ count: unknown }>`select count(*)::int as count from assignments
    where organization_id = ${orgId} and status = ${"RUNNING"}`;
  const queue = await sql<{ count: unknown }>`select count(*)::int as count from assignments a
    join missions m on m.id = a.mission_id
    where a.organization_id = ${orgId} and a.status = ${"READY"} and m.status in ('AUTHORIZED', 'EXECUTING')`;
  const qa = await sql<{ status: string; count: unknown }>`select status, count(*)::int as count from qa_reports
    where organization_id = ${orgId} group by status`;
  const dispatches = await sql<{ count: unknown }>`select count(*)::int as count from model_dispatches where organization_id = ${orgId}`;
  const duration = await sql<{ count: unknown; seconds: unknown }>`select count(*)::int as count,
      avg(extract(epoch from (updated_at - created_at))) as seconds
    from execution_jobs where organization_id = ${orgId} and status = ${"done"}`;
  const reused = await sql<{ count: unknown }>`select count(*)::int as count from knowledge_uses where organization_id = ${orgId}`;
  const knowledge = await sql<{ state: string; confidence: string; count: unknown }>`
    select state, confidence, count(*)::int as count from knowledge_entries
    where organization_id = ${orgId} group by state, confidence`;
  const done = num(duration[0]?.count);
  let contested = 0;
  let acceptedKnowledge = 0;
  for (const row of knowledge) {
    if (row.confidence === "contested") contested += num(row.count);
    if (row.state === "accepted") acceptedKnowledge += num(row.count);
  }
  return {
    running: num(running[0]?.count),
    capacity: await readCapacity(sql, orgId),
    queue: num(queue[0]?.count),
    qaPassed: num(qa.find((row) => row.status === "passed")?.count),
    qaFailed: num(qa.find((row) => row.status === "failed")?.count),
    dispatches: num(dispatches[0]?.count),
    avgDurationMs: done > 0 && duration[0]?.seconds != null ? Math.round(Number(duration[0].seconds) * 1000) : null,
    reused: num(reused[0]?.count),
    contested,
    acceptedKnowledge,
  };
}

async function recentHandoffs(sql: Sql, orgId: string): Promise<CommandCenter["handoffs"]> {
  const rows = await sql<{ id: string; mission_id: string; from_department: string; to_department: string; created_at: unknown }>`
    select id, mission_id, from_department, to_department, created_at from handoffs
    where organization_id = ${orgId} order by created_at desc limit 6`;
  return rows.map((row) => ({
    id: row.id,
    missionId: row.mission_id,
    fromDepartment: row.from_department,
    toDepartment: row.to_department,
    createdAt: iso(row.created_at),
  }));
}

async function missionHandoffs(sql: Sql, missionId: string): Promise<MissionView["handoffs"]> {
  const rows = await sql<{
    id: string;
    from_department: string;
    to_department: string;
    completed: string;
    outstanding: string;
    risks: string;
    criteria: string;
    created_at: unknown;
  }>`select id, from_department, to_department, completed, outstanding, risks, criteria, created_at from handoffs
    where mission_id = ${missionId} order by created_at desc limit 6`;
  return rows.map((row) => ({
    id: row.id,
    fromDepartment: row.from_department,
    toDepartment: row.to_department,
    completed: row.completed,
    outstanding: row.outstanding,
    risks: row.risks,
    criteria: row.criteria,
    createdAt: iso(row.created_at),
  }));
}

async function memoryRows(sql: Sql, orgId: string, excludeMissionId: string): Promise<Array<{ id: string; title: string; body: string }>> {
  return sql<{ id: string; title: string; body: string }>`select id, title, body from knowledge_entries
    where organization_id = ${orgId} and verified = ${true} and state = ${"accepted"}
      and (mission_id is null or mission_id <> ${excludeMissionId})
    order by created_at desc limit 4`;
}

async function memoryTitles(sql: Sql, orgId: string, excludeMissionId: string): Promise<string[]> {
  const rows = await memoryRows(sql, orgId, excludeMissionId);
  return rows.map((row) => row.title).filter((title) => title.trim().length > 0);
}

async function memoryBrief(sql: Sql, orgId: string, excludeMissionId: string): Promise<{ text: string; ids: string[] }> {
  const rows = await memoryRows(sql, orgId, excludeMissionId);
  return {
    text: rows.map((row) => `- ${row.title}: ${row.body.replace(/\s+/g, " ").trim().slice(0, 480)}`).join("\n"),
    ids: rows.map((row) => row.id),
  };
}

async function noteReuse(sql: Sql, orgId: string, missionId: string, ids: string[]): Promise<void> {
  for (const id of ids) {
    await sql`insert into knowledge_uses (id, organization_id, knowledge_id, mission_id)
      values (${nid("use")}, ${orgId}, ${id}, ${missionId})`;
  }
}

async function remember(
  sql: Sql,
  orgId: string,
  missionId: string,
  kind: string,
  title: string,
  body: string,
  source: string,
  verified: boolean,
): Promise<void> {
  const prior = await sql<{ id: string; body: string }>`select id, body from knowledge_entries
    where organization_id = ${orgId} and title = ${title} and state = ${"accepted"}
    order by created_at desc limit 1`;
  const versions = await sql<{ version: unknown }>`select coalesce(max(version), 0)::int as version
    from knowledge_entries where organization_id = ${orgId} and mission_id = ${missionId} and title = ${title}`;
  const decision = nextMemory({
    verified,
    priorId: prior[0]?.id ?? null,
    priorBody: prior[0]?.body ?? null,
    body,
    version: num(versions[0]?.version) + 1,
  });
  if (decision.supersedePrior && decision.supersedes) {
    await sql`update knowledge_entries set state = ${"superseded"}, verified = ${false}
      where id = ${decision.supersedes} and state = ${"accepted"}`;
  }
  await sql`insert into knowledge_entries (
    id, organization_id, mission_id, kind, title, body, source, verified, version, state, confidence, supersedes, evidence_ref
  ) values (
    ${nid("mem")}, ${orgId}, ${missionId}, ${kind}, ${title}, ${body.slice(0, 8000)}, ${source}, ${verified},
    ${decision.version}, ${decision.state}, ${decision.confidence}, ${decision.supersedes}, ${missionId}
  )`;
}

async function audit(
  sql: Sql,
  ws: Workspace,
  actorId: string,
  action: string,
  target: string,
  from: string | null,
  to: string | null,
  detail: string,
): Promise<void> {
  const kind = actorId.startsWith("svc:") || actorId === "nexus-verifier" || actorId === "nexus-assembly" || actorId.includes("grok")
    ? "service"
    : "human";
  await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${ws.orgId}, ${null}, ${null}, ${actorId}, ${kind}, ${action}, ${target}, ${from}, ${to}, ${detail.slice(0, 500)}
  )`;
}

async function ensureCompany(sql: Sql, userId: string): Promise<Workspace> {
  const existing = await sql<{ org_id: string; role: string; name: string }>`
    select o.id as org_id, m.role as role, o.name as name
    from memberships m join organizations o on o.id = m.organization_id
    where m.user_id = ${userId} limit 1`;
  let ws: Workspace;
  if (existing[0]) {
    ws = { orgId: existing[0].org_id, role: existing[0].role, orgName: existing[0].name };
  } else {
    const orgId = nid("org");
    try {
      await sql`insert into organizations (id, name, owner_user_id) values (${orgId}, ${"My Workspace"}, ${userId})`;
      await sql`insert into memberships (id, organization_id, user_id, role) values (${nid("mbr")}, ${orgId}, ${userId}, ${"owner"})`;
    } catch (error) {
      if (!isUnique(error)) throw error;
      const again = await sql<{ org_id: string; role: string; name: string }>`
        select o.id as org_id, m.role as role, o.name as name
        from memberships m join organizations o on o.id = m.organization_id
        where m.user_id = ${userId} limit 1`;
      if (!again[0]) throw new CompanyError("Could not open the company.");
      ws = { orgId: again[0].org_id, role: again[0].role, orgName: again[0].name };
      await seed(sql, ws.orgId);
      await sql`insert into scheduler_state (organization_id, status)
        values (${ws.orgId}, ${"paused"})
        on conflict (organization_id) do nothing`;
      return ws;
    }
    await sql`insert into audit_events (
      id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
    ) values (
      ${nid("aud")}, ${orgId}, ${null}, ${null}, ${userId}, ${"human"}, ${"organization.created"}, ${orgId},
      ${null}, ${null}, ${"Workspace opened"}
    )`;
    ws = { orgId, role: "owner", orgName: "My Workspace" };
  }
  await seed(sql, ws.orgId);
  await sql`insert into scheduler_state (organization_id, status)
    values (${ws.orgId}, ${"paused"})
    on conflict (organization_id) do nothing`;
  return ws;
}

async function seed(sql: Sql, orgId: string): Promise<void> {
  const counts = await sql<{ departments: unknown; agents: unknown }>`
    select
      (select count(*)::int from departments where organization_id = ${orgId}) as departments,
      (select count(*)::int from agents where organization_id = ${orgId}) as agents`;
  if (num(counts[0]?.departments) >= DEPARTMENTS.length && num(counts[0]?.agents) >= AGENTS.length) return;
  const have = await sql<{ slug: string }>`select slug from departments where organization_id = ${orgId}`;
  const present = new Set(have.map((row) => row.slug));
  const ids = new Map<string, string>();
  for (const department of DEPARTMENTS) {
    if (present.has(department.slug)) {
      const row = await sql<{ id: string }>`select id from departments where organization_id = ${orgId} and slug = ${department.slug}`;
      if (row[0]) ids.set(department.slug, row[0].id);
      continue;
    }
    const id = nid("dep");
    ids.set(department.slug, id);
    await sql`insert into departments (id, organization_id, slug, name, mandate)
      values (${id}, ${orgId}, ${department.slug}, ${department.name}, ${department.mandate})`;
  }
  for (const agent of AGENTS) {
    const departmentId = ids.get(agent.department);
    if (!departmentId) continue;
    const exists = await sql<{ id: string }>`select id from agents where organization_id = ${orgId} and slug = ${agent.slug}`;
    if (exists[0]) continue;
    await sql`insert into agents (
      id, organization_id, department_id, slug, name, title, responsibility, reports_to, permission_level
    ) values (
      ${nid("agt")}, ${orgId}, ${departmentId}, ${agent.slug}, ${agent.name}, ${agent.title},
      ${agent.responsibility}, ${agent.reportsTo}, ${agent.level}
    )`;
  }
}

export async function readDisclosure(sql: Sql, orgId: string): Promise<"local" | "public"> {
  const rows = await sql<{ model_disclosure: string }>`select model_disclosure from organizations where id = ${orgId}`;
  return rows[0]?.model_disclosure === "local" ? "local" : "public";
}

export async function setDisclosure(sql: Sql, userId: string, policy: string): Promise<void> {
  if (policy !== "local" && policy !== "public") throw new CompanyError("The model policy is local or public.");
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  await sql`update organizations set model_disclosure = ${policy} where id = ${ws.orgId}`;
  await audit(sql, ws, userId, "model.disclosure", ws.orgId, null, null, policy === "public"
    ? "Public model enabled. Internal objectives may be sent to the free endpoint. Confidential objectives stay here."
    : "Local only. Objectives stay in this workspace.");
}

export async function setScheduler(sql: Sql, userId: string, status: string): Promise<void> {
  if (status !== "running" && status !== "paused" && status !== "stopped") {
    throw new CompanyError("The scheduler is running, paused, or stopped.");
  }
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  await sql`insert into scheduler_state (organization_id, status)
    values (${ws.orgId}, ${status})
    on conflict (organization_id) do update set status = ${status}, last_error = ${""}, updated_at = now()`;
  await audit(sql, ws, userId, "scheduler.status", ws.orgId, null, status, status === "running"
    ? "Scheduler running. Authorized departments may start. Acceptance stays with the owner."
    : status === "paused"
      ? "Scheduler paused. Work already running can finish. Nothing new starts."
      : "Scheduler stopped. Nothing new starts.");
}

export async function setClassification(sql: Sql, userId: string, missionId: string, classification: string): Promise<void> {
  if (classification !== "internal" && classification !== "confidential") {
    throw new CompanyError("Classification is internal or confidential.");
  }
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  const mission = await mustMission(sql, ws.orgId, missionId);
  if (mission.status !== "PROPOSED" && mission.status !== "PLANNED" && mission.status !== "REJECTED") {
    throw new CompanyError("Classification can only change before execution.");
  }
  const saved = await sql<{ id: string }>`update missions set classification = ${classification}, updated_at = now()
    where id = ${mission.id} and organization_id = ${ws.orgId} and status = ${mission.status}
    returning id`;
  if (!saved[0]) throw new CompanyError("The mission changed before classification could be saved.");
  await audit(sql, ws, userId, "mission.classification", mission.id, mission.status, mission.status, classification);
}

async function readScheduler(sql: Sql, orgId: string): Promise<{ status: "running" | "paused" | "stopped"; lastTick: string | null; lastError: string; queue: number }> {
  const rows = await sql<{ status: string; last_tick_at: unknown; last_error: string }>`
    select status, last_tick_at, last_error from scheduler_state where organization_id = ${orgId}`;
  const status = rows[0]?.status === "running" || rows[0]?.status === "stopped" ? rows[0].status : "paused";
  const queued = await sql<{ count: unknown }>`select count(*)::int as count from assignments a
    join missions m on m.id = a.mission_id
    where a.organization_id = ${orgId} and a.status = ${"READY"} and m.status in ('AUTHORIZED', 'EXECUTING')`;
  return {
    status,
    lastTick: rows[0]?.last_tick_at ? iso(rows[0].last_tick_at) : null,
    lastError: rows[0]?.last_error ?? "",
    queue: num(queued[0]?.count),
  };
}

const modelCalls = new Map<string, number[]>();

async function gatedThink(
  sql: Sql,
  orgId: string,
  think: Thinker,
  input: { system: string; user: string },
  classification: DataClass,
): Promise<{ text: string; model: string; unavailable?: boolean; provider: "pollinations" | "local"; outcome: "succeeded" | "failed" | "timeout" | "withheld"; durationMs: number; errorCategory: string }> {
  const decision = providerDecision({ classification, disclosure: await readDisclosure(sql, orgId) });
  if (!decision.send) {
    return { text: "", model: "", unavailable: true, provider: "local", outcome: "withheld", durationMs: 0, errorCategory: decision.reason };
  }
  const policy = await readCostPolicy(sql, orgId);
  const quote = await pricedQuote(sql, orgId, "pollinations", "openai-fast", null, null, null);
  const gate = unpricedDispatch(policy, quote.kind);
  if (!gate.allow) {
    return { text: "", model: "", unavailable: true, provider: "local", outcome: "withheld", durationMs: 0, errorCategory: gate.reason };
  }
  const now = Date.now();
  const recent = (modelCalls.get(orgId) ?? []).filter((at) => now - at < 60_000);
  if (recent.length >= 40) {
    return { text: "", model: "", unavailable: true, provider: "local", outcome: "withheld", durationMs: 0, errorCategory: "Rate limit" };
  }
  recent.push(now);
  modelCalls.set(orgId, recent);
  const started = Date.now();
  const thought = await think(input);
  const outcome = thought.outcome ?? (thought.text.trim() ? "succeeded" : "failed");
  return {
    ...thought,
    provider: outcome === "succeeded" && thought.text.trim() ? "pollinations" : "local",
    outcome,
    durationMs: thought.durationMs ?? Date.now() - started,
    errorCategory: thought.errorCategory ?? "",
  };
}

async function peerMissions(
  sql: Sql,
  orgId: string,
  missionId: string,
): Promise<MissionView["peers"]> {
  const rows = await sql<{ id: string; title: string; status: string }>`
    select id, title, status from missions
    where organization_id = ${orgId} and id <> ${missionId}
    order by updated_at desc limit 20`;
  return rows.flatMap((row) => {
    if (!isMissionStatus(row.status)) return [];
    return [{ id: row.id, title: row.title, status: row.status }];
  });
}

async function workerCounts(sql: Sql, orgId: string): Promise<{ leased: number; retry: number; dead: number }> {
  const rows = await sql<{ status: string; count: unknown }>`
    select status, count(*)::int as count from execution_jobs
    where organization_id = ${orgId} and status in ('leased', 'retry', 'dead')
    group by status`;
  const workers = { leased: 0, retry: 0, dead: 0 };
  for (const row of rows) {
    if (row.status === "leased" || row.status === "retry" || row.status === "dead") workers[row.status] = num(row.count);
  }
  return workers;
}

async function missionJobs(sql: Sql, missionId: string): Promise<MissionView["jobs"]> {
  const rows = await sql<{ status: string; attempt: unknown; last_error: string; updated_at: unknown }>`
    select status, attempt, last_error, updated_at from execution_jobs
    where mission_id = ${missionId} order by created_at desc limit 8`;
  return rows.map((row) => ({
    status: row.status,
    attempt: num(row.attempt),
    lastError: row.last_error,
    updatedAt: iso(row.updated_at),
  }));
}

async function latestQa(sql: Sql, orgId: string, missionId: string, currentHtml: string): Promise<MissionView["qa"]> {
  const rows = await sql<{ status: string; artifact_sha256: string; report: unknown; execution_id: string; suite: string }>`
    select status, artifact_sha256, report, execution_id, suite from qa_reports
    where organization_id = ${orgId} and mission_id = ${missionId}
    order by created_at desc limit 1`;
  const row = rows[0];
  if (!row) return null;
  const current = evidenceStillCovers(row.artifact_sha256, sha256(currentHtml), row.status) || row.artifact_sha256 === sha256(currentHtml);
  let report: { detail?: string; tests?: unknown } = {};
  try {
    report = typeof row.report === "string" ? (JSON.parse(row.report) as { detail?: string; tests?: unknown }) : ((row.report ?? {}) as { detail?: string; tests?: unknown });
  } catch {
    return {
      status: row.status,
      sha256: row.artifact_sha256,
      detail: "The stored report could not be read.",
      executionId: row.execution_id ?? "",
      suite: row.suite ?? "",
      current,
      tests: [],
    };
  }
  const tests = Array.isArray(report?.tests)
    ? report.tests.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const test = item as { name?: string; passed?: boolean; detail?: string };
        if (typeof test.name !== "string" || typeof test.passed !== "boolean") return [];
        return [{ name: test.name, passed: test.passed, detail: typeof test.detail === "string" ? test.detail : "" }];
      })
    : [];
  return {
    status: row.status,
    sha256: row.artifact_sha256,
    detail: typeof report?.detail === "string" ? report.detail : "",
    executionId: row.execution_id ?? "",
    suite: row.suite ?? "",
    current,
    tests,
  };
}

function assertOwner(ws: Workspace): void {
  if (ws.role !== "owner") throw new CompanyError("Only the owner can direct the company.");
}

export async function requireOwnerScope(sql: Sql, userId: string): Promise<{ orgId: string; orgName: string }> {
  const ws = await ensureCompany(sql, userId);
  assertOwner(ws);
  return { orgId: ws.orgId, orgName: ws.orgName };
}

function readStrings(value: unknown): string[] {
  try {
    const raw = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function readChecks(value: unknown): Check[] {
  try {
    const raw = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { name?: string; passed?: boolean; detail?: string };
      if (typeof row.name !== "string" || typeof row.passed !== "boolean") return [];
      return [{ name: row.name, passed: row.passed, detail: typeof row.detail === "string" ? row.detail : "" }];
    });
  } catch {
    return [];
  }
}

function nid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function num(value: unknown): number {
  const n = typeof value === "bigint" ? Number(value) : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function isUnique(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("duplicate") || message.includes("23505") || message.toLowerCase().includes("unique");
}
