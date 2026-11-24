-- A schedule is a proposed order. It does not authorize a mission, start a task, or move money.
-- The execution scheduler in scheduler_state is a different control and is not changed here.
-- Retire by superseding or cancelling. Do not delete history.

create table if not exists schedule_policies (
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

create table if not exists schedule_plans (
  id text primary key,
  organization_id text not null,
  cycle_id text,
  version integer not null check (version > 0),
  policy_version integer not null,
  state text not null check (state in ('draft', 'proposed', 'accepted', 'superseded', 'cancelled')),
  fingerprint text not null,
  explanation text not null,
  underdetermined boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  decided_by text,
  decided_at timestamptz,
  unique (organization_id, id)
);

create unique index if not exists schedule_plans_one_proposed
  on schedule_plans (organization_id)
  where state = 'proposed';

create unique index if not exists schedule_plans_one_accepted
  on schedule_plans (organization_id)
  where state = 'accepted';

create index if not exists schedule_plans_org_idx
  on schedule_plans (organization_id, created_at desc);

create table if not exists schedule_items (
  id text primary key,
  organization_id text not null,
  plan_id text not null,
  source_type text not null check (source_type in ('obligation', 'mission', 'task')),
  source_id text not null,
  position integer not null,
  priority_class text not null,
  readiness text not null,
  scheduling_status text not null check (scheduling_status in (
    'schedulable', 'unassigned', 'blocked', 'approval', 'restricted',
    'proposed', 'authorized', 'excluded', 'conflict'
  )),
  duration text not null default 'unknown' check (duration = 'unknown'),
  window_start timestamptz,
  window_end timestamptz,
  resource_kind text check (resource_kind in ('human', 'agent', 'party')),
  resource_id text,
  resource_label text,
  availability text not null default 'unknown' check (availability = 'unknown'),
  reason text not null,
  evidence text not null,
  priority_policy_version integer not null,
  dependency_note text not null default '',
  priority_evaluation_id text,
  dependency_finding_id text,
  check (window_start is null and window_end is null),
  unique (organization_id, id),
  unique (organization_id, plan_id, source_type, source_id)
);

create index if not exists schedule_items_plan_idx
  on schedule_items (organization_id, plan_id, position);

create table if not exists schedule_conflicts (
  id text primary key,
  organization_id text not null,
  plan_id text not null,
  source_type text not null,
  source_id text not null,
  resource_kind text,
  resource_id text,
  reason text not null,
  unique (organization_id, id)
);

create index if not exists schedule_conflicts_plan_idx
  on schedule_conflicts (organization_id, plan_id);

create table if not exists schedule_events (
  id text primary key,
  organization_id text not null,
  plan_id text,
  previous_plan_id text,
  kind text not null check (kind in ('proposed', 'accepted', 'superseded', 'cancelled')),
  summary text not null,
  policy_version integer not null,
  cycle_id text,
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, id)
);

create index if not exists schedule_events_org_idx
  on schedule_events (organization_id, created_at desc);

create or replace function schedule_history_no_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Schedule history cannot be deleted';
end;
$$;

drop trigger if exists schedule_policies_no_delete on schedule_policies;
create trigger schedule_policies_no_delete
  before delete on schedule_policies
  for each row execute function schedule_history_no_delete();

drop trigger if exists schedule_plans_no_delete on schedule_plans;
create trigger schedule_plans_no_delete
  before delete on schedule_plans
  for each row execute function schedule_history_no_delete();

drop trigger if exists schedule_items_no_delete on schedule_items;
create trigger schedule_items_no_delete
  before delete on schedule_items
  for each row execute function schedule_history_no_delete();

drop trigger if exists schedule_conflicts_no_delete on schedule_conflicts;
create trigger schedule_conflicts_no_delete
  before delete on schedule_conflicts
  for each row execute function schedule_history_no_delete();

drop trigger if exists schedule_events_no_delete on schedule_events;
create trigger schedule_events_no_delete
  before delete on schedule_events
  for each row execute function schedule_history_no_delete();
