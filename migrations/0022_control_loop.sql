-- The control loop records what it noticed and what it decided.
-- A decision is not mission authorization, a payment, or a filing.
-- Drop the tables to reverse this. Existing missions and invoices stay.

create table if not exists control_policies (
  organization_id text not null,
  operation text not null,
  level integer not null check (level in (0, 1, 2)),
  halted boolean not null default false,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  primary key (organization_id, operation)
);

create table if not exists control_cycles (
  id text primary key,
  organization_id text not null,
  actor_id text not null,
  observed integer not null,
  decided integer not null,
  proposed integer not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists control_cycles_org_idx on control_cycles (organization_id, created_at desc);

create table if not exists control_events (
  id text primary key,
  organization_id text not null,
  event_type text not null,
  source_type text not null,
  source_id text not null,
  summary text not null,
  idempotency_key text not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, idempotency_key)
);

create table if not exists control_decisions (
  id text primary key,
  organization_id text not null,
  cycle_id text not null,
  event_id text not null,
  operation text not null,
  disposition text not null check (disposition in ('notice', 'proposed')),
  reason text not null,
  mission_id text,
  requires_human boolean not null,
  created_at timestamptz not null default now(),
  unique (organization_id, event_id),
  foreign key (organization_id, cycle_id) references control_cycles (organization_id, id),
  foreign key (organization_id, event_id) references control_events (organization_id, id)
);

create index if not exists control_decisions_org_idx on control_decisions (organization_id, created_at desc);

create or replace function control_records_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Control records cannot be changed or deleted';
end;
$$;

drop trigger if exists control_events_immutable on control_events;
create trigger control_events_immutable
  before update or delete on control_events
  for each row execute function control_records_immutable();

drop trigger if exists control_decisions_immutable on control_decisions;
create trigger control_decisions_immutable
  before update or delete on control_decisions
  for each row execute function control_records_immutable();
