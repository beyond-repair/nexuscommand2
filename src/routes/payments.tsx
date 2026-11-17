import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PayCard } from "@/components/company-notes";
import { Shell, useReadySession } from "@/components/shell";
import { Alert, Button, controlClass, when } from "@/components/nexus-ui";
import { DEPARTMENTS, formatMoney, dollarsToCents } from "@/lib/nexus/company";
import { companyCommand } from "@/lib/nexus/company-api";
import type { PaymentsView } from "@/lib/nexus/company-store";
import type { OfferRecord, PartyRecord } from "@/lib/nexus/books";
import { errorText, useCompany } from "@/lib/nexus/use-company";

export const Route = createFileRoute("/payments")({ component: PaymentsPage });

function PaymentsPage() {
  const { user, pending } = useReadySession();
  return (
    <Shell>
      {pending ? <p className="py-8 text-sm text-muted">Checking session</p> : user ? <Ledger /> : (
        <p className="py-8 text-sm"><Link to="/login" className="text-accent">Sign in</Link> to see payments.</p>
      )}
    </Shell>
  );
}

function Ledger() {
  const { data, error, loading, reload } = useCompany<PaymentsView>("payments");
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [missionId, setMissionId] = useState("");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const cents = dollarsToCents(amount);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await companyCommand({ data: { type: "record-payment", payer, amount, note, missionId, department } });
      setPayer("");
      setAmount("");
      setNote("");
      setMissionId("");
      setDepartment("");
      reload();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) return <p className="py-8 text-sm text-muted">Loading payments</p>;
  if (!data) {
    return (
      <div className="py-8">
        <Alert>{error ?? "Payments did not load."}</Alert>
        <button type="button" className="mt-3 text-sm text-accent" onClick={reload}>Retry</button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <h1 className="text-2xl font-medium">Payments</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          {data.destination.business} is paid at {data.destination.cashtag}. A receipt is money you write down after it arrives. It does not consume the spending ceiling, and it is not confirmation from Cash App.
        </p>
        <p className="mt-2 max-w-xl text-sm text-muted">
          An expenditure is money you write down as spent. It counts against the ceiling and any mission or department budget you name. Neither row moves a bank account.
        </p>
        <p className="mt-4 font-mono text-lg tabular-nums">Received {formatMoney(data.totalCents)} · Spent {formatMoney(data.finance.spentCents)}</p>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Reserved {formatMoney(data.finance.reservedCents)}. Estimates {formatMoney(data.finance.estimateCents)} are not charges.
          {data.finance.ceilingCents == null
            ? " No spending ceiling is set, so remaining budget is not shown."
            : ` Ceiling ${formatMoney(data.finance.ceilingCents)}. Remaining ${formatMoney(data.finance.remainingCents ?? 0)}.`}
        </p>
        <Ceiling busy={busy} onDone={reload} onError={setFormError} />
        <DepartmentBudget busy={busy} onDone={reload} onError={setFormError} />

        <form onSubmit={(event) => void submit(event)} className="mt-8 max-w-xl space-y-3">
          <label className="block text-sm">
            Who paid
            <input value={payer} onChange={(event) => setPayer(event.target.value)} className={`${controlClass} mt-1 h-11`} />
          </label>
          <label className="block text-sm">
            Amount
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="25.00" className={`${controlClass} mt-1 h-11`} />
          </label>
          {amount.trim() && cents == null ? <p className="text-sm text-danger">Use an amount like 25 or 25.00.</p> : null}
          <label className="block text-sm">
            Mission
            <select value={missionId} onChange={(event) => setMissionId(event.target.value)} className={`${controlClass} mt-1 h-11`}>
              <option value="">Not tied to a mission</option>
              {data.missions.map((mission) => (
                <option key={mission.id} value={mission.id}>{mission.title}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Department
            <select value={department} onChange={(event) => setDepartment(event.target.value)} className={`${controlClass} mt-1 h-11`}>
              <option value="">Company ceiling only</option>
              {DEPARTMENTS.map((item) => (
                <option key={item.slug} value={item.slug}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Note
            <input value={note} onChange={(event) => setNote(event.target.value)} className={`${controlClass} mt-1 h-11`} />
          </label>
          {formError ? <Alert>{formError}</Alert> : null}
          <Button type="submit" disabled={busy || payer.trim().length < 2 || cents == null}>
            {busy ? "Recording…" : cents ? `Record receipt ${formatMoney(cents)}` : "Record the receipt"}
          </Button>
        </form>
        <ExpenditureForm missions={data.missions} onDone={reload} onError={setFormError} />

        {data.rows.length === 0 ? (
          <p className="mt-8 text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {data.rows.map((row) => (
              <li key={row.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-sm ${row.voidedAt ? "text-muted line-through" : ""}`}>{row.payer}</span>
                  <span className="font-mono text-sm tabular-nums">{formatMoney(row.amountCents)}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {row.voidedAt ? "Voided · " : ""}{row.direction === "expenditure" ? "Expenditure" : "Receipt"} · {row.method} {row.destination} · {when(row.createdAt)}
                </p>
                {row.missionId && row.missionTitle ? (
                  <p className="mt-1 text-sm">
                    <Link to="/missions/$missionId" params={{ missionId: row.missionId }} className="text-accent">
                      {row.missionTitle}
                    </Link>
                  </p>
                ) : null}
                {row.note ? <p className="mt-1 text-sm text-muted">{row.note}</p> : null}
                {row.voidedAt ? (
                  <p className="mt-1 text-xs text-muted">Voided {when(row.voidedAt)}. The row stays. This is not a refund.</p>
                ) : (
                  <button
                    type="button"
                    className="mt-2 inline-flex h-11 items-center text-sm text-danger"
                    disabled={busy}
                    onClick={() => {
                      if (voiding !== row.id) {
                        setVoiding(row.id);
                        return;
                      }
                      setBusy(true);
                      setFormError(null);
                      void companyCommand({ data: { type: "void-payment", paymentId: row.id } })
                        .then(() => {
                          setVoiding(null);
                          reload();
                        })
                        .catch((err: unknown) => setFormError(errorText(err)))
                        .finally(() => setBusy(false));
                    }}
                  >
                    {voiding === row.id ? "Confirm void" : "Void this record"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {error ? (
          <button type="button" className="mt-4 text-sm text-danger" onClick={reload}>
            {error} Retry
          </button>
        ) : null}
        <Parties parties={data.parties} onDone={reload} onError={setFormError} />
        <Offers offers={data.offers} onDone={reload} onError={setFormError} />
      </div>
      <PayCard poster />
    </div>
  );
}

function Ceiling({ busy, onDone, onError }: { busy: boolean; onDone: () => void; onError: (message: string | null) => void }) {
  const [amount, setAmount] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    onError(null);
    try {
      await companyCommand({ data: { type: "ceiling", amount } });
      setAmount("");
      onDone();
    } catch (err) {
      onError(errorText(err));
    }
  }
  return (
    <form onSubmit={(event) => void save(event)} className="mt-4 max-w-sm">
      <label className="block text-sm">
        Spending ceiling
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="100.00" className={`${controlClass} mt-1 h-11`} />
      </label>
      <Button type="submit" variant="quiet" className="mt-2" disabled={busy || dollarsToCents(amount) == null}>Set ceiling</Button>
      <p className="mt-2 text-sm text-muted">Only you can raise or lower this. It does not move money, and it does not change payments already recorded.</p>
    </form>
  );
}

function DepartmentBudget({ busy, onDone, onError }: { busy: boolean; onDone: () => void; onError: (message: string | null) => void }) {
  const [slug, setSlug] = useState(DEPARTMENTS[0]?.slug ?? "engineering");
  const [amount, setAmount] = useState("");
  async function save(event: FormEvent) {
    event.preventDefault();
    onError(null);
    try {
      await companyCommand({ data: { type: "department-budget", note: slug, amount } });
      setAmount("");
      onDone();
    } catch (err) {
      onError(errorText(err));
    }
  }
  return (
    <form onSubmit={(event) => void save(event)} className="mt-4 max-w-sm">
      <label className="block text-sm">
        Department allocation
        <select value={slug} onChange={(event) => setSlug(event.target.value)} className="mt-1 h-11 w-full rounded-md border border-line bg-bg px-3 text-sm">
          {DEPARTMENTS.map((department) => (
            <option key={department.slug} value={department.slug}>{department.name}</option>
          ))}
        </select>
      </label>
      <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="40.00" className={`${controlClass} mt-2 h-11`} />
      <Button type="submit" variant="quiet" className="mt-2" disabled={busy || dollarsToCents(amount) == null}>Set allocation</Button>
      <p className="mt-2 text-sm text-muted">Applies when an expenditure names that department. A receipt is not checked against it. A blank department is checked only against the company ceiling and the mission budget.</p>
    </form>
  );
}

const ROLES = ["customer", "supplier", "employee", "contractor"] as const;

function ExpenditureForm({
  missions,
  onDone,
  onError,
}: {
  missions: Array<{ id: string; title: string }>;
  onDone: () => void;
  onError: (message: string | null) => void;
}) {
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [missionId, setMissionId] = useState("");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);
  const cents = dollarsToCents(amount);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError(null);
    try {
      await companyCommand({ data: { type: "record-expenditure", payer, amount, note, missionId, department } });
      setPayer("");
      setAmount("");
      setNote("");
      setMissionId("");
      setDepartment("");
      onDone();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="mt-8 max-w-xl space-y-3 border-t border-line pt-8">
      <h2 className="text-sm font-medium">Expenditure</h2>
      <p className="text-sm text-muted">This counts against the ceiling. It does not send money.</p>
      <label className="block text-sm">
        Who was paid
        <input value={payer} onChange={(event) => setPayer(event.target.value)} className={`${controlClass} mt-1 h-11`} />
      </label>
      <label className="block text-sm">
        Amount
        <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="25.00" className={`${controlClass} mt-1 h-11`} />
      </label>
      <label className="block text-sm">
        Mission
        <select value={missionId} onChange={(event) => setMissionId(event.target.value)} className={`${controlClass} mt-1 h-11`}>
          <option value="">Not tied to a mission</option>
          {missions.map((mission) => (
            <option key={mission.id} value={mission.id}>{mission.title}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Department
        <select value={department} onChange={(event) => setDepartment(event.target.value)} className={`${controlClass} mt-1 h-11`}>
          <option value="">Company ceiling only</option>
          {DEPARTMENTS.map((item) => (
            <option key={item.slug} value={item.slug}>{item.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Note
        <input value={note} onChange={(event) => setNote(event.target.value)} className={`${controlClass} mt-1 h-11`} />
      </label>
      <Button type="submit" disabled={busy || payer.trim().length < 2 || cents == null}>
        {busy ? "Recording…" : cents ? `Record expenditure ${formatMoney(cents)}` : "Record the expenditure"}
      </Button>
    </form>
  );
}

function Parties({
  parties,
  onDone,
  onError,
}: {
  parties: PartyRecord[];
  onDone: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("person");
  const [busy, setBusy] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError(null);
    try {
      await companyCommand({ data: { type: "create-party", name, kind } });
      setName("");
      onDone();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-10 max-w-xl border-t border-line pt-8">
      <h2 className="text-sm font-medium">Parties</h2>
      <p className="mt-2 text-sm text-muted">A customer, supplier, employee, or contractor is a role on one party. Archiving keeps the contacts. It does not make a sale.</p>
      <form onSubmit={(event) => void create(event)} className="mt-4 space-y-3">
        <label className="block text-sm">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} mt-1 h-11`} />
        </label>
        <label className="block text-sm">
          Kind
          <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${controlClass} mt-1 h-11`}>
            <option value="person">Person</option>
            <option value="organization">Organization</option>
          </select>
        </label>
        <Button type="submit" disabled={busy || name.trim().length < 2}>Add party</Button>
      </form>
      {parties.length === 0 ? <p className="mt-4 text-sm text-muted">No parties yet.</p> : (
        <ul className="mt-4 space-y-6">
          {parties.map((party) => (
            <PartyCard key={party.id} party={party} busy={busy} onDone={onDone} onError={onError} />
          ))}
        </ul>
      )}
    </section>
  );
}

function PartyCard({
  party,
  busy,
  onDone,
  onError,
}: {
  party: PartyRecord;
  busy: boolean;
  onDone: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState(party.displayName);
  const [role, setRole] = useState<string>(ROLES[0]);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  async function run(data: { type: string; name?: string; role?: string; label?: string; value?: string }) {
    onError(null);
    try {
      await companyCommand({ data: { ...data, partyId: party.id } });
      onDone();
    } catch (err) {
      onError(errorText(err));
    }
  }
  return (
    <li className="border-t border-line pt-4">
      <p className="text-sm">{party.displayName} · {party.kind} · {party.status}</p>
      {party.status === "active" ? (
        <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); void run({ type: "edit-party", name }); }}>
          <input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} h-11`} />
          <Button type="submit" variant="quiet" disabled={busy || name.trim().length < 2}>Rename</Button>
        </form>
      ) : null}
      <ul className="mt-2 space-y-1 text-sm">
        {party.roles.length === 0 ? <li className="text-muted">No roles.</li> : party.roles.map((item) => (
          <li key={item.role} className="flex items-center justify-between gap-3">
            <span>{item.role} · {item.status}</span>
            <button
              type="button"
              className="inline-flex h-11 items-center text-accent"
              onClick={() => void run({ type: item.status === "active" ? "deactivate-role" : "reactivate-role", role: item.role })}
            >
              {item.status === "active" ? "Deactivate" : "Reactivate"}
            </button>
          </li>
        ))}
      </ul>
      {party.status === "active" ? (
        <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); void run({ type: "assign-role", role }); }}>
          <select value={role} onChange={(event) => setRole(event.target.value)} className={`${controlClass} h-11`}>
            {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button type="submit" variant="quiet">Assign</Button>
        </form>
      ) : null}
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {party.contacts.map((contact) => (
          <li key={contact.id}>{contact.label}: {contact.value}</li>
        ))}
      </ul>
      {party.status === "active" ? (
        <>
          <form className="mt-2 space-y-2" onSubmit={(event) => { event.preventDefault(); void run({ type: "add-contact", label, value }).then(() => { setLabel(""); setValue(""); }); }}>
            <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Label" className={`${controlClass} h-11`} />
            <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Value" className={`${controlClass} h-11`} />
            <Button type="submit" variant="quiet" disabled={label.trim().length < 2 || value.trim().length < 2}>Add contact</Button>
          </form>
          <button type="button" className="mt-2 inline-flex h-11 items-center text-sm text-danger" onClick={() => void run({ type: "archive-party" })}>
            Archive party
          </button>
        </>
      ) : <p className="mt-2 text-xs text-muted">Archived. Contacts stay. This party is not offered for new work.</p>}
    </li>
  );
}

function Offers({
  offers,
  onDone,
  onError,
}: {
  offers: OfferRecord[];
  onDone: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("service");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    onError(null);
    try {
      await companyCommand({ data: { type: "create-offer", name, kind, amount: price } });
      setName("");
      setPrice("");
      onDone();
    } catch (err) {
      onError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-10 max-w-xl border-t border-line pt-8">
      <h2 className="text-sm font-medium">Catalog</h2>
      <p className="mt-2 text-sm text-muted">A price is a recorded amount in cents. Publishing an offer does not charge anyone and does not move stock.</p>
      <form onSubmit={(event) => void create(event)} className="mt-4 space-y-3">
        <label className="block text-sm">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} mt-1 h-11`} />
        </label>
        <label className="block text-sm">
          Kind
          <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${controlClass} mt-1 h-11`}>
            <option value="service">Service</option>
            <option value="product">Product</option>
          </select>
        </label>
        <label className="block text-sm">
          Price
          <input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="25.00" className={`${controlClass} mt-1 h-11`} />
        </label>
        <Button type="submit" disabled={busy || name.trim().length < 2 || dollarsToCents(price) == null}>Publish offer</Button>
      </form>
      {offers.length === 0 ? <p className="mt-4 text-sm text-muted">No offers yet.</p> : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {offers.map((offer) => (
            <OfferRow key={offer.id} offer={offer} onDone={onDone} onError={onError} />
          ))}
        </ul>
      )}
    </section>
  );
}

function OfferRow({
  offer,
  onDone,
  onError,
}: {
  offer: OfferRecord;
  onDone: () => void;
  onError: (message: string | null) => void;
}) {
  const [name, setName] = useState(offer.name);
  const [price, setPrice] = useState((offer.priceCents / 100).toFixed(2));
  async function run(type: string) {
    onError(null);
    try {
      await companyCommand({ data: { type, offerId: offer.id, name, amount: price } });
      onDone();
    } catch (err) {
      onError(errorText(err));
    }
  }
  return (
    <li className="py-3 text-sm">
      <p>{offer.name} · {offer.kind} · {offer.status} · {formatMoney(offer.priceCents)}</p>
      {offer.status === "active" ? (
        <form className="mt-2 space-y-2" onSubmit={(event) => { event.preventDefault(); void run("edit-offer"); }}>
          <input value={name} onChange={(event) => setName(event.target.value)} className={`${controlClass} h-11`} />
          <input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" className={`${controlClass} h-11`} />
          <div className="flex gap-3">
            <Button type="submit" variant="quiet" disabled={name.trim().length < 2 || dollarsToCents(price) == null}>Save price</Button>
            <button type="button" className="inline-flex h-11 items-center text-danger" onClick={() => void run("retire-offer")}>Retire</button>
          </div>
        </form>
      ) : <p className="mt-1 text-xs text-muted">Retired. It cannot be added to a new order.</p>}
    </li>
  );
}
