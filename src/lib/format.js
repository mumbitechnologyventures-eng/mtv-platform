// Currency + pricing helpers. Prices are stored in ZMW; other currencies are
// derived from exchange_rates.rate_from_zmw.

export function convert(zmw, rate) {
  const n = Number(zmw) || 0
  return n * (Number(rate) || 1)
}

export function formatMoney(amount, currency) {
  const symbol = currency?.symbol || 'K'
  const rounded = Math.round(Number(amount) || 0)
  return `${symbol}${rounded.toLocaleString('en-US')}`
}

// Applies the NGO discount (percent) when the toggle is on.
export function withDiscount(zmw, ngoOn, discountPct) {
  const n = Number(zmw) || 0
  if (!ngoOn) return n
  const pct = Number(discountPct) || 0
  return n * (1 - pct / 100)
}

// Human label for the pricing tier prefix.
export function tierPrefix(tier) {
  switch (tier) {
    case 'from': return 'From'
    case 'hourly': return 'Per hour'
    case 'monthly': return 'Per month'
    case 'per_page': return 'Per page'
    case 'per_document': return 'Per document'
    case 'quote': return ''
    default: return ''
  }
}

export function tierSuffix(tier) {
  switch (tier) {
    case 'hourly': return '/hr'
    case 'monthly': return '/mo'
    case 'per_page': return '/page'
    case 'per_document': return '/doc'
    default: return ''
  }
}

// site_content values are stored as plain text. Several keys pack multiple
// items "one per line", some as "Title | Description". These parse them.
export function toLines(value) {
  if (!value) return []
  return value.split('\n').map((l) => l.trim()).filter(Boolean)
}

export function toPairs(value) {
  return toLines(value).map((line) => {
    const [title, ...rest] = line.split('|')
    return { title: (title || '').trim(), desc: rest.join('|').trim() }
  })
}
