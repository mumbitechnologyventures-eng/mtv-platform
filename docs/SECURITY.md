# MTV Platform — Security

Honest framing: no system is "100% unhackable," and anyone who promises that is
wrong. The goal here is **defense in depth** — many independent layers, so a
single mistake doesn't become a breach. This documents what's in place and what
you still need to do in your dashboards.

## What's enforced in code (done)

### Secrets never reach the browser
- The Anthropic key, Flutterwave secret key, and Supabase service-role key are
  used **only** in serverless functions (`api/chat.js`, `api/verify-payment.js`).
- The browser only ever sees `VITE_`-prefixed values (Supabase URL + anon key,
  Flutterwave public key), which are safe to expose when RLS is on.
- `.env` is git-ignored and confirmed **not** tracked by git.

### HTTP security headers (`vercel.json`)
- **Content-Security-Policy** — the browser may only load scripts/styles/data
  from an allowlist (self, Supabase, Flutterwave, Google Fonts). Blocks most
  injected-script and data-exfiltration attacks.
- **X-Frame-Options: DENY** + `frame-ancestors 'none'` — the site can't be
  embedded in an iframe (clickjacking protection).
- **X-Content-Type-Options: nosniff**, **Referrer-Policy**, **Permissions-Policy**
  (camera/mic/geolocation off), **HSTS** (force HTTPS for 2 years).
- ⚠️ Test after first deploy: load the site, open the browser console, and run a
  **test payment**. If the console shows a CSP error blocking Supabase or
  Flutterwave, widen that one directive in `vercel.json` — don't remove CSP.

### Chatbot / user-input attack surface
- **Prompt-injection resistant:** the system prompt instructs the model to treat
  any "instructions" inside a user message as content to ignore, never reveal its
  own prompt or source, never quote prices, and never do the paid work for free.
- **Hard caps:** input ≤ 400 chars, output ≤ 200 tokens, history ≤ 6 turns,
  message array ≤ 40 — so a crafted payload can't run up cost or context.
- **Rate limits (Supabase-enforced):** per-visitor 15/day and global 800/day via
  the `bump_chat_usage` RPC. Survives a browser-storage wipe because it's keyed on
  IP server-side, not localStorage.
- The endpoint validates method, body shape, and types before doing any work.

### Payment endpoint
- Verifies the charge **server-side** with Flutterwave and checks amount +
  currency against the stored quote, so a client can't mark their own quote paid.
- Inputs (`transaction_id`, `tx_ref`) are type- and length-validated; body parse
  is wrapped so malformed input returns 400, not a crash.

## What YOU must do in the dashboards (checklist)

- [ ] **Supabase RLS audit.** Confirm Row Level Security is ON for every table and
      that anon can only read/write what it should. The `chat_usage` table must
      have RLS on with **no** anon policy (service-role only). Run
      `supabase/chat_schema.sql`.
- [ ] **Rotate any key that has ever been shared** (pasted in chat, email, etc.),
      including the Supabase anon key if unsure. Set fresh values in Vercel.
- [ ] **Set server-only env vars in Vercel** (never in `.env` committed): 
      `ANTHROPIC_API_KEY`, `FLW_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
      `SUPABASE_URL`, and public `VITE_FLW_PUBLIC_KEY`.
- [ ] **Turnstile on public forms.** Add Cloudflare Turnstile (or hCaptcha) to the
      Contact and quote-request forms to stop bot spam. Needs a site key + a
      server check — tell me when you want this wired in.
- [ ] **Admin accounts:** strong unique passwords, and enable 2FA on Supabase,
      Vercel, and GitHub.
- [ ] **Flutterwave webhook secret** set, so payment callbacks are verified.
- [ ] **Dependency updates.** Two *moderate* advisories exist in `react-router`
      (open-redirect via backslash; SSR hydration injection). Neither is
      practically exploitable here — this is a static SPA (no SSR) with static
      routes and no user-controlled navigation targets — so it's not urgent. The
      real fix is upgrading to React Router 7 (a major version with migration
      work); schedule it, don't rush it. Re-check with `npm audit` periodically.

## Principle to keep

Least privilege everywhere: the browser gets the minimum (anon key + RLS), the
server holds the secrets, and every input is capped and validated. When in doubt,
deny by default and open up only what a feature actually needs.
