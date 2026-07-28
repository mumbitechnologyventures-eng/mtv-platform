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
