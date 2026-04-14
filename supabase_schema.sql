-- ─────────────────────────────────────────────────────────────────────────────
-- Caflash — Supabase Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ─────────────────────────────────────────────────────────────────────────────

-- Projects
create table if not exists projects (
  id          text primary key,
  name        text not null,
  created_at  bigint not null  -- Unix ms timestamp
);

-- Sets (belong to a project)
create table if not exists sets (
  id          text primary key,
  project_id  text not null references projects(id) on delete cascade,
  name        text not null,
  created_at  bigint not null
);

-- Cards (belong to a set)
create table if not exists cards (
  id               text primary key,
  set_id           text not null references sets(id) on delete cascade,
  front            text not null default '',
  back             text not null default '',
  "order"          integer not null default 0,
  created_at       bigint not null,
  review_stage     integer not null default 1,
  next_review_date text not null default '1970-01-01',  -- YYYY-MM-DD
  history          jsonb not null default '[]'::jsonb   -- [{ date, correct }]
);

-- Indexes for common query patterns
create index if not exists sets_project_id_idx    on sets(project_id);
create index if not exists cards_set_id_idx       on cards(set_id);
create index if not exists cards_next_review_idx  on cards(next_review_date);
create index if not exists cards_review_stage_idx on cards(review_stage);
create index if not exists cards_created_at_idx   on cards(created_at);

-- Disable Row Level Security (public shared dataset, no auth)
alter table projects disable row level security;
alter table sets     disable row level security;
alter table cards    disable row level security;
