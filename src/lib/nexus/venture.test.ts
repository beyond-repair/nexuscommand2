import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { assignRole, createOffer, createParty, deactivateRole, reactivateRole, retireOffer } from "./books.ts";
import { CompanyError } from "./company.ts";
import { commandCenter, recordExpenditure, recordPayment, setSpendingCeiling, submitMission, type Sql } from "./company-store.ts";
import {
  acceptQuote,
  activateProcedure,
  addCampaign,
  addCapital,
  addPosition,
  addProcedure,
  addQuoteLine,
  allocatePayment,
  authorizeCampaign,
  authorizeLaunch,
  cancelOrder,
  createInvoice,
  createQuote,
  engage,
  fulfillOrder,
  invoiceOrder,
  issueInvoice,
  issueQuote,
  linkOrderMission,
  loadBusiness,
  openVenture,
  postBalancedEntry,
  recordRestricted,
  refuseManualJournal,
  runProcedure,
  setCapitalStatus,
  setStage,
  setStock,
  staffObligation,
  voidInvoice,
  waiveObligation,
} from "./venture.ts";

function wrap(db: PGlite): Sql {
  const sql = (async <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
    const result = await db.query<T>(text, values);
    return result.rows;
  }) as Sql;
  sql.transaction = async <T>(fn: (tx: Sql) => Promise<T>): Promise<T> =>
    db.transaction(async (tx) => {
      const inner = (async <R>(strings: TemplateStringsArray, ...values: unknown[]): Promise<R[]> => {
        let text = strings[0] ?? "";
        for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
        const result = await tx.query<R>(text, values);
        return result.rows;
      }) as Sql;
      return fn(inner);
    });
  return sql;
}

async function migrated(): Promise<{ db: PGlite; sql: Sql }> {
  const db = new PGlite();
  const directory = join(dirname(fileURLToPath(import.meta.url)), "../../../migrations");
  const files = readdirSync(directory).filter((name) => name.endsWith(".sql")).sort();
  for (const name of files) await db.exec(readFileSync(join(directory, name), "utf8"));
  return { db, sql: wrap(db) };
}

test("a business record coordinates the company and does not grant restricted authority", async () => {
  const { db, sql } = await migrated();
  const owner = "user_owner";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  await assert.rejects(
    openVenture(sql, { orgId, actorId: "svc:nexus", name: "North Desk", idea: "A desk for contractors.", structure: "llc" }),
    /agent cannot/,
  );
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "A desk for contractors who need invoices.", structure: "llc" });
  await assert.rejects(
    openVenture(sql, { orgId, actorId: owner, name: "Second", idea: "Another company inside this one.", structure: "llc" }),
    /already has a business/,
  );
  const view = await loadBusiness(sql, orgId);
  const domains = new Set(view.obligations.map((item) => item.domain));
  for (const domain of ["formation", "governance", "finance", "product", "market", "operations", "people", "quality"]) {
    assert.equal(domains.has(domain as never), true, domain);
  }
  assert.equal(view.venture?.stage, "concept");
  assert.equal((await commandCenter(sql, owner)).business.name, "North Desk");

  const restricted = view.obligations.find((item) => item.autonomy === "restricted" && item.domain === "formation");
  const prepare = view.obligations.find((item) => item.autonomy === "prepare");
  assert.ok(restricted && prepare);
  const before = await db.query<{ n: number }>("select count(*)::int as n from missions");
  await assert.rejects(staffObligation(sql, { orgId, actorId: owner, obligationId: restricted.id }), /Restricted/);
  assert.equal((await db.query<{ n: number }>("select count(*)::int as n from missions")).rows[0]?.n, before.rows[0]?.n);
  const missionId = await staffObligation(sql, { orgId, actorId: owner, obligationId: prepare.id });
  const mission = await db.query<{ status: string }>("select status from missions where id = $1", [missionId]);
  assert.equal(mission.rows[0]?.status, "PROPOSED");

  const quality = view.obligations.find((item) => item.domain === "quality");
  assert.ok(quality);
  await waiveObligation(sql, { orgId, actorId: owner, obligationId: quality.id, reason: "Skipping the gate for now." });
  await assert.rejects(setStage(sql, { orgId, actorId: owner, stage: "launch" }), /Launch stays closed/);
  await db.exec("update obligations set state = 'open', evidence = '' where domain = 'quality'");
  await recordRestricted(sql, { orgId, actorId: owner, obligationId: quality.id, evidence: "I authorized launch myself on paper." });
  const filings = await db.query("select id from filings");
  assert.equal(filings.rows.length, 0);
  await assert.rejects(setStage(sql, { orgId, actorId: owner, stage: "launch" }), /Launch stays closed/);
  await assert.rejects(authorizeLaunch(sql, { orgId, actorId: "svc:nexus", evidence: "An agent recorded this without a person." }), /agent cannot/);
  await authorizeLaunch(sql, { orgId, actorId: owner, evidence: "I authorized launch myself on paper." });
  await setStage(sql, { orgId, actorId: owner, stage: "launch" });
  assert.equal((await loadBusiness(sql, orgId)).venture?.stage, "launch");
  await db.close();
});

test("invoices, campaigns, and funding marks do not move the payment ledger", async () => {
  const { db, sql } = await migrated();
  const owner = "user_books";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "Sell a contractor desk service.", structure: "llc" });
  const customer = await createParty(sql, { orgId, actorId: owner, kind: "person", displayName: "Ada Client" });
  const supplier = await createParty(sql, { orgId, actorId: owner, kind: "organization", displayName: "Supply Co" });
  await assignRole(sql, { orgId, actorId: owner, partyId: customer, role: "customer" });
  await assignRole(sql, { orgId, actorId: owner, partyId: supplier, role: "supplier" });
  await createOffer(sql, { orgId, actorId: owner, kind: "service", name: "Desk setup", price: "40.00" });
  const offer = (await loadBusiness(sql, orgId)).offers[0];
  assert.ok(offer);
  await setStock(sql, { orgId, actorId: owner, offerId: offer.id, onHand: "4", note: "counted" });
  await createInvoice(sql, { orgId, actorId: owner, direction: "receivable", partyId: customer, offerId: offer.id, title: "Setup", amount: "40.00" });
  const invoice = (await loadBusiness(sql, orgId)).invoices[0];
  assert.ok(invoice);
  await issueInvoice(sql, { orgId, actorId: owner, invoiceId: invoice.id });
  assert.equal((await db.query("select id from payments")).rows.length, 0);
  assert.equal((await loadBusiness(sql, orgId)).stock[0]?.onHand, 4);

  await recordPayment(sql, owner, { payer: "Ada Client", amount: "40.00", note: "arrived", missionId: "" });
  await recordExpenditure(sql, owner, { payer: "Supply Co", amount: "10.00", note: "parts", missionId: "" });
  const books = await loadBusiness(sql, orgId);
  const receipt = books.payments.find((row) => row.direction === "receipt");
  const spend = books.payments.find((row) => row.direction === "expenditure");
  assert.ok(receipt && spend);
  await assert.rejects(
    allocatePayment(sql, { orgId, actorId: owner, invoiceId: invoice.id, paymentId: spend.id, amount: "10.00" }),
    /receivable takes a receipt/,
  );
  await allocatePayment(sql, { orgId, actorId: owner, invoiceId: invoice.id, paymentId: receipt.id, amount: "40.00" });
  await assert.rejects(
    allocatePayment(sql, { orgId, actorId: owner, invoiceId: invoice.id, paymentId: receipt.id, amount: "1.00" }),
    /more than/,
  );
  assert.equal((await loadBusiness(sql, orgId)).statement.receivableCents, 0);
  assert.equal((await loadBusiness(sql, orgId)).statement.receivedCents, 4000);

  await addCapital(sql, { orgId, actorId: owner, kind: "funding", name: "Family note", amount: "500.00", fundingKind: "loan", note: "" });
  const capital = (await loadBusiness(sql, orgId)).capital[0];
  assert.ok(capital);
  await setCapitalStatus(sql, { orgId, actorId: owner, capitalId: capital.id, status: "received" });
  assert.equal((await db.query<{ n: number }>("select count(*)::int as n from payments")).rows[0]?.n, 2);
  assert.equal((await loadBusiness(sql, orgId)).statement.fundingMarkedReceivedCents, 50000);
  assert.equal((await loadBusiness(sql, orgId)).statement.receivedCents, 4000);

  await addCampaign(sql, { orgId, actorId: owner, name: "Launch note", segment: "contractors", channel: "email", amount: "25.00", note: "" });
  const campaign = (await loadBusiness(sql, orgId)).campaigns[0];
  assert.ok(campaign);
  await authorizeCampaign(sql, { orgId, actorId: owner, campaignId: campaign.id });
  assert.equal((await db.query<{ n: number }>("select count(*)::int as n from payments")).rows[0]?.n, 2);

  await addPosition(sql, { orgId, actorId: owner, title: "Bookkeeper", kind: "contractor", department: "business", reportsTo: "Owner" });
  const position = (await loadBusiness(sql, orgId)).positions[0];
  assert.ok(position);
  await assert.rejects(engage(sql, { orgId, actorId: owner, positionId: position.id, partyId: customer }), /contractor role/);
  await assert.rejects(engage(sql, { orgId, actorId: "svc:nexus", positionId: position.id, partyId: supplier }), /agent cannot/);
  await assignRole(sql, { orgId, actorId: owner, partyId: supplier, role: "contractor" });
  await engage(sql, { orgId, actorId: owner, positionId: position.id, partyId: supplier });

  await addProcedure(sql, {
    orgId, actorId: owner, name: "Open the day", owner: "Owner", trigger: "Weekday morning",
    inputs: "Yesterday's ledger", actions: "Read open invoices", outputs: "A note", exceptions: "Stop if the books do not match", verification: "Owner checks the note",
  });
  const procedure = (await loadBusiness(sql, orgId)).procedures[0];
  assert.ok(procedure);
  await activateProcedure(sql, { orgId, actorId: owner, procedureId: procedure.id });
  const missionId = await runProcedure(sql, { orgId, actorId: owner, procedureId: procedure.id });
  assert.equal((await db.query<{ status: string }>("select status from missions where id = $1", [missionId])).rows[0]?.status, "PROPOSED");
  await db.close();
});

test("another company cannot read or attach this business", async () => {
  const { db, sql } = await migrated();
  const alpha = (await commandCenter(sql, "user_alpha")).organization.id;
  const beta = (await commandCenter(sql, "user_beta")).organization.id;
  await openVenture(sql, { orgId: alpha, actorId: "user_alpha", name: "Alpha Desk", idea: "Alpha keeps its own formation.", structure: "llc" });
  const hidden = await loadBusiness(sql, beta);
  assert.equal(hidden.venture, null);
  assert.equal(hidden.obligations.length, 0);
  const obligation = (await loadBusiness(sql, alpha)).obligations[0];
  assert.ok(obligation);
  await assert.rejects(staffObligation(sql, { orgId: beta, actorId: "user_beta", obligationId: obligation.id }), /not in this company/);
  await assert.rejects(
    db.exec(`insert into obligations (id, organization_id, venture_id, domain, autonomy, title)
      values ('obl_cross', '${beta}', '${(await loadBusiness(sql, alpha)).venture?.id}', 'finance', 'prepare', 'Cross')`),
  );
  const center = await commandCenter(sql, "user_beta");
  assert.equal(center.business.name, null);
  assert.equal(JSON.stringify(center).includes("Alpha Desk"), false);
  await db.close();
});

test("a quote becomes an order without payment, and an invoice does not spend", async () => {
  const { db, sql } = await migrated();
  const owner = "user_sales";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  await setSpendingCeiling(sql, owner, "100.00");
  await openVenture(sql, { orgId, actorId: owner, name: "North Desk", idea: "Sell a contractor desk service.", structure: "llc" });
  const customer = await createParty(sql, { orgId, actorId: owner, kind: "person", displayName: "Ada Client" });
  const supplier = await createParty(sql, { orgId, actorId: owner, kind: "organization", displayName: "Supply Co" });
  await assignRole(sql, { orgId, actorId: owner, partyId: supplier, role: "supplier" });
  await assignRole(sql, { orgId, actorId: owner, partyId: customer, role: "customer" });
  await deactivateRole(sql, { orgId, actorId: owner, partyId: customer, role: "customer" });
  await assert.rejects(createQuote(sql, { orgId, actorId: owner, partyId: customer, note: "too soon" }), /active customer/);
  await reactivateRole(sql, { orgId, actorId: owner, partyId: customer, role: "customer" });
  await assert.rejects(createQuote(sql, { orgId, actorId: owner, partyId: supplier, note: "supplier" }), /active customer/);
  await assert.rejects(createQuote(sql, { orgId, actorId: "svc:nexus", partyId: customer, note: "agent" }), /agent cannot/);

  await createOffer(sql, { orgId, actorId: owner, kind: "service", name: "Desk setup", price: "40.00" });
  await createOffer(sql, { orgId, actorId: owner, kind: "product", name: "Lamp", price: "15.00" });
  const offers = await loadBusiness(sql, orgId);
  const desk = offers.offers.find((item) => item.name === "Desk setup");
  const lamp = offers.offers.find((item) => item.name === "Lamp");
  assert.ok(desk && lamp);

  const empty = await createQuote(sql, { orgId, actorId: owner, partyId: customer, note: "Empty" });
  await assert.rejects(issueQuote(sql, { orgId, actorId: owner, quoteId: empty }), /Add a line/);
  await assert.rejects(acceptQuote(sql, { orgId, actorId: owner, quoteId: empty }), /Issue the quote/);

  const retiredQuote = await createQuote(sql, { orgId, actorId: owner, partyId: customer, note: "Retired lamp" });
  await addQuoteLine(sql, { orgId, actorId: owner, quoteId: retiredQuote, offerId: lamp.id, quantity: "1", amount: "" });
  await retireOffer(sql, { orgId, actorId: owner, offerId: lamp.id });
  await assert.rejects(
    addQuoteLine(sql, { orgId, actorId: owner, quoteId: retiredQuote, offerId: lamp.id, quantity: "1", amount: "" }),
    /retired offer cannot be added/,
  );
  await assert.rejects(issueQuote(sql, { orgId, actorId: owner, quoteId: retiredQuote }), /retired offer is on this quote/);

  const other = (await commandCenter(sql, "user_other")).organization.id;
  const foreignCustomer = await createParty(sql, { orgId: other, actorId: "user_other", kind: "person", displayName: "Other Client" });
  await assignRole(sql, { orgId: other, actorId: "user_other", partyId: foreignCustomer, role: "customer" });
  await createOffer(sql, { orgId: other, actorId: "user_other", kind: "service", name: "Foreign desk", price: "9.00" });
  const foreignOffer = (await loadBusiness(sql, other)).offers[0];
  assert.ok(foreignOffer);
  const foreignMission = (await submitMission(sql, "user_other", "Deliver the foreign desk this week.")).missionId;
  await recordPayment(sql, "user_other", { payer: "Other Client", amount: "9.00", note: "foreign receipt", missionId: "" });
  const foreignPayment = (await loadBusiness(sql, other)).payments[0];
  assert.ok(foreignPayment);

  const quoteId = await createQuote(sql, { orgId, actorId: owner, partyId: customer, note: "Desk install" });
  await assert.rejects(
    addQuoteLine(sql, { orgId, actorId: owner, quoteId, offerId: foreignOffer.id, quantity: "1", amount: "" }),
    /active offer/,
  );
  await assert.rejects(
    addQuoteLine(sql, { orgId, actorId: owner, quoteId, offerId: desk.id, quantity: "1.5", amount: "" }),
    /whole quantity/,
  );
  await addQuoteLine(sql, { orgId, actorId: owner, quoteId, offerId: desk.id, quantity: "2", amount: "" });
  await assert.rejects(acceptQuote(sql, { orgId, actorId: owner, quoteId }), /Issue the quote/);
  await assert.rejects(issueQuote(sql, { orgId, actorId: "svc:nexus", quoteId }), /agent cannot/);
  await issueQuote(sql, { orgId, actorId: owner, quoteId });
  await assert.rejects(
    addQuoteLine(sql, { orgId, actorId: owner, quoteId, offerId: desk.id, quantity: "1", amount: "10.00" }),
    /does not take new lines/,
  );
  await assert.rejects(acceptQuote(sql, { orgId, actorId: "svc:nexus", quoteId }), /agent cannot/);
  const orderId = await acceptQuote(sql, { orgId, actorId: owner, quoteId });
  await assert.rejects(acceptQuote(sql, { orgId, actorId: owner, quoteId }), /already became an order/);
  assert.equal((await db.query("select id from payments where organization_id = $1", [orgId])).rows.length, 0);
  const accepted = (await loadBusiness(sql, orgId)).orders.find((item) => item.id === orderId);
  assert.equal(accepted?.status, "accepted");
  assert.equal(accepted?.totalCents, 8000);
  assert.equal(accepted?.invoiceNumber, null);

  const missionId = (await submitMission(sql, owner, "Install the desk for Ada Client.")).missionId;
  await assert.rejects(linkOrderMission(sql, { orgId, actorId: "svc:nexus", orderId, missionId }), /agent cannot/);
  await assert.rejects(linkOrderMission(sql, { orgId, actorId: owner, orderId, missionId: foreignMission }), /not both in this company/);
  await linkOrderMission(sql, { orgId, actorId: owner, orderId, missionId });
  await assert.rejects(linkOrderMission(sql, { orgId, actorId: owner, orderId, missionId }), /already linked/);
  assert.equal((await db.query<{ status: string }>("select status from missions where id = $1", [missionId])).rows[0]?.status, "PROPOSED");

  await assert.rejects(invoiceOrder(sql, { orgId, actorId: "svc:nexus", orderId }), /agent cannot/);
  const invoiceId = await invoiceOrder(sql, { orgId, actorId: owner, orderId });
  const issued = (await loadBusiness(sql, orgId)).invoices.find((item) => item.id === invoiceId);
  assert.equal(issued?.number, "INV-0001");
  assert.equal(issued?.status, "issued");
  assert.equal(issued?.amountCents, 8000);
  assert.equal(issued?.orderId, orderId);
  assert.equal(issued?.direction, "receivable");
  const lineSum = await db.query<{ total: number }>(
    "select coalesce(sum(amount_cents), 0)::int as total from invoice_lines where invoice_id = $1",
    [invoiceId],
  );
  assert.equal(lineSum.rows[0]?.total, 8000);
  assert.equal((await loadBusiness(sql, orgId)).statement.receivableCents, 8000);
  assert.equal((await loadBusiness(sql, orgId)).statement.receivedCents, 0);
  assert.equal((await db.query("select id from payments where organization_id = $1", [orgId])).rows.length, 0);
  const ceiling = (await commandCenter(sql, owner)).finance;
  assert.equal(ceiling.spentCents, 0);
  assert.equal(ceiling.remainingCents, 10000);
  await assert.rejects(invoiceOrder(sql, { orgId, actorId: owner, orderId }), /already has an invoice/);
  await assert.rejects(
    allocatePayment(sql, { orgId, actorId: owner, invoiceId, paymentId: foreignPayment.id, amount: "9.00" }),
    /not in this company/,
  );
  await assert.rejects(voidInvoice(sql, { orgId, actorId: "svc:nexus", invoiceId }), /agent cannot/);
  await voidInvoice(sql, { orgId, actorId: owner, invoiceId });
  const voided = await db.query<{ status: string }>("select status from invoices where id = $1", [invoiceId]);
  assert.equal(voided.rows[0]?.status, "void");
  assert.equal((await loadBusiness(sql, orgId)).statement.receivableCents, 0);
  assert.equal((await db.query("select id from payments where organization_id = $1", [orgId])).rows.length, 0);
  const replacement = await invoiceOrder(sql, { orgId, actorId: owner, orderId });
  assert.equal((await loadBusiness(sql, orgId)).invoices.find((item) => item.id === replacement)?.number, "INV-0002");
  assert.equal((await db.query("select id from invoices where id = $1", [invoiceId])).rows.length, 1);

  await createOffer(sql, { orgId, actorId: owner, kind: "service", name: "Follow-up", price: "12.00" });
  const follow = (await loadBusiness(sql, orgId)).offers.find((item) => item.name === "Follow-up");
  assert.ok(follow);
  const secondQuote = await createQuote(sql, { orgId, actorId: owner, partyId: customer, note: "Follow-up visit" });
  await addQuoteLine(sql, { orgId, actorId: owner, quoteId: secondQuote, offerId: follow.id, quantity: "1", amount: "12.00" });
  await issueQuote(sql, { orgId, actorId: owner, quoteId: secondQuote });
  const secondOrder = await acceptQuote(sql, { orgId, actorId: owner, quoteId: secondQuote });
  await linkOrderMission(sql, { orgId, actorId: owner, orderId: secondOrder, missionId });
  await cancelOrder(sql, { orgId, actorId: owner, orderId: secondOrder });
  assert.equal((await db.query<{ n: number }>("select count(*)::int as n from order_lines where order_id = $1", [secondOrder])).rows[0]?.n, 1);
  assert.equal((await db.query<{ status: string }>("select status from orders where id = $1", [secondOrder])).rows[0]?.status, "cancelled");
  assert.equal((await db.query<{ status: string }>("select status from missions where id = $1", [missionId])).rows[0]?.status, "PROPOSED");
  await assert.rejects(invoiceOrder(sql, { orgId, actorId: owner, orderId: secondOrder }), /accepted order/);

  const thirdQuote = await createQuote(sql, { orgId, actorId: owner, partyId: customer, note: "Lamp replacement" });
  await addQuoteLine(sql, { orgId, actorId: owner, quoteId: thirdQuote, offerId: follow.id, quantity: "1", amount: "" });
  await issueQuote(sql, { orgId, actorId: owner, quoteId: thirdQuote });
  const thirdOrder = await acceptQuote(sql, { orgId, actorId: owner, quoteId: thirdQuote });
  await fulfillOrder(sql, { orgId, actorId: owner, orderId: thirdOrder });
  const thirdInvoice = await invoiceOrder(sql, { orgId, actorId: owner, orderId: thirdOrder });
  assert.equal((await loadBusiness(sql, orgId)).invoices.find((item) => item.id === thirdInvoice)?.number, "INV-0003");
  assert.equal((await db.query("select id from payments where organization_id = $1", [orgId])).rows.length, 0);
  assert.equal((await commandCenter(sql, owner)).finance.remainingCents, 10000);

  const hidden = await loadBusiness(sql, other);
  assert.equal(hidden.quotes.length, 0);
  assert.equal(hidden.orders.length, 0);
  assert.equal(JSON.stringify(hidden).includes("Ada Client"), false);
  assert.equal(JSON.stringify(hidden).includes("Desk install"), false);
  await assert.rejects(acceptQuote(sql, { orgId: other, actorId: "user_other", quoteId }), /not in this company/);
  await assert.rejects(invoiceOrder(sql, { orgId: other, actorId: "user_other", orderId }), /accepted order/);
  await assert.rejects(db.query(
    "insert into quotes (id, organization_id, party_id, created_by) values ($1, $2, $3, $4)",
    ["quo_cross", orgId, foreignCustomer, owner],
  ));
  await assert.rejects(db.query(
    "insert into order_mission_links (organization_id, order_id, mission_id, linked_by) values ($1, $2, $3, $4)",
    [orgId, orderId, foreignMission, owner],
  ));
  await db.close();
});

test("invoice numbers, voids, and journal entries stay on the claim", async () => {
  const { db, sql } = await migrated();
  const owner = "user_journal";
  const orgId = (await commandCenter(sql, owner)).organization.id;
  await setSpendingCeiling(sql, owner, "100.00");
  const customer = await createParty(sql, { orgId, actorId: owner, kind: "person", displayName: "Ada Client" });
  const supplier = await createParty(sql, { orgId, actorId: owner, kind: "organization", displayName: "Supply Co" });
  await assignRole(sql, { orgId, actorId: owner, partyId: customer, role: "customer" });
  await assignRole(sql, { orgId, actorId: owner, partyId: supplier, role: "supplier" });
  await createInvoice(sql, { orgId, actorId: owner, direction: "receivable", partyId: customer, offerId: "", title: "Draft only", amount: "5.00" });
  const draft = (await loadBusiness(sql, orgId)).invoices[0];
  assert.ok(draft);
  await voidInvoice(sql, { orgId, actorId: owner, invoiceId: draft.id });
  assert.equal((await db.query<{ number: string | null }>("select number from invoices where id = $1", [draft.id])).rows[0]?.number, null);
  assert.equal((await db.query<{ n: number }>("select count(*)::int as n from journal_entries")).rows[0]?.n, 0);

  await createInvoice(sql, { orgId, actorId: owner, direction: "receivable", partyId: customer, offerId: "", title: "Setup", amount: "40.00" });
  const open = (await loadBusiness(sql, orgId)).invoices.find((item) => item.status === "draft");
  assert.ok(open);
  assert.ok(sql.transaction);
  await assert.rejects(sql.transaction(async (tx) => {
    await tx`update invoices set title = ${"Changed"} where id = ${open.id}`;
    await postBalancedEntry(tx, {
      orgId, actorId: owner, sourceType: "invoice.issued", sourceId: open.id,
      lines: [{ code: "1200", debitCents: 100, creditCents: 0 }, { code: "4100", debitCents: 0, creditCents: 40 }],
    });
  }), /must balance/);
  assert.equal((await db.query<{ title: string }>("select title from invoices where id = $1", [open.id])).rows[0]?.title, "Setup");
  assert.equal((await db.query<{ status: string }>("select status from invoices where id = $1", [open.id])).rows[0]?.status, "draft");

  await assert.rejects(postBalancedEntry(sql, {
    orgId, actorId: "svc:nexus", sourceType: "invoice.issued", sourceId: open.id,
    lines: [{ code: "1200", debitCents: 100, creditCents: 0 }, { code: "4100", debitCents: 0, creditCents: 100 }],
  }), /agent cannot/);
  assert.throws(() => refuseManualJournal(), /cannot be entered/);
  await issueInvoice(sql, { orgId, actorId: owner, invoiceId: open.id });
  const issued = (await loadBusiness(sql, orgId)).invoices.find((item) => item.id === open.id);
  assert.equal(issued?.number, "INV-0001");
  assert.equal(issued?.posted, true);
  assert.equal((await loadBusiness(sql, orgId)).statement.journalClaimsCents, 4000);
  assert.equal((await commandCenter(sql, owner)).finance.remainingCents, 10000);
  assert.equal((await db.query("select id from payments")).rows.length, 0);
  const issueLines = (await loadBusiness(sql, orgId)).journal.find((entry) => entry.sourceType === "invoice.issued")?.lines ?? [];
  assert.equal(issueLines.reduce((sum, line) => sum + line.debitCents, 0), 4000);
  assert.equal(issueLines.reduce((sum, line) => sum + line.creditCents, 0), 4000);

  await recordPayment(sql, owner, { payer: "Ada Client", amount: "40.00", note: "arrived", missionId: "" });
  const receipt = (await loadBusiness(sql, orgId)).payments.find((row) => row.direction === "receipt");
  assert.ok(receipt);
  await allocatePayment(sql, { orgId, actorId: owner, invoiceId: open.id, paymentId: receipt.id, amount: "15.00" });
  const allocationId = (await db.query<{ id: string }>("select id from invoice_allocations where invoice_id = $1", [open.id])).rows[0]?.id;
  assert.ok(allocationId);
  const beforeLines = (await db.query<{ n: number }>("select count(*)::int as n from journal_lines")).rows[0]?.n;
  await postBalancedEntry(sql, {
    orgId, actorId: owner, sourceType: "invoice.allocated", sourceId: allocationId,
    lines: [{ code: "1300", debitCents: 1500, creditCents: 0 }, { code: "1200", debitCents: 0, creditCents: 1500 }],
  });
  assert.equal((await db.query<{ n: number }>("select count(*)::int as n from journal_entries")).rows[0]?.n, 2);
  assert.equal((await db.query<{ n: number }>("select count(*)::int as n from journal_lines")).rows[0]?.n, beforeLines);
  let books = await loadBusiness(sql, orgId);
  assert.equal(books.statement.receivableCents, 2500);
  assert.equal(books.statement.journalClaimsCents, 2500);
  assert.equal(books.payments.find((row) => row.id === receipt.id)?.allocatedCents, 1500);

  await voidInvoice(sql, { orgId, actorId: owner, invoiceId: open.id });
  books = await loadBusiness(sql, orgId);
  const voided = books.invoices.find((item) => item.id === open.id);
  assert.equal(voided?.status, "void");
  assert.equal(voided?.number, "INV-0001");
  assert.equal((await db.query("select id from payments")).rows.length, 1);
  assert.equal((await db.query("select id from invoice_allocations where invoice_id = $1", [open.id])).rows.length, 1);
  assert.equal(books.statement.receivableCents, 0);
  assert.equal(books.statement.journalClaimsCents, 0);
  assert.equal(books.payments.find((row) => row.id === receipt.id)?.allocatedCents, 0);
  const voidEntry = books.journal.find((entry) => entry.sourceType === "invoice.void");
  assert.ok(voidEntry);
  assert.equal(voidEntry.lines.reduce((sum, line) => sum + line.debitCents, 0), voidEntry.lines.reduce((sum, line) => sum + line.creditCents, 0));
  assert.equal(voidEntry.lines.some((line) => line.code === "1300" && line.creditCents === 1500), true);
  assert.equal(voidEntry.lines.some((line) => line.code === "1200" && line.creditCents === 2500), true);
  await assert.rejects(db.query("update journal_entries set source_type = 'invoice.issued' where organization_id = $1", [orgId]));
  await assert.rejects(db.query("delete from journal_lines where organization_id = $1", [orgId]));

  await createInvoice(sql, { orgId, actorId: owner, direction: "receivable", partyId: customer, offerId: "", title: "Next", amount: "1.00" });
  const next = (await loadBusiness(sql, orgId)).invoices.find((item) => item.status === "draft");
  assert.ok(next);
  await issueInvoice(sql, { orgId, actorId: owner, invoiceId: next.id });
  assert.equal((await loadBusiness(sql, orgId)).invoices.find((item) => item.id === next.id)?.number, "INV-0002");

  await createInvoice(sql, { orgId, actorId: owner, direction: "payable", partyId: supplier, offerId: "", title: "Parts", amount: "10.00" });
  const payable = (await loadBusiness(sql, orgId)).invoices.find((item) => item.title === "Parts");
  assert.ok(payable);
  await issueInvoice(sql, { orgId, actorId: owner, invoiceId: payable.id });
  assert.equal((await commandCenter(sql, owner)).finance.remainingCents, 10000);
  assert.equal((await loadBusiness(sql, orgId)).statement.journalObligationsCents, 1000);
  await recordExpenditure(sql, owner, { payer: "Supply Co", amount: "10.00", note: "parts", missionId: "" });
  assert.equal((await commandCenter(sql, owner)).finance.remainingCents, 9000);
  const spend = (await loadBusiness(sql, orgId)).payments.find((row) => row.direction === "expenditure");
  assert.ok(spend);
  await allocatePayment(sql, { orgId, actorId: owner, invoiceId: payable.id, paymentId: spend.id, amount: "10.00" });
  assert.equal((await loadBusiness(sql, orgId)).statement.journalObligationsCents, 0);
  assert.equal((await commandCenter(sql, owner)).finance.remainingCents, 9000);

  await createInvoice(sql, { orgId, actorId: owner, direction: "receivable", partyId: customer, offerId: "", title: "Parallel A", amount: "2.00" });
  await createInvoice(sql, { orgId, actorId: owner, direction: "receivable", partyId: customer, offerId: "", title: "Parallel B", amount: "3.00" });
  const parallel = (await loadBusiness(sql, orgId)).invoices.filter((item) => item.status === "draft");
  assert.equal(parallel.length, 2);
  await Promise.all(parallel.map((item) => issueInvoice(sql, { orgId, actorId: owner, invoiceId: item.id })));
  const parallelNumbers = (await loadBusiness(sql, orgId)).invoices
    .filter((item) => item.title === "Parallel A" || item.title === "Parallel B")
    .map((item) => item.number)
    .sort();
  assert.deepEqual(parallelNumbers, ["INV-0004", "INV-0005"]);

  await db.query(
    "insert into invoices (id, organization_id, direction, party_id, title, amount_cents, status, created_by) values ($1, $2, 'receivable', $3, 'Unposted', 300, 'issued', $4)",
    ["inv_gap", orgId, customer, owner],
  );
  assert.equal((await loadBusiness(sql, orgId)).statement.journalClaimsCents, null);
  assert.equal((await loadBusiness(sql, orgId)).invoices.find((item) => item.id === "inv_gap")?.posted, false);

  const other = (await commandCenter(sql, "user_other_journal")).organization.id;
  assert.equal((await loadBusiness(sql, other)).journal.length, 0);
  assert.equal(JSON.stringify(await loadBusiness(sql, other)).includes("INV-0001"), false);
  await db.close();
});
