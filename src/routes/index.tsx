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
