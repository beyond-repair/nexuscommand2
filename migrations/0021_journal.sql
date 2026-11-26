-- Invoice numbers are issued from one counter per company.
-- Voiding does not return a number. A draft has no number until it is issued.

create table if not exists invoice_sequences (
  organization_id text primary key,
  last_number integer not null default 0 check (last_number >= 0)
);

insert into invoice_sequences (organization_id, last_number)
select organization_id, max(substring(number from 5)::int)
from invoices
where number ~ '^INV-[0-9]+$'
group by organization_id
on conflict (organization_id) do update
  set last_number = greatest(invoice_sequences.last_number, excluded.last_number);

create unique index if not exists invoices_one_open_order_uidx
  on invoices (organization_id, order_id)
  where order_id is not null and status <> 'void';

-- Chart of accounts. These names are claims and applications, not a bank.
-- 1200 Claims receivable (asset)         — a customer claim, not cash
-- 1300 Receipts applied (asset)          — a recorded receipt applied to a claim, not a deposit
-- 2100 Claims payable (liability)        — a supplier claim, not a disbursement
-- 4100 Claims recorded (income)          — the claim was recorded, not collected
-- 5100 Obligations recorded (expense)    — the obligation was recorded, not paid
-- 5300 Expenditures applied (expense)    — a recorded expenditure applied to a payable, not a new spend
--
-- Issue a receivable:  Dr 1200, Cr 4100.
-- Issue a payable:     Dr 5100, Cr 2100.
-- Allocate a receipt:  Dr 1300, Cr 1200.
-- Allocate a spend:    Dr 2100, Cr 5300.
-- Void a receivable of T with A already allocated and O still open (T = A + O):
--   Dr 4100 T, Cr 1200 O, Cr 1300 A. Omit a zero side.
-- Void a payable:      Dr 2100 O, Dr 5300 A, Cr 5100 T.
-- A draft void posts nothing. The payment row and the allocation row stay.

create table if not exists ledger_accounts (
  id text primary key,
  organization_id text not null,
  code text not null,
  name text not null,
  kind text not null check (kind in ('asset', 'liability', 'income', 'expense')),
  unique (organization_id, id),
  unique (organization_id, code)
);

create table if not exists journal_entries (
  id text primary key,
  organization_id text not null,
  source_type text not null check (source_type in ('invoice.issued', 'invoice.allocated', 'invoice.void')),
  source_id text not null,
  created_by text not null,
  posted_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, source_type, source_id)
);

create table if not exists journal_lines (
  id text primary key,
  organization_id text not null,
  entry_id text not null,
  account_id text not null,
  debit_cents integer not null default 0 check (debit_cents >= 0),
  credit_cents integer not null default 0 check (credit_cents >= 0),
  check (debit_cents = 0 or credit_cents = 0),
  check (debit_cents > 0 or credit_cents > 0),
  foreign key (organization_id, entry_id) references journal_entries (organization_id, id),
  foreign key (organization_id, account_id) references ledger_accounts (organization_id, id)
);

create index if not exists journal_entries_org_idx on journal_entries (organization_id, posted_at);

-- Every insert of lines must balance on its own. The posting function inserts
-- all of an entry's lines in one statement, so a partial or one-sided insert
-- cannot commit.
create or replace function journal_entry_must_balance()
returns trigger
language plpgsql
as $$
declare
  bad integer;
begin
  select count(*) into bad
  from (
    select entry_id
    from new_lines
    group by entry_id
    having sum(debit_cents) <> sum(credit_cents)
        or sum(debit_cents) < 1
        or count(*) < 2
  ) unbalanced;
  if bad > 0 then
    raise exception 'A journal entry must balance';
  end if;
  return null;
end;
$$;

drop trigger if exists journal_lines_must_balance on journal_lines;
create trigger journal_lines_must_balance
  after insert on journal_lines
  referencing new table as new_lines
  for each statement
  execute function journal_entry_must_balance();

create or replace function journal_rows_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Posted journal rows cannot be changed or deleted';
end;
$$;

drop trigger if exists journal_entries_immutable on journal_entries;
create trigger journal_entries_immutable
  before update or delete on journal_entries
  for each row execute function journal_rows_immutable();

drop trigger if exists journal_lines_immutable on journal_lines;
create trigger journal_lines_immutable
  before update or delete on journal_lines
  for each row execute function journal_rows_immutable();
