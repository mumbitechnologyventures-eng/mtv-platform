-- ============================================================================
-- MTV Platform — bootstrap a FRESH Supabase project (fbgkawricmthukaoxqco)
-- ----------------------------------------------------------------------------
-- Run order on the new project's SQL editor:
--   1. Run SETUP_ALL.sql first (creates all tables + functions).
--   2. Run PHASE A below (adds the signup trigger SETUP_ALL leaves commented).
--   3. Sign up once at /login with your real email + a password.
--   4. Run PHASE B below (promotes you to admin).
-- Safe to re-run.
-- ============================================================================

-- ===== PHASE A — run BEFORE you sign up ====================================
-- Makes every future signup auto-create its profiles row.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== PHASE B — run AFTER you have signed up at /login ====================
-- Promotes your account to admin. Works whether or not the trigger fired,
-- because it reads straight from auth.users.
insert into public.profiles (id, name, email, is_admin)
select u.id, split_part(u.email, '@', 1), u.email, true
from auth.users u
where u.email = 'chibesamumbi21@gmail.com'
on conflict (id) do update set is_admin = true;
