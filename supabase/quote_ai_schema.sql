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
