import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Shell, useReadySession } from "@/components/shell";
import { Alert, Button, Field, controlClass } from "@/components/nexus-ui";
import { DEPARTMENTS, formatMoney } from "@/lib/nexus/company";
import { businessCommand } from "@/lib/nexus/business-api";
import type { BusinessView, ObligationRecord } from "@/lib/nexus/venture";
import { STAGES, STRUCTURES } from "@/lib/nexus/venture";
import { errorText, useCompany } from "@/lib/nexus/use-company";

export const Route = createFileRoute("/business")({ component: BusinessPage });

const TABS = ["Record", "Formation", "Finance", "Sales", "Product", "Market", "Operations", "People"] as const;
const STAGE_LABEL: Record<string, string> = {
  concept: "Concept",
  viability: "Viability",
  formation: "Formation",
  capitalization: "Capital",
  build: "Build",
  launch: "Launch",
  operating: "Operating",
  closed: "Closed",
};
const STRUCTURE_LABEL: Record<string, string> = {
  undecided: "Undecided",
  sole_proprietorship: "Sole proprietorship",
  partnership: "Partnership",
  llc: "LLC",
  corporation: "Corporation",
};
const DOMAIN_LABEL: Record<string, string> = {
  formation: "Formation",
  governance: "Governance",
  finance: "Finance",
  product: "Product",
  market: "Market",
  operations: "Operations",
  people: "People",
  quality: "Launch authority",
};

function BusinessPage() {
  const { user, pending } = useReadySession();
  return (
    <Shell>
      {pending ? <p className="py-8 text-sm text-muted">Checking session</p> : user ? <Desk /> : (
        <p className="py-8 text-sm"><Link to="/login" className="text-accent">Sign in</Link> to open the business record.</p>
      )}
    </Shell>
  );
}

function Desk() {
  const { data, error, loading, reload } = useCompany<BusinessView>("business");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Record");
  const [formError, setFormError] = useState<string | null>(null);
  if (loading && !data) return <p className="py-8 text-sm text-muted">Loading the business record</p>;
  if (!data) {
    return (
      <div className="py-8">
        <Alert>{error ?? "The business record did not load."}</Alert>
        <button type="button" className="mt-3 text-sm text-accent" onClick={reload}>Retry</button>
      </div>
    );
  }
  return (
    <div className="py-6">
      <p className="font-mono text-xs text-muted">One company. One record.</p>
      <h1 className="mt-1 text-2xl font-medium">{data.venture?.name ?? "Business"}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        NEXUS prepares and records. It does not give legal advice, file with a government, move a bank account, publish, or bind the company. Restricted actions stay with a person.
      </p>
      {formError ? <div className="mt-3"><Alert>{formError}</Alert></div> : null}
      {data.venture ? (
        <>
          <div className="-mx-4 mt-6 flex gap-1 overflow-x-auto px-4">
            {TABS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-sm ${tab === item ? "border-accent text-fg" : "border-transparent text-muted"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-6">
            {tab === "Record" ? <RecordTab data={data} reload={reload} onError={setFormError} /> : null}
            {tab === "Formation" ? <FormationTab data={data} reload={reload} onError={setFormError} /> : null}
            {tab === "Finance" ? <FinanceTab data={data} reload={reload} onError={setFormError} /> : null}
            {tab === "Sales" ? <SalesTab data={data} reload={reload} onError={setFormError} /> : null}
            {tab === "Product" ? <ProductTab data={data} reload={reload} onError={setFormError} /> : null}
            {tab === "Market" ? <MarketTab data={data} reload={reload} onError={setFormError} /> : null}
            {tab === "Operations" ? <OperationsTab data={data} reload={reload} onError={setFormError} /> : null}
            {tab === "People" ? <PeopleTab data={data} reload={reload} onError={setFormError} /> : null}
          </div>
        </>
      ) : (
        <OpenForm reload={reload} onError={setFormError} />
      )}
      {error ? <button type="button" className="mt-6 text-sm text-danger" onClick={reload}>{error} Retry</button> : null}
    </div>
  );
}

function OpenForm({ reload, onError }: { reload: () => void; onError: (message: string | null) => void }) {
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [structure, setStructure] = useState("undecided");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError(null);
    try {
      await businessCommand({ data: { type: "open", name, idea, kind: structure } });
      reload();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="mt-8 max-w-xl space-y-3">
      <Field label="Business name">
        <input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} h-11`} />
      </Field>
      <Field label="Idea">
        <textarea value={idea} onChange={(event) => setIdea(event.target.value)} className={`${controlClass} min-h-28 py-3`} placeholder="Who it is for, and what it will sell." />
      </Field>
      <Field label="Structure to research">
        <select value={structure} onChange={(event) => setStructure(event.target.value)} className={`${controlClass} h-11`}>
          {STRUCTURES.map((item) => <option key={item} value={item}>{STRUCTURE_LABEL[item]}</option>)}
        </select>
      </Field>
      <p className="text-sm text-muted">Opening the record coordinates formation, money, product, market, operations, and people. It does not register the business, and it does not rename this workspace.</p>
      <Button type="submit" disabled={busy || name.trim().length < 2 || idea.trim().length < 8}>{busy ? "Opening…" : "Open the business record"}</Button>
    </form>
  );
}

function RecordTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const venture = data.venture;
  const [stage, setStage] = useState(venture?.stage ?? "concept");
  const [structure, setStructure] = useState(venture?.structure ?? "undecided");
  const [burn, setBurn] = useState(venture?.monthlyBurnCents ? (venture.monthlyBurnCents / 100).toFixed(2) : "");
  const [launchNote, setLaunchNote] = useState("");
  const [selected, setSelected] = useState(data.obligations[0]?.id ?? "");
  if (!venture) return null;
  const obligation = data.obligations.find((item) => item.id === selected) ?? null;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <p className="text-sm text-muted">{venture.idea}</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={(event) => event.preventDefault()}>
          <Field label="Stage">
            <select value={stage} onChange={(event) => setStage(event.target.value as typeof venture.stage)} className={`${controlClass} h-11`}>
              {STAGES.map((item) => <option key={item} value={item}>{STAGE_LABEL[item]}</option>)}
            </select>
          </Field>
          <Field label="Structure">
            <select value={structure} onChange={(event) => setStructure(event.target.value as typeof venture.structure)} className={`${controlClass} h-11`}>
              {STRUCTURES.map((item) => <option key={item} value={item}>{STRUCTURE_LABEL[item]}</option>)}
            </select>
          </Field>
          <Field label="Monthly burn">
            <input value={burn} onChange={(event) => setBurn(event.target.value)} inputMode="decimal" placeholder="2500.00" className={`${controlClass} h-11`} />
          </Field>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <Quiet onError={onError} onDone={reload} label="Save stage" run={() => businessCommand({ data: { type: "stage", note: stage } })} />
          <Quiet onError={onError} onDone={reload} label="Save structure" run={() => businessCommand({ data: { type: "structure", kind: structure } })} />
          <Quiet onError={onError} onDone={reload} label="Save burn" run={() => businessCommand({ data: { type: "burn", amount: burn } })} />
        </div>
        <p className="mt-3 text-sm text-muted">
          Outstanding {venture.outstanding}. Fulfilled {venture.fulfilled}. Waived {venture.waived}.
          {venture.launchAuthorized
            ? " A person recorded launch authorization. NEXUS did not verify it."
            : " No human launch authorization."}
          {venture.ready ? " Launch readiness is recorded." : " Launch is not ready."}
          {venture.operating ? " The record is operating." : " The record is not operating."}
          A waiver does not authorize launch. A finished mission does not either.
        </p>
        {venture.launchAuthorized ? (
          <p className="mt-2 text-sm text-muted">{venture.launchEvidence}</p>
        ) : (
          <div className="mt-3 max-w-xl space-y-3">
            <Field label="How you authorized launch">
              <textarea value={launchNote} onChange={(event) => setLaunchNote(event.target.value)} className={`${controlClass} min-h-20 py-3`} />
            </Field>
            <Quiet onError={onError} onDone={reload} label="Record that I authorized launch" run={() => businessCommand({ data: { type: "authorize-launch", objective: launchNote } })} />
          </div>
        )}
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {data.obligations.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => setSelected(item.id)} className="flex min-h-11 w-full items-start justify-between gap-3 py-3 text-left">
                <span>
                  <span className="block text-sm">{item.title}</span>
                  <span className="font-mono text-xs text-muted">{DOMAIN_LABEL[item.domain]} · {autonomyLabel(item.autonomy)} · {item.state === "authorized" ? "staffed" : item.state === "satisfied" ? "fulfilled" : item.state === "open" ? "outstanding" : item.state}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        {obligation ? <ObligationPanel item={obligation} reload={reload} onError={onError} /> : null}
      </div>
      <Statement data={data} />
    </div>
  );
}

function autonomyLabel(value: string): string {
  if (value === "restricted") return "person";
  if (value === "authorized") return "owner may staff";
  return "research";
}

function ObligationPanel({ item, reload, onError }: { item: ObligationRecord; reload: () => void; onError: (message: string | null) => void }) {
  const [text, setText] = useState(item.detail || item.evidence || "");
  return (
    <div className="mt-4 border border-line bg-surface p-4">
      <p className="text-sm">{item.title}</p>
      {item.missionId ? (
        <p className="mt-2 text-sm"><Link to="/missions/$missionId" params={{ missionId: item.missionId }} className="text-accent">Proposed mission</Link>. It is not authorized to execute.</p>
      ) : null}
      {item.evidence ? <p className="mt-2 text-sm text-muted">{item.evidence}</p> : null}
      {item.state === "satisfied" || item.state === "waived" || item.state === "authorized" ? null : (
        <>
          <textarea value={text} onChange={(event) => setText(event.target.value)} className={`${controlClass} mt-3 min-h-24 py-3`} placeholder={item.autonomy === "restricted" ? "What a person did, and where." : "What was prepared."} />
          <div className="mt-3 flex flex-wrap gap-2">
            {item.autonomy === "restricted" ? (
              <Quiet onError={onError} onDone={reload} label="Record outside action" run={() => businessCommand({ data: { type: "record", recordId: item.id, objective: text } })} />
            ) : (
              <>
                <Quiet onError={onError} onDone={reload} label="Save preparation" run={() => businessCommand({ data: { type: "prepare", recordId: item.id, objective: text } })} />
                <Quiet onError={onError} onDone={reload} label="Staff a mission" run={() => businessCommand({ data: { type: "staff", recordId: item.id } })} />
              </>
            )}
            <Quiet onError={onError} onDone={reload} label="Waive" run={() => businessCommand({ data: { type: "waive", recordId: item.id, objective: text } })} />
          </div>
        </>
      )}
    </div>
  );
}

function Statement({ data }: { data: BusinessView }) {
  const row = data.statement;
  const lines = [
    ["Received", formatMoney(row.receivedCents)],
    ["Spent", formatMoney(row.spentCents)],
    ["Recorded margin", formatMoney(row.recordedMarginCents)],
    ["Runway", row.runwayMonths == null ? "Set a burn" : `${row.runwayMonths} mo`],
    ["Planned costs", formatMoney(row.plannedCostCents)],
    ["Funding marked", formatMoney(row.fundingMarkedReceivedCents)],
    ["Receivable", formatMoney(row.receivableCents)],
    ["Payable", formatMoney(row.payableCents)],
    ["Claims posted", row.journalClaimsCents == null ? "Unavailable" : formatMoney(row.journalClaimsCents)],
    ["Obligations posted", row.journalObligationsCents == null ? "Unavailable" : formatMoney(row.journalObligationsCents)],
  ];
  return (
    <aside>
      <h2 className="text-sm font-medium">Recorded position</h2>
      <dl className="mt-3 divide-y divide-line border-y border-line">
        {lines.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="font-mono text-sm tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">{row.note}</p>
    </aside>
  );
}

function FormationTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const [kind, setKind] = useState("license");
  const [jurisdiction, setJurisdiction] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [docKind, setDocKind] = useState("nda");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-sm font-medium">Filings to track</h2>
        <p className="mt-2 text-sm text-muted">A row is a reminder. Recording that you filed it does not mean NEXUS submitted it.</p>
        <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
          <Field label="Kind">
            <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${controlClass} h-11`}>
              {["name", "dba", "ein", "license", "permit", "trademark", "tax", "insurance", "other"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Jurisdiction"><input value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Deadline"><input value={deadline} onChange={(event) => setDeadline(event.target.value)} placeholder="2026-04-15" className={`${controlClass} h-11`} /></Field>
          <Field label="Note"><input value={note} onChange={(event) => setNote(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Quiet onError={onError} onDone={reload} label="Add filing" run={() => businessCommand({ data: { type: "filing", kind, jurisdiction, deadline, note } })} />
        </form>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {data.filings.length === 0 ? <li className="py-3 text-sm text-muted">None yet.</li> : data.filings.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <p>{item.kind} · {item.status}{item.jurisdiction ? ` · ${item.jurisdiction}` : ""}{item.deadline ? ` · ${item.deadline}` : ""}</p>
              {item.note ? <p className="mt-1 text-muted">{item.note}</p> : null}
              {item.status === "owner_recorded" ? null : (
                <RecordLine onError={onError} onDone={reload} placeholder="I filed this with…" type="record-filing" id={item.id} />
              )}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-sm font-medium">Drafts</h2>
        <p className="mt-2 text-sm text-muted">Approving a draft is not a signature and not legal advice.</p>
        <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
          <Field label="Kind">
            <select value={docKind} onChange={(event) => setDocKind(event.target.value)} className={`${controlClass} h-11`}>
              {["operating_agreement", "nda", "contract", "terms", "privacy", "other"].map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Draft"><textarea value={body} onChange={(event) => setBody(event.target.value)} className={`${controlClass} min-h-28 py-3`} /></Field>
          <Quiet onError={onError} onDone={reload} label="Save draft" run={() => businessCommand({ data: { type: "instrument", kind: docKind, name: title, objective: body } })} />
        </form>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {data.instruments.length === 0 ? <li className="py-3 text-sm text-muted">None yet.</li> : data.instruments.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <p>{item.title} · {item.kind.replaceAll("_", " ")} · {item.status === "owner_approved" ? "draft approved" : "draft"}</p>
              {item.body ? <p className="mt-1 line-clamp-3 text-muted">{item.body}</p> : null}
              {item.status === "draft" ? <div className="mt-2"><Quiet onError={onError} onDone={reload} label="Approve draft" run={() => businessCommand({ data: { type: "approve-instrument", recordId: item.id } })} /></div> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function FinanceTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const [kind, setKind] = useState("cost");
  const [funding, setFunding] = useState("loan");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState("receivable");
  const [partyId, setPartyId] = useState("");
  const [title, setTitle] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [alloc, setAlloc] = useState("");
  const parties = data.parties.filter((party) => party.status === "active");
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-10">
        <section>
          <h2 className="text-sm font-medium">Capital plan</h2>
          <p className="mt-2 text-sm text-muted">A cost is a plan. Funding marked received is not cash until you record a receipt on Payments.</p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <Field label="Kind">
              <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${controlClass} h-11`}>
                <option value="cost">Startup cost</option>
                <option value="funding">Funding</option>
              </select>
            </Field>
            {kind === "funding" ? (
              <Field label="Source">
                <select value={funding} onChange={(event) => setFunding(event.target.value)} className={`${controlClass} h-11`}>
                  <option value="loan">Loan</option>
                  <option value="investment">Investment</option>
                  <option value="grant">Grant</option>
                </select>
              </Field>
            ) : null}
            <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} h-11`} /></Field>
            <Field label="Amount"><input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" className={`${controlClass} h-11`} /></Field>
          </form>
          <div className="mt-3"><Quiet onError={onError} onDone={reload} label="Add to the plan" run={() => businessCommand({ data: { type: "capital", kind, name, amount, note: funding } })} /></div>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {data.capital.length === 0 ? <li className="py-3 text-sm text-muted">No plan lines.</li> : data.capital.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span>{item.name} · {item.kind}{item.fundingKind ? ` · ${item.fundingKind}` : ""} · {item.status}</span>
                <span className="font-mono tabular-nums">{formatMoney(item.amountCents)}</span>
                {item.kind === "funding" && item.status !== "received" ? (
                  <Quiet onError={onError} onDone={reload} label="Mark received" run={() => businessCommand({ data: { type: "capital-status", recordId: item.id, kind: "received" } })} />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-sm font-medium">Invoices</h2>
          <p className="mt-2 text-sm text-muted">Issuing an invoice assigns the next number and posts a claim. It does not collect or pay it. Voiding keeps the row and the payment. A second open invoice on the same order is refused.</p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
            <Field label="Direction">
              <select value={direction} onChange={(event) => setDirection(event.target.value)} className={`${controlClass} h-11`}>
                <option value="receivable">Customer owes</option>
                <option value="payable">We owe a supplier</option>
              </select>
            </Field>
            <Field label="Party">
              <select value={partyId} onChange={(event) => setPartyId(event.target.value)} className={`${controlClass} h-11`}>
                <option value="">Choose</option>
                {parties.map((party) => <option key={party.id} value={party.id}>{party.displayName}</option>)}
              </select>
            </Field>
            <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={`${controlClass} h-11`} /></Field>
            <Field label="Amount"><input value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} inputMode="decimal" className={`${controlClass} h-11`} /></Field>
          </form>
          <div className="mt-3"><Quiet onError={onError} onDone={reload} label="Draft invoice" run={() => businessCommand({ data: { type: "invoice", kind: direction, partyId, name: title, amount: invoiceAmount } })} /></div>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {data.invoices.length === 0 ? <li className="py-3 text-sm text-muted">No invoices. Add the customer or supplier on Payments first.</li> : data.invoices.map((item) => (
              <li key={item.id} className="py-3 text-sm">
                <p>{item.number ? `${item.number} · ` : ""}{item.title} · {item.partyName} · {item.status}</p>
                <p className="font-mono text-xs text-muted tabular-nums">{formatMoney(item.allocatedCents)} of {formatMoney(item.amountCents)}</p>
                {item.status === "issued" && !item.posted ? <p className="text-xs text-muted">Not posted. This claim is unavailable, not zero.</p> : null}
                {item.status === "draft" || item.status === "issued" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.status === "draft" ? <Quiet onError={onError} onDone={reload} label="Issue" run={() => businessCommand({ data: { type: "issue-invoice", recordId: item.id } })} /> : null}
                    <Quiet onError={onError} onDone={reload} label="Void" run={() => businessCommand({ data: { type: "void-invoice", recordId: item.id } })} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={(event) => event.preventDefault()}>
            <Field label="Issued invoice">
              <select value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} className={`${controlClass} h-11`}>
                <option value="">Choose</option>
                {data.invoices.filter((item) => item.status === "issued").map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </Field>
            <Field label="Open payment">
              <select value={paymentId} onChange={(event) => setPaymentId(event.target.value)} className={`${controlClass} h-11`}>
                <option value="">Choose</option>
                {data.payments.map((item) => <option key={item.id} value={item.id}>{item.direction} {item.payer} {formatMoney(item.amountCents - item.allocatedCents)}</option>)}
              </select>
            </Field>
            <Field label="Allocate"><input value={alloc} onChange={(event) => setAlloc(event.target.value)} inputMode="decimal" className={`${controlClass} h-11`} /></Field>
          </form>
          <div className="mt-3"><Quiet onError={onError} onDone={reload} label="Allocate" run={() => businessCommand({ data: { type: "allocate", recordId: invoiceId, paymentId, amount: alloc } })} /></div>
        </section>
        <section>
          <h2 className="text-sm font-medium">Journal</h2>
          <p className="mt-2 text-sm text-muted">Posted only from an invoice issue, allocation, or void. A line cannot be typed in, and a posted row cannot be edited. This is not a bank balance.</p>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {data.journal.length === 0 ? <li className="py-3 text-sm text-muted">No posted entries. A missing posting is not shown as zero.</li> : data.journal.map((entry) => (
              <li key={entry.id} className="py-3 text-sm">
                <p>{entry.sourceType === "invoice.issued" ? "Issued" : entry.sourceType === "invoice.allocated" ? "Allocated" : "Voided"}</p>
                <ul className="mt-1 text-muted">
                  {entry.lines.map((line) => (
                    <li key={`${entry.id}-${line.code}`} className="font-mono text-xs tabular-nums">
                      {line.code} {line.name} · {line.debitCents > 0 ? `Dr ${formatMoney(line.debitCents)}` : `Cr ${formatMoney(line.creditCents)}`}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Statement data={data} />
    </div>
  );
}

function SalesTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const customers = data.parties.filter((party) => party.status === "active" && party.roles.some((role) => role.role === "customer" && role.status === "active"));
  const activeOffers = data.offers.filter((offer) => offer.status === "active");
  const [partyId, setPartyId] = useState(customers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [offerId, setOfferId] = useState(activeOffers[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [missionId, setMissionId] = useState("");
  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h2 className="text-sm font-medium">Quotes</h2>
        <p className="mt-2 text-sm text-muted">A quote goes to a customer. Issuing it does not create an order. Accepting it does not take payment or authorize a mission.</p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <Field label="Customer">
            <select value={partyId} onChange={(event) => setPartyId(event.target.value)} className={`${controlClass} h-11`}>
              <option value="">Choose</option>
              {customers.map((party) => <option key={party.id} value={party.id}>{party.displayName}</option>)}
            </select>
          </Field>
          <Field label="Note"><input value={note} onChange={(event) => setNote(event.target.value)} className={`${controlClass} h-11`} /></Field>
        </form>
        <div className="mt-3"><Quiet onError={onError} onDone={reload} label="Draft quote" run={() => businessCommand({ data: { type: "quote", partyId, note } })} /></div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {data.quotes.length === 0 ? <li className="py-3 text-sm text-muted">No quotes. A customer role is required.</li> : data.quotes.map((quote) => (
            <li key={quote.id} className="py-3 text-sm">
              <p>{quote.partyName} · {quote.status} · {formatMoney(quote.totalCents)}</p>
              {quote.note ? <p className="text-muted">{quote.note}</p> : null}
              <ul className="mt-1 text-muted">
                {quote.lines.map((line) => <li key={line.id}>{line.quantity} {line.offerName} · {formatMoney(line.amountCents)} total</li>)}
              </ul>
              {quote.status === "draft" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Quiet onError={onError} onDone={reload} label="Add selected offer" run={() => businessCommand({ data: { type: "quote-line", recordId: quote.id, offerId, quantity, amount: price } })} />
                  <Quiet onError={onError} onDone={reload} label="Issue quote" run={() => businessCommand({ data: { type: "issue-quote", recordId: quote.id } })} />
                </div>
              ) : (
                <div className="mt-2"><Quiet onError={onError} onDone={reload} label="Accept into an order" run={() => businessCommand({ data: { type: "accept-quote", recordId: quote.id } })} /></div>
              )}
            </li>
          ))}
        </ul>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={(event) => event.preventDefault()}>
          <Field label="Offer for the next line">
            <select value={offerId} onChange={(event) => setOfferId(event.target.value)} className={`${controlClass} h-11`}>
              <option value="">Choose</option>
              {activeOffers.map((offer) => <option key={offer.id} value={offer.id}>{offer.name}</option>)}
            </select>
          </Field>
          <Field label="Quantity"><input value={quantity} onChange={(event) => setQuantity(event.target.value)} inputMode="numeric" className={`${controlClass} h-11`} /></Field>
          <Field label="Unit price, optional"><input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="Uses the offer" className={`${controlClass} h-11`} /></Field>
        </form>
      </section>
      <section>
        <h2 className="text-sm font-medium">Orders</h2>
        <p className="mt-2 text-sm text-muted">Cancelling an order leaves its lines and does not cancel a linked mission. An invoice is still not a receipt.</p>
        <Field label="Mission to link">
          <select value={missionId} onChange={(event) => setMissionId(event.target.value)} className={`${controlClass} mt-2 h-11`}>
            <option value="">Choose</option>
            {data.missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.title}</option>)}
          </select>
        </Field>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {data.orders.length === 0 ? <li className="py-3 text-sm text-muted">No orders.</li> : data.orders.map((order) => (
            <li key={order.id} className="py-3 text-sm">
              <p>{order.partyName} · {order.status} · {formatMoney(order.totalCents)}{order.invoiceNumber ? ` · ${order.invoiceNumber}` : ""}</p>
              {order.note ? <p className="text-muted">{order.note}</p> : null}
              {order.missionIds.length > 0 ? <p className="text-muted">{order.missionIds.length} linked mission{order.missionIds.length === 1 ? "" : "s"}, still not authorized by this link.</p> : null}
              {order.status === "accepted" || (order.status === "fulfilled" && !order.invoiceNumber) ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {order.status === "accepted" ? <Quiet onError={onError} onDone={reload} label="Link mission" run={() => businessCommand({ data: { type: "link-order", recordId: order.id, missionId } })} /> : null}
                  {!order.invoiceNumber ? <Quiet onError={onError} onDone={reload} label="Invoice" run={() => businessCommand({ data: { type: "invoice-order", recordId: order.id } })} /> : null}
                  {order.status === "accepted" ? <Quiet onError={onError} onDone={reload} label="Mark fulfilled" run={() => businessCommand({ data: { type: "fulfill-order", recordId: order.id } })} /> : null}
                  {order.status === "accepted" ? <Quiet onError={onError} onDone={reload} label="Cancel" run={() => businessCommand({ data: { type: "cancel-order", recordId: order.id } })} /> : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ProductTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const [offerId, setOfferId] = useState("");
  const [problem, setProblem] = useState("");
  const [requirements, setRequirements] = useState("");
  const [value, setValue] = useState("");
  const [cost, setCost] = useState("");
  const [stockOffer, setStockOffer] = useState("");
  const [onHand, setOnHand] = useState("");
  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h2 className="text-sm font-medium">Product brief</h2>
        <p className="mt-2 text-sm text-muted">Price stays on the offer. Cost here is not a charge. Counting stock does not record a sale.</p>
        <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
          <Field label="Offer">
            <select value={offerId} onChange={(event) => setOfferId(event.target.value)} className={`${controlClass} h-11`}>
              <option value="">No offer yet</option>
              {data.offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.name} · {formatMoney(offer.priceCents)}</option>)}
            </select>
          </Field>
          <Field label="Problem"><input value={problem} onChange={(event) => setProblem(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Requirements"><textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} className={`${controlClass} min-h-20 py-3`} /></Field>
          <Field label="Value"><input value={value} onChange={(event) => setValue(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Cost"><input value={cost} onChange={(event) => setCost(event.target.value)} inputMode="decimal" className={`${controlClass} h-11`} /></Field>
          <Quiet onError={onError} onDone={reload} label="Save brief" run={() => businessCommand({ data: { type: "brief", offerId, name: problem, objective: requirements, note: value, amount: cost } })} />
        </form>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {data.briefs.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <p>{item.problem}</p>
              <p className="text-muted">{item.offerName || "No offer"}{item.costCents ? ` · cost ${formatMoney(item.costCents)}` : ""}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-sm font-medium">Stock count</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <Field label="Offer">
            <select value={stockOffer} onChange={(event) => setStockOffer(event.target.value)} className={`${controlClass} h-11`}>
              <option value="">Choose</option>
              {data.offers.map((offer) => <option key={offer.id} value={offer.id}>{offer.name}</option>)}
            </select>
          </Field>
          <Field label="On hand"><input value={onHand} onChange={(event) => setOnHand(event.target.value)} inputMode="numeric" className={`${controlClass} h-11`} /></Field>
        </form>
        <div className="mt-3"><Quiet onError={onError} onDone={reload} label="Save count" run={() => businessCommand({ data: { type: "stock", offerId: stockOffer, amount: onHand } })} /></div>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {data.stock.map((item) => <li key={item.offerId} className="py-3 text-sm">{item.offerName} · {item.onHand} on hand</li>)}
        </ul>
      </section>
    </div>
  );
}

function MarketTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const [kind, setKind] = useState("segment");
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [campaign, setCampaign] = useState("");
  const [segment, setSegment] = useState("");
  const [channel, setChannel] = useState("");
  const [budget, setBudget] = useState("");
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-sm font-medium">Market notes</h2>
        <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
          <Field label="Kind">
            <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${controlClass} h-11`}>
              <option value="segment">Segment</option>
              <option value="competitor">Competitor</option>
              <option value="channel">Channel</option>
            </select>
          </Field>
          <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Detail"><textarea value={detail} onChange={(event) => setDetail(event.target.value)} className={`${controlClass} min-h-20 py-3`} /></Field>
          <Quiet onError={onError} onDone={reload} label="Add note" run={() => businessCommand({ data: { type: "market-note", kind, name, objective: detail } })} />
        </form>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {data.notes.map((item) => <li key={item.id} className="py-3 text-sm">{item.kind} · {item.name}<span className="mt-1 block text-muted">{item.detail}</span></li>)}
        </ul>
      </section>
      <section>
        <h2 className="text-sm font-medium">Campaigns</h2>
        <p className="mt-2 text-sm text-muted">Authorizing a campaign does not publish it and does not spend the budget.</p>
        <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
          <Field label="Name"><input value={campaign} onChange={(event) => setCampaign(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Segment"><input value={segment} onChange={(event) => setSegment(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Channel"><input value={channel} onChange={(event) => setChannel(event.target.value)} className={`${controlClass} h-11`} /></Field>
          <Field label="Budget"><input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" className={`${controlClass} h-11`} /></Field>
          <Quiet onError={onError} onDone={reload} label="Draft campaign" run={() => businessCommand({ data: { type: "campaign", name: campaign, note: segment, kind: channel, amount: budget } })} />
        </form>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {data.campaigns.map((item) => (
            <li key={item.id} className="py-3 text-sm">
              <p>{item.name} · {item.status} · {formatMoney(item.budgetCents)}</p>
              <p className="text-muted">{item.segment} {item.channel}</p>
              {item.status === "draft" ? <div className="mt-2"><Quiet onError={onError} onDone={reload} label="Authorize preparation" run={() => businessCommand({ data: { type: "authorize-campaign", recordId: item.id } })} /></div> : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function OperationsTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [trigger, setTrigger] = useState("");
  const [inputs, setInputs] = useState("");
  const [actions, setActions] = useState("");
  const [outputs, setOutputs] = useState("");
  const [exceptions, setExceptions] = useState("");
  const [verification, setVerification] = useState("");
  return (
    <div className="max-w-2xl">
      <h2 className="text-sm font-medium">Procedures</h2>
      <p className="mt-2 text-sm text-muted">An active procedure can open a proposed mission. It does not run by itself, and it cannot take a restricted action.</p>
      <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
        <Field label="Name"><input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Field label="Owner"><input value={owner} onChange={(event) => setOwner(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Field label="Trigger"><input value={trigger} onChange={(event) => setTrigger(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Field label="Inputs"><input value={inputs} onChange={(event) => setInputs(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Field label="Actions"><textarea value={actions} onChange={(event) => setActions(event.target.value)} className={`${controlClass} min-h-20 py-3`} /></Field>
        <Field label="Outputs"><input value={outputs} onChange={(event) => setOutputs(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Field label="Exceptions"><input value={exceptions} onChange={(event) => setExceptions(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Field label="Verification"><input value={verification} onChange={(event) => setVerification(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Quiet onError={onError} onDone={reload} label="Save procedure" run={() => businessCommand({ data: { type: "procedure", name, owner, trigger, inputs, actions, outputs, exceptions, verification } })} />
      </form>
      <ul className="mt-6 divide-y divide-line border-y border-line">
        {data.procedures.map((item) => (
          <li key={item.id} className="py-3 text-sm">
            <p>{item.name} · {item.status} · {item.ownerLabel}</p>
            <p className="text-muted">When {item.trigger}. Check: {item.verification}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.status === "draft" ? <Quiet onError={onError} onDone={reload} label="Activate" run={() => businessCommand({ data: { type: "activate-procedure", recordId: item.id } })} /> : null}
              {item.status === "active" && !item.missionId ? <Quiet onError={onError} onDone={reload} label="Open a mission" run={() => businessCommand({ data: { type: "run-procedure", recordId: item.id } })} /> : null}
              {item.missionId ? <Link to="/missions/$missionId" params={{ missionId: item.missionId }} className="inline-flex h-11 items-center text-accent">Mission</Link> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PeopleTab({ data, reload, onError }: { data: BusinessView; reload: () => void; onError: (message: string | null) => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("employee");
  const [department, setDepartment] = useState("");
  const [reportsTo, setReportsTo] = useState("");
  const [positionId, setPositionId] = useState("");
  const [partyId, setPartyId] = useState("");
  return (
    <div className="max-w-2xl">
      <h2 className="text-sm font-medium">Positions</h2>
      <p className="mt-2 text-sm text-muted">Employees and contractors are parties. Agents stay on the workforce and cannot hold a position. This is not payroll.</p>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <Field label="Title"><input value={title} onChange={(event) => setTitle(event.target.value)} className={`${controlClass} h-11`} /></Field>
        <Field label="Kind">
          <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${controlClass} h-11`}>
            <option value="employee">Employee</option>
            <option value="contractor">Contractor</option>
          </select>
        </Field>
        <Field label="Department">
          <select value={department} onChange={(event) => setDepartment(event.target.value)} className={`${controlClass} h-11`}>
            <option value="">None</option>
            {DEPARTMENTS.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </Field>
        <Field label="Reports to"><input value={reportsTo} onChange={(event) => setReportsTo(event.target.value)} className={`${controlClass} h-11`} /></Field>
      </form>
      <div className="mt-3"><Quiet onError={onError} onDone={reload} label="Add position" run={() => businessCommand({ data: { type: "position", name: title, kind, department, reportsTo } })} /></div>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {data.positions.map((item) => <li key={item.id} className="py-3 text-sm">{item.title} · {item.kind}{item.reportsTo ? ` · reports to ${item.reportsTo}` : ""}</li>)}
      </ul>
      <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <Field label="Position">
          <select value={positionId} onChange={(event) => setPositionId(event.target.value)} className={`${controlClass} h-11`}>
            <option value="">Choose</option>
            {data.positions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </Field>
        <Field label="Party">
          <select value={partyId} onChange={(event) => setPartyId(event.target.value)} className={`${controlClass} h-11`}>
            <option value="">Choose</option>
            {data.parties.filter((party) => party.status === "active").map((party) => <option key={party.id} value={party.id}>{party.displayName}</option>)}
          </select>
        </Field>
      </form>
      <div className="mt-3"><Quiet onError={onError} onDone={reload} label="Engage" run={() => businessCommand({ data: { type: "engage", recordId: positionId, partyId } })} /></div>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {data.engagements.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span>{item.partyName} · {item.status}</span>
            {item.status === "ended" ? null : <Quiet onError={onError} onDone={reload} label="End" run={() => businessCommand({ data: { type: "end-engagement", recordId: item.id } })} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecordLine({ type, id, placeholder, onDone, onError }: { type: string; id: string; placeholder: string; onDone: () => void; onError: (message: string | null) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="mt-2 flex gap-2">
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className={`${controlClass} h-11`} />
      <Quiet onError={onError} onDone={onDone} label="Record" run={() => businessCommand({ data: { type, recordId: id, objective: value } })} />
    </div>
  );
}

function Quiet({ label, run, onDone, onError }: { label: string; run: () => Promise<unknown>; onDone: () => void; onError: (message: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="quiet"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        onError(null);
        void run().then(() => onDone()).catch((err: unknown) => onError(errorText(err))).finally(() => setBusy(false));
      }}
    >
      {busy ? "Saving…" : label}
    </Button>
  );
}
