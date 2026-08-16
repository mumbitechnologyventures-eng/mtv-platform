# Service setup workflows — start to finish

Every service moves through the same 8-stage pipeline already built into the
`projects` table (`status` column): **agreement → welcome → brief → invoice →
in_progress → delivery → report → complete**. This doc defines what each stage
means in general, then what's specific to each service in the rate card
(`RATE_CARD_TEMPLATE.md` / the live `pricing` table) — so any admin picking up
a project knows exactly what to do at each step without guessing.

## The generic pipeline (applies to every service)

1. **agreement** — Lead has requested the service (via `/contact`, `/start`,
   or entered manually in `LeadsAdmin`). Admin approves the quote, terms are
   agreed. A `projects` row is created with `client_email`, `service_name`,
   `price_zmw`, `deposit_pct` (default 50).
2. **welcome** — Client gets a welcome message/brief-request. `project_docs`
   row of type `welcome` is sent.
3. **brief** — Admin collects the specifics needed to build (see per-service
   list below). Captured in `projects.objective` / `project_docs` (type
   `brief`) and `projects.deliverables` (jsonb list).
4. **invoice** — Deposit invoice sent (`project_docs` type `invoice`).
   Deposit = `price_zmw * deposit_pct / 100`, paid via `/pay/:ref`
   (Flutterwave) once wired; `payments` row records it.
5. **in_progress** — Build/execution happens. Client can message the builder
   any time via `ProjectThread` on `/portal`.
6. **delivery** — The finished work is handed over (see "delivery output"
   per service below). `project_docs` type `delivery`.
7. **report** — Short wrap-up report: what was built, what's next, any
   maintenance recommendation. `project_docs` type `report`.
8. **complete** — Project closes. Client can leave a review via
   `ProjectThread` (rating + comment, admin approves before it's public).
   Maintenance (below) can be offered as a separate follow-on project.

## Website Development

- **Brief needs:** number of pages, content/copy source, branding assets
  (logo, colours), domain status, which of admin/staff/client dashboards
  are in scope (Functional = admin+client; Complete = admin+staff+client).
- **Delivery output:** live site URL, admin login credentials, a short
  content-editing guide. Additional Dashboard / Additional User Account are
  logged as extra `project_docs` line items against an existing project,
  not new projects.

## Booking & Reservation Systems

- **Brief needs:** what's being booked (service/resource/room), calendar
  rules (hours, blackout dates), whether payment is collected at booking.
  "Information Only" tier has no booking logic — just a page describing
  availability/how to book.
- **Delivery output:** live booking flow tested end-to-end with a sample
  booking; admin view of bookings.

## E-Commerce & Data Management

- **Brief needs:** product list (name, price, stock, images), categories,
  payment method (Flutterwave), shipping/delivery terms. "+ Training" tier
  adds a live walkthrough session logged as a `project_docs` note.
- **Delivery output:** live store with real products loaded (not
  placeholders), one completed test order.
## Trading Solutions

- **Brief needs:** platform (MT4/MT5/other), existing strategy/rules in
  writing (for algorithm conversion), risk parameters, account type. AI
  Trading Robot tiers require a signed risk disclaimer before `in_progress`
  — trading carries real financial risk and MTV is not a licensed financial
  advisor; document this explicitly in the agreement stage.
- **Delivery output:** working script/EA file + setup instructions (1-month
  tier), or the same plus a monitoring log and monthly check-in cadence
  (1-year tier).

## Business Consulting

- **Brief needs:** topic/question for the 30-minute session, preferred
  call time. No separate `in_progress`/`delivery` stage needed — the call
  itself is the delivery; `report` is a short summary note sent after.

## Proofreading & Editing

- **Brief needs:** the document(s), page/word count (drives the per-page
  Proofreading price), deadline. Editing only runs after Proofreading on
  the same document.
- **Delivery output:** marked-up document returned; `report` stage can be
  skipped for this service (delivery = completion).

## Maintenance & Support

- This is a **follow-on** project type, offered after any other service
  reaches `complete` — not a standalone `agreement` from a cold lead.
- **Brief needs:** which system/site it covers, renewal date (annual).
- **Delivery output:** N/A — this is ongoing; instead track each piece of
  work done under it as dated notes in `projects.notes`, and confirm at
  each renewal whether the client wants to continue.
## Premium Services

- Mobile App / AI BI Platforms / Enterprise ERP are **"from" prices** —
  treat the rate-card number as a floor, not a quote. `brief` stage must
  produce a written scope + final price **before** `invoice` — do not
  invoice off the "from" price.
- Custom Government & NGO Systems and Cloud Infrastructure & DevOps are
  **quote-only** — no price exists until a scoping call happens; the
  `agreement` stage for these is really "schedule a scoping call," and the
  real `agreement` (with a price) comes after that.

## Custom Software Development

- **Brief needs:** which category (inventory, school, hospital, CRM, HR,
  NGO, financial, workflow automation, or other), core entities/data the
  system must track, number of user roles, integrations needed.
- Same "from" price rule as Premium Services: brief produces the real
  price before `invoice`.
- **Delivery output:** working system + admin login + a short user guide.

## Notes

- All prices in this doc's source (the rate card) are ZMW; USD shown to
  foreign clients converts live via `exchange_rates` (seeded 2026-08-16
  from XE's published mid-market rate — not a fixed contract rate, so
  worth refreshing before any large foreign invoice).
- No NGO discount is currently set on any of these real rate-card items
  (`ngo_discount = 0` across the board) — the rate card given didn't
  mention one. Set it per-service in `/admin` → Pricing if MTV decides to
  offer one.
