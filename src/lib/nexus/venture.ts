import { CompanyError, DEPARTMENTS, dollarsToCents, titleFrom } from "./company.ts";
import { listOffers, listParties, type OfferRecord, type PartyRecord } from "./books.ts";
import type { Sql } from "./company-store.ts";

export const STRUCTURES = ["undecided", "sole_proprietorship", "partnership", "llc", "corporation"] as const;
export const STAGES = ["concept", "viability", "formation", "capitalization", "build", "launch", "operating", "closed"] as const;
export const DOMAINS = ["formation", "governance", "finance", "product", "market", "operations", "people", "quality"] as const;

export type StructureName = (typeof STRUCTURES)[number];
export type StageName = (typeof STAGES)[number];
export type DomainName = (typeof DOMAINS)[number];
export type Autonomy = "prepare" | "authorized" | "restricted";

const LAUNCH: Array<{ domain: DomainName; autonomy: Autonomy; title: string }> = [
  { domain: "formation", autonomy: "prepare", title: "Compare entity structures against this idea. Research only. This is not legal advice." },
  { domain: "formation", autonomy: "prepare", title: "Research the name, DBA rules, and trademark conflicts." },
  { domain: "formation", autonomy: "prepare", title: "List federal, state, and local licenses and permits that may apply." },
  { domain: "formation", autonomy: "restricted", title: "EIN, registration, and government filings stay with a person. NEXUS does not submit them." },
  { domain: "governance", autonomy: "prepare", title: "Draft the operating agreement, NDA, terms, and privacy policy." },
  { domain: "governance", autonomy: "restricted", title: "Signing or binding the company stays with a person. A draft is not an agreement." },
  { domain: "finance", autonomy: "prepare", title: "Build the startup budget, funding list, and monthly burn." },
  { domain: "finance", autonomy: "restricted", title: "Bank accounts, disbursements, and tax filings stay with a person. A recorded number is not a transfer." },
  { domain: "product", autonomy: "prepare", title: "Write the problem, requirements, offer, price, and cost." },
  { domain: "market", autonomy: "prepare", title: "Name the customer, the competitors, and the first campaign." },
  { domain: "market", autonomy: "authorized", title: "Staff approved campaign work. Authorization is not publication and not ad spend." },
  { domain: "market", autonomy: "restricted", title: "Publishing and paying for acquisition stay with a person." },
  { domain: "operations", autonomy: "prepare", title: "Write the first procedure, with an owner, trigger, inputs, outputs, exceptions, and a check." },
  { domain: "people", autonomy: "prepare", title: "Define positions for employees and contractors. Agents are not staff." },
  { domain: "quality", autonomy: "restricted", title: "Gather launch evidence. Recording this item does not authorize launch, and an agent cannot." },
];

export type VentureRecord = {
  id: string;
  name: string;
  idea: string;
  structure: StructureName;
  stage: StageName;
  monthlyBurnCents: number | null;
  outstanding: number;
  fulfilled: number;
  waived: number;
  launchAuthorized: boolean;
  launchAuthorizedAt: string | null;
  launchEvidence: string;
  ready: boolean;
  operating: boolean;
};

export type ObligationRecord = {
  id: string;
  domain: DomainName;
  autonomy: Autonomy;
  state: "open" | "prepared" | "authorized" | "satisfied" | "waived";
  title: string;
  detail: string;
  evidence: string;
  missionId: string | null;
};

export type BusinessStatement = {
  receivedCents: number;
  spentCents: number;
  recordedMarginCents: number;
  burnCents: number | null;
  runwayMonths: number | null;
  plannedCostCents: number;
  fundingMarkedReceivedCents: number;
  receivableCents: number;
  payableCents: number;
  note: string;
};

export type BusinessView = {
  venture: VentureRecord | null;
  obligations: ObligationRecord[];
  filings: Array<{ id: string; kind: string; jurisdiction: string; status: string; deadline: string; note: string }>;
  instruments: Array<{ id: string; kind: string; title: string; body: string; status: string }>;
  capital: Array<{ id: string; kind: string; name: string; amountCents: number; fundingKind: string; status: string; note: string }>;
  invoices: Array<{ id: string; direction: string; partyId: string | null; partyName: string; title: string; amountCents: number; status: string; allocatedCents: number; number: string | null; orderId: string | null }>;
  quotes: Array<{ id: string; partyId: string; partyName: string; status: string; note: string; totalCents: number; lines: Array<{ id: string; offerName: string; quantity: number; amountCents: number }> }>;
  orders: Array<{ id: string; partyName: string; quoteId: string; status: string; note: string; totalCents: number; missionIds: string[]; invoiceNumber: string | null }>;
  missions: Array<{ id: string; title: string; status: string }>;
  payments: Array<{ id: string; payer: string; direction: string; amountCents: number; allocatedCents: number }>;
  briefs: Array<{ id: string; offerId: string | null; offerName: string; problem: string; requirements: string; valueProposition: string; costCents: number | null; feedback: string }>;
  campaigns: Array<{ id: string; name: string; segment: string; channel: string; status: string; budgetCents: number; note: string }>;
  notes: Array<{ id: string; kind: string; name: string; detail: string }>;
  procedures: Array<{ id: string; name: string; ownerLabel: string; trigger: string; inputs: string; actions: string; outputs: string; exceptions: string; verification: string; status: string; missionId: string | null }>;
  positions: Array<{ id: string; title: string; kind: string; department: string; reportsTo: string }>;
  engagements: Array<{ id: string; positionId: string; partyId: string; partyName: string; status: string }>;
  stock: Array<{ offerId: string; offerName: string; onHand: number; note: string }>;
  parties: PartyRecord[];
  offers: OfferRecord[];
  statement: BusinessStatement;
};

function nid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function isUnique(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("duplicate") || message.includes("23505") || message.toLowerCase().includes("unique");
}

function iso(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const text = String(value);
  return text || null;
}

function num(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function refuseAgent(actorId: string, action: string): void {
  if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}

function clean(value: string, min: number, max: number, label: string): string {
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length < min || text.length > max) throw new CompanyError(label);
  return text;
}

function structureOf(value: string): StructureName {
  if ((STRUCTURES as readonly string[]).includes(value)) return value as StructureName;
  throw new CompanyError("Choose a structure, or leave it undecided. This choice is research, not a filing.");
}

function stageOf(value: string): StageName {
  if ((STAGES as readonly string[]).includes(value)) return value as StageName;
  throw new CompanyError("That stage is not on the record.");
}

async function audit(sql: Sql, orgId: string, actorId: string, action: string, target: string, detail: string): Promise<void> {
  await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${"human"}, ${action}, ${target}, ${null}, ${null}, ${detail.slice(0, 500)}
  )`;
}

async function ventureId(sql: Sql, orgId: string): Promise<string> {
  const rows = await sql<{ id: string }>`select id from ventures where organization_id = ${orgId} limit 1`;
  if (!rows[0]) throw new CompanyError("Open the business record first.");
  return rows[0].id;
}

export async function ventureSummary(sql: Sql, orgId: string): Promise<{
  name: string | null;
  stage: string | null;
  openObligations: number;
  restrictedOpen: number;
}> {
  const rows = await sql<{ name: string; stage: string }>`select name, stage from ventures where organization_id = ${orgId} limit 1`;
  if (!rows[0]) return { name: null, stage: null, openObligations: 0, restrictedOpen: 0 };
  const counts = await sql<{ open: unknown; restricted: unknown }>`select
    count(*) filter (where state in ('open', 'prepared'))::int as open,
    count(*) filter (where autonomy = 'restricted' and state in ('open', 'prepared'))::int as restricted
    from obligations where organization_id = ${orgId}`;
  return {
    name: rows[0].name,
    stage: rows[0].stage,
    openObligations: num(counts[0]?.open),
    restrictedOpen: num(counts[0]?.restricted),
  };
}

export async function openVenture(
  sql: Sql,
  input: { orgId: string; actorId: string; name: string; idea: string; structure: string },
): Promise<string> {
  refuseAgent(input.actorId, "open a business record");
  const name = clean(input.name, 2, 80, "Name the business.");
  const idea = input.idea.trim();
  if (idea.length < 8 || idea.length > 2000) throw new CompanyError("Describe the idea in at least a short sentence.");
  const structure = structureOf(input.structure);
  const existing = await sql<{ id: string }>`select id from ventures where organization_id = ${input.orgId} limit 1`;
  if (existing[0]) throw new CompanyError("This company already has a business record.");
  const id = nid("ven");
  await sql`insert into ventures (id, organization_id, name, idea, structure, created_by)
    values (${id}, ${input.orgId}, ${name}, ${idea}, ${structure}, ${input.actorId})`;
  for (const item of LAUNCH) {
    await sql`insert into obligations (id, organization_id, venture_id, domain, autonomy, title)
      values (${nid("obl")}, ${input.orgId}, ${id}, ${item.domain}, ${item.autonomy}, ${item.title})`;
  }
  await audit(sql, input.orgId, input.actorId, "venture.opened", id, `${name} opened. No filing, payment, or agreement was made.`);
  return id;
}

export async function setStructure(sql: Sql, input: { orgId: string; actorId: string; structure: string }): Promise<void> {
  refuseAgent(input.actorId, "change the business structure");
  const structure = structureOf(input.structure);
  const rows = await sql<{ id: string }>`update ventures set structure = ${structure}
    where organization_id = ${input.orgId} returning id`;
  if (!rows[0]) throw new CompanyError("Open the business record first.");
  await audit(sql, input.orgId, input.actorId, "venture.structure", rows[0].id, `Structure marked ${structure}. This is not a registration.`);
}

export async function setBurn(sql: Sql, input: { orgId: string; actorId: string; amount: string }): Promise<void> {
  refuseAgent(input.actorId, "set a burn rate");
  const cents = input.amount.trim() ? dollarsToCents(input.amount) : null;
  if (input.amount.trim() && cents == null) throw new CompanyError("Enter a monthly burn like 2500 or 2500.00, or leave it blank to clear it.");
  const rows = await sql<{ id: string }>`update ventures set monthly_burn_cents = ${cents}
    where organization_id = ${input.orgId} returning id`;
  if (!rows[0]) throw new CompanyError("Open the business record first.");
}

export async function setStage(sql: Sql, input: { orgId: string; actorId: string; stage: string }): Promise<void> {
  refuseAgent(input.actorId, "move the business stage");
  const stage = stageOf(input.stage);
  const current = await sql<{ id: string; stage: string }>`select id, stage from ventures where organization_id = ${input.orgId} limit 1`;
  if (!current[0]) throw new CompanyError("Open the business record first.");
  if (stage === "launch" || stage === "operating") {
    const auth = await sql<{ id: string }>`select id from launch_authorizations where organization_id = ${input.orgId} limit 1`;
    if (!auth[0]) {
      throw new CompanyError("Launch stays closed until a person records that they authorized it. A waiver does not. A finished mission does not.");
    }
  }
  if (stage === "operating" && current[0].stage !== "launch" && current[0].stage !== "operating") {
    throw new CompanyError("Operating stays closed until launch readiness is recorded.");
  }
  await sql`update ventures set stage = ${stage} where id = ${current[0].id}`;
  await audit(sql, input.orgId, input.actorId, "venture.stage", current[0].id, `Stage marked ${stage}. This is not a government status.`);
}

export async function authorizeLaunch(sql: Sql, input: { orgId: string; actorId: string; evidence: string }): Promise<void> {
  refuseAgent(input.actorId, "authorize launch");
  const evidence = clean(input.evidence, 12, 2000, "Record how you authorized launch. This does not verify the legal result.");
  const venture = await ventureId(sql, input.orgId);
  try {
    await sql`insert into launch_authorizations (id, organization_id, venture_id, actor_id, evidence)
      values (${nid("lau")}, ${input.orgId}, ${venture}, ${input.actorId}, ${evidence})`;
  } catch (error) {
    if (isUnique(error)) throw new CompanyError("Launch is already authorized by a person. Recording it again does not verify it.");
    throw error;
  }
  await audit(sql, input.orgId, input.actorId, "venture.launch_authorized", venture, "A person recorded launch authorization. NEXUS did not verify it, and the company is not operating yet.");
}

export async function reclassifyObligation(sql: Sql, input: { orgId: string; actorId: string; obligationId: string; autonomy: string }): Promise<void> {
  refuseAgent(input.actorId, "change a work classification");
  const rows = await sql<{ id: string; autonomy: string }>`select id, autonomy from obligations
    where id = ${input.obligationId} and organization_id = ${input.orgId} limit 1`;
  if (!rows[0]) throw new CompanyError("That obligation is not in this company.");
  await audit(
    sql,
    input.orgId,
    input.actorId,
    "obligation.reclassify_refused",
    rows[0].id,
    `Refused to change ${rows[0].autonomy} to ${input.autonomy.slice(0, 40)}. Classification cannot be changed.`,
  );
  throw new CompanyError("A classification cannot be changed. Restricted work cannot be relabeled as research or owner-staffed.");
}

export async function prepareObligation(sql: Sql, input: { orgId: string; actorId: string; obligationId: string; detail: string }): Promise<void> {
  refuseAgent(input.actorId, "prepare an obligation");
  const detail = clean(input.detail, 8, 2000, "Write what was prepared.");
  const rows = await sql<{ id: string }>`update obligations set detail = ${detail}, state = ${"prepared"}
    where id = ${input.obligationId} and organization_id = ${input.orgId} and state in (${"open"}, ${"prepared"})
    returning id`;
  if (!rows[0]) throw new CompanyError("That open obligation is not in this company.");
}

export async function staffObligation(sql: Sql, input: { orgId: string; actorId: string; obligationId: string }): Promise<string> {
  refuseAgent(input.actorId, "staff an obligation");
  const rows = await sql<{ id: string; autonomy: Autonomy; title: string; detail: string; state: string; mission_id: string | null }>`
    select id, autonomy, title, detail, state, mission_id from obligations
    where id = ${input.obligationId} and organization_id = ${input.orgId} limit 1`;
  const row = rows[0];
  if (!row) throw new CompanyError("That obligation is not in this company.");
  if (row.autonomy === "restricted") {
    throw new CompanyError("Restricted. A person does this outside NEXUS, then records it. NEXUS will not open a mission that files, disburses, publishes, or binds the company.");
  }
  if (row.mission_id || row.state === "authorized" || row.state === "satisfied" || row.state === "waived") {
    throw new CompanyError("That obligation already has a mission or is closed.");
  }
  const objective = `Business obligation: ${row.title} Preparation: ${row.detail || "none yet."} Research and draft only. Do not file, spend, publish, or sign.`.slice(0, 2000);
  const missionId = nid("msn");
  await sql`insert into missions (id, organization_id, title, objective, status, created_by)
    values (${missionId}, ${input.orgId}, ${titleFrom(row.title)}, ${objective}, ${"PROPOSED"}, ${input.actorId})`;
  const saved = await sql<{ id: string }>`update obligations set state = ${"authorized"}, mission_id = ${missionId}
    where id = ${row.id} and organization_id = ${input.orgId} and mission_id is null and state in (${"open"}, ${"prepared"})
    returning id`;
  if (!saved[0]) throw new CompanyError("That obligation changed before it could be staffed.");
  await audit(sql, input.orgId, input.actorId, "venture.staffed", missionId, "A proposed mission was opened. It is not authorized to execute.");
  return missionId;
}

export async function recordRestricted(sql: Sql, input: { orgId: string; actorId: string; obligationId: string; evidence: string }): Promise<void> {
  refuseAgent(input.actorId, "record a restricted action");
  const evidence = clean(input.evidence, 12, 2000, "Record what the person did, and where.");
  const rows = await sql<{ id: string; venture_id: string }>`update obligations set state = ${"satisfied"}, evidence = ${evidence}
    where id = ${input.obligationId} and organization_id = ${input.orgId}
      and autonomy = ${"restricted"} and state in (${"open"}, ${"prepared"})
    returning id, venture_id`;
  if (!rows[0]) throw new CompanyError("That restricted obligation is not open in this company.");
  await sql`insert into external_action_records (
    id, organization_id, venture_id, obligation_id, classification, actor_id, evidence_ref
  ) values (
    ${nid("xar")}, ${input.orgId}, ${rows[0].venture_id}, ${rows[0].id}, ${"restricted"}, ${input.actorId}, ${evidence}
  )`;
  await audit(sql, input.orgId, input.actorId, "venture.recorded_outside", rows[0].id, "Owner recorded an outside action. NEXUS did not perform it and did not verify it.");
}

export async function waiveObligation(sql: Sql, input: { orgId: string; actorId: string; obligationId: string; reason: string }): Promise<void> {
  refuseAgent(input.actorId, "waive an obligation");
  const reason = clean(input.reason, 8, 500, "Say why this obligation is waived.");
  const rows = await sql<{ id: string }>`update obligations set state = ${"waived"}, evidence = ${reason}
    where id = ${input.obligationId} and organization_id = ${input.orgId} and state in (${"open"}, ${"prepared"})
    returning id`;
  if (!rows[0]) throw new CompanyError("That open obligation is not in this company.");
}

export async function addFiling(sql: Sql, input: {
  orgId: string; actorId: string; kind: string; jurisdiction: string; deadline: string; note: string;
}): Promise<void> {
  refuseAgent(input.actorId, "add a filing");
  const kind = ["name", "dba", "ein", "license", "permit", "trademark", "tax", "insurance", "other"].includes(input.kind) ? input.kind : "other";
  const venture = await ventureId(sql, input.orgId);
  await sql`insert into filings (id, organization_id, venture_id, kind, jurisdiction, deadline, note, created_by)
    values (${nid("fil")}, ${input.orgId}, ${venture}, ${kind}, ${input.jurisdiction.trim().slice(0, 120)}, ${input.deadline.trim().slice(0, 40)}, ${input.note.trim().slice(0, 500)}, ${input.actorId})`;
}

export async function recordFiling(sql: Sql, input: { orgId: string; actorId: string; filingId: string; note: string }): Promise<void> {
  refuseAgent(input.actorId, "record a filing");
  const note = clean(input.note, 8, 500, "Record what you filed, and with whom. NEXUS did not submit it.");
  const rows = await sql<{ id: string }>`update filings set status = ${"owner_recorded"}, note = ${note}
    where id = ${input.filingId} and organization_id = ${input.orgId} and status in (${"research"}, ${"prepared"})
    returning id`;
  if (!rows[0]) throw new CompanyError("That filing is not open in this company.");
  await audit(sql, input.orgId, input.actorId, "filing.owner_recorded", rows[0].id, "Owner recorded a filing. NEXUS did not submit it.");
}

export async function addInstrument(sql: Sql, input: { orgId: string; actorId: string; kind: string; title: string; body: string }): Promise<void> {
  refuseAgent(input.actorId, "draft an instrument");
  const kind = ["operating_agreement", "nda", "contract", "terms", "privacy", "other"].includes(input.kind) ? input.kind : "other";
  const title = clean(input.title, 2, 120, "Name the document.");
  const venture = await ventureId(sql, input.orgId);
  await sql`insert into instruments (id, organization_id, venture_id, kind, title, body, created_by)
    values (${nid("ins")}, ${input.orgId}, ${venture}, ${kind}, ${title}, ${input.body.trim().slice(0, 8000)}, ${input.actorId})`;
}

export async function approveInstrument(sql: Sql, input: { orgId: string; actorId: string; instrumentId: string }): Promise<void> {
  refuseAgent(input.actorId, "approve a draft");
  const rows = await sql<{ id: string; body: string }>`select id, body from instruments
    where id = ${input.instrumentId} and organization_id = ${input.orgId} and status = ${"draft"} limit 1`;
  if (!rows[0]) throw new CompanyError("That draft is not in this company.");
  if (rows[0].body.trim().length < 20) throw new CompanyError("Write the draft before you approve it. Approval is not a signature.");
  await sql`update instruments set status = ${"owner_approved"} where id = ${rows[0].id}`;
  await audit(sql, input.orgId, input.actorId, "instrument.approved", rows[0].id, "Owner approved a draft. It is not a signed agreement.");
}

export async function addCapital(sql: Sql, input: {
  orgId: string; actorId: string; kind: string; name: string; amount: string; fundingKind: string; note: string;
}): Promise<void> {
  refuseAgent(input.actorId, "add a capital item");
  const kind = input.kind === "funding" ? "funding" : "cost";
  const name = clean(input.name, 2, 120, "Name the cost or the funding source.");
  const cents = dollarsToCents(input.amount);
  if (cents == null) throw new CompanyError("Enter an amount like 1000 or 1000.00.");
  const fundingKind = kind === "funding" && ["loan", "investment", "grant"].includes(input.fundingKind) ? input.fundingKind : "";
  if (kind === "funding" && !fundingKind) throw new CompanyError("Funding is a loan, an investment, or a grant.");
  const venture = await ventureId(sql, input.orgId);
  await sql`insert into capital_items (id, organization_id, venture_id, kind, name, amount_cents, funding_kind, note, created_by)
    values (${nid("cap")}, ${input.orgId}, ${venture}, ${kind}, ${name}, ${cents}, ${fundingKind}, ${input.note.trim().slice(0, 500)}, ${input.actorId})`;
}

export async function setCapitalStatus(sql: Sql, input: { orgId: string; actorId: string; capitalId: string; status: string }): Promise<void> {
  refuseAgent(input.actorId, "change funding status");
  if (!["planned", "pursuing", "declined", "received"].includes(input.status)) throw new CompanyError("That funding status is not on the record.");
  const rows = await sql<{ id: string }>`update capital_items set status = ${input.status}
    where id = ${input.capitalId} and organization_id = ${input.orgId} and kind = ${"funding"}
    returning id`;
  if (!rows[0]) throw new CompanyError("That funding item is not in this company.");
  await audit(sql, input.orgId, input.actorId, "capital.status", rows[0].id, `Marked ${input.status}. This did not record a receipt.`);
}

async function partyRole(sql: Sql, orgId: string, partyId: string, role: string): Promise<void> {
  const rows = await sql<{ id: string }>`select id from party_roles
    where organization_id = ${orgId} and party_id = ${partyId} and role = ${role} and status = ${"active"} limit 1`;
  if (!rows[0]) throw new CompanyError(`That party needs an active ${role} role in this company.`);
}

export async function createInvoice(sql: Sql, input: {
  orgId: string; actorId: string; direction: string; partyId: string; offerId: string; title: string; amount: string;
}): Promise<void> {
  refuseAgent(input.actorId, "create an invoice");
  const direction = input.direction === "payable" ? "payable" : "receivable";
  const title = clean(input.title, 2, 120, "Name the invoice.");
  const cents = dollarsToCents(input.amount);
  if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
  await partyRole(sql, input.orgId, input.partyId, direction === "payable" ? "supplier" : "customer");
  let offerId: string | null = null;
  if (input.offerId.trim()) {
    const offer = await sql<{ id: string }>`select id from offers
      where id = ${input.offerId.trim()} and organization_id = ${input.orgId} and status = ${"active"} limit 1`;
    if (!offer[0]) throw new CompanyError("That active offer is not in this company.");
    offerId = offer[0].id;
  }
  await sql`insert into invoices (id, organization_id, direction, party_id, offer_id, title, amount_cents, created_by)
    values (${nid("inv")}, ${input.orgId}, ${direction}, ${input.partyId}, ${offerId}, ${title}, ${cents}, ${input.actorId})`;
}

export async function issueInvoice(sql: Sql, input: { orgId: string; actorId: string; invoiceId: string }): Promise<void> {
  refuseAgent(input.actorId, "issue an invoice");
  const rows = await sql<{ id: string }>`update invoices set status = ${"issued"}
    where id = ${input.invoiceId} and organization_id = ${input.orgId} and status = ${"draft"} returning id`;
  if (!rows[0]) throw new CompanyError("That draft invoice is not in this company.");
  await audit(sql, input.orgId, input.actorId, "invoice.issued", rows[0].id, "Issued. No payment was created.");
}

export async function voidInvoice(sql: Sql, input: { orgId: string; actorId: string; invoiceId: string }): Promise<void> {
  refuseAgent(input.actorId, "void an invoice");
  const rows = await sql<{ id: string }>`update invoices set status = ${"void"}
    where id = ${input.invoiceId} and organization_id = ${input.orgId} and status in (${"draft"}, ${"issued"}) returning id`;
  if (!rows[0]) throw new CompanyError("That invoice is not open in this company.");
}

export async function allocatePayment(sql: Sql, input: {
  orgId: string; actorId: string; invoiceId: string; paymentId: string; amount: string;
}): Promise<void> {
  refuseAgent(input.actorId, "allocate a payment");
  const cents = dollarsToCents(input.amount);
  if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
  if (!sql.transaction) throw new CompanyError("The books lock is unavailable. Nothing was allocated.");
  await sql.transaction(async (tx) => {
    const invoice = await tx<{ id: string; direction: string; amount_cents: unknown; status: string }>`
      select id, direction, amount_cents, status from invoices
      where id = ${input.invoiceId} and organization_id = ${input.orgId} for update`;
    if (!invoice[0] || invoice[0].status !== "issued") throw new CompanyError("Only an issued invoice in this company can be allocated.");
    const payment = await tx<{ id: string; direction: string; amount_cents: unknown; voided_at: unknown }>`
      select id, direction, amount_cents, voided_at from payments
      where id = ${input.paymentId} and organization_id = ${input.orgId} for update`;
    if (!payment[0] || payment[0].voided_at) throw new CompanyError("That open payment is not in this company.");
    const expect = invoice[0].direction === "payable" ? "expenditure" : "receipt";
    if (payment[0].direction !== expect) {
      throw new CompanyError(expect === "receipt"
        ? "A receivable takes a receipt. An expenditure does not collect it."
        : "A payable takes an expenditure. A receipt does not pay it.");
    }
    const usedInvoice = await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from invoice_allocations
      where invoice_id = ${invoice[0].id}`;
    const usedPayment = await tx<{ total: unknown }>`select coalesce(sum(amount_cents), 0)::int as total from invoice_allocations
      where payment_id = ${payment[0].id}`;
    if (num(usedInvoice[0]?.total) + cents > num(invoice[0].amount_cents)) throw new CompanyError("That is more than the invoice still records.");
    if (num(usedPayment[0]?.total) + cents > num(payment[0].amount_cents)) throw new CompanyError("That is more than the payment still unallocated.");
    try {
      await tx`insert into invoice_allocations (id, organization_id, invoice_id, payment_id, amount_cents, created_by)
        values (${nid("alc")}, ${input.orgId}, ${invoice[0].id}, ${payment[0].id}, ${cents}, ${input.actorId})`;
    } catch (error) {
      if (isUnique(error)) throw new CompanyError("That payment is already allocated to this invoice. Nothing was added.");
      throw error;
    }
  });
}

function quantityOf(raw: string): number {
  const text = raw.trim() || "1";
  if (!/^\d+$/.test(text)) throw new CompanyError("Enter a whole quantity.");
  const quantity = Number(text);
  if (quantity < 1 || quantity > 10000) throw new CompanyError("Quantity must be from 1 to 10000.");
  return quantity;
}

export async function createQuote(sql: Sql, input: { orgId: string; actorId: string; partyId: string; note: string }): Promise<string> {
  refuseAgent(input.actorId, "create a quote");
  await partyRole(sql, input.orgId, input.partyId, "customer");
  const id = nid("quo");
  await sql`insert into quotes (id, organization_id, party_id, note, created_by)
    values (${id}, ${input.orgId}, ${input.partyId}, ${input.note.trim().slice(0, 200)}, ${input.actorId})`;
  return id;
}

export async function addQuoteLine(sql: Sql, input: {
  orgId: string; actorId: string; quoteId: string; offerId: string; quantity: string; amount: string;
}): Promise<void> {
  refuseAgent(input.actorId, "add a quote line");
  const quantity = quantityOf(input.quantity);
  const quote = await sql<{ id: string; status: string }>`select id, status from quotes
    where id = ${input.quoteId} and organization_id = ${input.orgId} limit 1`;
  if (!quote[0]) throw new CompanyError("That quote is not in this company.");
  if (quote[0].status !== "draft") throw new CompanyError("An issued quote does not take new lines.");
  const offer = await sql<{ id: string; name: string; price_cents: unknown; status: string }>`select id, name, price_cents, status from offers
    where id = ${input.offerId} and organization_id = ${input.orgId} limit 1`;
  if (!offer[0] || offer[0].status !== "active") throw new CompanyError("A retired offer cannot be added. Choose an active offer in this company.");
  const unit = input.amount.trim() ? dollarsToCents(input.amount) : num(offer[0].price_cents);
  if (unit == null || unit < 1) throw new CompanyError("Enter a price like 25 or 25.00.");
  const total = unit * quantity;
  if (total > 100_000_000) throw new CompanyError("That line is too large.");
  await sql`insert into quote_lines (id, organization_id, quote_id, offer_id, quantity, amount_cents, description)
    values (${nid("qln")}, ${input.orgId}, ${quote[0].id}, ${offer[0].id}, ${quantity}, ${total}, ${offer[0].name})`;
}

export async function issueQuote(sql: Sql, input: { orgId: string; actorId: string; quoteId: string }): Promise<void> {
  refuseAgent(input.actorId, "issue a quote");
  const quote = await sql<{ id: string; status: string }>`select id, status from quotes
    where id = ${input.quoteId} and organization_id = ${input.orgId} limit 1`;
  if (!quote[0] || quote[0].status !== "draft") throw new CompanyError("That draft quote is not in this company.");
  const lines = await sql<{ offer_id: string }>`select offer_id from quote_lines
    where quote_id = ${quote[0].id} and organization_id = ${input.orgId}`;
  if (lines.length === 0) throw new CompanyError("Add a line before issuing the quote.");
  const retired = await sql<{ id: string }>`select o.id from offers o
    join quote_lines l on l.offer_id = o.id and l.organization_id = o.organization_id
    where l.quote_id = ${quote[0].id} and l.organization_id = ${input.orgId} and o.status <> ${"active"} limit 1`;
  if (retired[0]) throw new CompanyError("A retired offer is on this quote. Remove it before issuing.");
  const rows = await sql<{ id: string }>`update quotes set status = ${"issued"}
    where id = ${quote[0].id} and organization_id = ${input.orgId} and status = ${"draft"} returning id`;
  if (!rows[0]) throw new CompanyError("That draft quote is not in this company.");
  await audit(sql, input.orgId, input.actorId, "quote.issued", rows[0].id, "Issued. This is not an order and not a payment.");
}

export async function acceptQuote(sql: Sql, input: { orgId: string; actorId: string; quoteId: string }): Promise<string> {
  refuseAgent(input.actorId, "accept a quote");
  if (!sql.transaction) throw new CompanyError("The books lock is unavailable. No order was created.");
  return sql.transaction(async (tx) => {
    const quote = await tx<{ id: string; party_id: string; status: string; note: string }>`select id, party_id, status, note from quotes
      where id = ${input.quoteId} and organization_id = ${input.orgId} for update`;
    if (!quote[0]) throw new CompanyError("That quote is not in this company.");
    if (quote[0].status !== "issued") throw new CompanyError("Issue the quote before it becomes an order.");
    const lines = await tx<{ offer_id: string; quantity: unknown; amount_cents: unknown; description: string }>`
      select offer_id, quantity, amount_cents, description from quote_lines
      where quote_id = ${quote[0].id} and organization_id = ${input.orgId}`;
    if (lines.length === 0) throw new CompanyError("That quote has no lines.");
    const orderId = nid("ord");
    try {
      await tx`insert into orders (id, organization_id, party_id, quote_id, status, note, created_by)
        values (${orderId}, ${input.orgId}, ${quote[0].party_id}, ${quote[0].id}, ${"accepted"}, ${quote[0].note}, ${input.actorId})`;
    } catch (error) {
      if (isUnique(error)) throw new CompanyError("That quote already became an order.");
      throw error;
    }
    for (const line of lines) {
      await tx`insert into order_lines (id, organization_id, order_id, offer_id, quantity, amount_cents, description)
        values (${nid("oln")}, ${input.orgId}, ${orderId}, ${line.offer_id}, ${num(line.quantity)}, ${num(line.amount_cents)}, ${line.description})`;
    }
    await audit(tx, input.orgId, input.actorId, "order.accepted", orderId, "Owner accepted the quote. No payment was taken and no mission was authorized.");
    return orderId;
  });
}

export async function cancelOrder(sql: Sql, input: { orgId: string; actorId: string; orderId: string }): Promise<void> {
  refuseAgent(input.actorId, "cancel an order");
  const rows = await sql<{ id: string }>`update orders set status = ${"cancelled"}
    where id = ${input.orderId} and organization_id = ${input.orgId} and status = ${"accepted"} returning id`;
  if (!rows[0]) throw new CompanyError("That accepted order is not in this company.");
  await audit(sql, input.orgId, input.actorId, "order.cancelled", rows[0].id, "Cancelled. Lines remain. Linked missions were not cancelled.");
}

export async function fulfillOrder(sql: Sql, input: { orgId: string; actorId: string; orderId: string }): Promise<void> {
  refuseAgent(input.actorId, "fulfill an order");
  const rows = await sql<{ id: string }>`update orders set status = ${"fulfilled"}
    where id = ${input.orderId} and organization_id = ${input.orgId} and status = ${"accepted"} returning id`;
  if (!rows[0]) throw new CompanyError("That accepted order is not in this company.");
  await audit(sql, input.orgId, input.actorId, "order.fulfilled", rows[0].id, "Marked fulfilled. No payment was created.");
}

export async function linkOrderMission(sql: Sql, input: { orgId: string; actorId: string; orderId: string; missionId: string }): Promise<void> {
  refuseAgent(input.actorId, "link an order to a mission");
  try {
    const rows = await sql<{ order_id: string }>`insert into order_mission_links (organization_id, order_id, mission_id, linked_by)
      select o.organization_id, o.id, m.id, ${input.actorId}
      from orders o
      join missions m on m.id = ${input.missionId} and m.organization_id = o.organization_id
      where o.id = ${input.orderId} and o.organization_id = ${input.orgId}
      returning order_id`;
    if (!rows[0]) throw new CompanyError("That order and mission are not both in this company. Nothing was linked.");
    await audit(sql, input.orgId, input.actorId, "order.linked", rows[0].order_id, "Linked to a mission. The mission was not authorized.");
  } catch (error) {
    if (error instanceof CompanyError) throw error;
    if (isUnique(error)) throw new CompanyError("That mission is already linked.");
    throw error;
  }
}

export async function invoiceOrder(sql: Sql, input: { orgId: string; actorId: string; orderId: string }): Promise<string> {
  refuseAgent(input.actorId, "invoice an order");
  if (!sql.transaction) throw new CompanyError("The books lock is unavailable. No invoice was issued.");
  return sql.transaction(async (tx) => {
    const order = await tx<{ id: string; party_id: string; status: string; note: string }>`select id, party_id, status, note from orders
      where id = ${input.orderId} and organization_id = ${input.orgId} for update`;
    if (!order[0] || (order[0].status !== "accepted" && order[0].status !== "fulfilled")) {
      throw new CompanyError("Only an accepted order in this company can be invoiced.");
    }
    const existing = await tx<{ id: string }>`select id from invoices
      where organization_id = ${input.orgId} and order_id = ${order[0].id} and status <> ${"void"} limit 1`;
    if (existing[0]) throw new CompanyError("That order already has an invoice.");
    const lines = await tx<{ description: string; amount_cents: unknown }>`select description, amount_cents from order_lines
      where order_id = ${order[0].id} and organization_id = ${input.orgId}`;
    const total = lines.reduce((sum, line) => sum + num(line.amount_cents), 0);
    if (total < 1) throw new CompanyError("That order has no amount to invoice.");
    const seq = await tx<{ n: unknown }>`select coalesce(max(substring(number from 5)::int), 0)::int as n from invoices
      where organization_id = ${input.orgId} and number like ${"INV-%"}`;
    const number = `INV-${String(num(seq[0]?.n) + 1).padStart(4, "0")}`;
    const invoiceId = nid("inv");
    const title = order[0].note.trim() || "Order";
    await tx`insert into invoices (id, organization_id, direction, party_id, title, amount_cents, status, created_by, order_id, number)
      values (${invoiceId}, ${input.orgId}, ${"receivable"}, ${order[0].party_id}, ${title}, ${total}, ${"issued"}, ${input.actorId}, ${order[0].id}, ${number})`;
    for (const line of lines) {
      await tx`insert into invoice_lines (id, organization_id, invoice_id, description, amount_cents)
        values (${nid("iln")}, ${input.orgId}, ${invoiceId}, ${line.description}, ${num(line.amount_cents)})`;
    }
    await audit(tx, input.orgId, input.actorId, "invoice.issued", invoiceId, `${number} issued from an order. No payment was created.`);
    return invoiceId;
  });
}

export async function addBrief(sql: Sql, input: {
  orgId: string; actorId: string; offerId: string; problem: string; requirements: string; value: string; cost: string;
}): Promise<void> {
  refuseAgent(input.actorId, "write a product brief");
  const problem = clean(input.problem, 8, 500, "Name the market problem.");
  let offerId: string | null = null;
  if (input.offerId.trim()) {
    const offer = await sql<{ id: string }>`select id from offers where id = ${input.offerId.trim()} and organization_id = ${input.orgId} limit 1`;
    if (!offer[0]) throw new CompanyError("That offer is not in this company.");
    offerId = offer[0].id;
  }
  const cost = input.cost.trim() ? dollarsToCents(input.cost) : null;
  if (input.cost.trim() && cost == null) throw new CompanyError("Enter a cost like 10 or 10.00, or leave it blank. A cost is not a charge.");
  await sql`insert into product_briefs (
    id, organization_id, offer_id, problem, requirements, value_proposition, cost_cents, created_by
  ) values (
    ${nid("brf")}, ${input.orgId}, ${offerId}, ${problem}, ${input.requirements.trim().slice(0, 2000)},
    ${input.value.trim().slice(0, 500)}, ${cost}, ${input.actorId}
  )`;
}

export async function addFeedback(sql: Sql, input: { orgId: string; actorId: string; briefId: string; feedback: string }): Promise<void> {
  refuseAgent(input.actorId, "record product feedback");
  const feedback = clean(input.feedback, 2, 2000, "Write the feedback.");
  const rows = await sql<{ id: string }>`update product_briefs set feedback = ${feedback}
    where id = ${input.briefId} and organization_id = ${input.orgId} returning id`;
  if (!rows[0]) throw new CompanyError("That brief is not in this company.");
}

export async function addCampaign(sql: Sql, input: {
  orgId: string; actorId: string; name: string; segment: string; channel: string; amount: string; note: string;
}): Promise<void> {
  refuseAgent(input.actorId, "draft a campaign");
  const name = clean(input.name, 2, 120, "Name the campaign.");
  const budget = input.amount.trim() ? dollarsToCents(input.amount) : 0;
  if (input.amount.trim() && budget == null) throw new CompanyError("Enter a budget like 100 or leave it blank. A budget is not spend.");
  await sql`insert into campaigns (id, organization_id, name, segment, channel, budget_cents, note, created_by)
    values (${nid("cmp")}, ${input.orgId}, ${name}, ${input.segment.trim().slice(0, 160)}, ${input.channel.trim().slice(0, 80)}, ${budget ?? 0}, ${input.note.trim().slice(0, 500)}, ${input.actorId})`;
}

export async function authorizeCampaign(sql: Sql, input: { orgId: string; actorId: string; campaignId: string }): Promise<void> {
  refuseAgent(input.actorId, "authorize a campaign");
  const rows = await sql<{ id: string }>`update campaigns set status = ${"authorized"}
    where id = ${input.campaignId} and organization_id = ${input.orgId} and status = ${"draft"} returning id`;
  if (!rows[0]) throw new CompanyError("That draft campaign is not in this company.");
  await audit(sql, input.orgId, input.actorId, "campaign.authorized", rows[0].id, "Authorized to prepare. No money moved and nothing was published.");
}

export async function closeCampaign(sql: Sql, input: { orgId: string; actorId: string; campaignId: string }): Promise<void> {
  refuseAgent(input.actorId, "close a campaign");
  const rows = await sql<{ id: string }>`update campaigns set status = ${"closed"}
    where id = ${input.campaignId} and organization_id = ${input.orgId} and status in (${"draft"}, ${"authorized"}) returning id`;
  if (!rows[0]) throw new CompanyError("That campaign is not open in this company.");
}

export async function addMarketNote(sql: Sql, input: { orgId: string; actorId: string; kind: string; name: string; detail: string }): Promise<void> {
  refuseAgent(input.actorId, "add market research");
  const kind = input.kind === "competitor" || input.kind === "channel" ? input.kind : "segment";
  const name = clean(input.name, 2, 120, "Name the segment, competitor, or channel.");
  await sql`insert into market_notes (id, organization_id, kind, name, detail, created_by)
    values (${nid("mkt")}, ${input.orgId}, ${kind}, ${name}, ${input.detail.trim().slice(0, 2000)}, ${input.actorId})`;
}

export async function addProcedure(sql: Sql, input: {
  orgId: string; actorId: string; name: string; owner: string; trigger: string; inputs: string; actions: string; outputs: string; exceptions: string; verification: string;
}): Promise<void> {
  refuseAgent(input.actorId, "write a procedure");
  const name = clean(input.name, 2, 120, "Name the procedure.");
  const owner = clean(input.owner, 2, 80, "Name the owner of the procedure.");
  const trigger = clean(input.trigger, 2, 300, "Name what starts the procedure.");
  const inputs = clean(input.inputs, 2, 1000, "Name the required inputs.");
  const actions = clean(input.actions, 2, 2000, "Name the authorized actions.");
  const outputs = clean(input.outputs, 2, 1000, "Name the expected outputs.");
  const exceptions = clean(input.exceptions, 2, 1000, "Name the exception path.");
  const verification = clean(input.verification, 2, 1000, "Name how the result is checked.");
  await sql`insert into procedures (
    id, organization_id, name, owner_label, trigger_text, inputs, actions, outputs, exceptions, verification, created_by
  ) values (
    ${nid("sop")}, ${input.orgId}, ${name}, ${owner}, ${trigger}, ${inputs}, ${actions}, ${outputs}, ${exceptions}, ${verification}, ${input.actorId}
  )`;
}

export async function activateProcedure(sql: Sql, input: { orgId: string; actorId: string; procedureId: string }): Promise<void> {
  refuseAgent(input.actorId, "activate a procedure");
  const rows = await sql<{ id: string }>`update procedures set status = ${"active"}
    where id = ${input.procedureId} and organization_id = ${input.orgId} and status = ${"draft"} returning id`;
  if (!rows[0]) throw new CompanyError("That draft procedure is not in this company.");
}

export async function runProcedure(sql: Sql, input: { orgId: string; actorId: string; procedureId: string }): Promise<string> {
  refuseAgent(input.actorId, "run a procedure");
  const rows = await sql<{ id: string; name: string; owner_label: string; trigger_text: string; inputs: string; actions: string; outputs: string; exceptions: string; verification: string; mission_id: string | null }>`
    select id, name, owner_label, trigger_text, inputs, actions, outputs, exceptions, verification, mission_id
    from procedures where id = ${input.procedureId} and organization_id = ${input.orgId} and status = ${"active"} limit 1`;
  const row = rows[0];
  if (!row) throw new CompanyError("That active procedure is not in this company.");
  if (row.mission_id) throw new CompanyError("That procedure already opened a mission.");
  const objective = `Procedure ${row.name}. Owner ${row.owner_label}. Trigger: ${row.trigger_text}. Inputs: ${row.inputs}. Actions: ${row.actions}. Outputs: ${row.outputs}. Exceptions: ${row.exceptions}. Check: ${row.verification}. Do not take a restricted action.`;
  const missionId = nid("msn");
  await sql`insert into missions (id, organization_id, title, objective, status, created_by)
    values (${missionId}, ${input.orgId}, ${titleFrom(row.name)}, ${objective.slice(0, 2000)}, ${"PROPOSED"}, ${input.actorId})`;
  await sql`update procedures set mission_id = ${missionId} where id = ${row.id} and mission_id is null`;
  await audit(sql, input.orgId, input.actorId, "procedure.mission", missionId, "A proposed mission was opened from a procedure. It is not authorized to execute.");
  return missionId;
}

export async function retireProcedure(sql: Sql, input: { orgId: string; actorId: string; procedureId: string }): Promise<void> {
  refuseAgent(input.actorId, "retire a procedure");
  const rows = await sql<{ id: string }>`update procedures set status = ${"retired"}
    where id = ${input.procedureId} and organization_id = ${input.orgId} and status in (${"draft"}, ${"active"}) returning id`;
  if (!rows[0]) throw new CompanyError("That procedure is not in this company.");
}

export async function addPosition(sql: Sql, input: {
  orgId: string; actorId: string; title: string; kind: string; department: string; reportsTo: string;
}): Promise<void> {
  refuseAgent(input.actorId, "define a position");
  if (input.kind !== "employee" && input.kind !== "contractor") throw new CompanyError("A position is for an employee or a contractor. Agents stay on the workforce.");
  const title = clean(input.title, 2, 80, "Name the position.");
  const department = DEPARTMENTS.some((item) => item.slug === input.department) ? input.department : "";
  await sql`insert into positions (id, organization_id, title, kind, department_slug, reports_to, created_by)
    values (${nid("pos")}, ${input.orgId}, ${title}, ${input.kind}, ${department}, ${input.reportsTo.trim().slice(0, 80)}, ${input.actorId})`;
}

export async function engage(sql: Sql, input: { orgId: string; actorId: string; positionId: string; partyId: string }): Promise<void> {
  refuseAgent(input.actorId, "engage a person");
  const position = await sql<{ id: string; kind: string }>`select id, kind from positions
    where id = ${input.positionId} and organization_id = ${input.orgId} limit 1`;
  if (!position[0]) throw new CompanyError("That position is not in this company.");
  await partyRole(sql, input.orgId, input.partyId, position[0].kind);
  await sql`insert into engagements (id, organization_id, position_id, party_id, created_by)
    values (${nid("eng")}, ${input.orgId}, ${position[0].id}, ${input.partyId}, ${input.actorId})`;
}

export async function endEngagement(sql: Sql, input: { orgId: string; actorId: string; engagementId: string }): Promise<void> {
  refuseAgent(input.actorId, "end an engagement");
  const rows = await sql<{ id: string }>`update engagements set status = ${"ended"}
    where id = ${input.engagementId} and organization_id = ${input.orgId} and status in (${"planned"}, ${"active"}) returning id`;
  if (!rows[0]) throw new CompanyError("That engagement is not open in this company.");
}

export async function setStock(sql: Sql, input: { orgId: string; actorId: string; offerId: string; onHand: string; note: string }): Promise<void> {
  refuseAgent(input.actorId, "count stock");
  if (!/^\d+$/.test(input.onHand.trim())) throw new CompanyError("Enter a whole number on hand. A sale does not change this count.");
  const onHand = Number(input.onHand.trim());
  const offer = await sql<{ id: string }>`select id from offers where id = ${input.offerId} and organization_id = ${input.orgId} limit 1`;
  if (!offer[0]) throw new CompanyError("That offer is not in this company.");
  await sql`insert into stock_counts (id, organization_id, offer_id, on_hand, note, created_by)
    values (${nid("stk")}, ${input.orgId}, ${offer[0].id}, ${onHand}, ${input.note.trim().slice(0, 200)}, ${input.actorId})
    on conflict (organization_id, offer_id) do update set on_hand = ${onHand}, note = ${input.note.trim().slice(0, 200)}, updated_at = now()`;
}

async function statement(sql: Sql, orgId: string, burn: number | null): Promise<BusinessStatement> {
  const cash = await sql<{ received: unknown; spent: unknown }>`select
    coalesce(sum(amount_cents) filter (where direction = 'receipt' and voided_at is null), 0)::int as received,
    coalesce(sum(amount_cents) filter (where direction = 'expenditure' and voided_at is null), 0)::int as spent
    from payments where organization_id = ${orgId}`;
  const capital = await sql<{ costs: unknown; marked: unknown }>`select
    coalesce(sum(amount_cents) filter (where kind = 'cost'), 0)::int as costs,
    coalesce(sum(amount_cents) filter (where kind = 'funding' and status = 'received'), 0)::int as marked
    from capital_items where organization_id = ${orgId}`;
  const invoices = await sql<{ direction: string; open_cents: unknown }>`select i.direction,
    greatest(i.amount_cents - coalesce((select sum(amount_cents) from invoice_allocations a where a.invoice_id = i.id), 0), 0)::int as open_cents
    from invoices i where i.organization_id = ${orgId} and i.status = ${"issued"}`;
  let receivable = 0;
  let payable = 0;
  for (const row of invoices) {
    if (row.direction === "payable") payable += num(row.open_cents);
    else receivable += num(row.open_cents);
  }
  const received = num(cash[0]?.received);
  const spent = num(cash[0]?.spent);
  const margin = received - spent;
  const runway = burn && burn > 0 ? Math.floor(margin / burn) : null;
  return {
    receivedCents: received,
    spentCents: spent,
    recordedMarginCents: margin,
    burnCents: burn,
    runwayMonths: runway != null && runway < 0 ? 0 : runway,
    plannedCostCents: num(capital[0]?.costs),
    fundingMarkedReceivedCents: num(capital[0]?.marked),
    receivableCents: receivable,
    payableCents: payable,
    note: "Recorded margin is receipts minus expenditures. It is not a bank balance, not profit, and not a tax return. Funding marked received is not cash until you record a receipt.",
  };
}

export async function loadBusiness(sql: Sql, orgId: string): Promise<BusinessView> {
  const ventureRows = await sql<{ id: string; name: string; idea: string; structure: StructureName; stage: StageName; monthly_burn_cents: unknown }>`
    select id, name, idea, structure, stage, monthly_burn_cents from ventures where organization_id = ${orgId} limit 1`;
  const launch = await sql<{ evidence: string; created_at: unknown }>`
    select evidence, created_at from launch_authorizations where organization_id = ${orgId} limit 1`;
  const obligations = await sql<{ id: string; domain: DomainName; autonomy: Autonomy; state: ObligationRecord["state"]; title: string; detail: string; evidence: string; mission_id: string | null }>`
    select id, domain, autonomy, state, title, detail, evidence, mission_id from obligations
    where organization_id = ${orgId} order by created_at`;
  const outstanding = obligations.filter((row) => row.state === "open" || row.state === "prepared").length;
  const fulfilled = obligations.filter((row) => row.state === "satisfied").length;
  const waived = obligations.filter((row) => row.state === "waived").length;
  const launchAuthorized = Boolean(launch[0]);
  const venture = ventureRows[0]
    ? {
        id: ventureRows[0].id,
        name: ventureRows[0].name,
        idea: ventureRows[0].idea,
        structure: ventureRows[0].structure,
        stage: ventureRows[0].stage,
        monthlyBurnCents: ventureRows[0].monthly_burn_cents == null ? null : num(ventureRows[0].monthly_burn_cents),
        outstanding,
        fulfilled,
        waived,
        launchAuthorized,
        launchAuthorizedAt: iso(launch[0]?.created_at),
        launchEvidence: launch[0]?.evidence ?? "",
        ready: ventureRows[0].stage === "launch" && launchAuthorized,
        operating: ventureRows[0].stage === "operating",
      }
    : null;
  const filings = await sql<{ id: string; kind: string; jurisdiction: string; status: string; deadline: string; note: string }>`
    select id, kind, jurisdiction, status, deadline, note from filings where organization_id = ${orgId} order by created_at desc`;
  const instruments = await sql<{ id: string; kind: string; title: string; body: string; status: string }>`
    select id, kind, title, body, status from instruments where organization_id = ${orgId} order by created_at desc`;
  const capital = await sql<{ id: string; kind: string; name: string; amount_cents: unknown; funding_kind: string; status: string; note: string }>`
    select id, kind, name, amount_cents, funding_kind, status, note from capital_items where organization_id = ${orgId} order by created_at desc`;
  const invoiceRows = await sql<{ id: string; direction: string; party_id: string | null; party_name: string | null; title: string; amount_cents: unknown; status: string; allocated: unknown; number: string | null; order_id: string | null }>`
    select i.id, i.direction, i.party_id, p.display_name as party_name, i.title, i.amount_cents, i.status,
      coalesce((select sum(amount_cents) from invoice_allocations a where a.invoice_id = i.id), 0)::int as allocated,
      i.number, i.order_id
    from invoices i
    left join parties p on p.id = i.party_id and p.organization_id = i.organization_id
    where i.organization_id = ${orgId} order by i.created_at desc`;
  const paymentRows = await sql<{ id: string; payer: string; direction: string; amount_cents: unknown; allocated: unknown }>`
    select p.id, p.payer, p.direction, p.amount_cents,
      coalesce((select sum(amount_cents) from invoice_allocations a where a.payment_id = p.id), 0)::int as allocated
    from payments p where p.organization_id = ${orgId} and p.voided_at is null order by p.created_at desc limit 40`;
  const briefs = await sql<{ id: string; offer_id: string | null; offer_name: string | null; problem: string; requirements: string; value_proposition: string; cost_cents: unknown; feedback: string }>`
    select b.id, b.offer_id, o.name as offer_name, b.problem, b.requirements, b.value_proposition, b.cost_cents, b.feedback
    from product_briefs b
    left join offers o on o.id = b.offer_id and o.organization_id = b.organization_id
    where b.organization_id = ${orgId} order by b.created_at desc`;
  const campaigns = await sql<{ id: string; name: string; segment: string; channel: string; status: string; budget_cents: unknown; note: string }>`
    select id, name, segment, channel, status, budget_cents, note from campaigns where organization_id = ${orgId} order by created_at desc`;
  const notes = await sql<{ id: string; kind: string; name: string; detail: string }>`
    select id, kind, name, detail from market_notes where organization_id = ${orgId} order by created_at desc`;
  const procedures = await sql<{ id: string; name: string; owner_label: string; trigger_text: string; inputs: string; actions: string; outputs: string; exceptions: string; verification: string; status: string; mission_id: string | null }>`
    select id, name, owner_label, trigger_text, inputs, actions, outputs, exceptions, verification, status, mission_id
    from procedures where organization_id = ${orgId} order by created_at desc`;
  const positions = await sql<{ id: string; title: string; kind: string; department_slug: string; reports_to: string }>`
    select id, title, kind, department_slug, reports_to from positions where organization_id = ${orgId} order by title`;
  const engagements = await sql<{ id: string; position_id: string; party_id: string; party_name: string; status: string }>`
    select e.id, e.position_id, e.party_id, p.display_name as party_name, e.status
    from engagements e join parties p on p.id = e.party_id and p.organization_id = e.organization_id
    where e.organization_id = ${orgId} order by e.created_at desc`;
  const stock = await sql<{ offer_id: string; offer_name: string; on_hand: unknown; note: string }>`
    select s.offer_id, o.name as offer_name, s.on_hand, s.note
    from stock_counts s join offers o on o.id = s.offer_id and o.organization_id = s.organization_id
    where s.organization_id = ${orgId}`;
  const quoteRows = await sql<{ id: string; party_id: string; party_name: string; status: string; note: string; total: unknown }>`
    select q.id, q.party_id, p.display_name as party_name, q.status, q.note,
      coalesce((select sum(amount_cents) from quote_lines l where l.quote_id = q.id), 0)::int as total
    from quotes q join parties p on p.id = q.party_id and p.organization_id = q.organization_id
    where q.organization_id = ${orgId} order by q.created_at desc`;
  const quoteLines = await sql<{ id: string; quote_id: string; description: string; quantity: unknown; amount_cents: unknown }>`
    select id, quote_id, description, quantity, amount_cents from quote_lines where organization_id = ${orgId}`;
  const orderRows = await sql<{ id: string; party_name: string; quote_id: string; status: string; note: string; total: unknown; invoice_number: string | null }>`
    select o.id, p.display_name as party_name, o.quote_id, o.status, o.note,
      coalesce((select sum(amount_cents) from order_lines l where l.order_id = o.id), 0)::int as total,
      (select i.number from invoices i where i.order_id = o.id and i.organization_id = o.organization_id and i.status <> 'void' limit 1) as invoice_number
    from orders o join parties p on p.id = o.party_id and p.organization_id = o.organization_id
    where o.organization_id = ${orgId} order by o.created_at desc`;
  const links = await sql<{ order_id: string; mission_id: string }>`
    select order_id, mission_id from order_mission_links where organization_id = ${orgId}`;
  const missions = await sql<{ id: string; title: string; status: string }>`
    select id, title, status from missions where organization_id = ${orgId} order by updated_at desc limit 40`;
  return {
    venture,
    obligations: obligations.map((row) => ({
      id: row.id, domain: row.domain, autonomy: row.autonomy, state: row.state, title: row.title,
      detail: row.detail, evidence: row.evidence, missionId: row.mission_id,
    })),
    filings,
    instruments,
    capital: capital.map((row) => ({
      id: row.id, kind: row.kind, name: row.name, amountCents: num(row.amount_cents),
      fundingKind: row.funding_kind, status: row.status, note: row.note,
    })),
    invoices: invoiceRows.map((row) => ({
      id: row.id, direction: row.direction, partyId: row.party_id, partyName: row.party_name ?? "",
      title: row.title, amountCents: num(row.amount_cents), status: row.status, allocatedCents: num(row.allocated),
      number: row.number, orderId: row.order_id,
    })),
    payments: paymentRows.map((row) => ({
      id: row.id, payer: row.payer, direction: row.direction, amountCents: num(row.amount_cents), allocatedCents: num(row.allocated),
    })),
    briefs: briefs.map((row) => ({
      id: row.id, offerId: row.offer_id, offerName: row.offer_name ?? "", problem: row.problem,
      requirements: row.requirements, valueProposition: row.value_proposition,
      costCents: row.cost_cents == null ? null : num(row.cost_cents), feedback: row.feedback,
    })),
    campaigns: campaigns.map((row) => ({
      id: row.id, name: row.name, segment: row.segment, channel: row.channel, status: row.status,
      budgetCents: num(row.budget_cents), note: row.note,
    })),
    notes,
    procedures: procedures.map((row) => ({
      id: row.id, name: row.name, ownerLabel: row.owner_label, trigger: row.trigger_text, inputs: row.inputs,
      actions: row.actions, outputs: row.outputs, exceptions: row.exceptions, verification: row.verification,
      status: row.status, missionId: row.mission_id,
    })),
    positions: positions.map((row) => ({
      id: row.id, title: row.title, kind: row.kind, department: row.department_slug, reportsTo: row.reports_to,
    })),
    engagements: engagements.map((row) => ({
      id: row.id, positionId: row.position_id, partyId: row.party_id, partyName: row.party_name, status: row.status,
    })),
    stock: stock.map((row) => ({ offerId: row.offer_id, offerName: row.offer_name, onHand: num(row.on_hand), note: row.note })),
    quotes: quoteRows.map((row) => ({
      id: row.id, partyId: row.party_id, partyName: row.party_name, status: row.status, note: row.note, totalCents: num(row.total),
      lines: quoteLines.filter((line) => line.quote_id === row.id).map((line) => ({
        id: line.id, offerName: line.description, quantity: num(line.quantity), amountCents: num(line.amount_cents),
      })),
    })),
    orders: orderRows.map((row) => ({
      id: row.id, partyName: row.party_name, quoteId: row.quote_id, status: row.status, note: row.note, totalCents: num(row.total),
      missionIds: links.filter((link) => link.order_id === row.id).map((link) => link.mission_id),
      invoiceNumber: row.invoice_number,
    })),
    missions,
    parties: await listParties(sql, orgId),
    offers: await listOffers(sql, orgId),
    statement: await statement(sql, orgId, venture?.monthlyBurnCents ?? null),
  };
}
