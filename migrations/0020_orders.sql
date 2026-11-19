-- A quote is an offer of work. An order is the owner's acceptance of it.
-- Neither one is a payment, and neither one authorizes a mission.

create unique index if not exists missions_org_id_uidx on missions (organization_id, id);

create table if not exists quotes (
  id text primary key,
  organization_id text not null,
  party_id text not null,
  status text not null default 'draft' check (status in ('draft', 'issued')),
  currency text not null default 'USD',
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, party_id) references parties (organization_id, id)
);

create index if not exists quotes_org_idx on quotes (organization_id, created_at desc);

create table if not exists quote_lines (
  id text primary key,
  organization_id text not null,
  quote_id text not null,
  offer_id text not null,
  quantity integer not null check (quantity > 0),
  amount_cents integer not null check (amount_cents > 0),
  description text not null default '',
  foreign key (organization_id, quote_id) references quotes (organization_id, id),
  foreign key (organization_id, offer_id) references offers (organization_id, id)
);

create table if not exists orders (
  id text primary key,
  organization_id text not null,
  party_id text not null,
  quote_id text not null unique,
  status text not null check (status in ('draft', 'accepted', 'cancelled', 'fulfilled')),
  currency text not null default 'USD',
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, party_id) references parties (organization_id, id),
  foreign key (organization_id, quote_id) references quotes (organization_id, id)
);

create index if not exists orders_org_idx on orders (organization_id, created_at desc);

create table if not exists order_lines (
  id text primary key,
  organization_id text not null,
  order_id text not null,
  offer_id text not null,
  quantity integer not null check (quantity > 0),
  amount_cents integer not null check (amount_cents > 0),
  description text not null default '',
  foreign key (organization_id, order_id) references orders (organization_id, id),
  foreign key (organization_id, offer_id) references offers (organization_id, id)
);

create table if not exists order_mission_links (
  organization_id text not null,
  order_id text not null,
  mission_id text not null,
  linked_by text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, order_id, mission_id),
  foreign key (organization_id, order_id) references orders (organization_id, id),
  foreign key (organization_id, mission_id) references missions (organization_id, id)
);

alter table invoices add column if not exists order_id text;
alter table invoices add column if not exists number text;

alter table invoices drop constraint if exists invoices_order_fk;
alter table invoices add constraint invoices_order_fk
  foreign key (organization_id, order_id) references orders (organization_id, id);

create unique index if not exists invoices_org_number_uidx on invoices (organization_id, number) where number is not null;

create table if not exists invoice_lines (
  id text primary key,
  organization_id text not null,
  invoice_id text not null,
  description text not null,
  amount_cents integer not null check (amount_cents > 0),
  foreign key (organization_id, invoice_id) references invoices (organization_id, id)
);
