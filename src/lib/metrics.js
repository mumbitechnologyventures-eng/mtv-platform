// Pure helpers that turn raw lead/project rows into chart-ready series.
// Kept framework-free so they're easy to reason about and test.

// Monochrome-first palette: white leads, restrained tints carry status
// meaning only where it earns its place (won/lost). No neon.
export const CHART_COLORS = {
  clay: '#ffffff',      // primary series — white
  clayLight: '#cfcfcf',
  blue: '#7f9cc0',      // muted steel
  green: '#5dcaa5',     // muted positive
  purple: '#9a9a9a',    // neutral grey
  red: '#e57373',       // muted negative
  yellow: '#d1a054',    // muted amber
  grid: 'rgba(255,255,255,0.08)',
  axis: '#5a5a5a',
}

export const LEAD_STATUS_COLOR = {
  new: CHART_COLORS.clay,
  contacted: CHART_COLORS.blue,
  quoted: CHART_COLORS.purple,
  won: CHART_COLORS.green,
  lost: CHART_COLORS.red,
}

const DAY = 86400000

export function daysBetween(a, b = new Date()) {
  return Math.floor((b - new Date(a)) / DAY)
}

// Count leads per day for the last `days`, returning a continuous series.
export function leadsOverTime(leads, days = 30) {
  const now = new Date()
  const buckets = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY)
    const key = d.toISOString().slice(0, 10)
    buckets[key] = { date: key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 }
  }
  leads.forEach((l) => {
    const key = new Date(l.created_at).toISOString().slice(0, 10)
    if (buckets[key]) buckets[key].count += 1
  })
  return Object.values(buckets)
}

export function countBy(rows, field) {
  const map = {}
  rows.forEach((r) => {
    const k = r[field] || '—'
    map[k] = (map[k] || 0) + 1
  })
  return map
}

export function leadsByStatus(leads) {
  const order = ['new', 'contacted', 'quoted', 'won', 'lost']
  const counts = countBy(leads, 'status')
  return order
    .filter((s) => counts[s])
    .map((s) => ({ name: s, value: counts[s], color: LEAD_STATUS_COLOR[s] }))
}

export function topServices(leads, limit = 6) {
  const counts = countBy(leads.filter((l) => l.service), 'service')
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

// Funnel: leads that reached at least each stage (won implies it was quoted, etc).
export function funnel(leads) {
  const total = leads.length
  const reached = (statuses) => leads.filter((l) => statuses.includes(l.status)).length
  const contacted = reached(['contacted', 'quoted', 'won'])
  const quoted = reached(['quoted', 'won'])
  const won = reached(['won'])
  return [
    { name: 'All leads', value: total },
    { name: 'Contacted', value: contacted },
    { name: 'Quoted', value: quoted },
    { name: 'Won', value: won },
  ]
}

export function winRate(leads) {
  const decided = leads.filter((l) => ['won', 'lost'].includes(l.status)).length
  const won = leads.filter((l) => l.status === 'won').length
  return decided ? Math.round((won / decided) * 100) : 0
}

// ---- Project / revenue helpers ----

export function sumBy(rows, field) {
  return rows.reduce((acc, r) => acc + (Number(r[field]) || 0), 0)
}

export function pipelineByStage(projects, stages) {
  return stages.map((stage) => {
    const list = projects.filter((p) => p.status === stage)
    return {
      stage,
      label: stage.replace(/_/g, ' '),
      count: list.length,
      value: sumBy(list, 'price_zmw'),
    }
  })
}

export function depositDue(project) {
  return Math.round((Number(project.price_zmw) || 0) * (Number(project.deposit_pct) || 0) / 100)
}

export function fmtK(n) {
  return `K${Math.round(Number(n) || 0).toLocaleString('en-US')}`
}
