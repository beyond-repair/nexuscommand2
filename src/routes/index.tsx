import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AccessPanel } from "@/components/access-panel";
import { PayCard, RunTokenNote } from "@/components/company-notes";
import { Shell, useReadySession } from "@/components/shell";
import { Alert, Button, controlClass } from "@/components/nexus-ui";
import { companyCommand } from "@/lib/nexus/company-api";
import { MISSION_LABEL, formatMoney, type MissionStatus } from "@/lib/nexus/company";
import type { CommandCenter } from "@/lib/nexus/company-store";
import { errorText, useCompany } from "@/lib/nexus/use-company";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, pending } = useReadySession();
  return <Shell>{pending ? <Landing holdAuth /> : user ? <Command /> : <Landing />}</Shell>;
}

function Landing({ holdAuth = false }: { holdAuth?: boolean }) {
  return (
    <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <p className="font-mono text-xs text-muted">Virtual company</p>
        <h1 className="mt-2 max-w-xl text-3xl font-medium leading-tight">One owner. One command center. A workforce with a record.</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          NEXUS turns an objective into a mission. Executive plans it. Research, product, architecture, design, and
          engineering produce the work. Quality checks the artifacts. You accept or reject the packet.
        </p>
        <ol className="mt-6 max-w-xl space-y-2 text-sm">
          {[
            "You establish the mission",
            "The CEO writes a plan and waits",
            "You authorize execution",
            "Departments hand off structured work",
            "Quality computes pass or fail",
            "You accept the packet, or send it back",
          ].map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="font-mono text-xs text-accent tabular-nums">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-xl text-sm text-muted">
          Agents cannot deploy, spend money, or accept their own work. Each department run is a step you start. Writing uses GPT-OSS 20B, a free public model.
        </p>
      </div>
      <div>
        {holdAuth ? <p className="text-sm text-muted">Checking session</p> : <AccessPanel />}
        <ul className="mt-6 space-y-3 text-sm">
          {[
            ["Executive", "Plan and coordinate"],
            ["Research", "Constraints and sources"],
            ["Engineering", "Design and implementation"],
            ["Creative", "Interface"],
            ["Quality", "Independent verification"],
            ["Governance", "Your approval, on the record"],
          ].map(([name, duty]) => (
            <li key={name} className="border-t border-line pt-3">
              <span className="block font-medium">{name}</span>
              <span className="text-muted">{duty}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GithubPanel({ github, busy, onDone, onError }: { github: CommandCenter["world"]["github"]; busy: boolean; onDone: () => void; onError: (message: string | null) => void }) {
  const [token, setToken] = useState("");
  const [repos, setRepos] = useState("");
  const [resource, setResource] = useState("");
  const [operation, setOperation] = useState("repo");
  async function send(type: string, extra: { note?: string; objective?: string; department?: string; secret?: string }) {
    onError(null);
    try {
      await companyCommand({ data: { type, ...extra } });
      setToken("");
      onDone();
    } catch (err) {
      setToken("");
      onError(errorText(err));
    }
  }
  return (
    <div className="mt-6 max-w-xl space-y-3 border-t border-line pt-4">
      <h3 className="text-sm font-medium">GitHub</h3>
      <p className="text-sm">{github.status === "connected" ? `Connected as ${github.account}` : `Status: ${github.status}`}</p>
      <p className="text-sm text-muted">{github.polling}</p>
      {github.scopes ? <p className="text-sm text-muted">Scopes: {github.scopes}</p> : null}
      {github.hint ? <p className="text-sm text-muted">Credential hint: {github.hint}</p> : null}
      {github.rate ? <p className="text-sm text-muted">Rate limit: {github.rate}</p> : null}
      {github.lastSuccess ? <p className="text-sm text-muted">Last success: {github.lastSuccess}</p> : null}
      {github.lastFailure ? <p className="text-sm text-muted">Last failure: {github.lastFailure}</p> : null}
      {github.repos.length > 0 ? (
        <ul className="space-y-1">
          {github.repos.map((repo) => (
            <li key={repo.fullName} className="text-sm">{repo.fullName}{repo.private ? " · private, contents withheld" : ""}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No repository has been retrieved.</p>
      )}
      {github.recent.length > 0 ? (
        <ul className="space-y-1">
          {github.recent.map((item) => (
            <li key={`${item.createdAt}:${item.operation}:${item.resource}`} className="font-mono text-xs text-muted">{item.result} · {item.operation} · {item.resource} · {item.httpStatus}</li>
          ))}
        </ul>
      ) : null}
      <input value={token} onChange={(event) => setToken(event.target.value)} type="password" autoComplete="off" placeholder="Read-only token" className={`${controlClass} h-11`} />
      <input value={repos} onChange={(event) => setRepos(event.target.value)} placeholder="Optional owner/name, comma separated" className={`${controlClass} h-11`} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="quiet" disabled={busy || token.trim().length < 8} onClick={() => void send("github-connect", { secret: token, note: repos })}>Verify and connect</Button>
        <Button type="button" variant="quiet" disabled={busy || github.status !== "connected"} onClick={() => void send("github-refresh", {})}>Refresh repositories</Button>
        <Button type="button" variant="quiet" disabled={busy || github.status === "not connected"} onClick={() => void send("github-disconnect", {})}>Disconnect</Button>
        <Button type="button" variant="quiet" disabled={busy || github.status === "not connected"} onClick={() => void send("github-revoke", {})}>Revoke</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={operation} onChange={(event) => setOperation(event.target.value)} className={`${controlClass} h-11 max-w-[10rem]`}>
          {["repo", "branches", "commits", "pulls", "issues", "workflows"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input value={resource} onChange={(event) => setResource(event.target.value)} placeholder="owner/name" className={`${controlClass} h-11 max-w-xs`} />
        <Button type="button" variant="quiet" disabled={busy || github.status !== "connected"} onClick={() => void send("github-read", { objective: operation, note: resource, department: "engineering" })}>Read</Button>
      </div>
      <p className="text-sm text-muted">A token is sent once, sealed, and never shown again. Write operations are not available. Without an encryption key, nothing is stored.</p>
    </div>
  );
}

function WorldDesk({ busy, onDone, onError }: { busy: boolean; onDone: () => void; onError: (message: string | null) => void }) {
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [inputRate, setInputRate] = useState("");
  const [outputRate, setOutputRate] = useState("");
  const [service, setService] = useState("");
  async function send(type: string, extra: { note?: string; amount?: string; objective?: string; policy?: string }) {
    onError(null);
    try {
      await companyCommand({ data: { type, ...extra } });
      onDone();
    } catch (err) {
      onError(errorText(err));
    }
  }
  return (
    <div className="mt-4 max-w-xl space-y-3">
      <p className="text-sm text-muted">Enter a price only if you know it. Leave a box blank and that dimension stays unknown. This does not fetch a provider's price list.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Provider" className={`${controlClass} h-11`} />
        <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="Model" className={`${controlClass} h-11`} />
        <input value={inputRate} onChange={(event) => setInputRate(event.target.value)} placeholder="Input cents / million" className={`${controlClass} h-11`} />
        <input value={outputRate} onChange={(event) => setOutputRate(event.target.value)} placeholder="Output cents / million" className={`${controlClass} h-11`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="quiet" disabled={busy || !provider.trim() || !model.trim()} onClick={() => void send("price", { note: `${provider}/${model}`, amount: inputRate, objective: outputRate })}>Record price</Button>
        <Button type="button" variant="quiet" disabled={busy} onClick={() => void send("cost-policy", { note: "refuse" })}>Refuse unpriced calls</Button>
        <Button type="button" variant="quiet" disabled={busy} onClick={() => void send("cost-policy", { note: "record_unknown" })}>Allow unknown cost</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <input value={service} onChange={(event) => setService(event.target.value)} placeholder="Service name" className={`${controlClass} h-11 max-w-xs`} />
        <Button type="button" variant="quiet" disabled={busy || service.trim().length < 2} onClick={() => void send("integration", { note: service, policy: "information", objective: "read" })}>Register, not connect</Button>
      </div>
    </div>
  );
}

function Command() {
  const navigate = useNavigate();
  const { data, error, loading, reload } = useCompany<CommandCenter>("command");
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loopError, setLoopError] = useState<string | null>(null);
  const [relation, setRelation] = useState("depends_on");
  const [sourceRef, setSourceRef] = useState("");
  const [targetRef, setTargetRef] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [readyFilter, setReadyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [markLevel, setMarkLevel] = useState("critical");
  const [markRef, setMarkRef] = useState("");
  const [markReason, setMarkReason] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("open");
  const [scheduleClass, setScheduleClass] = useState("all");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const result = await companyCommand({ data: { type: "submit", objective } });
      if (result && "missionId" in result) {
        await navigate({ to: "/missions/$missionId", params: { missionId: result.missionId } });
      }
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function control(type: string, extra: { kind?: string; note?: string; objective?: string; label?: string; value?: string; name?: string } = {}) {
    setBusy(true);
    setLoopError(null);
    try {
      await companyCommand({ data: { type, ...extra } });
      reload();
    } catch (err) {
      setLoopError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <p className="py-8 text-sm text-muted">Opening the company</p>;
  if (!data) {
    return (
      <div className="py-8">
        <Alert>{error ?? "The company did not load."}</Alert>
        <button type="button" className="mt-3 text-sm text-accent" onClick={reload}>Retry</button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <p className="font-mono text-xs text-muted">{data.organization.role}</p>
        <h1 className="mt-1 text-2xl font-medium">{data.organization.name}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
          {[
            ["Missions", data.counts.missions],
            ["In motion", data.counts.executing],
            ["Awaiting you", data.counts.awaiting],
            ["Open defects", data.counts.defects],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-bg px-3 py-3">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="mt-1 font-mono text-lg tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <section className="mt-8 border border-line bg-surface px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">Business</h2>
            <Link to="/business" className="text-sm text-accent">Open the record</Link>
          </div>
          <p className="mt-2 text-sm text-muted">
            {data.business.name
              ? `${data.business.name} is in ${data.business.stage}. ${data.business.openObligations} obligations are still open. ${data.business.restrictedOpen} must be done by a person, not an agent.`
              : "No business record yet. Opening one coordinates formation, money, product, market, operations, and people. It does not create a second company."}
          </p>
        </section>
        <section className="mt-4 border border-line bg-surface px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">Control loop</h2>
            <span className="font-mono text-xs text-muted">
              {data.control.halted ? "Stopped" : "Running"} · {data.control.prepareLevel === 0 ? "Manual" : data.control.prepareLevel === 2 ? "Delegated" : "Assisted"}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            It reads open obligations, accepted orders, unpaid claims, dependencies, and priority, then proposes a schedule order. A notice is not execution. Blocked, circular, missing, or approval-waiting work is not proposed. Priority does not clear a blocker, grant approval, reclassify restricted work, or authorize a mission. A schedule is not a timetable and accepting it does not authorize a mission. While the loop is stopped, a cycle does not write a schedule. Delegated may open a proposed mission for research work that is free to start. That mission is not authorized. The loop does not file, spend, publish, sign, or change who is allowed to do what. Restricted work stays with you. The department scheduler is separate and is unchanged.
          </p>
          {data.control.lastCycle ? (
            <p className="mt-2 font-mono text-xs text-muted tabular-nums">
              Last cycle noticed {data.control.lastCycle.observed}, decided {data.control.lastCycle.decided}, proposed {data.control.lastCycle.proposed}.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted">No cycle has run. Opening this page does not start one.</p>
          )}
          {loopError ? <div className="mt-2"><Alert>{loopError}</Alert></div> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" disabled={busy || data.organization.role !== "owner"} onClick={() => void control("control-cycle")}>Run cycle</Button>
            <Button type="button" variant="quiet" disabled={busy || data.organization.role !== "owner" || data.control.prepareLevel === 0} onClick={() => void control("control-policy", { kind: "0" })}>Manual</Button>
            <Button type="button" variant="quiet" disabled={busy || data.organization.role !== "owner" || data.control.prepareLevel === 1} onClick={() => void control("control-policy", { kind: "1" })}>Assisted</Button>
            <Button type="button" variant="quiet" disabled={busy || data.organization.role !== "owner" || data.control.prepareLevel === 2} onClick={() => void control("control-policy", { kind: "2" })}>Delegated</Button>
            <Button type="button" variant="danger" disabled={busy || data.organization.role !== "owner" || data.control.halted} onClick={() => void control("control-halt", { kind: "stop" })}>Stop the loop</Button>
            <Button type="button" variant="quiet" disabled={busy || data.organization.role !== "owner" || !data.control.halted} onClick={() => void control("control-halt", { kind: "resume" })}>Resume</Button>
          </div>
          {data.control.decisions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No decision is on record.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.control.decisions.map((decision) => (
                <li key={decision.id} className="border-t border-line pt-3">
                  <p className="text-sm">{decision.summary}</p>
                  <p className="mt-1 text-sm text-muted">{decision.reason}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {decision.disposition === "proposed" ? "Proposed mission" : "Notice"} · still needs you
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <DependencyPanel
          plan={data.plan}
          owner={data.organization.role === "owner"}
          busy={busy}
          relation={relation}
          sourceRef={sourceRef}
          targetRef={targetRef}
          onRelation={setRelation}
          onSource={setSourceRef}
          onTarget={setTargetRef}
          onAdd={() => {
            const source = sourceRef.split(":");
            const target = targetRef.split(":");
            void control("dependency-add", {
              kind: relation,
              note: source[0] ?? "",
              objective: source.slice(1).join(":"),
              label: target[0] ?? "",
              value: target.slice(1).join(":"),
            });
          }}
          onRetire={(id) => void control("dependency-retire", { note: id })}
        />
        <PriorityPanel
          priority={data.priority}
          records={data.plan.records}
          owner={data.organization.role === "owner"}
          busy={busy}
          classFilter={classFilter}
          readyFilter={readyFilter}
          typeFilter={typeFilter}
          divisionFilter={divisionFilter}
          ownerFilter={ownerFilter}
          statusFilter={statusFilter}
          markLevel={markLevel}
          markRef={markRef}
          markReason={markReason}
          onClass={setClassFilter}
          onReady={setReadyFilter}
          onType={setTypeFilter}
          onDivision={setDivisionFilter}
          onOwner={setOwnerFilter}
          onStatus={setStatusFilter}
          onMarkLevel={setMarkLevel}
          onMarkRef={setMarkRef}
          onMarkReason={setMarkReason}
          onMark={() => {
            const source = markRef.split(":");
            void control("priority-objective", {
              kind: markLevel,
              note: source[0] ?? "",
              objective: source.slice(1).join(":"),
              name: markReason,
            });
          }}
          onRetire={(id) => void control("priority-objective-retire", { note: id })}
        />
        <SchedulePanel
          schedule={data.schedule}
          owner={data.organization.role === "owner"}
          busy={busy}
          statusFilter={scheduleFilter}
          classFilter={scheduleClass}
          onStatus={setScheduleFilter}
          onClass={setScheduleClass}
          onAccept={() => void control("schedule-accept")}
          onCancel={(which) => void control("schedule-cancel", { kind: which })}
        />

        <form onSubmit={(event) => void submit(event)} className="mt-8">
          <label htmlFor="mission" className="text-sm font-medium">
            New mission
          </label>
          <textarea
            id="mission"
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
            placeholder="Build a contractor desk that tracks jobs and drafts invoices."
            className={`${controlClass} mt-2 min-h-28 py-3`}
          />
          {formError ? (
            <div className="mt-2">
              <Alert>{formError}</Alert>
            </div>
          ) : null}
          <Button type="submit" className="mt-3" disabled={busy || objective.trim().length < 8}>
            {busy ? "Filing…" : "Establish the mission"}
          </Button>
        </form>

        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium">Active record</h2>
            <Link to="/missions" className="text-sm text-accent">
              All missions
            </Link>
          </div>
          {data.missions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No missions. The workforce is standing by until you set an objective.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {data.missions.slice(0, 8).map((mission) => (
                <li key={mission.id}>
                  <Link to="/missions/$missionId" params={{ missionId: mission.id }} className="flex min-h-11 items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{mission.title}</span>
                      <span className="font-mono text-xs text-muted tabular-nums">
                        P{mission.priority} · {mission.done}/{mission.total || "—"} departments
                        {mission.parentId ? " · subordinate" : ""}
                      </span>
                    </span>
                    <Status status={mission.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mt-10">
          <h2 className="text-sm font-medium">Operational findings</h2>
          <p className="mt-2 text-sm text-muted">Recorded items come from the company record. An inferred item says so and is not a fact.</p>
          {data.findings.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No open finding. That is the record, not a prediction that nothing will fail.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.findings.map((finding) => (
                <li key={finding.id} className="border-t border-line pt-3">
                  <p className="text-sm">{finding.title}</p>
                  <p className="mt-1 text-sm text-muted">{finding.evidence}</p>
                  <p className="mt-1 text-sm text-muted">{finding.recommendation}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {finding.severity} · {finding.confidence}{finding.ownerRequired ? " · owner" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mt-10">
          <h2 className="text-sm font-medium">Resources on record</h2>
          <p className="mt-2 text-sm text-muted">
            Running {data.resources.running} of {data.resources.capacity}. Queue {data.resources.queue}. Quality {data.resources.qaPassed} passed, {data.resources.qaFailed} failed. Model dispatches {data.resources.dispatches}. Accepted knowledge {data.resources.acceptedKnowledge}, contested {data.resources.contested}, reused {data.resources.reused}.
          </p>
          <p className="mt-2 text-sm text-muted">
            {data.resources.avgDurationMs === null
              ? "Average execution time is not shown. No finished execution job is on record."
              : `Average finished execution ${Math.round(data.resources.avgDurationMs / 1000)}s, from completed jobs only.`}
          </p>
          {data.handoffs.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {data.handoffs.map((handoff) => (
                <li key={handoff.id} className="text-sm text-muted">{handoff.fromDepartment} → {handoff.toDepartment}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No department handoff has been stored yet.</p>
          )}
        </section>
        <section className="mt-10">
          <h2 className="text-sm font-medium">Change control</h2>
          {data.changes.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No specification version has been filed. An accepted mission records its specification when you accept it. A later edit is a new version.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.changes.map((change) => (
                <li key={change.id} className="border-t border-line pt-3 text-sm">
                  <p>Version {change.version} · {change.state} · review {change.revalidation}</p>
                  <p className="mt-1 text-muted">{change.added} added, {change.removed} removed, {change.affected} deliverables traced. Unaffected work is not in that count.</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="mt-10">
          <h2 className="text-sm font-medium">Financial control</h2>
          <p className="mt-2 text-sm text-muted">
            Received {formatMoney(data.finance.receivedCents)}. Spent {formatMoney(data.finance.spentCents)}. Reserved {formatMoney(data.finance.reservedCents)}. Estimates {formatMoney(data.finance.estimateCents)} do not consume the ceiling. Receipts do not either.
          </p>
          <p className="mt-2 text-sm text-muted">
            {data.finance.ceilingCents == null
              ? "No spending ceiling is set. Remaining budget is unavailable, not zero and not unlimited as a measured figure."
              : `Ceiling ${formatMoney(data.finance.ceilingCents)}. Remaining ${formatMoney(data.finance.remainingCents ?? 0)}. Utilization ${Math.round((data.finance.utilization ?? 0) * 100)}%, from expenditures and open reservations.`}
          </p>
        </section>
        <section className="mt-10">
          <h2 className="text-sm font-medium">Provider reliability</h2>
          <ul className="mt-3 space-y-3">
            {data.providers.map((provider) => (
              <li key={`${provider.provider}:${provider.model}`} className="border-t border-line pt-3 text-sm">
                <p>{provider.provider}{provider.model ? ` · ${provider.model}` : ""}</p>
                <p className="mt-1 text-muted">{provider.note}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  Attempts {provider.attempts}. Withheld {provider.withheld}. Unspecified {provider.unspecified}.
                  {provider.measured
                    ? ` Success ${Math.round((provider.successRate ?? 0) * 100)}%. Failure ${Math.round((provider.failureRate ?? 0) * 100)}%. Timeout ${Math.round((provider.timeoutRate ?? 0) * 100)}%.`
                    : " Rates hidden."}
                  {provider.averageMs == null ? " Duration unavailable." : ` Average ${provider.averageMs} ms.`}
                  {provider.periodStart ? ` Period ${provider.periodStart} to ${provider.periodEnd}.` : ""}
                  {provider.lastOutcome ? ` Last ${provider.lastOutcome}.` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-10">
          <h2 className="text-sm font-medium">External world</h2>
          <p className="mt-2 text-sm text-muted">
            Unknown-cost policy: {data.world.policy === "refuse" ? "refuse the call" : "record the cost as unknown"}. Prices on record: {data.world.prices}. Unknown cost rows: {data.world.unknownCosts}. Estimates: {data.world.estimates}.
          </p>
          <p className="mt-2 text-sm text-muted">{data.world.forecast}</p>
          {data.world.integrations.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No external service is registered. A registry row would still not mean the service is connected.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.world.integrations.map((integration) => (
                <li key={integration.id} className="text-sm">{integration.name} · {integration.category} · {integration.label}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-sm text-muted">
            Actions waiting on you: {data.world.pendingActions}. Observations stored, not accepted as knowledge: {data.world.observations}.
            {" "}Maintenance proposed {data.world.maintenanceProposed}, applied {data.world.maintenanceApplied}. Delivery waiting {data.world.outboxPending}, dead {data.world.outboxDead}. <Link to="/operations" className="text-accent">Open the operational record</Link>.
          </p>
          {data.world.devices.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No device is registered. Nothing physical is being monitored or controlled.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.world.devices.map((device) => (
                <li key={device.id} className="text-sm">
                  {device.name} · {device.permission} · {device.connected ? "connected" : "not connected"}{device.emergencyStop ? " · emergency stop set" : ""}
                </li>
              ))}
            </ul>
          )}
          <WorldDesk busy={busy} onDone={reload} onError={setFormError} />
          <GithubPanel github={data.world.github} busy={busy} onDone={reload} onError={setFormError} />
        </section>
        <section className="mt-10">
          <h2 className="text-sm font-medium">How a department run is locked</h2>
          <div className="mt-2 max-w-xl">
            <RunTokenNote />
          </div>
          <p className="mt-3 text-sm text-muted">
            Model policy: {data.disclosure === "public" ? "public. Internal work may use the free model. Confidential work never does." : "local. Objectives stay in this workspace."}
            {" "}Scheduler: {data.scheduler.status}. Queue {data.scheduler.queue}. Workers: {data.workers.leased} leased, {data.workers.retry} waiting to retry, {data.workers.dead} dead.
          </p>
          <p className="mt-3 text-sm">
            <Link to="/governance" className="text-accent">Change the model policy</Link>
            {" · "}
            <Link to="/blueprint" className="text-accent">Operating contract</Link>
          </p>
        </section>
        {error ? (
          <button type="button" className="mt-4 text-sm text-danger" onClick={reload}>
            {error} Retry
          </button>
        ) : null}
      </div>

      <aside className="space-y-8">
        <section>
          <h2 className="text-sm font-medium">Departments</h2>
          <ul className="mt-2 space-y-3">
            {data.departments.map((department) => (
              <li key={department.slug} className="border-t border-line pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm">{department.name}</span>
                  <span className="font-mono text-xs text-muted tabular-nums">{department.open} open</span>
                </div>
                <p className="text-xs text-muted">{department.mandate}</p>
              </li>
            ))}
          </ul>
        </section>
        {data.awaiting.length > 0 ? (
          <section>
            <h2 className="text-sm font-medium">Waiting for you</h2>
            <ul className="mt-2 space-y-2">
              {data.awaiting.map((mission) => (
                <li key={mission.id}>
                  <Link to="/missions/$missionId" params={{ missionId: mission.id }} className="text-sm text-accent">
                    {mission.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <PayCard recordedCents={data.counts.recordedCents} recordedLabel="Received" />
        {data.recent.length > 0 ? (
          <section>
            <h2 className="text-sm font-medium">Latest record</h2>
            <ul className="mt-2 space-y-2">
              {data.recent.map((event) => (
                <li key={event.id} className="text-sm">
                  <span className="font-mono text-xs">{event.action}</span>
                  {event.target?.startsWith("msn_") ? (
                    <Link to="/missions/$missionId" params={{ missionId: event.target }} className="mt-0.5 block text-xs text-accent">
                      {event.detail || "Open the mission"}
                    </Link>
                  ) : event.detail ? (
                    <span className="mt-0.5 block text-xs text-muted">{event.detail}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function Status({ status }: { status: MissionStatus }) {
  const tone = status === "REJECTED" || status === "CANCELLED" ? "text-danger" : status === "AWAITING_ACCEPTANCE" || status === "ACCEPTED" ? "text-accent" : "text-muted";
  return <span className={`shrink-0 font-mono text-xs ${tone}`}>{MISSION_LABEL[status]}</span>;
}

const RELATION_LABEL: Record<string, string> = {
  depends_on: "Depends on",
  blocks: "Blocks",
  requires_approval: "Requires approval from",
  owned_by: "Owned by",
  assigned_to: "Assigned to",
  produces: "Produces",
  satisfies: "Satisfies",
  derived_from: "Derived from",
  related_to: "Related to",
};

const PLAN_LABEL: Record<string, string> = {
  ready: "Ready",
  blocked: "Blocked",
  missing: "Missing prerequisite",
  approval: "Waiting for human approval",
  circular: "Circular dependency",
  unassigned: "Ownership gap",
  proposed: "Proposed",
  completed: "Completed",
};

function DependencyPanel({
  plan,
  owner,
  busy,
  relation,
  sourceRef,
  targetRef,
  onRelation,
  onSource,
  onTarget,
  onAdd,
  onRetire,
}: {
  plan: CommandCenter["plan"];
  owner: boolean;
  busy: boolean;
  relation: string;
  sourceRef: string;
  targetRef: string;
  onRelation: (value: string) => void;
  onSource: (value: string) => void;
  onTarget: (value: string) => void;
  onAdd: () => void;
  onRetire: (id: string) => void;
}) {
  const problems = plan.items.filter((item) => item.status === "blocked" || item.status === "missing" || item.status === "approval" || item.status === "circular");
  const gaps = plan.items.filter((item) => item.status === "unassigned");
  const active = plan.relationships.filter((item) => item.state === "active");
  const tally = (status: string) => plan.items.filter((item) => item.status === status).length;
  const statusOf = new Map(plan.items.map((item) => [`${item.recordType}:${item.recordId}`, item.status]));
  const reading = [
    ["ready", "Ready"],
    ["blocked", "Blocked"],
    ["approval", "Waiting for human approval"],
    ["missing", "Missing prerequisite"],
    ["proposed", "Proposed"],
    ["completed", "Completed"],
    ["circular", "Circular dependency"],
    ["unassigned", "Ownership gap"],
  ].map(([status, label]) => `${label} ${tally(status)}`).join(" · ");
  return (
    <section className="mt-4 border border-line bg-surface px-4 py-4">
      <h2 className="text-sm font-medium">Dependencies</h2>
      <p className="mt-2 text-sm text-muted">
        This is the current reading of records you already have. Opening the page does not run a cycle and does not authorize anything. {plan.deadlineNote}
      </p>
      <p className="mt-2 font-mono text-xs text-muted">{reading}</p>
      {plan.sequence.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No remaining work is free of a cycle.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {plan.sequence.slice(0, 8).map((step, index) => (
            <li key={`${step.recordType}:${step.recordId}`} className="text-sm">
              <span className="font-mono text-xs text-muted tabular-nums">{index + 1} </span>
              {step.label}
              <span className="mt-0.5 block font-mono text-xs text-muted">{PLAN_LABEL[statusOf.get(`${step.recordType}:${step.recordId}`) ?? ""] ?? "Reading"}</span>
              <span className="mt-0.5 block text-sm text-muted">{step.because}</span>
            </li>
          ))}
        </ol>
      )}
      {problems.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing in this reading is blocked, circular, missing, or waiting for approval.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {problems.slice(0, 8).map((item) => (
            <li key={`${item.status}:${item.recordType}:${item.recordId}`} className="border-t border-line pt-3">
              <p className="text-sm">{item.label}</p>
              <p className="mt-1 font-mono text-xs text-muted">{PLAN_LABEL[item.status] ?? item.status}</p>
              <p className="mt-1 text-sm text-muted">{item.evidence}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-muted">
        {gaps.length === 0
          ? "No ownership gap is on this reading."
          : `${gaps.length} open ${gaps.length === 1 ? "record has" : "records have"} no owner or assignee on a relationship. No owner was invented.`}
      </p>
      {active.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No active relationship. A blank list is not a claim that nothing depends on anything.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {active.map((item) => (
            <li key={item.id} className="border-t border-line pt-3">
              <p className="text-sm">{item.sourceLabel} · {RELATION_LABEL[item.relation] ?? item.relation} · {item.targetLabel}</p>
              <button type="button" className="mt-1 inline-flex h-11 items-center text-sm text-accent disabled:opacity-40" disabled={busy || !owner} onClick={() => onRetire(item.id)}>Retire</button>
            </li>
          ))}
        </ul>
      )}
      {plan.retired > 0 ? <p className="mt-2 text-sm text-muted">{plan.retired} retired. Those rows stay.</p> : null}
      <div className="mt-4 grid gap-2">
        <select value={relation} onChange={(event) => onRelation(event.target.value)} className={`${controlClass} h-11`} disabled={!owner}>
          {Object.entries(RELATION_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={sourceRef} onChange={(event) => onSource(event.target.value)} className={`${controlClass} h-11`} disabled={!owner}>
          <option value="">From</option>
          {plan.records.map((record) => <option key={`s:${record.type}:${record.id}`} value={`${record.type}:${record.id}`}>{record.label}</option>)}
        </select>
        <select value={targetRef} onChange={(event) => onTarget(event.target.value)} className={`${controlClass} h-11`} disabled={!owner}>
          <option value="">To</option>
          {plan.records.map((record) => <option key={`t:${record.type}:${record.id}`} value={`${record.type}:${record.id}`}>{record.label}</option>)}
        </select>
        <Button type="button" variant="quiet" disabled={busy || !owner || !sourceRef || !targetRef || sourceRef === targetRef} onClick={onAdd}>Add relationship</Button>
      </div>
    </section>
  );
}

const CLASS_LABEL: Record<string, string> = {
  P0: "P0 Critical",
  P1: "P1 High",
  P2: "P2 Normal",
  P3: "P3 Low",
  P4: "P4 Deferred",
};

const RECOMMEND_LABEL: Record<string, string> = {
  do_now: "Do now",
  do_next: "Do next",
  prepare: "Prepare",
  await_approval: "Await human approval",
  resolve_blocker: "Resolve blocker",
  assign_ownership: "Assign ownership",
  defer: "Defer",
};

function PriorityPanel({
  priority,
  records,
  owner,
  busy,
  classFilter,
  readyFilter,
  typeFilter,
  divisionFilter,
  ownerFilter,
  statusFilter,
  markLevel,
  markRef,
  markReason,
  onClass,
  onReady,
  onType,
  onDivision,
  onOwner,
  onStatus,
  onMarkLevel,
  onMarkRef,
  onMarkReason,
  onMark,
  onRetire,
}: {
  priority: CommandCenter["priority"];
  records: CommandCenter["plan"]["records"];
  owner: boolean;
  busy: boolean;
  classFilter: string;
  readyFilter: string;
  typeFilter: string;
  divisionFilter: string;
  ownerFilter: string;
  statusFilter: string;
  markLevel: string;
  markRef: string;
  markReason: string;
  onClass: (value: string) => void;
  onReady: (value: string) => void;
  onType: (value: string) => void;
  onDivision: (value: string) => void;
  onOwner: (value: string) => void;
  onStatus: (value: string) => void;
  onMarkLevel: (value: string) => void;
  onMarkRef: (value: string) => void;
  onMarkReason: (value: string) => void;
  onMark: () => void;
  onRetire: (id: string) => void;
}) {
  const match = (item: CommandCenter["priority"]["items"][number]) => {
    if (classFilter !== "all" && item.classification !== classFilter) return false;
    if (readyFilter !== "all" && item.readiness !== readyFilter) return false;
    if (typeFilter !== "all" && item.recordType !== typeFilter) return false;
    if (divisionFilter === "none" && item.division) return false;
    if (divisionFilter !== "all" && divisionFilter !== "none" && item.division !== divisionFilter) return false;
    if (ownerFilter === "gap" && item.ownerLabel) return false;
    if (ownerFilter === "recorded" && !item.ownerLabel) return false;
    if (statusFilter !== "all" && item.statusLabel !== statusFilter) return false;
    return true;
  };
  const shown = priority.sequence.filter(match).slice(0, 8);
  const blockedHigh = priority.items.filter((item) => (item.classification === "P0" || item.classification === "P1")
    && (item.readiness === "blocked" || item.readiness === "missing" || item.readiness === "circular" || item.readiness === "approval")
    && match(item)).slice(0, 4);
  const statuses = [...new Set(priority.items.map((item) => item.statusLabel))].sort();
  const tally = (name: string) => priority.items.filter((item) => item.classification === name).length;
  return (
    <section className="mt-4 border border-line bg-surface px-4 py-4">
      <h2 className="text-sm font-medium">Priority</h2>
      <p className="mt-2 text-sm text-muted">
        Policy version {priority.policyVersion}. This is a recommendation, not an assignment and not an authorization. Opening the page does not run a cycle. {priority.deadlineNote}
      </p>
      <p className="mt-2 font-mono text-xs text-muted">
        P0 {tally("P0")} · P1 {tally("P1")} · P2 {tally("P2")} · P3 {tally("P3")} · P4 {tally("P4")}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select value={classFilter} onChange={(event) => onClass(event.target.value)} className={`${controlClass} h-11`}>
          <option value="all">All priorities</option>
          {Object.entries(CLASS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={readyFilter} onChange={(event) => onReady(event.target.value)} className={`${controlClass} h-11`}>
          <option value="all">All readiness</option>
          {Object.entries(PLAN_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => onType(event.target.value)} className={`${controlClass} h-11`}>
          <option value="all">All record types</option>
          {["obligation", "mission", "task", "order", "invoice"].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select value={divisionFilter} onChange={(event) => onDivision(event.target.value)} className={`${controlClass} h-11`}>
          <option value="all">All divisions</option>
          <option value="none">Division not recorded</option>
          {["formation", "governance", "finance", "product", "market", "operations", "people", "quality"].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select value={ownerFilter} onChange={(event) => onOwner(event.target.value)} className={`${controlClass} h-11`}>
          <option value="all">Any ownership</option>
          <option value="gap">Ownership gap</option>
          <option value="recorded">Owner recorded</option>
        </select>
        <select value={statusFilter} onChange={(event) => onStatus(event.target.value)} className={`${controlClass} h-11`}>
          <option value="all">Any status</option>
          {statuses.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing in this reading matches. A blank list is not a claim that the work is done.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {shown.map((item, index) => (
            <li key={`${item.recordType}:${item.recordId}`} className="border-t border-line pt-3">
              <p className="text-sm">{index + 1}. {item.label}</p>
              <p className={`mt-1 font-mono text-xs ${item.classification === "P0" ? "text-danger" : item.classification === "P1" ? "text-accent" : "text-muted"}`}>
                {CLASS_LABEL[item.classification]} · {RECOMMEND_LABEL[item.recommendation] ?? item.recommendation} · {PLAN_LABEL[item.readiness] ?? item.readiness}
                {item.restricted ? " · restricted" : ""}
              </p>
              <p className="mt-1 text-sm text-muted">{item.positionReason}</p>
              <p className="mt-1 text-sm text-muted">{item.human}</p>
              <p className="mt-1 text-sm text-muted">{item.factors.map((factor) => factor.evidence).join(" ")}</p>
            </li>
          ))}
        </ol>
      )}
      {blockedHigh.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No high-priority work in this filter is blocked or waiting.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {blockedHigh.map((item) => (
            <li key={`held:${item.recordType}:${item.recordId}`} className="border-t border-line pt-3">
              <p className="text-sm">{item.label}</p>
              <p className="mt-1 font-mono text-xs text-danger">{CLASS_LABEL[item.classification]} stays blocked</p>
              <p className="mt-1 text-sm text-muted">{item.human}</p>
            </li>
          ))}
        </ul>
      )}
      {priority.changes.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No priority change is stored. Opening this page does not write one.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {priority.changes.slice(0, 5).map((change) => (
            <li key={change.id} className="border-t border-line pt-3 text-sm text-muted">
              {change.previous ?? "None"} became {change.next}. {change.reason}
            </li>
          ))}
        </ul>
      )}
      {priority.objectives.length === 0 ? null : (
        <ul className="mt-3 space-y-3">
          {priority.objectives.map((item) => (
            <li key={item.id} className="border-t border-line pt-3">
              <p className="text-sm">{item.label} · {item.level}</p>
              <p className="mt-1 text-sm text-muted">{item.reason}</p>
              <button type="button" className="mt-1 inline-flex h-11 items-center text-sm text-accent disabled:opacity-40" disabled={busy || !owner} onClick={() => onRetire(item.id)}>Retire objective</button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 grid gap-2">
        <select value={markLevel} onChange={(event) => onMarkLevel(event.target.value)} className={`${controlClass} h-11`} disabled={!owner}>
          <option value="critical">Critical objective</option>
          <option value="high">High objective</option>
          <option value="low">Low objective</option>
          <option value="defer">Defer objective</option>
        </select>
        <select value={markRef} onChange={(event) => onMarkRef(event.target.value)} className={`${controlClass} h-11`} disabled={!owner}>
          <option value="">Record</option>
          {records.map((record) => <option key={`m:${record.type}:${record.id}`} value={`${record.type}:${record.id}`}>{record.label}</option>)}
        </select>
        <textarea value={markReason} onChange={(event) => onMarkReason(event.target.value)} placeholder="Why this matters. A sentence, not a guess." className={`${controlClass} min-h-20 py-3`} disabled={!owner} />
        <Button type="button" variant="quiet" disabled={busy || !owner || !markRef || markReason.trim().length < 12} onClick={onMark}>Record objective</Button>
      </div>
    </section>
  );
}

const SCHEDULE_LABEL: Record<string, string> = {
  schedulable: "Schedulable proposal",
  unassigned: "Ready but unassigned",
  blocked: "Blocked",
  approval: "Awaiting human approval",
  restricted: "Restricted",
  proposed: "Proposed mission",
  authorized: "Already authorized",
  excluded: "Excluded",
  conflict: "Resource conflict",
};

function SchedulePanel({
  schedule,
  owner,
  busy,
  statusFilter,
  classFilter,
  onStatus,
  onClass,
  onAccept,
  onCancel,
}: {
  schedule: CommandCenter["schedule"];
  owner: boolean;
  busy: boolean;
  statusFilter: string;
  classFilter: string;
  onStatus: (value: string) => void;
  onClass: (value: string) => void;
  onAccept: () => void;
  onCancel: (which: "proposed" | "accepted") => void;
}) {
  const match = (item: CommandCenter["schedule"]["items"][number]) => {
    if (statusFilter === "open" && item.schedulingStatus === "excluded") return false;
    if (statusFilter !== "all" && statusFilter !== "open" && item.schedulingStatus !== statusFilter) return false;
    if (classFilter !== "all" && item.priorityClass !== classFilter) return false;
    return true;
  };
  const shown = schedule.items.filter(match).slice(0, 8);
  return (
    <section className="mt-4 border border-line bg-surface px-4 py-4">
      <h2 className="text-sm font-medium">Schedule</h2>
      <p className="mt-2 text-sm text-muted">
        Policy version {schedule.policyVersion}. This is a proposed order, not a calendar and not an authorization. {schedule.note} People on record: {schedule.people}. Agents on record: {schedule.agents}. Availability is unknown for every one of them.
      </p>
      {schedule.proposed ? (
        <p className="mt-2 text-sm text-muted">Stored proposal version {schedule.proposed.version}. {schedule.diverged ? "The reading has changed since that version. Run a cycle to record it. This page does not." : "The reading matches the stored proposal."} Accepting it does not authorize a mission.</p>
      ) : (
        <p className="mt-2 text-sm text-muted">No schedule is stored. This reading is a draft on the page only. Opening the page does not write one.</p>
      )}
      {schedule.accepted ? (
        <p className="mt-2 text-sm text-muted">Accepted version {schedule.accepted.version} is the owner's last accepted order. It still does not authorize a mission. {schedule.accepted.explanation}</p>
      ) : (
        <p className="mt-2 text-sm text-muted">No schedule has been accepted.</p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select value={statusFilter} onChange={(event) => onStatus(event.target.value)} className={`${controlClass} h-11`}>
          <option value="open">Open work</option>
          <option value="all">Including excluded</option>
          {Object.entries(SCHEDULE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={classFilter} onChange={(event) => onClass(event.target.value)} className={`${controlClass} h-11`}>
          <option value="all">All priorities</option>
          {Object.entries(CLASS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing in this reading matches. A blank list is not a claim that the work is done.</p>
      ) : (
        <ol className="mt-3 space-y-3">
          {shown.map((item) => (
            <li key={`${item.recordType}:${item.recordId}`} className="border-t border-line pt-3">
              <p className="text-sm">{item.position}. {item.label}</p>
              <p className={`mt-1 font-mono text-xs ${item.schedulingStatus === "conflict" || item.schedulingStatus === "blocked" ? "text-danger" : item.schedulingStatus === "schedulable" ? "text-accent" : "text-muted"}`}>
                {SCHEDULE_LABEL[item.schedulingStatus] ?? item.schedulingStatus}
                {item.priorityClass === "unscored" ? "" : ` · ${CLASS_LABEL[item.priorityClass] ?? item.priorityClass}`}
                {" · "}{PLAN_LABEL[item.readiness] ?? item.readiness}
                {item.executable ? " · proposal only" : " · not executable"}
              </p>
              <p className="mt-1 text-sm text-muted">{item.reason}</p>
              <p className="mt-1 text-sm text-muted">
                {item.resourceLabel ? `Recorded resource ${item.resourceLabel}. ` : "No eligible resource is recorded. "}
                Duration unknown. Availability unknown. No start or end.
              </p>
              {item.dependencyNote ? <p className="mt-1 text-sm text-muted">{item.dependencyNote}</p> : null}
            </li>
          ))}
        </ol>
      )}
      {schedule.conflicts.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No resource conflict is in this reading. Unknown duration is not being treated as a free hour.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {schedule.conflicts.slice(0, 4).map((conflict) => (
            <li key={`${conflict.recordType}:${conflict.recordId}`} className="border-t border-line pt-3">
              <p className="text-sm">Resource conflict</p>
              <p className="mt-1 text-sm text-muted">{conflict.reason}</p>
            </li>
          ))}
        </ul>
      )}
      {schedule.events.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No schedule change is stored.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {schedule.events.slice(0, 5).map((event) => (
            <li key={event.id} className="border-t border-line pt-3 text-sm text-muted">{event.summary}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="quiet" disabled={busy || !owner || !schedule.proposed} onClick={onAccept}>Accept proposed schedule</Button>
        <Button type="button" variant="quiet" disabled={busy || !owner || !schedule.proposed} onClick={() => onCancel("proposed")}>Cancel proposed</Button>
        <Button type="button" variant="quiet" disabled={busy || !owner || !schedule.accepted} onClick={() => onCancel("accepted")}>Cancel accepted</Button>
      </div>
    </section>
  );
}
