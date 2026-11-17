import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PayCard, RunTokenNote } from "@/components/company-notes";
import { Shell, useReadySession } from "@/components/shell";
import { Alert, Button, controlClass, when } from "@/components/nexus-ui";
import { agentBySlug, ASSIGNMENT_LABEL, CHECK_OWNER, dollarsToCents, formatMoney, MISSION_LABEL, MISSION_PATH, reworkFrom } from "@/lib/nexus/company";
import type { MissionView } from "@/lib/nexus/company-store";
import { companyCommand } from "@/lib/nexus/company-api";
import { errorText, useCompany } from "@/lib/nexus/use-company";

export const Route = createFileRoute("/missions/$missionId")({ component: MissionPage });

function MissionPage() {
  const { missionId } = Route.useParams();
  const { user, pending } = useReadySession();
  if (pending) return <Shell><p className="py-8 text-sm text-muted">Checking session</p></Shell>;
  if (!user) {
    return (
      <Shell>
        <p className="py-8 text-sm">
          <Link to="/login" className="text-accent">Sign in</Link> to open this mission.
        </p>
      </Shell>
    );
  }
  return (
    <Shell>
      <MissionBody missionId={missionId} />
    </Shell>
  );
}

function MissionBody({ missionId }: { missionId: string }) {
  const { data, error, loading, reload } = useCompany<MissionView>("mission", missionId);
  const [busy, setBusy] = useState<string | null>(null);
  const [stepLabel, setStepLabel] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  async function depend(value: string) {
    setBusy("depend");
    setFormError(null);
    try {
      await companyCommand({ data: { type: "depend", missionId, dependsOn: value } });
      reload();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function classify(value: string) {
    setBusy("classification");
    setFormError(null);
    try {
      await companyCommand({ data: { type: "classification", missionId, classification: value } });
      reload();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function parent(value: string) {
    setBusy("parent");
    setFormError(null);
    try {
      await companyCommand({ data: { type: "parent", missionId, parentId: value } });
      reload();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function priority(value: string) {
    setBusy("priority");
    setFormError(null);
    try {
      await companyCommand({ data: { type: "priority", missionId, priority: value } });
      reload();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function act(type: string) {
    setBusy(type);
    setFormError(null);
    try {
      await companyCommand({ data: { type, missionId, note } });
      setNote("");
      reload();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function walk() {
    for (let step = 0; step < 8; step += 1) {
      const result = await companyCommand({ data: { type: "run", missionId } });
      if (result && "agent" in result) setStepLabel(result.agent);
      if (result && "stopped" in result && result.stopped) break;
      reload();
    }
  }

  async function runCompany() {
    setBusy("company");
    setFormError(null);
    try {
      await walk();
      reload();
    } catch (err) {
      setFormError(errorText(err));
      reload();
    } finally {
      setBusy(null);
      setStepLabel(null);
    }
  }

  async function fixAndRetest() {
    setBusy("fix");
    setFormError(null);
    setStepLabel("engineering");
    try {
      const result = await companyCommand({ data: { type: "rework", missionId } });
      if (result && "agent" in result && typeof result.agent === "string") setStepLabel(result.agent);
      await walk();
      reload();
    } catch (err) {
      setFormError(errorText(err));
      reload();
    } finally {
      setBusy(null);
      setStepLabel(null);
    }
  }

  if (loading && !data) return <p className="py-8 text-sm text-muted">Opening the mission</p>;
  if (!data) {
    return (
      <div className="py-8">
        <Alert>{error ?? "This mission did not load."}</Alert>
        <button type="button" className="mt-3 text-sm text-accent" onClick={reload}>Retry</button>
      </div>
    );
  }

  const mission = data.mission;
  const status = mission.status;
  const running = data.assignments.some((row) => row.status === "RUNNING");
  const failed = data.assignments.find((row) => row.status === "FAILED");
  const next = data.assignments.find((row) => row.status !== "DONE");
  const slice = workingSlice(data.assignments.find((row) => row.agent === "developer")?.artifact ?? "");
  const redo = reworkFrom(
    data.defects.map((item) => item.name),
    data.assignments.filter((row) => row.status === "FAILED").map((row) => row.agent),
  );
  const redoName = agentBySlug(redo)?.name ?? "the department";
  const terminal = status === "REJECTED" || status === "CANCELLED" ? status : null;

  return (
    <div className="py-6">
      <p className="font-mono text-xs text-muted">Mission</p>
      <h1 className="mt-1 text-2xl font-medium">{mission.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{mission.objective}</p>
      {data.memory.length > 0 ? (
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Verified memory the company will use: {data.memory.join(" · ")}
        </p>
      ) : null}
      <ol className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {MISSION_PATH.map((step) => {
          const reached = status === "REJECTED" ? MISSION_PATH.indexOf("AWAITING_ACCEPTANCE") : MISSION_PATH.indexOf(status);
          const here = step === status;
          const done = !here && reached >= MISSION_PATH.indexOf(step);
          const tone = here ? "border-accent text-accent" : done ? "border-line text-fg" : "border-line text-muted";
          return (
            <li key={step} className={`shrink-0 border-b-2 pb-1 font-mono text-xs ${tone}`} aria-current={here ? "step" : undefined}>
              {MISSION_LABEL[step]}
            </li>
          );
        })}
        {terminal ? (
          <li className="shrink-0 border-b-2 border-danger pb-1 font-mono text-xs text-danger" aria-current="step">
            {MISSION_LABEL[terminal]}
          </li>
        ) : null}
      </ol>
      {status === "ACCEPTED" ? <p className="mt-3 text-sm">Accepted. The packet is on the record.</p> : null}
      {status === "REJECTED" ? (
        <p className="mt-3 text-sm text-muted">Rejected, after the packet was offered. Rewrite the strategy if the plan was wrong. Reset departments if you want the same plan to run again from the start.</p>
      ) : null}
      {status === "CANCELLED" ? (
        <p className="mt-3 text-sm text-muted">Cancelled. Departments that had not finished are closed. This does not delete the record.</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {status === "PROPOSED" || status === "PLANNED" || status === "REJECTED" ? (
          <Button disabled={busy !== null} onClick={() => void act("plan")}>
            {busy === "plan" ? "Planning…" : status === "PROPOSED" ? "Develop the strategy" : "Rewrite the strategy"}
          </Button>
        ) : null}
        {status === "PLANNED" ? (
          <Button disabled={busy !== null} onClick={() => void act("authorize")}>
            {busy === "authorize" ? "Authorizing…" : "Authorize execution"}
          </Button>
        ) : null}
        {status === "AUTHORIZED" || status === "EXECUTING" ? (
          <>
            {!failed && next ? (
              <Button disabled={busy !== null || running} onClick={() => void runCompany()}>
                {busy === "company" ? `Running ${stepLabel ?? "the company"}…` : "Run the company"}
              </Button>
            ) : null}
            <Button variant="quiet" disabled={busy !== null || running || !next} onClick={() => void act("run")}>
              {busy === "run" ? "Running…" : next ? `Run ${next.agentName}` : "Nothing left to run"}
            </Button>
          </>
        ) : null}
        {running ? (
          <Button disabled={busy !== null} onClick={() => void act("recover")}>
            {busy === "recover" ? "Recovering…" : "Recover stuck run"}
          </Button>
        ) : null}
        {failed ? (
          <Button disabled={busy !== null || running} onClick={() => void fixAndRetest()}>
            {busy === "fix" ? `Retesting ${stepLabel ?? redoName}…` : `Fix and retest · ${redoName}`}
          </Button>
        ) : null}
        {status === "AWAITING_ACCEPTANCE" ? (
          <Button variant="quiet" disabled={busy !== null} onClick={() => void act("rework")}>
            {busy === "rework" ? "Sending back…" : `Send back to ${redoName}`}
          </Button>
        ) : null}
        {status !== "ACCEPTED" && status !== "CANCELLED" ? (
          <Button variant="quiet" disabled={busy !== null} onClick={() => void act("cancel")}>
            Cancel
          </Button>
        ) : null}
        {status === "REJECTED" ? (
          <Button variant="quiet" disabled={busy !== null} onClick={() => void act("reopen")}>
            {busy === "reopen" ? "Resetting…" : "Reset departments"}
          </Button>
        ) : null}
      </div>
      {formError ? <div className="mt-3"><Alert>{formError}</Alert></div> : null}
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}

      <section className="mt-8 max-w-2xl">
        <h2 className="text-sm font-medium">How this run is locked</h2>
        <div className="mt-2">
          <RunTokenNote />
        </div>
      </section>

      {mission.questions.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Questions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            {mission.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {status === "PROPOSED" || status === "PLANNED" || status === "REJECTED" ? (
        <section className="mt-8 max-w-xl">
          <h2 className="text-sm font-medium">Depends on</h2>
          <p className="mt-2 text-sm text-muted">Execution will not start until that mission is accepted. None means this mission stands alone.</p>
          <select
            value={mission.dependsOn ?? ""}
            disabled={busy !== null || data.peers.length === 0}
            onChange={(event) => void depend(event.target.value)}
            className="mt-3 h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            <option value="">No dependency</option>
            {data.peers.map((peer) => (
              <option key={peer.id} value={peer.id}>{peer.title} · {peer.status}</option>
            ))}
          </select>
        </section>
      ) : mission.dependsOn ? (
        <p className="mt-6 text-sm text-muted">
          Depends on {data.peers.find((peer) => peer.id === mission.dependsOn)?.title ?? "another mission"}.
        </p>
      ) : null}

      {status === "PROPOSED" || status === "PLANNED" || status === "REJECTED" ? (
        <section className="mt-8 max-w-xl">
          <h2 className="text-sm font-medium">Classification</h2>
          <p className="mt-2 text-sm text-muted">Confidential work is never sent to a public model, even when public disclosure is on. Internal work may be, and only then.</p>
          <select
            value={mission.classification}
            disabled={busy !== null}
            onChange={(event) => void classify(event.target.value)}
            className="mt-3 h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            <option value="internal">Internal</option>
            <option value="confidential">Confidential</option>
          </select>
        </section>
      ) : (
        <p className="mt-6 text-sm text-muted">Classification: {mission.classification}.</p>
      )}

      {status === "PROPOSED" || status === "PLANNED" || status === "REJECTED" ? (
        <section className="mt-8 max-w-xl">
          <h2 className="text-sm font-medium">Parent objective</h2>
          <p className="mt-2 text-sm text-muted">This does not start the mission. The parent cannot be accepted while this work is still open.</p>
          <select
            value={mission.parentId ?? ""}
            disabled={busy !== null}
            onChange={(event) => void parent(event.target.value)}
            className="mt-3 h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            <option value="">No parent</option>
            {data.peers.map((peer) => (
              <option key={peer.id} value={peer.id}>{peer.title} · {peer.status}</option>
            ))}
          </select>
        </section>
      ) : mission.parentId ? (
        <p className="mt-6 text-sm text-muted">Parent: {data.peers.find((peer) => peer.id === mission.parentId)?.title ?? "another mission"}.</p>
      ) : null}

      {status !== "ACCEPTED" && status !== "CANCELLED" ? (
        <section className="mt-8 max-w-xl">
          <h2 className="text-sm font-medium">Priority</h2>
          <p className="mt-2 text-sm text-muted">Higher numbers are scheduled first. This does not authorize the mission.</p>
          <select
            value={String(mission.priority)}
            disabled={busy !== null}
            onChange={(event) => void priority(event.target.value)}
            className="mt-3 h-11 w-full rounded-md border border-line bg-bg px-3 text-sm"
          >
            {[10, 30, 50, 70, 90].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </section>
      ) : (
        <p className="mt-6 text-sm text-muted">Priority {mission.priority}.</p>
      )}

      <Milestone missionId={missionId} milestone={mission.milestone} busy={busy !== null} onDone={reload} onError={setFormError} />
      <Specification missionId={missionId} busy={busy !== null} onDone={reload} onError={setFormError} />

      {data.findings.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Findings</h2>
          <ul className="mt-3 space-y-3">
            {data.findings.map((finding) => (
              <li key={finding.id}>
                <p className="text-sm">{finding.title}</p>
                <p className="mt-1 text-sm text-muted">{finding.evidence}</p>
                <p className="mt-1 font-mono text-xs text-muted">{finding.severity} · {finding.confidence}{finding.ownerRequired ? " · owner" : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.handoffs.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Handoffs</h2>
          <ul className="mt-3 space-y-4">
            {data.handoffs.map((handoff) => (
              <li key={handoff.id} className="border-t border-line pt-3">
                <p className="text-sm">{handoff.fromDepartment} → {handoff.toDepartment}</p>
                <p className="mt-1 text-sm text-muted">Completed: {handoff.completed || "Nothing stored."}</p>
                <p className="mt-1 text-sm text-muted">Still required: {handoff.outstanding}</p>
                <p className="mt-1 text-sm text-muted">Criteria: {handoff.criteria}</p>
                {handoff.risks ? <p className="mt-1 text-sm text-muted">Risks: {handoff.risks}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {status === "PROPOSED" || status === "PLANNED" || status === "REJECTED" ? (
        <AnswerForm
          key={`${mission.id}:${mission.answers}`}
          initial={mission.answers}
          disabled={busy !== null}
          saving={busy === "answer"}
          onSave={async (text) => {
            setBusy("answer");
            setFormError(null);
            try {
              await companyCommand({ data: { type: "answer", missionId, note: text } });
              reload();
            } catch (err) {
              setFormError(errorText(err));
            } finally {
              setBusy(null);
            }
          }}
        />
      ) : mission.answers ? (
        <section className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium">Owner's answer</h2>
          <p className="mt-2 text-sm text-muted">{mission.answers}</p>
        </section>
      ) : null}

      {mission.strategy ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Strategy</h2>
          <p className="mt-1 font-mono text-xs text-muted">{mission.planSource || "unspecified source"}</p>
          <pre className="mt-3 max-w-2xl whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted">{mission.strategy}</pre>
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted">No plan yet. Developing the strategy is one call to GPT-OSS 20B, and nothing runs until you authorize it.</p>
      )}

      {slice ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Working slice</h2>
          <p className="mt-1 text-sm text-muted">The implementation, running in a sandbox. It cannot reach the rest of NEXUS.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="quiet" onClick={() => downloadSlice(slice, mission.title)}>Download the slice</Button>
            <Button variant="quiet" onClick={() => downloadPacket(mission.title, mission.objective, data.assignments)}>Download the packet</Button>
          </div>
          <iframe title="Working slice" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={slice} className="mt-3 h-80 w-full border border-line bg-bg" />
        </section>
      ) : null}

      {!slice && data.assignments.some((row) => row.artifact.trim()) ? (
        <div className="mt-8">
          <Button variant="quiet" onClick={() => downloadPacket(mission.title, mission.objective, data.assignments)}>
            Download the packet
          </Button>
        </div>
      ) : null}

      {data.jobs.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Execution</h2>
          <ul className="mt-2 space-y-1">
            {data.jobs.map((job, index) => (
              <li key={`${job.updatedAt}-${index}`} className="text-sm">
                <span className="font-mono text-xs">{job.status}</span>
                <span className="text-muted"> · attempt {job.attempt}</span>
                {job.lastError ? <span className="mt-0.5 block text-muted">{job.lastError}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.qa ? (
        <section className="mt-8 max-w-2xl">
          <h2 className="text-sm font-medium">Independent verification</h2>
          <p className="mt-1 font-mono text-xs text-muted">{data.qa.status} · {data.qa.suite || "nexus-qa"} · {data.qa.sha256.slice(0, 16)}</p>
          <p className="mt-2 text-sm text-muted">{data.qa.detail}</p>
          {data.qa.current ? null : (
            <p className="mt-2 text-sm text-danger">This report does not cover the implementation that is stored now. A later edit does not keep the old pass.</p>
          )}
          <ul className="mt-3 space-y-1">
            {data.qa.tests.map((item) => (
              <li key={item.name} className={`font-mono text-xs ${item.passed ? "text-accent" : "text-danger"}`}>
                {item.passed ? "pass" : "fail"} · {item.name}. {item.detail}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {data.defects.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Open defects</h2>
          <p className="mt-1 text-sm text-muted">Quality failed these checks. They stay open until a later verification passes.</p>
          <ul className="mt-3 space-y-2">
            {data.defects.map((defect) => {
              const owner = CHECK_OWNER[defect.name];
              const ownerName = owner ? (agentBySlug(owner)?.name ?? owner) : "the company";
              return (
              <li key={defect.id} className="text-sm">
                <span className="font-mono text-xs text-danger">{defect.name}</span>
                <span className="mt-1 block text-muted">{defect.detail}</span>
                <span className="mt-1 block text-xs text-muted">Owned by {ownerName}</span>
              </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {data.assignments.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Departments</h2>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {data.assignments.map((row) => (
              <li key={row.id} className="py-3">
                <button type="button" className="flex w-full items-baseline justify-between gap-3 text-left" onClick={() => setOpen(open === row.id ? null : row.id)}>
                  <span>
                    <span className="block text-sm">{row.agentName}</span>
                    <span className="text-xs text-muted">{row.title}</span>
                  </span>
                  <span className={`font-mono text-xs ${row.status === "FAILED" ? "text-danger" : row.status === "DONE" ? "text-accent" : "text-muted"}`}>
                    {ASSIGNMENT_LABEL[row.status]}
                  </span>
                </button>
                {open === row.id ? (
                  <div className="mt-3">
                    <p className="text-sm text-muted">{row.brief}</p>
                    {row.model && row.status !== "RUNNING" ? <p className="mt-2 font-mono text-xs text-muted">{row.model}</p> : null}
                    {row.error ? <p className="mt-2 text-sm text-danger">{row.error}</p> : null}
                    {row.evidence.length > 0 ? (
                      <ul className="mt-3 space-y-1">
                        {row.evidence.map((item) => (
                          <li key={item.name} className={`font-mono text-xs ${item.passed ? "text-accent" : "text-danger"}`}>
                            {item.passed ? "pass" : "fail"} · {item.name}. {item.detail}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {row.artifact ? (
                      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap border border-line bg-surface p-3 font-mono text-xs leading-relaxed">{row.artifact}</pre>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {status === "AWAITING_ACCEPTANCE" ? (
        <section className="mt-8 max-w-xl">
          <h2 className="text-sm font-medium">Owner acceptance</h2>
          <p className="mt-2 text-sm text-muted">Quality already published a result. Accepting does not ask an agent for permission.</p>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note for the record" className="mt-3 min-h-20 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={busy !== null} onClick={() => void act("accept")}>Accept the packet</Button>
            <Button variant="danger" disabled={busy !== null || note.trim().length < 4} onClick={() => void act("reject")}>Reject</Button>
          </div>
        </section>
      ) : null}

      {status === "AWAITING_ACCEPTANCE" || status === "ACCEPTED" || data.payments.length > 0 || (status !== "PROPOSED" && status !== "CANCELLED") ? (
        <MissionLedger missionId={mission.id} rows={data.payments} poster={status === "AWAITING_ACCEPTANCE" || status === "ACCEPTED"} onChange={reload} />
      ) : null}

      <TaskLinks missionId={mission.id} links={data.taskLinks} onChange={reload} />

      {data.audit.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium">Record</h2>
          <ul className="mt-2 space-y-2">
            {data.audit.map((event) => (
              <li key={event.id} className="text-sm">
                <span className="font-mono text-xs text-muted">{when(event.createdAt)}</span>{" "}
                <span className="font-mono text-xs">{event.action}</span>
                {event.toState ? <span className="text-muted"> → {event.toState}</span> : null}
                {event.detail ? <span className="mt-0.5 block text-muted">{event.detail}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TaskLinks({
  missionId,
  links,
  onChange,
}: {
  missionId: string;
  links: MissionView["taskLinks"];
  onChange: () => void;
}) {
  const [taskId, setTaskId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(type: "link-task" | "unlink-task", id: string) {
    setBusy(true);
    setError(null);
    try {
      await companyCommand({ data: { type, missionId, note: id } });
      setTaskId("");
      onChange();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 max-w-xl">
      <h2 className="text-sm font-medium">Task link</h2>
      <p className="mt-2 text-sm text-muted">The owner can point this mission at an existing task. The link does not start either one, and removing it does not delete either record.</p>
      {links.length === 0 ? <p className="mt-3 text-sm text-muted">No task is linked.</p> : (
        <ul className="mt-3 space-y-2">
          {links.map((link) => (
            <li key={link.taskId} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{link.projectName} · {link.objective}</span>
                <span className="font-mono text-xs text-muted">{link.state} · {link.taskId}</span>
              </span>
              <Button variant="quiet" disabled={busy} onClick={() => void send("unlink-task", link.taskId)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
      <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void send("link-task", taskId.trim()); }}>
        <input value={taskId} onChange={(event) => setTaskId(event.target.value)} placeholder="Existing task id" className={controlClass} />
        <Button disabled={busy || taskId.trim().length < 4}>Link</Button>
      </form>
      {error ? <div className="mt-3"><Alert>{error}</Alert></div> : null}
    </section>
  );
}

function MissionLedger({
  missionId,
  rows,
  poster,
  onChange,
}: {
  missionId: string;
  rows: Array<{ id: string; payer: string; amountCents: number; note: string; voidedAt: string | null; createdAt: string; direction?: string }>;
  poster: boolean;
  onChange: () => void;
}) {
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cents = dollarsToCents(amount);
  const active = rows.filter((row) => !row.voidedAt && row.direction !== "expenditure");
  const total = active.reduce((sum, row) => sum + row.amountCents, 0);

  async function record(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await companyCommand({ data: { type: "record-payment", missionId, payer, amount, note: payNote } });
      setPayer("");
      setAmount("");
      setPayNote("");
      onChange();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function voidRow(id: string) {
    if (voiding !== id) {
      setVoiding(id);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await companyCommand({ data: { type: "void-payment", paymentId: id } });
      setVoiding(null);
      onChange();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 max-w-xl">
      <PayCard poster={poster} recordedCents={total} recordedLabel="On this mission" />
      <form onSubmit={(event) => void record(event)} className="mt-4 space-y-2">
        <p className="text-sm text-muted">Record money that already arrived for this mission. A receipt does not consume the spending ceiling. NEXUS does not collect it.</p>
        <input value={payer} onChange={(event) => setPayer(event.target.value)} placeholder="Who paid" className={`${controlClass} h-11`} />
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Amount, 25.00" className={`${controlClass} h-11`} />
        <input value={payNote} onChange={(event) => setPayNote(event.target.value)} placeholder="Note" className={`${controlClass} h-11`} />
        {error ? <Alert>{error}</Alert> : null}
        <Button type="submit" disabled={busy || payer.trim().length < 2 || cents == null}>
          {busy ? "Recording…" : "Record on this mission"}
        </Button>
      </form>
      {rows.length > 0 ? (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {rows.map((row) => (
            <li key={row.id} className="py-3 text-sm">
              <span className={row.voidedAt ? "text-muted line-through" : ""}>{row.payer}</span>
              <span className="float-right font-mono tabular-nums">{formatMoney(row.amountCents)}</span>
              <span className="mt-1 block text-xs text-muted">{row.voidedAt ? `Voided ${when(row.voidedAt)}` : when(row.createdAt)}{row.note ? ` · ${row.note}` : ""}</span>
              {row.voidedAt ? null : (
                <button type="button" className="mt-1 inline-flex h-11 items-center text-sm text-danger" disabled={busy} onClick={() => void voidRow(row.id)}>
                  {voiding === row.id ? "Confirm void" : "Void this record"}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function AnswerForm({
  initial,
  disabled,
  saving,
  onSave,
}: {
  initial: string;
  disabled: boolean;
  saving: boolean;
  onSave: (text: string) => Promise<void>;
}) {
  const [answer, setAnswer] = useState(initial);
  return (
    <section className="mt-8 max-w-xl">
      <h2 className="text-sm font-medium">Your answer</h2>
      <p className="mt-2 text-sm text-muted">
        The next plan and every department read this. Saving it does not authorize the work.
      </p>
      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Who it is for, and what you will accept"
        className="mt-3 min-h-20 w-full rounded-md border border-line bg-bg px-3 py-2 text-sm"
      />
      <Button className="mt-3" disabled={disabled || answer.trim().length < 4} onClick={() => void onSave(answer)}>
        {saving ? "Saving…" : "Save the answer"}
      </Button>
    </section>
  );
}

function downloadPacket(
  title: string,
  objective: string,
  assignments: Array<{ agentName: string; status: string; artifact: string }>,
) {
  const body = [
    `# ${title}`,
    objective,
    ...assignments
      .filter((row) => row.artifact.trim())
      .map((row) => `## ${row.agentName} · ${row.status}\n\n${row.artifact.trim()}`),
  ].join("\n\n");
  const blob = new Blob([body], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFile(title)}.md`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadSlice(html: string, title: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFile(title)}.html`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function safeFile(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 48) || "packet";
}

function workingSlice(artifact: string): string | null {
  const fenced = artifact.match(/```html\s*([\s\S]*?)```/i);
  if (fenced?.[1]?.includes("<")) return fenced[1].trim();
  const loose = artifact.match(/```\s*(<!doctype html[\s\S]*?)```/i);
  if (loose?.[1]) return loose[1].trim();
  if (/^<!doctype html/i.test(artifact.trim())) return artifact.trim();
  return null;
}

function Milestone({
  missionId,
  milestone,
  busy,
  onDone,
  onError,
}: {
  missionId: string;
  milestone: string;
  busy: boolean;
  onDone: () => void;
  onError: (message: string | null) => void;
}) {
  const [text, setText] = useState(milestone);
  async function save(event: FormEvent) {
    event.preventDefault();
    onError(null);
    try {
      await companyCommand({ data: { type: "milestone", missionId, note: text } });
      onDone();
    } catch (err) {
      onError(errorText(err));
    }
  }
  return (
    <form onSubmit={(event) => void save(event)} className="mt-8 max-w-xl">
      <h2 className="text-sm font-medium">Milestone</h2>
      <p className="mt-2 text-sm text-muted">A completion mark you write. It is not calculated.</p>
      <input value={text} onChange={(event) => setText(event.target.value)} className={`${controlClass} mt-3`} placeholder="Invoices can be drafted from a job" />
      <Button type="submit" variant="quiet" className="mt-3" disabled={busy}>{milestone ? milestone : "Save milestone"}</Button>
    </form>
  );
}

function Specification({
  missionId,
  busy,
  onDone,
  onError,
}: {
  missionId: string;
  busy: boolean;
  onDone: () => void;
  onError: (message: string | null) => void;
}) {
  const [body, setBody] = useState("");
  const [budget, setBudget] = useState("");
  async function send(type: string, extra: { objective?: string; amount?: string } = {}) {
    onError(null);
    try {
      await companyCommand({ data: { type, missionId, ...extra } });
      if (type === "propose-spec") setBody("");
      onDone();
    } catch (err) {
      onError(errorText(err));
    }
  }
  return (
    <section className="mt-8 max-w-xl">
      <h2 className="text-sm font-medium">Specification</h2>
      <p className="mt-2 text-sm text-muted">A new version is filed beside the accepted one. Accepting it does not accept the mission, and it does not reopen work that the change does not touch.</p>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} className={`${controlClass} mt-3 min-h-28 py-3`} placeholder="Invoices are drafted from a recorded job." />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="quiet" disabled={busy || body.trim().length < 8} onClick={() => void send("propose-spec", { objective: body })}>File a new version</Button>
        <Button type="button" variant="quiet" disabled={busy} onClick={() => void send("accept-spec")}>Accept this version</Button>
        <Button type="button" variant="quiet" disabled={busy} onClick={() => void send("revalidate")}>Authorize the affected review</Button>
      </div>
      <label className="mt-4 block text-sm">
        Mission budget
        <input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" placeholder="40.00" className={`${controlClass} mt-1 h-11`} />
      </label>
      <Button type="button" variant="quiet" className="mt-2" disabled={busy || dollarsToCents(budget) == null} onClick={() => void send("mission-budget", { amount: budget })}>Set mission budget</Button>
    </section>
  );
}
