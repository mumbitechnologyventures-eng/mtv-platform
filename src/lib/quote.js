// Quote math for the service-request flow. Handles ZMW (local) and USD (foreign)
// clients. Framework-free and easy to test.

export function money(n, currency = 'ZMW') {
  const v = Math.round(Number(n) || 0).toLocaleString('en-US')
  if (currency === 'ZMW') return `K${v}`
  if (currency === 'USD') return `$${v}`
  return `${currency} ${v}`
}

// Unit price of one service in the chosen currency.
// USD uses the row's usd_price when set, otherwise converts from ZMW using the
// supplied rate (USD per 1 ZMW). ZMW uses the local price directly.
export function unitPrice(row, currency = 'ZMW', usdPerZmw = 0) {
  if (currency === 'USD') {
    if (row.usd_price != null && row.usd_price !== '') return Number(row.usd_price)
    return Math.round((Number(row.zmw_price) || 0) * (Number(usdPerZmw) || 0))
  }
  return Number(row.zmw_price) || 0
}

export function sumItems(items = []) {
  return items.reduce((acc, it) => acc + (Number(it.unit) || 0) * (Number(it.qty) || 1), 0)
}

// discountPct is a whole number (e.g. 35 for an NGO). Returns amounts, not percents.
export function computeTotals(items = [], discountPct = 0) {
  const subtotal = sumItems(items)
  const discount = Math.round((subtotal * (Number(discountPct) || 0)) / 100)
  const total = Math.max(0, subtotal - discount)
  return { subtotal, discount, total }
}

// Deposit to start a project. Default 50% of the total; balance settled later.
export const DEPOSIT_PCT = 50
export function depositOf(total, pct = DEPOSIT_PCT) {
  return Math.round((Number(total) || 0) * (Number(pct) || 0) / 100)
}

// Short, human reference used for the quote and as the payment tx_ref.
export function makeQuoteRef() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MTVQ-${mm}${dd}-${rand}`
}

export function priceLabel(row, currency = 'ZMW', usdPerZmw = 0) {
  const base = money(unitPrice(row, currency, usdPerZmw), currency)
  return row.tier === 'from' ? `from ${base}` : base
}
