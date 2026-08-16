-- ============================================================================
-- Mumbi Technology Ventures — Supabase schema reference
-- ----------------------------------------------------------------------------
-- This is a REFERENCE snapshot of the live MTV schema on project
--   fqqcxznrrtastywwcgyv (db.fqqcxznrrtastywwcgyv.supabase.co, Postgres 17).
--
-- The live database already exists and is intact — you do NOT need to run this
-- to use the app. It is here so the schema is version-controlled alongside the
-- code and can be recreated on a fresh Supabase project if ever needed.
--
-- Only the 7 tables the app actually uses are documented. Older migrations
-- (testimonials, portfolio, messages, marketplace/agrikorex) are not part of
-- the current database and are intentionally omitted.
-- ============================================================================

-- ---------- Helper functions ------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path to 'public', 'pg_temp'
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Creates a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  insert into profiles (id, name, company, email, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'company', ''),
    new.email,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger (create once on a fresh project):
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();

-- ---------- profiles --------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id),
  name       text,
  company    text,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_insert" on public.profiles for insert
  with check (id = auth.uid() or is_admin());
create policy "profiles_update" on public.profiles for update
  using (id = auth.uid() or is_admin());

-- ---------- leads (public contact form target) -----------------------------
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null,
  email        text not null,
  company      text,
  service      text,
  budget       text,
  message      text not null,
  status       text not null default 'new',
  source       text default 'website',
  ref          text,
  timezone     text,
  country      text,
  local_time   text,
  country_name text,
  continent    text,
  utc_offset   text
);
alter table public.leads enable row level security;
-- Anonymous visitors may INSERT (submit the form) but not read.
create policy "leads_public_insert" on public.leads for insert
  to anon, authenticated with check (true);
create policy "Admins can do everything on leads" on public.leads for all
  using (is_admin()) with check (is_admin());

-- ---------- pricing ---------------------------------------------------------
create table if not exists public.pricing (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  category     text not null,
  name         text not null,
  zmw_price    numeric not null,
  usd_price    numeric,
  tier         text,             -- from | quote | hourly | monthly | per_page | per_document
  description  text,
  includes     jsonb default '[]'::jsonb,
  sort_order   integer default 0,
  active       boolean default true,
  ngo_discount integer default 10,
  is_primary   boolean not null default false,
  subtitle     text,
  short_desc   text,
  features     jsonb default '[]'::jsonb,
  drawer_tiers jsonb default '[]'::jsonb,
  timeline     text
);
alter table public.pricing enable row level security;
create policy "Public reads active pricing" on public.pricing for select
  using (active = true);
create policy "Admins manage pricing" on public.pricing for all
  using (is_admin()) with check (is_admin());

-- ---------- exchange_rates --------------------------------------------------
create table if not exists public.exchange_rates (
  currency_code text primary key,
  name          text not null,
  symbol        text not null,
  flag          text not null default '',
  rate_from_zmw numeric not null default 1,   -- value of 1 ZMW in this currency
  updated_at    timestamptz not null default now()
);
alter table public.exchange_rates enable row level security;
create policy "rates_public_read" on public.exchange_rates for select
  to anon, authenticated using (true);
create policy "rates_admin_write" on public.exchange_rates for all
  to authenticated using (is_admin()) with check (is_admin());

-- ---------- site_content (editable strings) ---------------------------------
create table if not exists public.site_content (
  key        text primary key,
  label      text not null,
  value      text not null default '',
  updated_at timestamptz default now(),
  section    text default 'general',
  sort_order integer default 0
);
alter table public.site_content enable row level security;
-- Everything except the 'Business' section is world-readable.
create policy "Public reads non-business content" on public.site_content for select
  using (section is distinct from 'Business' or is_admin());
create policy "Admin can manage site_content" on public.site_content for all
  using (is_admin());

-- ---------- projects (client pipeline) --------------------------------------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  ref              text unique,
  lead_id          uuid references public.leads(id),
  client_name      text not null,
  client_email     text,
  client_company   text,
  client_country   text,
  client_timezone  text,
  service_name     text,
  service_category text,
  price_zmw        numeric default 0,
  currency         text default 'ZMW',
  deposit_pct      integer default 50,
  timeline         text,
  deliverables     jsonb default '[]'::jsonb,
  objective        text,
  status           text default 'agreement'
    check (status in ('agreement','welcome','brief','invoice','in_progress','delivery','report','complete')),
  start_date       date,
  due_date         date,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
alter table public.projects enable row level security;
create policy "Admins manage projects" on public.projects for all
  to authenticated using (is_admin()) with check (is_admin());

-- ---------- project_docs ----------------------------------------------------
create table if not exists public.project_docs (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  type       text not null
    check (type in ('agreement','welcome','brief','invoice','delivery','report','thankyou','feedback')),
  status     text default 'draft'
    check (status in ('draft','sent','signed','paid','done')),
  data       jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  sent_at    timestamptz
);
alter table public.project_docs enable row level security;
create policy "Admins manage project_docs" on public.project_docs for all
  to authenticated using (is_admin()) with check (is_admin());
