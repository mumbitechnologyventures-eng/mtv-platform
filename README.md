# Mumbi Technology Ventures — Platform

Rebuilt front end for the MTV platform: a public marketing site, an admin
dashboard, and the client-project pipeline. React + Vite + Tailwind, wired to
the existing Supabase project.

The Supabase database was **not** rebuilt — it already exists and is intact.
This repo is the application layer that talks to it.

## Stack

- React 18 + Vite 5
- React Router 6
- Tailwind CSS 3
- Supabase JS v2 (Postgres, Auth, RLS)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Environment variables. A working `.env` is already included (pointing at the
   live project). To use your own key, copy the example and edit:

   ```bash
   cp .env.example .env
   ```

   | Variable                 | Value                                            |
   | ------------------------ | ------------------------------------------------ |
   | `VITE_SUPABASE_URL`      | `https://fqqcxznrrtastywwcgyv.supabase.co`       |
   | `VITE_SUPABASE_ANON_KEY` | Publishable / anon key from Supabase → API keys  |

3. Run:

   ```bash
   npm run dev      # http://localhost:5173
   npm run build    # production build to dist/
   npm run preview  # preview the production build
   ```

## What's here

### Public site (no login)
- **Home** (`/`) — hero, trust bar, why-us comparison, process, guarantees and
  CTA. Every string is pulled live from the `site_content` table.
- **Pricing** (`/pricing`) — all active services from `pricing`, grouped by
  category, with a **currency switcher** (ZMW / USD / GBP / EUR via
  `exchange_rates`) and an **NGO 35%-off toggle**.
- **Contact** (`/contact`) — the lead-capture form. Inserts into `leads`
  (anonymous insert is allowed by RLS) and records the visitor's timezone.

### Client portal (login required, any user)
- **`/portal`** — a client sees only their **own** projects (matched by the
  email on the project) with a read-only status tracker and their shared
  documents. Enforced at the database by RLS, not just in the UI.

### Admin (login required, `is_admin = true`)
- **Overview** — analytics dashboard: leads over time, by status, top services,
  conversion funnel, plus pipeline value. Range toggle (30d / 90d / 1y).
- **Follow-up** — leads awaiting first contact, ageing buckets, overdue flags,
  and one-click status moves (mark contacted / quoted / won / lost).
- **Pipeline** — revenue view: booked vs active vs delivered value, deposits
  collected vs expected, value/count by stage, and a kanban board of projects.
- **Leads** — filter by status, view detail, change status, reply by email.
- **Projects** — create a project from a lead or from scratch.
- **Project detail** — 8-stage stepper (agreement → complete) and the
  `project_docs` list (agreements, invoices, delivery notes, reports).
- **Pricing** — full CRUD on services (add / edit / hide / delete).
- **Site content** — edit every public string, grouped by section.
- **Exchange rates** — update the ZMW→currency rates that drive the switcher.

### Charts
The dashboards use **Recharts**, themed to match the site in
`src/components/charts.jsx`. All metric math lives in `src/lib/metrics.js`
(pure functions, no framework) so it's easy to adjust or test.

## Admin access

Auth is Supabase email/password. A new sign-up gets a `profiles` row with
`is_admin = false`. To make yourself an admin, run once in the Supabase SQL
editor:

```sql
update public.profiles set is_admin = true where email = 'chibesamumbi21@gmail.com';
```

If you have no auth user yet, create one in Supabase → Authentication → Users,
then run the update above.

## Database

- `supabase/schema_reference.sql` — a documented snapshot of the 7 live tables,
  the `is_admin()` / `handle_new_user()` functions, and all RLS policies. You
  don't need to run it against the existing project; it's for version control
  and for recreating the schema on a fresh project.
- `supabase/delete_sample_data.sql` — removes the seeded demo data (see below).

### Sample / demo data
The dashboards were seeded with clearly-marked sample data so the charts aren't
empty: **26 leads** (`source = 'sample'`), **9 projects** (`notes =
'[SAMPLE DATA]'`, refs `SMP-…`) and their documents. Real form submissions use
`source = 'website'` and are never confused with samples. To wipe the demo data,
run `supabase/delete_sample_data.sql` in the Supabase SQL editor.

### Client-portal access (RLS)
A migration (`client_portal_read_policies`) adds two permissive SELECT policies
so a signed-in client can read their own `projects` and non-draft
`project_docs`, matched by `client_email` against their JWT email. Admin
policies are unchanged. For a client to log in, create an auth user with the
same email as `projects.client_email` (Supabase → Authentication → Users).

### A note on the `send-message` edge function
The Supabase project has an edge function `send-message` that emails clients via
Resend and writes to a `messages` table. **That table does not exist in the
current database**, so the function would fail if called. This rebuild does not
depend on it. If you want in-app client messaging later, (re)create the
`messages` table first, then wire it in.

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages). Build command
`npm run build`, output directory `dist`. Set the two `VITE_` env vars in the
host's dashboard. Because routing is client-side, add an SPA fallback so all
paths serve `index.html` (Vercel/Netlify do this automatically for Vite).
