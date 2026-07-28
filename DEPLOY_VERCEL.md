# Deploying MTV Platform to Vercel

This is a Vite + React (SPA) app on Supabase. Vercel builds it as a static
site and serves it from a global CDN. Supabase stays as the backend.

---

## What's already configured

- `vercel.json` — sets framework `vite`, build command, output `dist`, and an
  SPA rewrite so deep links like `/pricing`, `/contact`, `/admin` don't 404.
- `.gitignore` — excludes `.env` and `node_modules`. Your secrets never get
  committed; you set them in the Vercel dashboard instead (below).
- Production build verified locally: `npm run build` compiles clean.

---

## Environment variables (required)

The app reads two variables (Vite only exposes `VITE_`-prefixed vars):

| Name                     | Value                                      |
| ------------------------ | ------------------------------------------ |
| `VITE_SUPABASE_URL`      | your Supabase project URL                  |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon / publishable key       |

Both are already in your local `.env`. You must re-enter them in Vercel — the
`.env` file is intentionally not deployed.

---

## Option A — Deploy from GitHub (recommended)

1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "MTV platform — futuristic redesign, Vercel-ready"
   git branch -M main
   git remote add origin https://github.com/<you>/mtv-platform.git
   git push -u origin main
   ```
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects **Vite**. Leave build settings as-is (they match
   `vercel.json`).
4. Under **Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (Production + Preview + Development).
5. Click **Deploy**. You get a `*.vercel.app` URL in ~1 minute.
6. Every future `git push` to `main` auto-deploys.

## Option B — Deploy with the CLI (no GitHub)

```bash
npm i -g vercel
vercel            # first run: links/creates the project, asks a few questions
# add env vars when prompted, or:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod     # ship to production
```

---

## Supabase: allow the new domain

After the first deploy, add your Vercel URL(s) so auth + API calls work:

- Supabase Dashboard → **Authentication → URL Configuration** → add
  `https://<your-project>.vercel.app` to **Site URL** / **Redirect URLs**.
- (Supabase allows all origins for the REST/JS client by default; the anon key
  plus Row Level Security is what protects your data — keep RLS on.)

---

## Custom domain (optional)

Vercel → Project → **Settings → Domains** → add your domain and follow the DNS
records shown. HTTPS is automatic.

---

## Editing site content & contact details

Text, taglines, pricing, and contact info are **not hardcoded** — they live in
Supabase (`site_content`, `pricing`) and are edited from the built-in admin at
`/admin` (Content, Pricing, Rates panels). Log in at `/login`. Update
placeholders there; no redeploy needed.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the built dist/ locally
```
