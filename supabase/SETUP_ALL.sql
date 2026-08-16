-- ============================================================
-- MTV Platform — FULL DATABASE SETUP (run once on a new project)
-- Paste this whole file into the Supabase SQL Editor and Run.
-- Order matters; do not reorder.
-- ============================================================

-- ===== 1. Base schema (profiles, is_admin, pricing, etc.) =====
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

-- ===== 2. Quote/payment flow (quote_requests, quotes, payments) =====
-- ============================================================================
-- MTV Platform — "Request a service" flow: quotes + payments
-- ----------------------------------------------------------------------------
-- Run this ONCE on the MTV Supabase project (fqqcxznrrtastywwcgyv) in the
-- SQL editor. It adds three tables the service-request flow uses:
--   quote_requests  — the intake (who is asking)
--   quotes          — the priced quote (line items + totals + status)
--   payments        — a record per payment attempt (Flutterwave)
--
-- Design notes:
-- - Anonymous visitors may CREATE a request and a quote (so the public flow
--   works without login), but may NOT read or change them afterwards.
-- - Quotes move to 'paid' only from the server (the verify-payment function
--   uses the service-role key, which bypasses RLS). Clients cannot mark
--   themselves paid.
-- ============================================================================

-- ---------- quote_requests --------------------------------------------------
create table if not exists public.quote_requests (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  ref        text,                          -- shared with the quote for easy matching
  name       text not null,
  email      text not null,
  company    text,
  phone      text,
  notes      text,
  status     text not null default 'new',   -- new | quoted | paid | closed
  source     text default 'flow'
);
alter table public.quote_requests enable row level security;
create policy "quote_requests_public_insert" on public.quote_requests
  for insert to anon, authenticated with check (true);
create policy "quote_requests_admin_all" on public.quote_requests
  for all using (is_admin()) with check (is_admin());

-- ---------- quotes ----------------------------------------------------------
create table if not exists public.quotes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  ref         text unique not null,            -- also used as the payment tx_ref
  request_id  uuid references public.quote_requests(id),
  client_name    text,
  client_email   text,
  client_company text,
  client_phone   text,
  notes          text,
  items       jsonb not null default '[]'::jsonb,  -- [{name, category, price_zmw, qty}]
  currency    text not null default 'ZMW',
  subtotal    numeric not null default 0,
  discount    numeric not null default 0,      -- amount, not percent
  total       numeric not null default 0,
  status      text not null default 'draft',   -- draft | awaiting_payment | paid | cancelled
  paid_at     timestamptz
);
alter table public.quotes enable row level security;
-- Public may create a quote (the flow builds it client-side) ...
create policy "quotes_public_insert" on public.quotes
  for insert to anon, authenticated with check (true);
-- ... and read a single quote back by its exact ref (needed on the pay screen).
create policy "quotes_public_select_by_ref" on public.quotes
  for select to anon, authenticated using (true);
create policy "quotes_admin_all" on public.quotes
  for all using (is_admin()) with check (is_admin());

-- ---------- payments --------------------------------------------------------
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  quote_id     uuid references public.quotes(id),
  quote_ref    text,
  provider     text not null default 'flutterwave',
  tx_ref       text,                 -- our reference sent to the gateway
  provider_ref text,                 -- gateway transaction id
  amount       numeric,
  currency     text default 'ZMW',
  status       text not null default 'pending', -- pending | successful | failed
  raw          jsonb default '{}'::jsonb
);
alter table public.payments enable row level security;
-- Only admins/server read payments. The verify-payment function writes with the
-- service-role key, which bypasses RLS, so no public insert policy is needed.
create policy "payments_admin_all" on public.payments
  for all using (is_admin()) with check (is_admin());

-- ---------- helpful indexes -------------------------------------------------
create index if not exists quotes_ref_idx on public.quotes (ref);
create index if not exists payments_quote_ref_idx on public.payments (quote_ref);

-- ===== 3. AI quote fields (description, summary, deposit, client_type) =====
-- ============================================================================
-- MTV Platform — AI quote flow + deposit model
-- ----------------------------------------------------------------------------
-- Run ONCE on the MTV Supabase project (after flow_schema.sql). Adds the columns
-- the new "describe → AI summary → agree → admin sends payment form" flow needs.
-- Safe to re-run (IF NOT EXISTS).
-- ============================================================================

alter table public.quotes add column if not exists description  text;    -- what the client typed
alter table public.quotes add column if not exists summary      text;    -- AI-written plain summary
alter table public.quotes add column if not exists deposit      numeric not null default 0;
alter table public.quotes add column if not exists client_type  text default 'local';  -- local | foreign

-- Status vocabulary now (text, not enforced):
--   submitted     -> visitor agreed + submitted, waiting for admin
--   payment_sent  -> admin sent the payment form
--   deposit_paid  -> 50% deposit cleared (set server-side by verify-payment)
--   in_progress   -> work started
--   completed     -> done
--   cancelled
-- Existing quotes default to whatever they had; new ones start at 'submitted'.

-- No RLS changes: quotes already allow public insert, public select-by-ref
-- (needed by /pay/:ref), and full admin access. Keep it that way.

-- ===== 4. Admin approval + price override (original_total, admin_note) =====
-- ============================================================================
-- MTV Platform — admin approval gate + price override
-- ----------------------------------------------------------------------------
-- Run ONCE on the MTV Supabase project (after quote_ai_schema.sql). Adds the
-- fields the admin needs to override a quote's price and record why. Safe to
-- re-run (IF NOT EXISTS).
-- ============================================================================

alter table public.quotes add column if not exists original_total numeric;  -- snapshot before any admin override
alter table public.quotes add column if not exists admin_note     text;     -- why the price was adjusted / internal note

-- Status vocabulary (text, not enforced). A quote is a DRAFT until approved,
-- and the /pay/:ref page refuses payment for anything not yet approved:
--   submitted     -> visitor submitted, NEEDS ADMIN REVIEW (cannot be paid)
--   approved      -> admin approved; payment form can be sent / paid
--   payment_sent  -> admin sent the payment form
--   deposit_paid  -> 50% deposit cleared (set server-side by verify-payment)
--   in_progress   -> work started
--   completed
--   cancelled     -> declined / withdrawn (payment blocked)
--
-- The admin overriding a price updates quotes.total (and quotes.deposit = 50%),
-- keeping the first value in original_total for the audit trail. Prices set by
-- the automated flow still come only from the rate card; the human admin may
-- override — that is the safeguard against underpriced large projects.

-- ===== 5. Chatbot rate-limit store =====
-- Chat rate-limiting store for the site assistant.
-- Counts messages per visitor (IP) and globally, per day, so the serverless
-- endpoint can enforce daily caps that survive a browser-storage wipe.
--
-- Run this once on the MTV Supabase project (SQL editor).

create table if not exists chat_usage (
  bucket text not null,               -- an IP address, or the literal 'GLOBAL'
  day    date not null default current_date,
  count  integer not null default 0,
  primary key (bucket, day)
);

-- RLS on with NO policies => anon and authenticated clients cannot read or
-- write this table at all. Only the service role (used server-side by the
-- chat endpoint) bypasses RLS. Keep it that way.
alter table chat_usage enable row level security;

-- Atomically increment today's per-IP and global counters, returning both new
-- values. SECURITY DEFINER so it runs with the function owner's rights; it is
-- only ever called with the service-role key from the serverless function.
create or replace function bump_chat_usage(p_ip text)
returns table (ip_count integer, global_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip integer;
  v_global integer;
begin
  insert into chat_usage (bucket, day, count)
  values (p_ip, current_date, 1)
  on conflict (bucket, day) do update set count = chat_usage.count + 1
  returning count into v_ip;

  insert into chat_usage (bucket, day, count)
  values ('GLOBAL', current_date, 1)
  on conflict (bucket, day) do update set count = chat_usage.count + 1
  returning count into v_global;

  ip_count := v_ip;
  global_count := v_global;
  return next;
end;
$$;

-- Lock the function down: only the service role may call it.
revoke all on function bump_chat_usage(text) from public, anon, authenticated;
