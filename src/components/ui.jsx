// Small shared admin UI atoms.

export function PageHead({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-sand-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="card relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-clay/60 to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-wide text-sand-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-sand-100 text-glow">{value}</p>
      {hint && <p className="mt-1 text-xs text-sand-400">{hint}</p>}
    </div>
  )
}

const TONES = {
  new: 'bg-clay/15 text-clay',
  contacted: 'bg-blue-500/15 text-blue-300',
  quoted: 'bg-purple-500/15 text-purple-300',
  won: 'bg-green-500/15 text-green-300',
  lost: 'bg-red-500/15 text-red-300',
  agreement: 'bg-clay/15 text-clay',
  welcome: 'bg-blue-500/15 text-blue-300',
  brief: 'bg-blue-500/15 text-blue-300',
  invoice: 'bg-purple-500/15 text-purple-300',
  in_progress: 'bg-yellow-500/15 text-yellow-300',
  delivery: 'bg-teal-500/15 text-teal-300',
  report: 'bg-teal-500/15 text-teal-300',
  complete: 'bg-green-500/15 text-green-300',
}

export function Badge({ status }) {
  const tone = TONES[status] || 'bg-ink-700 text-sand-300'
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {String(status || '').replace(/_/g, ' ')}
    </span>
  )
}

export function Empty({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-ink-600 px-6 py-12 text-center text-sm text-sand-400">
      {children}
    </div>
  )
}
