-- Priority is a recommendation. It does not authorize a mission, clear a dependency, or move money.
-- Retire a row to keep history. Do not delete it.

create table if not exists priority_policies (
  id text primary key,
  organization_id text not null,
  version integer not null check (version = 1),
  document text not null,
  state text not null default 'active' check (state in ('active', 'retired')),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, version)
);

create table if not exists priority_objectives (
  id text primary key,
  organization_id text not null,
  source_type text not null,
  source_id text not null,
  level text not null check (level in ('critical', 'high', 'low', 'defer')),
  reason text not null,
  state text not null default 'active' check (state in ('active', 'retired')),
  created_by text not null,
  created_at timestamptz not null default now(),
  retired_by text,
  retired_at timestamptz,
  unique (organization_id, id)
);

create unique index if not exists priority_obj_active_uidx
  on priority_objectives (organization_id, source_type, source_id)
  where state = 'active';

create table if not exists priority_evaluations (
  id text primary key,
  organization_id text not null,
  cycle_id text not null,
  policy_version integer not null,
  source_type text not null,
  source_id text not null,
  classification text not null check (classification in ('P0', 'P1', 'P2', 'P3', 'P4')),
  readiness text not null,
  recommendation text not null check (recommendation in (
    'do_now', 'do_next', 'prepare', 'await_approval', 'resolve_blocker', 'assign_ownership', 'defer'
  )),
  explanation text not null,
  factors text not null,
  idempotency_key text not null,
  state text not null default 'active' check (state in ('active', 'retired')),
  created_by text not null,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, idempotency_key)
);

create index if not exists priority_evaluations_org_idx
  on priority_evaluations (organization_id, state, created_at desc);

create table if not exists priority_changes (
  id text primary key,
  organization_id text not null,
  cycle_id text not null,
  source_type text not null,
  source_id text not null,
  previous text,
  next text not null,
  reason text not null,
  policy_version integer not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists priority_changes_org_idx
  on priority_changes (organization_id, created_at desc);

create or replace function priority_history_no_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Priority history cannot be deleted';
end;
$$;

drop trigger if exists priority_policies_no_delete on priority_policies;
create trigger priority_policies_no_delete
  before delete on priority_policies
  for each row execute function priority_history_no_delete();

drop trigger if exists priority_objectives_no_delete on priority_objectives;
create trigger priority_objectives_no_delete
  before delete on priority_objectives
  for each row execute function priority_history_no_delete();

drop trigger if exists priority_evaluations_no_delete on priority_evaluations;
create trigger priority_evaluations_no_delete
  before delete on priority_evaluations
  for each row execute function priority_history_no_delete();

drop trigger if exists priority_changes_no_delete on priority_changes;
create trigger priority_changes_no_delete
  before delete on priority_changes
  for each row execute function priority_history_no_delete();
