-- Certa schema
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/vraebaohufndoygupqjv/sql

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- users
-- ─────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read their own row"
  on public.users for select
  using (auth.uid() = id);

-- ─────────────────────────────────────────
-- cycles
-- ─────────────────────────────────────────
create table if not exists public.cycles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  start_date  date not null,
  created_at  timestamptz not null default now()
);

alter table public.cycles enable row level security;

create policy "Users can manage their own cycles"
  on public.cycles for all
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- cycle_entries
-- ─────────────────────────────────────────
create table if not exists public.cycle_entries (
  id                uuid primary key default gen_random_uuid(),
  cycle_id          uuid references public.cycles(id) on delete cascade,
  user_id           uuid not null references public.users(id) on delete cascade,
  date              date not null,
  cycle_day         integer,
  temp_f            numeric(5, 2),
  mucus_type        text check (mucus_type in ('none', 'sticky', 'creamy', 'watery', 'egg-white')),
  mucus_sensation   text check (mucus_sensation in ('dry', 'damp', 'wet', 'lubricative')),
  lh_value          numeric(7, 2),
  estrogen_value    numeric(7, 2),
  symptoms          text[] default '{}',
  notes             text,
  created_at        timestamptz not null default now(),

  unique (user_id, date)
);

alter table public.cycle_entries enable row level security;

create policy "Users can manage their own entries"
  on public.cycle_entries for all
  using (auth.uid() = user_id);

-- Index for fast per-user date range queries
create index if not exists cycle_entries_user_date
  on public.cycle_entries (user_id, date desc);
