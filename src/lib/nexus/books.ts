import { CompanyError, dollarsToCents } from "./company.ts";
import type { Sql } from "./company-store.ts";

export type PartyKind = "person" | "organization";
export type PartyRoleName = "customer" | "supplier" | "employee" | "contractor";

export type PartyRecord = {
  id: string;
  kind: PartyKind;
  displayName: string;
  status: "active" | "archived";
  roles: Array<{ role: PartyRoleName; status: "active" | "inactive" }>;
  contacts: Array<{ id: string; label: string; value: string }>;
};

export type OfferRecord = {
  id: string;
  kind: "product" | "service";
  name: string;
  status: "active" | "retired";
  priceCents: number;
  currency: string;
};

function nid(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function refuseAgent(actorId: string, action: string): void {
  if (actorId.startsWith("svc:")) throw new CompanyError(`An agent cannot ${action}.`);
}

export async function createParty(
  sql: Sql,
  input: { orgId: string; actorId: string; kind: string; displayName: string },
): Promise<string> {
  refuseAgent(input.actorId, "create a party");
  const name = input.displayName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) throw new CompanyError("Name the party.");
  const kind = input.kind === "organization" ? "organization" : "person";
  const id = nid("pty");
  await sql`insert into parties (id, organization_id, kind, display_name, created_by)
    values (${id}, ${input.orgId}, ${kind}, ${name}, ${input.actorId})`;
  return id;
}

export async function editParty(
  sql: Sql,
  input: { orgId: string; actorId: string; partyId: string; displayName: string },
): Promise<void> {
  refuseAgent(input.actorId, "edit a party");
  const name = input.displayName.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) throw new CompanyError("Name the party.");
  const rows = await sql<{ id: string }>`update parties set display_name = ${name}
    where id = ${input.partyId} and organization_id = ${input.orgId}
    returning id`;
  if (!rows[0]) throw new CompanyError("That party is not in this company.");
}

export async function archiveParty(sql: Sql, input: { orgId: string; actorId: string; partyId: string }): Promise<void> {
  refuseAgent(input.actorId, "archive a party");
  const rows = await sql<{ id: string }>`update parties set status = ${"archived"}
    where id = ${input.partyId} and organization_id = ${input.orgId} and status = ${"active"}
    returning id`;
  if (!rows[0]) throw new CompanyError("That active party is not in this company.");
}

export async function assignRole(
  sql: Sql,
  input: { orgId: string; actorId: string; partyId: string; role: string },
): Promise<"created" | "exists"> {
  refuseAgent(input.actorId, "assign a party role");
  const role = cleanRole(input.role);
  const rows = await sql<{ id: string }>`insert into party_roles (id, organization_id, party_id, role, assigned_by)
    select ${nid("rol")}, p.organization_id, p.id, ${role}, ${input.actorId}
    from parties p
    where p.id = ${input.partyId} and p.organization_id = ${input.orgId}
    on conflict (organization_id, party_id, role) do nothing
    returning id`;
  if (rows[0]) return "created";
  const existing = await sql<{ status: string }>`select status from party_roles
    where organization_id = ${input.orgId} and party_id = ${input.partyId} and role = ${role} limit 1`;
  if (!existing[0]) throw new CompanyError("That party is not in this company. Nothing was assigned.");
  if (existing[0].status === "inactive") {
    throw new CompanyError("That role is inactive. Reactivate it. Nothing was assigned.");
  }
  return "exists";
}

export async function deactivateRole(
  sql: Sql,
  input: { orgId: string; actorId: string; partyId: string; role: string },
): Promise<void> {
  refuseAgent(input.actorId, "remove a party role");
  const role = cleanRole(input.role);
  const rows = await sql<{ id: string }>`update party_roles set status = ${"inactive"}
    where organization_id = ${input.orgId} and party_id = ${input.partyId} and role = ${role} and status = ${"active"}
    returning id`;
  if (!rows[0]) throw new CompanyError("That active role is not in this company.");
}

export async function reactivateRole(
  sql: Sql,
  input: { orgId: string; actorId: string; partyId: string; role: string },
): Promise<void> {
  refuseAgent(input.actorId, "reactivate a party role");
  const role = cleanRole(input.role);
  const rows = await sql<{ id: string }>`update party_roles set status = ${"active"}
    where organization_id = ${input.orgId} and party_id = ${input.partyId} and role = ${role} and status = ${"inactive"}
    returning id`;
  if (!rows[0]) throw new CompanyError("That inactive role is not in this company.");
}

export async function addContact(
  sql: Sql,
  input: { orgId: string; actorId: string; partyId: string; label: string; value: string },
): Promise<void> {
  refuseAgent(input.actorId, "add a party contact");
  const label = input.label.trim().slice(0, 40);
  const value = input.value.trim().slice(0, 200);
  if (label.length < 2 || value.length < 2) throw new CompanyError("A contact needs a label and a value.");
  const rows = await sql<{ id: string }>`insert into party_contacts (id, organization_id, party_id, label, value, created_by)
    select ${nid("ctc")}, p.organization_id, p.id, ${label}, ${value}, ${input.actorId}
    from parties p
    where p.id = ${input.partyId} and p.organization_id = ${input.orgId}
    returning id`;
  if (!rows[0]) throw new CompanyError("That party is not in this company. Nothing was added.");
}

export async function listParties(sql: Sql, orgId: string): Promise<PartyRecord[]> {
  const parties = await sql<{ id: string; kind: PartyKind; display_name: string; status: "active" | "archived" }>`
    select id, kind, display_name, status from parties
    where organization_id = ${orgId}
    order by status asc, display_name asc`;
  if (parties.length === 0) return [];
  const roles = await sql<{ party_id: string; role: PartyRoleName; status: "active" | "inactive" }>`
    select party_id, role, status from party_roles where organization_id = ${orgId}`;
  const contacts = await sql<{ id: string; party_id: string; label: string; value: string }>`
    select id, party_id, label, value from party_contacts where organization_id = ${orgId} order by created_at`;
  return parties.map((party) => ({
    id: party.id,
    kind: party.kind,
    displayName: party.display_name,
    status: party.status,
    roles: roles.filter((role) => role.party_id === party.id).map((role) => ({ role: role.role, status: role.status })),
    contacts: contacts.filter((contact) => contact.party_id === party.id).map((contact) => ({
      id: contact.id,
      label: contact.label,
      value: contact.value,
    })),
  }));
}

export async function createOffer(
  sql: Sql,
  input: { orgId: string; actorId: string; kind: string; name: string; price: string },
): Promise<void> {
  refuseAgent(input.actorId, "publish an offer");
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) throw new CompanyError("Name the offer.");
  const cents = dollarsToCents(input.price);
  if (cents == null) throw new CompanyError("Enter a price like 25 or 25.00.");
  const kind = input.kind === "service" ? "service" : "product";
  await sql`insert into offers (id, organization_id, kind, name, price_cents, created_by)
    values (${nid("ofr")}, ${input.orgId}, ${kind}, ${name}, ${cents}, ${input.actorId})`;
}

export async function editOffer(
  sql: Sql,
  input: { orgId: string; actorId: string; offerId: string; name: string; price: string },
): Promise<void> {
  refuseAgent(input.actorId, "edit an offer");
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) throw new CompanyError("Name the offer.");
  const cents = dollarsToCents(input.price);
  if (cents == null) throw new CompanyError("Enter a price like 25 or 25.00.");
  const rows = await sql<{ id: string }>`update offers set name = ${name}, price_cents = ${cents}
    where id = ${input.offerId} and organization_id = ${input.orgId} and status = ${"active"}
    returning id`;
  if (!rows[0]) throw new CompanyError("That active offer is not in this company.");
}

export async function retireOffer(sql: Sql, input: { orgId: string; actorId: string; offerId: string }): Promise<void> {
  refuseAgent(input.actorId, "retire an offer");
  const rows = await sql<{ id: string }>`update offers set status = ${"retired"}
    where id = ${input.offerId} and organization_id = ${input.orgId} and status = ${"active"}
    returning id`;
  if (!rows[0]) throw new CompanyError("That active offer is not in this company.");
}

export async function listOffers(sql: Sql, orgId: string): Promise<OfferRecord[]> {
  const rows = await sql<{ id: string; kind: "product" | "service"; name: string; status: "active" | "retired"; price_cents: unknown; currency: string }>`
    select id, kind, name, status, price_cents, currency from offers
    where organization_id = ${orgId}
    order by status asc, name asc`;
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    name: row.name,
    status: row.status,
    priceCents: Number(row.price_cents ?? 0),
    currency: row.currency,
  }));
}

function cleanRole(role: string): PartyRoleName {
  if (role === "customer" || role === "supplier" || role === "employee" || role === "contractor") return role;
  throw new CompanyError("Role must be customer, supplier, employee, or contractor.");
}
