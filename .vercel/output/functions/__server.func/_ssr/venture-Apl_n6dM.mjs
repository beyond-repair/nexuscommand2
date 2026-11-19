import { N as titleFrom, a as DEPARTMENTS, i as CompanyError, y as dollarsToCents } from "./company-cyOhrTv5.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/venture-Apl_n6dM.js
function nid$1(prefix) {
	return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
function refuseAgent$1(actorId, action) {
	if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}
async function createParty(sql, input) {
	refuseAgent$1(input.actorId, "create a party");
	const name = input.displayName.trim().replace(/\s+/g, " ");
	if (name.length < 2 || name.length > 120) throw new CompanyError("Name the party.");
	const kind = input.kind === "organization" ? "organization" : "person";
	const id = nid$1("pty");
	await sql`insert into parties (id, organization_id, kind, display_name, created_by)
    values (${id}, ${input.orgId}, ${kind}, ${name}, ${input.actorId})`;
	return id;
}
async function editParty(sql, input) {
	refuseAgent$1(input.actorId, "edit a party");
	const name = input.displayName.trim().replace(/\s+/g, " ");
	if (name.length < 2 || name.length > 120) throw new CompanyError("Name the party.");
	if (!(await sql`update parties set display_name = ${name}
    where id = ${input.partyId} and organization_id = ${input.orgId}
    returning id`)[0]) throw new CompanyError("That party is not in this company.");
}
async function archiveParty(sql, input) {
	refuseAgent$1(input.actorId, "archive a party");
	if (!(await sql`update parties set status = ${"archived"}
    where id = ${input.partyId} and organization_id = ${input.orgId} and status = ${"active"}
    returning id`)[0]) throw new CompanyError("That active party is not in this company.");
}
async function assignRole(sql, input) {
	refuseAgent$1(input.actorId, "assign a party role");
	const role = cleanRole(input.role);
	if ((await sql`insert into party_roles (id, organization_id, party_id, role, assigned_by)
    select ${nid$1("rol")}, p.organization_id, p.id, ${role}, ${input.actorId}
    from parties p
    where p.id = ${input.partyId} and p.organization_id = ${input.orgId}
    on conflict (organization_id, party_id, role) do nothing
    returning id`)[0]) return "created";
	const existing = await sql`select status from party_roles
    where organization_id = ${input.orgId} and party_id = ${input.partyId} and role = ${role} limit 1`;
	if (!existing[0]) throw new CompanyError("That party is not in this company. Nothing was assigned.");
	if (existing[0].status === "inactive") throw new CompanyError("That role is inactive. Reactivate it. Nothing was assigned.");
	return "exists";
}
async function deactivateRole(sql, input) {
	refuseAgent$1(input.actorId, "remove a party role");
	const role = cleanRole(input.role);
	if (!(await sql`update party_roles set status = ${"inactive"}
    where organization_id = ${input.orgId} and party_id = ${input.partyId} and role = ${role} and status = ${"active"}
    returning id`)[0]) throw new CompanyError("That active role is not in this company.");
}
async function reactivateRole(sql, input) {
	refuseAgent$1(input.actorId, "reactivate a party role");
	const role = cleanRole(input.role);
	if (!(await sql`update party_roles set status = ${"active"}
    where organization_id = ${input.orgId} and party_id = ${input.partyId} and role = ${role} and status = ${"inactive"}
    returning id`)[0]) throw new CompanyError("That inactive role is not in this company.");
}
async function addContact(sql, input) {
	refuseAgent$1(input.actorId, "add a party contact");
	const label = input.label.trim().slice(0, 40);
	const value = input.value.trim().slice(0, 200);
	if (label.length < 2 || value.length < 2) throw new CompanyError("A contact needs a label and a value.");
	if (!(await sql`insert into party_contacts (id, organization_id, party_id, label, value, created_by)
    select ${nid$1("ctc")}, p.organization_id, p.id, ${label}, ${value}, ${input.actorId}
    from parties p
    where p.id = ${input.partyId} and p.organization_id = ${input.orgId}
    returning id`)[0]) throw new CompanyError("That party is not in this company. Nothing was added.");
}
async function listParties(sql, orgId) {
	const parties = await sql`
    select id, kind, display_name, status from parties
    where organization_id = ${orgId}
    order by status asc, display_name asc`;
	if (parties.length === 0) return [];
	const roles = await sql`
    select party_id, role, status from party_roles where organization_id = ${orgId}`;
	const contacts = await sql`
    select id, party_id, label, value from party_contacts where organization_id = ${orgId} order by created_at`;
	return parties.map((party) => ({
		id: party.id,
		kind: party.kind,
		displayName: party.display_name,
		status: party.status,
		roles: roles.filter((role) => role.party_id === party.id).map((role) => ({
			role: role.role,
			status: role.status
		})),
		contacts: contacts.filter((contact) => contact.party_id === party.id).map((contact) => ({
			id: contact.id,
			label: contact.label,
			value: contact.value
		}))
	}));
}
async function createOffer(sql, input) {
	refuseAgent$1(input.actorId, "publish an offer");
	const name = input.name.trim().replace(/\s+/g, " ");
	if (name.length < 2 || name.length > 120) throw new CompanyError("Name the offer.");
	const cents = dollarsToCents(input.price);
	if (cents == null) throw new CompanyError("Enter a price like 25 or 25.00.");
	const kind = input.kind === "service" ? "service" : "product";
	await sql`insert into offers (id, organization_id, kind, name, price_cents, created_by)
    values (${nid$1("ofr")}, ${input.orgId}, ${kind}, ${name}, ${cents}, ${input.actorId})`;
}
async function editOffer(sql, input) {
	refuseAgent$1(input.actorId, "edit an offer");
	const name = input.name.trim().replace(/\s+/g, " ");
	if (name.length < 2 || name.length > 120) throw new CompanyError("Name the offer.");
	const cents = dollarsToCents(input.price);
	if (cents == null) throw new CompanyError("Enter a price like 25 or 25.00.");
	if (!(await sql`update offers set name = ${name}, price_cents = ${cents}
    where id = ${input.offerId} and organization_id = ${input.orgId} and status = ${"active"}
    returning id`)[0]) throw new CompanyError("That active offer is not in this company.");
}
async function retireOffer(sql, input) {
	refuseAgent$1(input.actorId, "retire an offer");
	if (!(await sql`update offers set status = ${"retired"}
    where id = ${input.offerId} and organization_id = ${input.orgId} and status = ${"active"}
    returning id`)[0]) throw new CompanyError("That active offer is not in this company.");
}
async function listOffers(sql, orgId) {
	return (await sql`
    select id, kind, name, status, price_cents, currency from offers
    where organization_id = ${orgId}
    order by status asc, name asc`).map((row) => ({
		id: row.id,
		kind: row.kind,
		name: row.name,
		status: row.status,
		priceCents: Number(row.price_cents ?? 0),
		currency: row.currency
	}));
}
function cleanRole(role) {
	if (role === "customer" || role === "supplier" || role === "employee" || role === "contractor") return role;
	throw new CompanyError("Role must be customer, supplier, employee, or contractor.");
}
var STRUCTURES = [
	"undecided",
	"sole_proprietorship",
	"partnership",
	"llc",
	"corporation"
];
var STAGES = [
	"concept",
	"viability",
	"formation",
	"capitalization",
	"build",
	"launch",
	"operating",
	"closed"
];
var LAUNCH = [
	{
		domain: "formation",
		autonomy: "prepare",
		title: "Compare entity structures against this idea. Research only. This is not legal advice."
	},
	{
		domain: "formation",
		autonomy: "prepare",
		title: "Research the name, DBA rules, and trademark conflicts."
	},
	{
		domain: "formation",
		autonomy: "prepare",
		title: "List federal, state, and local licenses and permits that may apply."
	},
	{
		domain: "formation",
		autonomy: "restricted",
		title: "EIN, registration, and government filings stay with a person. NEXUS does not submit them."
	},
	{
		domain: "governance",
		autonomy: "prepare",
		title: "Draft the operating agreement, NDA, terms, and privacy policy."
	},
	{
		domain: "governance",
		autonomy: "restricted",
		title: "Signing or binding the company stays with a person. A draft is not an agreement."
	},
	{
		domain: "finance",
		autonomy: "prepare",
		title: "Build the startup budget, funding list, and monthly burn."
	},
	{
		domain: "finance",
		autonomy: "restricted",
		title: "Bank accounts, disbursements, and tax filings stay with a person. A recorded number is not a transfer."
	},
	{
		domain: "product",
		autonomy: "prepare",
		title: "Write the problem, requirements, offer, price, and cost."
	},
	{
		domain: "market",
		autonomy: "prepare",
		title: "Name the customer, the competitors, and the first campaign."
	},
	{
		domain: "market",
		autonomy: "authorized",
		title: "Staff approved campaign work. Authorization is not publication and not ad spend."
	},
	{
		domain: "market",
		autonomy: "restricted",
		title: "Publishing and paying for acquisition stay with a person."
	},
	{
		domain: "operations",
		autonomy: "prepare",
		title: "Write the first procedure, with an owner, trigger, inputs, outputs, exceptions, and a check."
	},
	{
		domain: "people",
		autonomy: "prepare",
		title: "Define positions for employees and contractors. Agents are not staff."
	},
	{
		domain: "quality",
		autonomy: "restricted",
		title: "Gather launch evidence. Recording this item does not authorize launch, and an agent cannot."
	}
];
function nid(prefix) {
	return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
function isUnique(error) {
	const message = error instanceof Error ? error.message : String(error);
	return message.includes("duplicate") || message.includes("23505") || message.toLowerCase().includes("unique");
}
function iso(value) {
	if (value == null) return null;
	if (value instanceof Date) return value.toISOString();
	return String(value) || null;
}
function num(value) {
	const parsed = typeof value === "number" ? value : Number(value ?? 0);
	return Number.isFinite(parsed) ? parsed : 0;
}
function refuseAgent(actorId, action) {
	if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}
function clean(value, min, max, label) {
	const text = value.trim().replace(/\s+/g, " ");
	if (text.length < min || text.length > max) throw new CompanyError(label);
	return text;
}
function structureOf(value) {
	if (STRUCTURES.includes(value)) return value;
	throw new CompanyError("Choose a structure, or leave it undecided. This choice is research, not a filing.");
}
function stageOf(value) {
	if (STAGES.includes(value)) return value;
	throw new CompanyError("That stage is not on the record.");
}
async function audit(sql, orgId, actorId, action, target, detail) {
	await sql`insert into audit_events (
    id, organization_id, project_id, task_id, actor_id, actor_kind, action, target, from_state, to_state, detail
  ) values (
    ${nid("aud")}, ${orgId}, ${null}, ${null}, ${actorId}, ${"human"}, ${action}, ${target}, ${null}, ${null}, ${detail.slice(0, 500)}
  )`;
}
async function ventureId(sql, orgId) {
	const rows = await sql`select id from ventures where organization_id = ${orgId} limit 1`;
	if (!rows[0]) throw new CompanyError("Open the business record first.");
	return rows[0].id;
}
async function ventureSummary(sql, orgId) {
	const rows = await sql`select name, stage from ventures where organization_id = ${orgId} limit 1`;
	if (!rows[0]) return {
		name: null,
		stage: null,
		openObligations: 0,
		restrictedOpen: 0
	};
	const counts = await sql`select
    count(*) filter (where state in ('open', 'prepared'))::int as open,
    count(*) filter (where autonomy = 'restricted' and state in ('open', 'prepared'))::int as restricted
    from obligations where organization_id = ${orgId}`;
	return {
		name: rows[0].name,
		stage: rows[0].stage,
		openObligations: num(counts[0]?.open),
		restrictedOpen: num(counts[0]?.restricted)
	};
}
async function openVenture(sql, input) {
	refuseAgent(input.actorId, "open a business record");
	const name = clean(input.name, 2, 80, "Name the business.");
	const idea = input.idea.trim();
	if (idea.length < 8 || idea.length > 2e3) throw new CompanyError("Describe the idea in at least a short sentence.");
	const structure = structureOf(input.structure);
	if ((await sql`select id from ventures where organization_id = ${input.orgId} limit 1`)[0]) throw new CompanyError("This company already has a business record.");
	const id = nid("ven");
	await sql`insert into ventures (id, organization_id, name, idea, structure, created_by)
    values (${id}, ${input.orgId}, ${name}, ${idea}, ${structure}, ${input.actorId})`;
	for (const item of LAUNCH) await sql`insert into obligations (id, organization_id, venture_id, domain, autonomy, title)
      values (${nid("obl")}, ${input.orgId}, ${id}, ${item.domain}, ${item.autonomy}, ${item.title})`;
	await audit(sql, input.orgId, input.actorId, "venture.opened", id, `${name} opened. No filing, payment, or agreement was made.`);
	return id;
}
async function setStructure(sql, input) {
	refuseAgent(input.actorId, "change the business structure");
	const structure = structureOf(input.structure);
	const rows = await sql`update ventures set structure = ${structure}
    where organization_id = ${input.orgId} returning id`;
	if (!rows[0]) throw new CompanyError("Open the business record first.");
	await audit(sql, input.orgId, input.actorId, "venture.structure", rows[0].id, `Structure marked ${structure}. This is not a registration.`);
}
async function setBurn(sql, input) {
	refuseAgent(input.actorId, "set a burn rate");
	const cents = input.amount.trim() ? dollarsToCents(input.amount) : null;
	if (input.amount.trim() && cents == null) throw new CompanyError("Enter a monthly burn like 2500 or 2500.00, or leave it blank to clear it.");
	if (!(await sql`update ventures set monthly_burn_cents = ${cents}
    where organization_id = ${input.orgId} returning id`)[0]) throw new CompanyError("Open the business record first.");
}
async function setStage(sql, input) {
	refuseAgent(input.actorId, "move the business stage");
	const stage = stageOf(input.stage);
	const current = await sql`select id, stage from ventures where organization_id = ${input.orgId} limit 1`;
	if (!current[0]) throw new CompanyError("Open the business record first.");
	if (stage === "launch" || stage === "operating") {
		if (!(await sql`select id from launch_authorizations where organization_id = ${input.orgId} limit 1`)[0]) throw new CompanyError("Launch stays closed until a person records that they authorized it. A waiver does not. A finished mission does not.");
	}
	if (stage === "operating" && current[0].stage !== "launch" && current[0].stage !== "operating") throw new CompanyError("Operating stays closed until launch readiness is recorded.");
	await sql`update ventures set stage = ${stage} where id = ${current[0].id}`;
	await audit(sql, input.orgId, input.actorId, "venture.stage", current[0].id, `Stage marked ${stage}. This is not a government status.`);
}
async function authorizeLaunch(sql, input) {
	refuseAgent(input.actorId, "authorize launch");
	const evidence = clean(input.evidence, 12, 2e3, "Record how you authorized launch. This does not verify the legal result.");
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
async function reclassifyObligation(sql, input) {
	refuseAgent(input.actorId, "change a work classification");
	const rows = await sql`select id, autonomy from obligations
    where id = ${input.obligationId} and organization_id = ${input.orgId} limit 1`;
	if (!rows[0]) throw new CompanyError("That obligation is not in this company.");
	await audit(sql, input.orgId, input.actorId, "obligation.reclassify_refused", rows[0].id, `Refused to change ${rows[0].autonomy} to ${input.autonomy.slice(0, 40)}. Classification cannot be changed.`);
	throw new CompanyError("A classification cannot be changed. Restricted work cannot be relabeled as research or owner-staffed.");
}
async function prepareObligation(sql, input) {
	refuseAgent(input.actorId, "prepare an obligation");
	if (!(await sql`update obligations set detail = ${clean(input.detail, 8, 2e3, "Write what was prepared.")}, state = ${"prepared"}
    where id = ${input.obligationId} and organization_id = ${input.orgId} and state in (${"open"}, ${"prepared"})
    returning id`)[0]) throw new CompanyError("That open obligation is not in this company.");
}
async function staffObligation(sql, input) {
	refuseAgent(input.actorId, "staff an obligation");
	const row = (await sql`
    select id, autonomy, title, detail, state, mission_id from obligations
    where id = ${input.obligationId} and organization_id = ${input.orgId} limit 1`)[0];
	if (!row) throw new CompanyError("That obligation is not in this company.");
	if (row.autonomy === "restricted") throw new CompanyError("Restricted. A person does this outside NEXUS, then records it. NEXUS will not open a mission that files, disburses, publishes, or binds the company.");
	if (row.mission_id || row.state === "authorized" || row.state === "satisfied" || row.state === "waived") throw new CompanyError("That obligation already has a mission or is closed.");
	const objective = `Business obligation: ${row.title} Preparation: ${row.detail || "none yet."} Research and draft only. Do not file, spend, publish, or sign.`.slice(0, 2e3);
	const missionId = nid("msn");
	await sql`insert into missions (id, organization_id, title, objective, status, created_by)
    values (${missionId}, ${input.orgId}, ${titleFrom(row.title)}, ${objective}, ${"PROPOSED"}, ${input.actorId})`;
	if (!(await sql`update obligations set state = ${"authorized"}, mission_id = ${missionId}
    where id = ${row.id} and organization_id = ${input.orgId} and mission_id is null and state in (${"open"}, ${"prepared"})
    returning id`)[0]) throw new CompanyError("That obligation changed before it could be staffed.");
	await audit(sql, input.orgId, input.actorId, "venture.staffed", missionId, "A proposed mission was opened. It is not authorized to execute.");
	return missionId;
}
async function recordRestricted(sql, input) {
	refuseAgent(input.actorId, "record a restricted action");
	const evidence = clean(input.evidence, 12, 2e3, "Record what the person did, and where.");
	const rows = await sql`update obligations set state = ${"satisfied"}, evidence = ${evidence}
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
async function waiveObligation(sql, input) {
	refuseAgent(input.actorId, "waive an obligation");
	if (!(await sql`update obligations set state = ${"waived"}, evidence = ${clean(input.reason, 8, 500, "Say why this obligation is waived.")}
    where id = ${input.obligationId} and organization_id = ${input.orgId} and state in (${"open"}, ${"prepared"})
    returning id`)[0]) throw new CompanyError("That open obligation is not in this company.");
}
async function addFiling(sql, input) {
	refuseAgent(input.actorId, "add a filing");
	const kind = [
		"name",
		"dba",
		"ein",
		"license",
		"permit",
		"trademark",
		"tax",
		"insurance",
		"other"
	].includes(input.kind) ? input.kind : "other";
	const venture = await ventureId(sql, input.orgId);
	await sql`insert into filings (id, organization_id, venture_id, kind, jurisdiction, deadline, note, created_by)
    values (${nid("fil")}, ${input.orgId}, ${venture}, ${kind}, ${input.jurisdiction.trim().slice(0, 120)}, ${input.deadline.trim().slice(0, 40)}, ${input.note.trim().slice(0, 500)}, ${input.actorId})`;
}
async function recordFiling(sql, input) {
	refuseAgent(input.actorId, "record a filing");
	const rows = await sql`update filings set status = ${"owner_recorded"}, note = ${clean(input.note, 8, 500, "Record what you filed, and with whom. NEXUS did not submit it.")}
    where id = ${input.filingId} and organization_id = ${input.orgId} and status in (${"research"}, ${"prepared"})
    returning id`;
	if (!rows[0]) throw new CompanyError("That filing is not open in this company.");
	await audit(sql, input.orgId, input.actorId, "filing.owner_recorded", rows[0].id, "Owner recorded a filing. NEXUS did not submit it.");
}
async function addInstrument(sql, input) {
	refuseAgent(input.actorId, "draft an instrument");
	const kind = [
		"operating_agreement",
		"nda",
		"contract",
		"terms",
		"privacy",
		"other"
	].includes(input.kind) ? input.kind : "other";
	const title = clean(input.title, 2, 120, "Name the document.");
	const venture = await ventureId(sql, input.orgId);
	await sql`insert into instruments (id, organization_id, venture_id, kind, title, body, created_by)
    values (${nid("ins")}, ${input.orgId}, ${venture}, ${kind}, ${title}, ${input.body.trim().slice(0, 8e3)}, ${input.actorId})`;
}
async function approveInstrument(sql, input) {
	refuseAgent(input.actorId, "approve a draft");
	const rows = await sql`select id, body from instruments
    where id = ${input.instrumentId} and organization_id = ${input.orgId} and status = ${"draft"} limit 1`;
	if (!rows[0]) throw new CompanyError("That draft is not in this company.");
	if (rows[0].body.trim().length < 20) throw new CompanyError("Write the draft before you approve it. Approval is not a signature.");
	await sql`update instruments set status = ${"owner_approved"} where id = ${rows[0].id}`;
	await audit(sql, input.orgId, input.actorId, "instrument.approved", rows[0].id, "Owner approved a draft. It is not a signed agreement.");
}
async function addCapital(sql, input) {
	refuseAgent(input.actorId, "add a capital item");
	const kind = input.kind === "funding" ? "funding" : "cost";
	const name = clean(input.name, 2, 120, "Name the cost or the funding source.");
	const cents = dollarsToCents(input.amount);
	if (cents == null) throw new CompanyError("Enter an amount like 1000 or 1000.00.");
	const fundingKind = kind === "funding" && [
		"loan",
		"investment",
		"grant"
	].includes(input.fundingKind) ? input.fundingKind : "";
	if (kind === "funding" && !fundingKind) throw new CompanyError("Funding is a loan, an investment, or a grant.");
	const venture = await ventureId(sql, input.orgId);
	await sql`insert into capital_items (id, organization_id, venture_id, kind, name, amount_cents, funding_kind, note, created_by)
    values (${nid("cap")}, ${input.orgId}, ${venture}, ${kind}, ${name}, ${cents}, ${fundingKind}, ${input.note.trim().slice(0, 500)}, ${input.actorId})`;
}
async function setCapitalStatus(sql, input) {
	refuseAgent(input.actorId, "change funding status");
	if (![
		"planned",
		"pursuing",
		"declined",
		"received"
	].includes(input.status)) throw new CompanyError("That funding status is not on the record.");
	const rows = await sql`update capital_items set status = ${input.status}
    where id = ${input.capitalId} and organization_id = ${input.orgId} and kind = ${"funding"}
    returning id`;
	if (!rows[0]) throw new CompanyError("That funding item is not in this company.");
	await audit(sql, input.orgId, input.actorId, "capital.status", rows[0].id, `Marked ${input.status}. This did not record a receipt.`);
}
async function partyRole(sql, orgId, partyId, role) {
	if (!(await sql`select id from party_roles
    where organization_id = ${orgId} and party_id = ${partyId} and role = ${role} and status = ${"active"} limit 1`)[0]) throw new CompanyError(`That party needs an active ${role} role in this company.`);
}
async function createInvoice(sql, input) {
	refuseAgent(input.actorId, "create an invoice");
	const direction = input.direction === "payable" ? "payable" : "receivable";
	const title = clean(input.title, 2, 120, "Name the invoice.");
	const cents = dollarsToCents(input.amount);
	if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
	await partyRole(sql, input.orgId, input.partyId, direction === "payable" ? "supplier" : "customer");
	let offerId = null;
	if (input.offerId.trim()) {
		const offer = await sql`select id from offers
      where id = ${input.offerId.trim()} and organization_id = ${input.orgId} and status = ${"active"} limit 1`;
		if (!offer[0]) throw new CompanyError("That active offer is not in this company.");
		offerId = offer[0].id;
	}
	await sql`insert into invoices (id, organization_id, direction, party_id, offer_id, title, amount_cents, created_by)
    values (${nid("inv")}, ${input.orgId}, ${direction}, ${input.partyId}, ${offerId}, ${title}, ${cents}, ${input.actorId})`;
}
async function issueInvoice(sql, input) {
	refuseAgent(input.actorId, "issue an invoice");
	const rows = await sql`update invoices set status = ${"issued"}
    where id = ${input.invoiceId} and organization_id = ${input.orgId} and status = ${"draft"} returning id`;
	if (!rows[0]) throw new CompanyError("That draft invoice is not in this company.");
	await audit(sql, input.orgId, input.actorId, "invoice.issued", rows[0].id, "Issued. No payment was created.");
}
async function voidInvoice(sql, input) {
	refuseAgent(input.actorId, "void an invoice");
	if (!(await sql`update invoices set status = ${"void"}
    where id = ${input.invoiceId} and organization_id = ${input.orgId} and status in (${"draft"}, ${"issued"}) returning id`)[0]) throw new CompanyError("That invoice is not open in this company.");
}
async function allocatePayment(sql, input) {
	refuseAgent(input.actorId, "allocate a payment");
	const cents = dollarsToCents(input.amount);
	if (cents == null) throw new CompanyError("Enter an amount like 25 or 25.00.");
	if (!sql.transaction) throw new CompanyError("The books lock is unavailable. Nothing was allocated.");
	await sql.transaction(async (tx) => {
		const invoice = await tx`
      select id, direction, amount_cents, status from invoices
      where id = ${input.invoiceId} and organization_id = ${input.orgId} for update`;
		if (!invoice[0] || invoice[0].status !== "issued") throw new CompanyError("Only an issued invoice in this company can be allocated.");
		const payment = await tx`
      select id, direction, amount_cents, voided_at from payments
      where id = ${input.paymentId} and organization_id = ${input.orgId} for update`;
		if (!payment[0] || payment[0].voided_at) throw new CompanyError("That open payment is not in this company.");
		const expect = invoice[0].direction === "payable" ? "expenditure" : "receipt";
		if (payment[0].direction !== expect) throw new CompanyError(expect === "receipt" ? "A receivable takes a receipt. An expenditure does not collect it." : "A payable takes an expenditure. A receipt does not pay it.");
		const usedInvoice = await tx`select coalesce(sum(amount_cents), 0)::int as total from invoice_allocations
      where invoice_id = ${invoice[0].id}`;
		const usedPayment = await tx`select coalesce(sum(amount_cents), 0)::int as total from invoice_allocations
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
function quantityOf(raw) {
	const text = raw.trim() || "1";
	if (!/^\d+$/.test(text)) throw new CompanyError("Enter a whole quantity.");
	const quantity = Number(text);
	if (quantity < 1 || quantity > 1e4) throw new CompanyError("Quantity must be from 1 to 10000.");
	return quantity;
}
async function createQuote(sql, input) {
	refuseAgent(input.actorId, "create a quote");
	await partyRole(sql, input.orgId, input.partyId, "customer");
	const id = nid("quo");
	await sql`insert into quotes (id, organization_id, party_id, note, created_by)
    values (${id}, ${input.orgId}, ${input.partyId}, ${input.note.trim().slice(0, 200)}, ${input.actorId})`;
	return id;
}
async function addQuoteLine(sql, input) {
	refuseAgent(input.actorId, "add a quote line");
	const quantity = quantityOf(input.quantity);
	const quote = await sql`select id, status from quotes
    where id = ${input.quoteId} and organization_id = ${input.orgId} limit 1`;
	if (!quote[0]) throw new CompanyError("That quote is not in this company.");
	if (quote[0].status !== "draft") throw new CompanyError("An issued quote does not take new lines.");
	const offer = await sql`select id, name, price_cents, status from offers
    where id = ${input.offerId} and organization_id = ${input.orgId} limit 1`;
	if (!offer[0] || offer[0].status !== "active") throw new CompanyError("A retired offer cannot be added. Choose an active offer in this company.");
	const unit = input.amount.trim() ? dollarsToCents(input.amount) : num(offer[0].price_cents);
	if (unit == null || unit < 1) throw new CompanyError("Enter a price like 25 or 25.00.");
	const total = unit * quantity;
	if (total > 1e8) throw new CompanyError("That line is too large.");
	await sql`insert into quote_lines (id, organization_id, quote_id, offer_id, quantity, amount_cents, description)
    values (${nid("qln")}, ${input.orgId}, ${quote[0].id}, ${offer[0].id}, ${quantity}, ${total}, ${offer[0].name})`;
}
async function issueQuote(sql, input) {
	refuseAgent(input.actorId, "issue a quote");
	const quote = await sql`select id, status from quotes
    where id = ${input.quoteId} and organization_id = ${input.orgId} limit 1`;
	if (!quote[0] || quote[0].status !== "draft") throw new CompanyError("That draft quote is not in this company.");
	if ((await sql`select offer_id from quote_lines
    where quote_id = ${quote[0].id} and organization_id = ${input.orgId}`).length === 0) throw new CompanyError("Add a line before issuing the quote.");
	if ((await sql`select o.id from offers o
    join quote_lines l on l.offer_id = o.id and l.organization_id = o.organization_id
    where l.quote_id = ${quote[0].id} and l.organization_id = ${input.orgId} and o.status <> ${"active"} limit 1`)[0]) throw new CompanyError("A retired offer is on this quote. Remove it before issuing.");
	const rows = await sql`update quotes set status = ${"issued"}
    where id = ${quote[0].id} and organization_id = ${input.orgId} and status = ${"draft"} returning id`;
	if (!rows[0]) throw new CompanyError("That draft quote is not in this company.");
	await audit(sql, input.orgId, input.actorId, "quote.issued", rows[0].id, "Issued. This is not an order and not a payment.");
}
async function acceptQuote(sql, input) {
	refuseAgent(input.actorId, "accept a quote");
	if (!sql.transaction) throw new CompanyError("The books lock is unavailable. No order was created.");
	return sql.transaction(async (tx) => {
		const quote = await tx`select id, party_id, status, note from quotes
      where id = ${input.quoteId} and organization_id = ${input.orgId} for update`;
		if (!quote[0]) throw new CompanyError("That quote is not in this company.");
		if (quote[0].status !== "issued") throw new CompanyError("Issue the quote before it becomes an order.");
		const lines = await tx`
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
		for (const line of lines) await tx`insert into order_lines (id, organization_id, order_id, offer_id, quantity, amount_cents, description)
        values (${nid("oln")}, ${input.orgId}, ${orderId}, ${line.offer_id}, ${num(line.quantity)}, ${num(line.amount_cents)}, ${line.description})`;
		await audit(tx, input.orgId, input.actorId, "order.accepted", orderId, "Owner accepted the quote. No payment was taken and no mission was authorized.");
		return orderId;
	});
}
async function cancelOrder(sql, input) {
	refuseAgent(input.actorId, "cancel an order");
	const rows = await sql`update orders set status = ${"cancelled"}
    where id = ${input.orderId} and organization_id = ${input.orgId} and status = ${"accepted"} returning id`;
	if (!rows[0]) throw new CompanyError("That accepted order is not in this company.");
	await audit(sql, input.orgId, input.actorId, "order.cancelled", rows[0].id, "Cancelled. Lines remain. Linked missions were not cancelled.");
}
async function fulfillOrder(sql, input) {
	refuseAgent(input.actorId, "fulfill an order");
	const rows = await sql`update orders set status = ${"fulfilled"}
    where id = ${input.orderId} and organization_id = ${input.orgId} and status = ${"accepted"} returning id`;
	if (!rows[0]) throw new CompanyError("That accepted order is not in this company.");
	await audit(sql, input.orgId, input.actorId, "order.fulfilled", rows[0].id, "Marked fulfilled. No payment was created.");
}
async function linkOrderMission(sql, input) {
	refuseAgent(input.actorId, "link an order to a mission");
	try {
		const rows = await sql`insert into order_mission_links (organization_id, order_id, mission_id, linked_by)
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
async function invoiceOrder(sql, input) {
	refuseAgent(input.actorId, "invoice an order");
	if (!sql.transaction) throw new CompanyError("The books lock is unavailable. No invoice was issued.");
	return sql.transaction(async (tx) => {
		const order = await tx`select id, party_id, status, note from orders
      where id = ${input.orderId} and organization_id = ${input.orgId} for update`;
		if (!order[0] || order[0].status !== "accepted" && order[0].status !== "fulfilled") throw new CompanyError("Only an accepted order in this company can be invoiced.");
		if ((await tx`select id from invoices
      where organization_id = ${input.orgId} and order_id = ${order[0].id} and status <> ${"void"} limit 1`)[0]) throw new CompanyError("That order already has an invoice.");
		const lines = await tx`select description, amount_cents from order_lines
      where order_id = ${order[0].id} and organization_id = ${input.orgId}`;
		const total = lines.reduce((sum, line) => sum + num(line.amount_cents), 0);
		if (total < 1) throw new CompanyError("That order has no amount to invoice.");
		const seq = await tx`select coalesce(max(substring(number from 5)::int), 0)::int as n from invoices
      where organization_id = ${input.orgId} and number like ${"INV-%"}`;
		const number = `INV-${String(num(seq[0]?.n) + 1).padStart(4, "0")}`;
		const invoiceId = nid("inv");
		const title = order[0].note.trim() || "Order";
		await tx`insert into invoices (id, organization_id, direction, party_id, title, amount_cents, status, created_by, order_id, number)
      values (${invoiceId}, ${input.orgId}, ${"receivable"}, ${order[0].party_id}, ${title}, ${total}, ${"issued"}, ${input.actorId}, ${order[0].id}, ${number})`;
		for (const line of lines) await tx`insert into invoice_lines (id, organization_id, invoice_id, description, amount_cents)
        values (${nid("iln")}, ${input.orgId}, ${invoiceId}, ${line.description}, ${num(line.amount_cents)})`;
		await audit(tx, input.orgId, input.actorId, "invoice.issued", invoiceId, `${number} issued from an order. No payment was created.`);
		return invoiceId;
	});
}
async function addBrief(sql, input) {
	refuseAgent(input.actorId, "write a product brief");
	const problem = clean(input.problem, 8, 500, "Name the market problem.");
	let offerId = null;
	if (input.offerId.trim()) {
		const offer = await sql`select id from offers where id = ${input.offerId.trim()} and organization_id = ${input.orgId} limit 1`;
		if (!offer[0]) throw new CompanyError("That offer is not in this company.");
		offerId = offer[0].id;
	}
	const cost = input.cost.trim() ? dollarsToCents(input.cost) : null;
	if (input.cost.trim() && cost == null) throw new CompanyError("Enter a cost like 10 or 10.00, or leave it blank. A cost is not a charge.");
	await sql`insert into product_briefs (
    id, organization_id, offer_id, problem, requirements, value_proposition, cost_cents, created_by
  ) values (
    ${nid("brf")}, ${input.orgId}, ${offerId}, ${problem}, ${input.requirements.trim().slice(0, 2e3)},
    ${input.value.trim().slice(0, 500)}, ${cost}, ${input.actorId}
  )`;
}
async function addFeedback(sql, input) {
	refuseAgent(input.actorId, "record product feedback");
	if (!(await sql`update product_briefs set feedback = ${clean(input.feedback, 2, 2e3, "Write the feedback.")}
    where id = ${input.briefId} and organization_id = ${input.orgId} returning id`)[0]) throw new CompanyError("That brief is not in this company.");
}
async function addCampaign(sql, input) {
	refuseAgent(input.actorId, "draft a campaign");
	const name = clean(input.name, 2, 120, "Name the campaign.");
	const budget = input.amount.trim() ? dollarsToCents(input.amount) : 0;
	if (input.amount.trim() && budget == null) throw new CompanyError("Enter a budget like 100 or leave it blank. A budget is not spend.");
	await sql`insert into campaigns (id, organization_id, name, segment, channel, budget_cents, note, created_by)
    values (${nid("cmp")}, ${input.orgId}, ${name}, ${input.segment.trim().slice(0, 160)}, ${input.channel.trim().slice(0, 80)}, ${budget ?? 0}, ${input.note.trim().slice(0, 500)}, ${input.actorId})`;
}
async function authorizeCampaign(sql, input) {
	refuseAgent(input.actorId, "authorize a campaign");
	const rows = await sql`update campaigns set status = ${"authorized"}
    where id = ${input.campaignId} and organization_id = ${input.orgId} and status = ${"draft"} returning id`;
	if (!rows[0]) throw new CompanyError("That draft campaign is not in this company.");
	await audit(sql, input.orgId, input.actorId, "campaign.authorized", rows[0].id, "Authorized to prepare. No money moved and nothing was published.");
}
async function closeCampaign(sql, input) {
	refuseAgent(input.actorId, "close a campaign");
	if (!(await sql`update campaigns set status = ${"closed"}
    where id = ${input.campaignId} and organization_id = ${input.orgId} and status in (${"draft"}, ${"authorized"}) returning id`)[0]) throw new CompanyError("That campaign is not open in this company.");
}
async function addMarketNote(sql, input) {
	refuseAgent(input.actorId, "add market research");
	const kind = input.kind === "competitor" || input.kind === "channel" ? input.kind : "segment";
	const name = clean(input.name, 2, 120, "Name the segment, competitor, or channel.");
	await sql`insert into market_notes (id, organization_id, kind, name, detail, created_by)
    values (${nid("mkt")}, ${input.orgId}, ${kind}, ${name}, ${input.detail.trim().slice(0, 2e3)}, ${input.actorId})`;
}
async function addProcedure(sql, input) {
	refuseAgent(input.actorId, "write a procedure");
	const name = clean(input.name, 2, 120, "Name the procedure.");
	const owner = clean(input.owner, 2, 80, "Name the owner of the procedure.");
	const trigger = clean(input.trigger, 2, 300, "Name what starts the procedure.");
	const inputs = clean(input.inputs, 2, 1e3, "Name the required inputs.");
	const actions = clean(input.actions, 2, 2e3, "Name the authorized actions.");
	const outputs = clean(input.outputs, 2, 1e3, "Name the expected outputs.");
	const exceptions = clean(input.exceptions, 2, 1e3, "Name the exception path.");
	const verification = clean(input.verification, 2, 1e3, "Name how the result is checked.");
	await sql`insert into procedures (
    id, organization_id, name, owner_label, trigger_text, inputs, actions, outputs, exceptions, verification, created_by
  ) values (
    ${nid("sop")}, ${input.orgId}, ${name}, ${owner}, ${trigger}, ${inputs}, ${actions}, ${outputs}, ${exceptions}, ${verification}, ${input.actorId}
  )`;
}
async function activateProcedure(sql, input) {
	refuseAgent(input.actorId, "activate a procedure");
	if (!(await sql`update procedures set status = ${"active"}
    where id = ${input.procedureId} and organization_id = ${input.orgId} and status = ${"draft"} returning id`)[0]) throw new CompanyError("That draft procedure is not in this company.");
}
async function runProcedure(sql, input) {
	refuseAgent(input.actorId, "run a procedure");
	const row = (await sql`
    select id, name, owner_label, trigger_text, inputs, actions, outputs, exceptions, verification, mission_id
    from procedures where id = ${input.procedureId} and organization_id = ${input.orgId} and status = ${"active"} limit 1`)[0];
	if (!row) throw new CompanyError("That active procedure is not in this company.");
	if (row.mission_id) throw new CompanyError("That procedure already opened a mission.");
	const objective = `Procedure ${row.name}. Owner ${row.owner_label}. Trigger: ${row.trigger_text}. Inputs: ${row.inputs}. Actions: ${row.actions}. Outputs: ${row.outputs}. Exceptions: ${row.exceptions}. Check: ${row.verification}. Do not take a restricted action.`;
	const missionId = nid("msn");
	await sql`insert into missions (id, organization_id, title, objective, status, created_by)
    values (${missionId}, ${input.orgId}, ${titleFrom(row.name)}, ${objective.slice(0, 2e3)}, ${"PROPOSED"}, ${input.actorId})`;
	await sql`update procedures set mission_id = ${missionId} where id = ${row.id} and mission_id is null`;
	await audit(sql, input.orgId, input.actorId, "procedure.mission", missionId, "A proposed mission was opened from a procedure. It is not authorized to execute.");
	return missionId;
}
async function retireProcedure(sql, input) {
	refuseAgent(input.actorId, "retire a procedure");
	if (!(await sql`update procedures set status = ${"retired"}
    where id = ${input.procedureId} and organization_id = ${input.orgId} and status in (${"draft"}, ${"active"}) returning id`)[0]) throw new CompanyError("That procedure is not in this company.");
}
async function addPosition(sql, input) {
	refuseAgent(input.actorId, "define a position");
	if (input.kind !== "employee" && input.kind !== "contractor") throw new CompanyError("A position is for an employee or a contractor. Agents stay on the workforce.");
	const title = clean(input.title, 2, 80, "Name the position.");
	const department = DEPARTMENTS.some((item) => item.slug === input.department) ? input.department : "";
	await sql`insert into positions (id, organization_id, title, kind, department_slug, reports_to, created_by)
    values (${nid("pos")}, ${input.orgId}, ${title}, ${input.kind}, ${department}, ${input.reportsTo.trim().slice(0, 80)}, ${input.actorId})`;
}
async function engage(sql, input) {
	refuseAgent(input.actorId, "engage a person");
	const position = await sql`select id, kind from positions
    where id = ${input.positionId} and organization_id = ${input.orgId} limit 1`;
	if (!position[0]) throw new CompanyError("That position is not in this company.");
	await partyRole(sql, input.orgId, input.partyId, position[0].kind);
	await sql`insert into engagements (id, organization_id, position_id, party_id, created_by)
    values (${nid("eng")}, ${input.orgId}, ${position[0].id}, ${input.partyId}, ${input.actorId})`;
}
async function endEngagement(sql, input) {
	refuseAgent(input.actorId, "end an engagement");
	if (!(await sql`update engagements set status = ${"ended"}
    where id = ${input.engagementId} and organization_id = ${input.orgId} and status in (${"planned"}, ${"active"}) returning id`)[0]) throw new CompanyError("That engagement is not open in this company.");
}
async function setStock(sql, input) {
	refuseAgent(input.actorId, "count stock");
	if (!/^\d+$/.test(input.onHand.trim())) throw new CompanyError("Enter a whole number on hand. A sale does not change this count.");
	const onHand = Number(input.onHand.trim());
	const offer = await sql`select id from offers where id = ${input.offerId} and organization_id = ${input.orgId} limit 1`;
	if (!offer[0]) throw new CompanyError("That offer is not in this company.");
	await sql`insert into stock_counts (id, organization_id, offer_id, on_hand, note, created_by)
    values (${nid("stk")}, ${input.orgId}, ${offer[0].id}, ${onHand}, ${input.note.trim().slice(0, 200)}, ${input.actorId})
    on conflict (organization_id, offer_id) do update set on_hand = ${onHand}, note = ${input.note.trim().slice(0, 200)}, updated_at = now()`;
}
async function statement(sql, orgId, burn) {
	const cash = await sql`select
    coalesce(sum(amount_cents) filter (where direction = 'receipt' and voided_at is null), 0)::int as received,
    coalesce(sum(amount_cents) filter (where direction = 'expenditure' and voided_at is null), 0)::int as spent
    from payments where organization_id = ${orgId}`;
	const capital = await sql`select
    coalesce(sum(amount_cents) filter (where kind = 'cost'), 0)::int as costs,
    coalesce(sum(amount_cents) filter (where kind = 'funding' and status = 'received'), 0)::int as marked
    from capital_items where organization_id = ${orgId}`;
	const invoices = await sql`select i.direction,
    greatest(i.amount_cents - coalesce((select sum(amount_cents) from invoice_allocations a where a.invoice_id = i.id), 0), 0)::int as open_cents
    from invoices i where i.organization_id = ${orgId} and i.status = ${"issued"}`;
	let receivable = 0;
	let payable = 0;
	for (const row of invoices) if (row.direction === "payable") payable += num(row.open_cents);
	else receivable += num(row.open_cents);
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
		note: "Recorded margin is receipts minus expenditures. It is not a bank balance, not profit, and not a tax return. Funding marked received is not cash until you record a receipt."
	};
}
async function loadBusiness(sql, orgId) {
	const ventureRows = await sql`
    select id, name, idea, structure, stage, monthly_burn_cents from ventures where organization_id = ${orgId} limit 1`;
	const launch = await sql`
    select evidence, created_at from launch_authorizations where organization_id = ${orgId} limit 1`;
	const obligations = await sql`
    select id, domain, autonomy, state, title, detail, evidence, mission_id from obligations
    where organization_id = ${orgId} order by created_at`;
	const outstanding = obligations.filter((row) => row.state === "open" || row.state === "prepared").length;
	const fulfilled = obligations.filter((row) => row.state === "satisfied").length;
	const waived = obligations.filter((row) => row.state === "waived").length;
	const launchAuthorized = Boolean(launch[0]);
	const venture = ventureRows[0] ? {
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
		operating: ventureRows[0].stage === "operating"
	} : null;
	const filings = await sql`
    select id, kind, jurisdiction, status, deadline, note from filings where organization_id = ${orgId} order by created_at desc`;
	const instruments = await sql`
    select id, kind, title, body, status from instruments where organization_id = ${orgId} order by created_at desc`;
	const capital = await sql`
    select id, kind, name, amount_cents, funding_kind, status, note from capital_items where organization_id = ${orgId} order by created_at desc`;
	const invoiceRows = await sql`
    select i.id, i.direction, i.party_id, p.display_name as party_name, i.title, i.amount_cents, i.status,
      coalesce((select sum(amount_cents) from invoice_allocations a where a.invoice_id = i.id), 0)::int as allocated,
      i.number, i.order_id
    from invoices i
    left join parties p on p.id = i.party_id and p.organization_id = i.organization_id
    where i.organization_id = ${orgId} order by i.created_at desc`;
	const paymentRows = await sql`
    select p.id, p.payer, p.direction, p.amount_cents,
      coalesce((select sum(amount_cents) from invoice_allocations a where a.payment_id = p.id), 0)::int as allocated
    from payments p where p.organization_id = ${orgId} and p.voided_at is null order by p.created_at desc limit 40`;
	const briefs = await sql`
    select b.id, b.offer_id, o.name as offer_name, b.problem, b.requirements, b.value_proposition, b.cost_cents, b.feedback
    from product_briefs b
    left join offers o on o.id = b.offer_id and o.organization_id = b.organization_id
    where b.organization_id = ${orgId} order by b.created_at desc`;
	const campaigns = await sql`
    select id, name, segment, channel, status, budget_cents, note from campaigns where organization_id = ${orgId} order by created_at desc`;
	const notes = await sql`
    select id, kind, name, detail from market_notes where organization_id = ${orgId} order by created_at desc`;
	const procedures = await sql`
    select id, name, owner_label, trigger_text, inputs, actions, outputs, exceptions, verification, status, mission_id
    from procedures where organization_id = ${orgId} order by created_at desc`;
	const positions = await sql`
    select id, title, kind, department_slug, reports_to from positions where organization_id = ${orgId} order by title`;
	const engagements = await sql`
    select e.id, e.position_id, e.party_id, p.display_name as party_name, e.status
    from engagements e join parties p on p.id = e.party_id and p.organization_id = e.organization_id
    where e.organization_id = ${orgId} order by e.created_at desc`;
	const stock = await sql`
    select s.offer_id, o.name as offer_name, s.on_hand, s.note
    from stock_counts s join offers o on o.id = s.offer_id and o.organization_id = s.organization_id
    where s.organization_id = ${orgId}`;
	const quoteRows = await sql`
    select q.id, q.party_id, p.display_name as party_name, q.status, q.note,
      coalesce((select sum(amount_cents) from quote_lines l where l.quote_id = q.id), 0)::int as total
    from quotes q join parties p on p.id = q.party_id and p.organization_id = q.organization_id
    where q.organization_id = ${orgId} order by q.created_at desc`;
	const quoteLines = await sql`
    select id, quote_id, description, quantity, amount_cents from quote_lines where organization_id = ${orgId}`;
	const orderRows = await sql`
    select o.id, p.display_name as party_name, o.quote_id, o.status, o.note,
      coalesce((select sum(amount_cents) from order_lines l where l.order_id = o.id), 0)::int as total,
      (select i.number from invoices i where i.order_id = o.id and i.organization_id = o.organization_id and i.status <> 'void' limit 1) as invoice_number
    from orders o join parties p on p.id = o.party_id and p.organization_id = o.organization_id
    where o.organization_id = ${orgId} order by o.created_at desc`;
	const links = await sql`
    select order_id, mission_id from order_mission_links where organization_id = ${orgId}`;
	const missions = await sql`
    select id, title, status from missions where organization_id = ${orgId} order by updated_at desc limit 40`;
	return {
		venture,
		obligations: obligations.map((row) => ({
			id: row.id,
			domain: row.domain,
			autonomy: row.autonomy,
			state: row.state,
			title: row.title,
			detail: row.detail,
			evidence: row.evidence,
			missionId: row.mission_id
		})),
		filings,
		instruments,
		capital: capital.map((row) => ({
			id: row.id,
			kind: row.kind,
			name: row.name,
			amountCents: num(row.amount_cents),
			fundingKind: row.funding_kind,
			status: row.status,
			note: row.note
		})),
		invoices: invoiceRows.map((row) => ({
			id: row.id,
			direction: row.direction,
			partyId: row.party_id,
			partyName: row.party_name ?? "",
			title: row.title,
			amountCents: num(row.amount_cents),
			status: row.status,
			allocatedCents: num(row.allocated),
			number: row.number,
			orderId: row.order_id
		})),
		payments: paymentRows.map((row) => ({
			id: row.id,
			payer: row.payer,
			direction: row.direction,
			amountCents: num(row.amount_cents),
			allocatedCents: num(row.allocated)
		})),
		briefs: briefs.map((row) => ({
			id: row.id,
			offerId: row.offer_id,
			offerName: row.offer_name ?? "",
			problem: row.problem,
			requirements: row.requirements,
			valueProposition: row.value_proposition,
			costCents: row.cost_cents == null ? null : num(row.cost_cents),
			feedback: row.feedback
		})),
		campaigns: campaigns.map((row) => ({
			id: row.id,
			name: row.name,
			segment: row.segment,
			channel: row.channel,
			status: row.status,
			budgetCents: num(row.budget_cents),
			note: row.note
		})),
		notes,
		procedures: procedures.map((row) => ({
			id: row.id,
			name: row.name,
			ownerLabel: row.owner_label,
			trigger: row.trigger_text,
			inputs: row.inputs,
			actions: row.actions,
			outputs: row.outputs,
			exceptions: row.exceptions,
			verification: row.verification,
			status: row.status,
			missionId: row.mission_id
		})),
		positions: positions.map((row) => ({
			id: row.id,
			title: row.title,
			kind: row.kind,
			department: row.department_slug,
			reportsTo: row.reports_to
		})),
		engagements: engagements.map((row) => ({
			id: row.id,
			positionId: row.position_id,
			partyId: row.party_id,
			partyName: row.party_name,
			status: row.status
		})),
		stock: stock.map((row) => ({
			offerId: row.offer_id,
			offerName: row.offer_name,
			onHand: num(row.on_hand),
			note: row.note
		})),
		quotes: quoteRows.map((row) => ({
			id: row.id,
			partyId: row.party_id,
			partyName: row.party_name,
			status: row.status,
			note: row.note,
			totalCents: num(row.total),
			lines: quoteLines.filter((line) => line.quote_id === row.id).map((line) => ({
				id: line.id,
				offerName: line.description,
				quantity: num(line.quantity),
				amountCents: num(line.amount_cents)
			}))
		})),
		orders: orderRows.map((row) => ({
			id: row.id,
			partyName: row.party_name,
			quoteId: row.quote_id,
			status: row.status,
			note: row.note,
			totalCents: num(row.total),
			missionIds: links.filter((link) => link.order_id === row.id).map((link) => link.mission_id),
			invoiceNumber: row.invoice_number
		})),
		missions,
		parties: await listParties(sql, orgId),
		offers: await listOffers(sql, orgId),
		statement: await statement(sql, orgId, venture?.monthlyBurnCents ?? null)
	};
}
//#endregion
export { setStock as $, editParty as A, loadBusiness as B, closeCampaign as C, createQuote as D, createParty as E, issueInvoice as F, recordFiling as G, prepareObligation as H, issueQuote as I, retireProcedure as J, recordRestricted as K, linkOrderMission as L, engage as M, fulfillOrder as N, deactivateRole as O, invoiceOrder as P, setStage as Q, listOffers as R, cancelOrder as S, createOffer as T, reactivateRole as U, openVenture as V, reclassifyObligation as W, setBurn as X, runProcedure as Y, setCapitalStatus as Z, approveInstrument as _, addBrief as a, authorizeCampaign as b, addContact as c, addInstrument as d, setStructure as et, addMarketNote as f, allocatePayment as g, addQuoteLine as h, activateProcedure as i, waiveObligation as it, endEngagement as j, editOffer as k, addFeedback as l, addProcedure as m, STRUCTURES as n, ventureSummary as nt, addCampaign as o, addPosition as p, retireOffer as q, acceptQuote as r, voidInvoice as rt, addCapital as s, STAGES as t, staffObligation as tt, addFiling as u, archiveParty as v, createInvoice as w, authorizeLaunch as x, assignRole as y, listParties as z };
