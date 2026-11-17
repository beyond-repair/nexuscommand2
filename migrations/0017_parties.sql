-- One party identity per company. Roles and contacts cannot point at another company's party.

create table if not exists parties (
  id text primary key,
  organization_id text not null references organizations (id),
  kind text not null check (kind in ('person', 'organization')),
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists parties_org_idx on parties (organization_id, status);

create table if not exists party_roles (
  id text primary key,
  organization_id text not null,
  party_id text not null,
  role text not null check (role in ('customer', 'supplier', 'employee', 'contractor')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  assigned_by text not null,
  assigned_at timestamptz not null default now(),
  unique (organization_id, party_id, role),
  foreign key (organization_id, party_id) references parties (organization_id, id)
);

create index if not exists party_roles_role_idx on party_roles (organization_id, role, status);

create table if not exists party_contacts (
  id text primary key,
  organization_id text not null,
  party_id text not null,
  label text not null,
  value text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, party_id) references parties (organization_id, id)
);

create index if not exists party_contacts_party_idx on party_contacts (organization_id, party_id);

-- A price is a recorded amount. It is not a charge and it does not move stock.

create table if not exists offers (
  id text primary key,
  organization_id text not null references organizations (id),
  kind text not null check (kind in ('product', 'service')),
  name text not null,
  status text not null default 'active' check (status in ('active', 'retired')),
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists offers_org_idx on offers (organization_id, status);
