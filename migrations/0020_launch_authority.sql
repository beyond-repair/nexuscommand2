-- Human launch authorization is not an obligation, a waiver, or a finished mission.
-- Drop this table to reverse the addition. Existing ventures keep their stage.

create table if not exists launch_authorizations (
  id text primary key,
  organization_id text not null unique,
  venture_id text not null,
  actor_id text not null,
  evidence text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, venture_id) references ventures (organization_id, id)
);

-- A record that a person acted outside NEXUS. It does not verify the act.

create table if not exists external_action_records (
  id text primary key,
  organization_id text not null,
  venture_id text not null,
  obligation_id text not null,
  classification text not null,
  actor_id text not null,
  evidence_ref text not null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, venture_id) references ventures (organization_id, id)
);

create index if not exists external_action_org_idx on external_action_records (organization_id, created_at desc);
