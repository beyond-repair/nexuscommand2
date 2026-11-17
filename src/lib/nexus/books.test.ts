import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { CompanyError } from "./company.ts";
import {
  addContact,
  archiveParty,
  assignRole,
  createOffer,
  createParty,
  deactivateRole,
  editOffer,
  listOffers,
  listParties,
  reactivateRole,
  retireOffer,
} from "./books.ts";
import {
  commandCenter,
  payments,
  recordExpenditure,
  recordPayment,
  setSpendingCeiling,
  voidPayment,
  type Sql,
} from "./company-store.ts";

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

test("a receipt does not spend the ceiling and a voided expenditure does not stay spent", async () => {
  const { db, sql } = await migrated();
  const owner = "user_books";
  const opened = await commandCenter(sql, owner);
  assert.equal(opened.organization.name, "My Workspace");
  await setSpendingCeiling(sql, owner, "1.00");
  await recordPayment(sql, owner, { payer: "Client", amount: "50.00", note: "arrived", missionId: "" });
  const afterReceipt = await payments(sql, owner);
  assert.equal(afterReceipt.finance.receivedCents, 5000);
  assert.equal(afterReceipt.finance.spentCents, 0);
  assert.equal(afterReceipt.totalCents, 5000);
  assert.equal(afterReceipt.rows[0]?.direction, "receipt");
  await recordExpenditure(sql, owner, { payer: "Vendor", amount: "0.40", note: "tools", missionId: "" });
  const spent = (await payments(sql, owner)).rows.find((row) => row.direction === "expenditure");
  assert.ok(spent);
  await voidPayment(sql, owner, spent.id);
  await recordExpenditure(sql, owner, { payer: "Vendor", amount: "0.80", note: "hosting", missionId: "" });
  await assert.rejects(
    recordExpenditure(sql, owner, { payer: "Vendor", amount: "0.30", note: "over", missionId: "" }),
    CompanyError,
  );
  const ledger = await payments(sql, owner);
  assert.equal(ledger.finance.spentCents, 80);
  assert.equal(ledger.finance.receivedCents, 5000);
  assert.equal(ledger.finance.remainingCents, 20);
  await db.close();
});

test("an existing workspace name is left alone", async () => {
  const { db, sql } = await migrated();
  await db.exec(`
    insert into organizations (id, name, owner_user_id) values ('org_kept', 'Kept Name', 'user_kept');
    insert into memberships (id, organization_id, user_id, role) values ('mem_kept', 'org_kept', 'user_kept', 'owner');
  `);
  const center = await commandCenter(sql, "user_kept");
  assert.equal(center.organization.name, "Kept Name");
  await db.close();
});

test("party roles stay inside the company and an inactive role is not silently active", async () => {
  const { db, sql } = await migrated();
  const alpha = await commandCenter(sql, "user_alpha");
  const beta = await commandCenter(sql, "user_beta");
  const partyId = await createParty(sql, { orgId: alpha.organization.id, actorId: "user_alpha", kind: "person", displayName: "Ada Client" });
  assert.equal(await assignRole(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId, role: "customer" }), "created");
  assert.equal(await assignRole(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId, role: "customer" }), "exists");
  await addContact(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId, label: "email", value: "ada@example.com" });
  await deactivateRole(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId, role: "customer" });
  await assert.rejects(
    assignRole(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId, role: "customer" }),
    /inactive/,
  );
  await reactivateRole(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId, role: "customer" });
  assert.equal(await assignRole(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId, role: "customer" }), "exists");
  await archiveParty(sql, { orgId: alpha.organization.id, actorId: "user_alpha", partyId });
  const archived = await listParties(sql, alpha.organization.id);
  assert.equal(archived[0]?.status, "archived");
  assert.equal(archived[0]?.contacts.length, 1);
  assert.equal((await listParties(sql, beta.organization.id)).length, 0);
  await assert.rejects(
    assignRole(sql, { orgId: beta.organization.id, actorId: "user_beta", partyId, role: "supplier" }),
    CompanyError,
  );
  await assert.rejects(
    db.exec(`insert into party_roles (id, organization_id, party_id, role, assigned_by) values ('rol_cross', '${beta.organization.id}', '${partyId}', 'customer', 'user_beta')`),
  );
  await assert.rejects(
    createParty(sql, { orgId: alpha.organization.id, actorId: "svc:nexus", kind: "person", displayName: "Agent Person" }),
    /agent cannot/i,
  );
  await db.close();
});

test("an offer price is cents, not a charge, and it does not cross companies", async () => {
  const { db, sql } = await migrated();
  const alpha = await commandCenter(sql, "user_alpha");
  const beta = await commandCenter(sql, "user_beta");
  await assert.rejects(
    createOffer(sql, { orgId: alpha.organization.id, actorId: "user_alpha", kind: "service", name: "Review", price: "nope" }),
    CompanyError,
  );
  await createOffer(sql, { orgId: alpha.organization.id, actorId: "user_alpha", kind: "service", name: "Review", price: "25.50" });
  const offer = (await listOffers(sql, alpha.organization.id))[0];
  assert.equal(offer?.priceCents, 2550);
  assert.equal(offer?.kind, "service");
  assert.equal((await listOffers(sql, beta.organization.id)).length, 0);
  const spent = await db.query<{ total: number }>("select coalesce(sum(amount_cents), 0)::int as total from payments");
  assert.equal(spent.rows[0]?.total, 0);
  await assert.rejects(
    createOffer(sql, { orgId: alpha.organization.id, actorId: "svc:writer", kind: "product", name: "Box", price: "1.00" }),
    /agent cannot/i,
  );
  if (!offer) throw new Error("missing offer");
  await retireOffer(sql, { orgId: alpha.organization.id, actorId: "user_alpha", offerId: offer.id });
  await assert.rejects(
    editOffer(sql, { orgId: alpha.organization.id, actorId: "user_alpha", offerId: offer.id, name: "Review", price: "10.00" }),
    CompanyError,
  );
  await db.close();
});
