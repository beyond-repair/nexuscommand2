-- One business record per company. It coordinates work. It does not file, bank, or bind.

create table if not exists ventures (
  id text primary key,
  organization_id text not null unique references organizations (id),
  name text not null,
  idea text not null,
  structure text not null check (structure in ('undecided', 'sole_proprietorship', 'partnership', 'llc', 'corporation')),
  stage text not null default 'concept' check (stage in (
    'concept', 'viability', 'formation', 'capitalization', 'build', 'launch', 'operating', 'closed'
  )),
  monthly_burn_cents integer check (monthly_burn_cents is null or monthly_burn_cents > 0),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table if not exists obligations (
  id text primary key,
  organization_id text not null,
  venture_id text not null,
  domain text not null check (domain in (
    'formation', 'governance', 'finance', 'product', 'market', 'operations', 'people', 'quality'
  )),
  autonomy text not null check (autonomy in ('prepare', 'authorized', 'restricted')),
  state text not null default 'open' check (state in ('open', 'prepared', 'authorized', 'satisfied', 'waived')),
  title text not null,
  detail text not null default '',
  evidence text not null default '',
  mission_id text,
  created_at timestamptz not null default now(),
  foreign key (organization_id, venture_id) references ventures (organization_id, id)
);

create index if not exists obligations_org_idx on obligations (organization_id, domain, state);

create table if not exists filings (
  id text primary key,
  organization_id text not null,
  venture_id text not null,
  kind text not null check (kind in ('name', 'dba', 'ein', 'license', 'permit', 'trademark', 'tax', 'insurance', 'other')),
  jurisdiction text not null default '',
  status text not null default 'research' check (status in ('research', 'prepared', 'owner_recorded')),
  deadline text not null default '',
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, venture_id) references ventures (organization_id, id)
);

create table if not exists instruments (
  id text primary key,
  organization_id text not null,
  venture_id text not null,
  kind text not null check (kind in ('operating_agreement', 'nda', 'contract', 'terms', 'privacy', 'other')),
  title text not null,
  body text not null default '',
  status text not null default 'draft' check (status in ('draft', 'owner_approved')),
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, venture_id) references ventures (organization_id, id)
);

create table if not exists capital_items (
  id text primary key,
  organization_id text not null,
  venture_id text not null,
  kind text not null check (kind in ('cost', 'funding')),
  name text not null,
  amount_cents integer not null check (amount_cents > 0),
  funding_kind text not null default '' check (funding_kind in ('', 'loan', 'investment', 'grant')),
  status text not null default 'planned' check (status in ('planned', 'pursuing', 'declined', 'received')),
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, venture_id) references ventures (organization_id, id)
);

create unique index if not exists payments_org_id_uidx on payments (organization_id, id);
create unique index if not exists offers_org_id_uidx on offers (organization_id, id);

create table if not exists invoices (
  id text primary key,
  organization_id text not null,
  direction text not null check (direction in ('receivable', 'payable')),
  party_id text,
  offer_id text,
  title text not null,
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'draft' check (status in ('draft', 'issued', 'void')),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, party_id) references parties (organization_id, id),
  foreign key (organization_id, offer_id) references offers (organization_id, id)
);

create table if not exists invoice_allocations (
  id text primary key,
  organization_id text not null,
  invoice_id text not null,
  payment_id text not null,
  amount_cents integer not null check (amount_cents > 0),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (invoice_id, payment_id),
  foreign key (organization_id, invoice_id) references invoices (organization_id, id),
  foreign key (organization_id, payment_id) references payments (organization_id, id)
);

create table if not exists product_briefs (
  id text primary key,
  organization_id text not null,
  offer_id text,
  problem text not null,
  requirements text not null default '',
  value_proposition text not null default '',
  cost_cents integer check (cost_cents is null or cost_cents > 0),
  feedback text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, offer_id) references offers (organization_id, id)
);

create table if not exists campaigns (
  id text primary key,
  organization_id text not null,
  name text not null,
  segment text not null default '',
  channel text not null default '',
  status text not null default 'draft' check (status in ('draft', 'authorized', 'closed')),
  budget_cents integer not null default 0 check (budget_cents >= 0),
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists market_notes (
  id text primary key,
  organization_id text not null,
  kind text not null check (kind in ('segment', 'competitor', 'channel')),
  name text not null,
  detail text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists procedures (
  id text primary key,
  organization_id text not null,
  name text not null,
  owner_label text not null,
  trigger_text text not null,
  inputs text not null,
  actions text not null,
  outputs text not null,
  exceptions text not null,
  verification text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'retired')),
  mission_id text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists positions (
  id text primary key,
  organization_id text not null,
  title text not null,
  kind text not null check (kind in ('employee', 'contractor')),
  department_slug text not null default '',
  reports_to text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create table if not exists engagements (
  id text primary key,
  organization_id text not null,
  position_id text not null,
  party_id text not null,
  status text not null default 'planned' check (status in ('planned', 'active', 'ended')),
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, position_id) references positions (organization_id, id),
  foreign key (organization_id, party_id) references parties (organization_id, id)
);

create table if not exists stock_counts (
  id text primary key,
  organization_id text not null,
  offer_id text not null,
  on_hand integer not null check (on_hand >= 0),
  note text not null default '',
  created_by text not null,
  updated_at timestamptz not null default now(),
  unique (organization_id, offer_id),
  foreign key (organization_id, offer_id) references offers (organization_id, id)
);
