-- Relationships between records this company already has.
-- A row does not authorize a mission, move money, or complete the work.
-- Retire a relationship to keep it. Do not delete it.

create table if not exists organizational_relationships (
  id text primary key,
  organization_id text not null,
  source_type text not null,
  source_id text not null,
  target_type text not null,
  target_id text not null,
  relation text not null check (relation in (
    'depends_on', 'blocks', 'requires_approval', 'owned_by', 'assigned_to',
    'produces', 'satisfies', 'derived_from', 'related_to'
  )),
  metadata text not null default '',
  state text not null default 'active' check (state in ('active', 'retired')),
  created_by text not null,
  created_at timestamptz not null default now(),
  retired_by text,
  retired_at timestamptz,
  unique (organization_id, id),
  check (source_type <> target_type or source_id <> target_id)
);

create unique index if not exists org_rel_active_uidx
  on organizational_relationships (organization_id, source_type, source_id, relation, target_type, target_id)
  where state = 'active';

create index if not exists org_rel_org_idx
  on organizational_relationships (organization_id, state, created_at desc);

create table if not exists dependency_findings (
  id text primary key,
  organization_id text not null,
  kind text not null check (kind in (
    'ready', 'blocked', 'missing', 'approval', 'unassigned', 'circular'
  )),
  source_type text not null,
  source_id text not null,
  summary text not null,
  evidence text not null,
  idempotency_key text not null,
  state text not null default 'active' check (state in ('active', 'retired')),
  created_by text not null,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (organization_id, id),
  unique (organization_id, idempotency_key)
);

create index if not exists dependency_findings_org_idx
  on dependency_findings (organization_id, state, created_at desc);

-- History stays. Retirement and a later reading may update a row. Deleting one does not.
create or replace function dependency_records_no_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Dependency history cannot be deleted';
end;
$$;

drop trigger if exists org_rel_no_delete on organizational_relationships;
create trigger org_rel_no_delete
  before delete on organizational_relationships
  for each row execute function dependency_records_no_delete();

drop trigger if exists dependency_findings_no_delete on dependency_findings;
create trigger dependency_findings_no_delete
  before delete on dependency_findings
  for each row execute function dependency_records_no_delete();

