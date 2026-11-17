import assert from "node:assert/strict";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { CompanyError } from "./company.ts";
import { commitCharge, type Sql } from "./company-store.ts";

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

test("two charges cannot pass the same ceiling and an estimate does not consume it", async () => {
  const db = new PGlite();
  await db.exec(`
    create table organizations (id text primary key);
    insert into organizations (id) values ('org_a');
    create table portfolio_limits (
      organization_id text primary key references organizations (id),
      max_concurrent integer not null default 1,
      spending_ceiling_cents integer
    );
    insert into portfolio_limits (organization_id, max_concurrent, spending_ceiling_cents) values ('org_a', 1, 100);
    create table payments (
      id text primary key,
      organization_id text not null,
      mission_id text,
      amount_cents integer not null,
      voided_at timestamptz,
      department_slug text not null default '',
      direction text not null default 'expenditure'
    );
    create table commitments (
      id text primary key,
      organization_id text not null,
      mission_id text,
      department_slug text not null default '',
      amount_cents integer not null,
      kind text not null,
      status text not null
    );
    create table missions (id text primary key, budget_cents integer);
    create table department_budgets (organization_id text, department_slug text, amount_cents integer);
  `);
  const sql = wrap(db);
  const charge = (cents: number, kind: "charge" | "reserve" | "estimate" = "charge") => commitCharge(sql, {
    orgId: "org_a",
    missionId: null,
    department: "",
    amountCents: cents,
    kind,
    write: async (tx) => {
      if (kind === "charge") {
        await tx`insert into payments (id, organization_id, amount_cents) values (${`pay_${cents}_${Math.random()}`}, ${"org_a"}, ${cents})`;
      } else {
        await tx`insert into commitments (id, organization_id, amount_cents, kind, status) values (${`cmt_${kind}_${cents}`}, ${"org_a"}, ${cents}, ${kind === "estimate" ? "estimate" : "reserved"}, ${"open"})`;
      }
    },
  });
  await charge(80);
  await db.exec("insert into payments (id, organization_id, amount_cents, direction) values ('pay_receipt', 'org_a', 5000, 'receipt')");
  await assert.rejects(charge(30), CompanyError);
  await charge(50, "estimate");
  await charge(20);
  await assert.rejects(charge(1), CompanyError);
  const rows = await db.query<{ total: number }>("select coalesce(sum(amount_cents), 0)::int as total from payments where direction = 'expenditure'");
  assert.equal(rows.rows[0]?.total, 100);
  const receipts = await db.query<{ total: number }>("select coalesce(sum(amount_cents), 0)::int as total from payments where direction = 'receipt'");
  assert.equal(receipts.rows[0]?.total, 5000);
  await db.close();
});
