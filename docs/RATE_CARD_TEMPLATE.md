# Rate card — fill in real prices

Your quote generator at `/start` already works; it just needs real numbers. The
`pricing` table currently holds zero placeholders, so every total shows K0.

**I can't set prices for you** — that's your call, and inventing figures would
break the trust the whole system is built on. Fill this table with your real
prices and send it back; I'll generate the SQL (or help you enter it in
`/admin` → Pricing) so `/start` shows real totals.

## Columns (what each means)

- **category** — group heading, e.g. `Web`, `Data`, `Automation`, `Consulting`.
- **name** — the service as the client sees it.
- **zmw_price** — price in Kwacha (whole number, no symbol). For "from" tiers,
  the starting price.
- **usd_price** — price in USD for foreign clients. Leave blank to auto-convert
  from ZMW using your exchange rate.
- **tier** — one of: `fixed` (exact price), `from` (starting price, "from K…"),
  `quote` (price on request), `hourly`, `monthly`, `per_page`, `per_document`.
- **includes** — short bullet list of what's included (for the service card).
- **ngo_discount** — % discount for registered NGOs (default 35).

## Fill this in

| category | name | zmw_price | usd_price | tier | includes | ngo_discount |
|----------|------|-----------|-----------|------|----------|--------------|
| Web | Business website (up to 5 pages) |  |  | from | Design, mobile-ready, contact form | 35 |
| Web | Landing page |  |  | fixed | One page, single goal, form | 35 |
| Data | Data cleaning / structuring |  |  | from | Cleaned dataset, documented | 35 |
| Data | Dashboard / tracker |  |  | from | Live dashboard, key metrics | 35 |
| Automation | Follow-up / reminder system |  |  | quote | Scoped after a short call | 35 |
| Consulting | IT / AI consulting |  |  | hourly | Advisory, per hour | 0 |

Add, remove, or rename rows freely — this is just a starting shape. Send it back
with numbers and I'll turn it into ready-to-run insert SQL for the `pricing`
table.
