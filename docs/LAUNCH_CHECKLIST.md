# MTV launch checklist — step by step

Everything here is done by you (it needs your accounts and your prices). Work top
to bottom. Each step says exactly where to click and what to paste.

Key locations, so you always know where "the stuff" is:

- **The app on your computer:** `C:\Users\ChiBEAST\Desktop\Area_51\MumbiTechnologyVentures\Platform`
- **SQL files:** that folder → `supabase\SETUP_ALL.sql` and `supabase\NEW_PROJECT_BOOTSTRAP.sql`
- **Supabase project:** https://supabase.com/dashboard/project/iqxowwfltefmlnxvctfe
- **The running app (after step 2):** http://localhost:5173

---

## Step 1 — Build the database on the new Supabase project

1. Go to the Supabase project: https://supabase.com/dashboard/project/iqxowwfltefmlnxvctfe
2. Left sidebar → **SQL Editor** → **New query**.
3. On your computer, open `Platform\supabase\SETUP_ALL.sql` in Notepad (or VS Code),
   select all, copy.
4. Paste it into the SQL editor and click **Run**. You should see "Success".
   This creates every table (pricing, quotes, profiles, etc.).
5. New query again. Open `Platform\supabase\NEW_PROJECT_BOOTSTRAP.sql`, copy **only
   the PHASE A block** (the `create trigger` part), paste, **Run**.
   This makes signup create your profile row automatically.

Tip: before the next step, turn off email confirmation so signup logs you in
instantly. Supabase → **Authentication** → **Sign In / Providers** → **Email** →
turn **Confirm email** off → Save. (You can turn it back on later.)

---

## Step 2 — Run the app and make yourself admin

1. Open a terminal in the app folder. Easiest way: open the `Platform` folder in
   VS Code → menu **Terminal → New Terminal**.
2. First time only, install dependencies: type `npm install` and press Enter, wait.
3. Start the app: type `npm run dev` and press Enter. It prints a local address.
4. Open your browser to **http://localhost:5173** — that's your live app.
5. Go to **http://localhost:5173/login**, switch to **Sign up**, register with
   `chibesamumbi21@gmail.com` and a password you choose.
6. Back in Supabase → **SQL Editor** → **New query**. Open
   `NEW_PROJECT_BOOTSTRAP.sql`, copy the **PHASE B block**, paste, **Run**.
   This flips your account to admin.
7. In the app, sign out and sign back in. You should now land in `/admin`.

---

## Step 3 — Enter your real prices

1. In the app, go to **http://localhost:5173/admin/pricing** (or click Pricing in
   the admin menu).
2. Click to add or edit each service and type its real ZMW price, tier, and NGO
   discount. Save each one.
3. Check the public **Pricing** page and the **/start** quote flow — totals now
   show real numbers instead of K0.

You never touch SQL for prices again — this screen is the source of truth.

---

## Step 4 — Put the same settings on Vercel (so the live site works)

The app on your computer reads `.env`. The live site reads Vercel's environment
variables instead, so they must be set there too.

1. Go to your project on https://vercel.com → **Settings** → **Environment
   Variables**.
2. Add these. Browser-safe ones start with `VITE_`; the rest are server-only —
   never put the server ones in the code or in `.env`.

   | Name | Value | Where to find it |
   |------|-------|------------------|
   | `VITE_SUPABASE_URL` | `https://iqxowwfltefmlnxvctfe.supabase.co` | already known |
   | `VITE_SUPABASE_ANON_KEY` | your `sb_publishable_...` key | Supabase → Settings → API → Publishable key |
   | `SUPABASE_URL` | `https://iqxowwfltefmlnxvctfe.supabase.co` | same as above |
   | `SUPABASE_SERVICE_ROLE_KEY` | your `sb_secret_...` key | Supabase → Settings → API → Secret keys |
   | `VITE_FLW_PUBLIC_KEY` | Flutterwave public key | Flutterwave dashboard → Settings → API Keys |
   | `FLW_SECRET_KEY` | Flutterwave secret key | Flutterwave dashboard → Settings → API Keys |
   | `ANTHROPIC_API_KEY` | Claude API key | https://console.anthropic.com → API Keys |

3. After saving, go to the **Deployments** tab → latest deployment → **Redeploy**
   so the new values take effect.

Payments and the chatbot only work once their keys are set. Until then the site
still runs; those features show a clear "not configured" message.

---

## Step 5 — Commit the code changes

The finalized code is saved on disk but not yet committed to git.

- In VS Code: **Source Control** panel (branch icon) → type the message
  `Finalize for launch: new Supabase project, code-splitting, error boundary` →
  **Commit** → **Sync/Push**.
- If Vercel is linked to the repo, the push auto-deploys.

---

## Step 6 — Name and domain (when ready)

- Register the PACRA business name.
- Buy the `.com` domain, then add it in Vercel → **Settings** → **Domains**.

---

## Quick "is it working?" checks

- `localhost:5173` loads the homepage → build + env are good.
- You can reach `/admin` → your admin bootstrap worked.
- Pricing page shows real numbers → prices are in.
- Submitting `/start` creates a row in Supabase → **Table Editor** → `quote_requests`.
