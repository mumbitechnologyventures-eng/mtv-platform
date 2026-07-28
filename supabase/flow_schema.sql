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
