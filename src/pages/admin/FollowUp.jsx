import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { PageHead, StatCard, Badge, Empty } from '../../components/ui.jsx'
import { daysBetween } from '../../lib/metrics.js'

// A "new" lead older than this many days is treated as overdue for first contact.
const OVERDUE_DAYS = 2

function ageLabel(days) {
  if (days <= 0) return 'today'
  if (days === 1) return '1 day'
  return `${days} days`
}

function bucketOf(days) {
  if (days <= 1) return '0–1 days'
  if (days <= 3) return '2–3 days'
  if (days <= 7) return '4–7 days'
  return '8+ days'
}
const BUCKETS = ['0–1 days', '2–3 days', '4–7 days', '8+ days']

export default function FollowUp() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('id, name, email, company, service, status, created_at')
      .order('created_at', { ascending: true })
    setLeads(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Anything not yet won/lost needs some follow-up.
  const open = useMemo(
    () => leads.filter((l) => !['won', 'lost'].includes(l.status))
      .map((l) => ({ ...l, age: daysBetween(l.created_at) })),
    [leads]
  )

  const needFirstContact = open.filter((l) => l.status === 'new')
  const overdue = needFirstContact.filter((l) => l.age >= OVERDUE_DAYS)
  const oldestAge = open.length ? Math.max(...open.map((l) => l.age)) : 0

  const bucketCounts = useMemo(() => {
    const m = Object.fromEntries(BUCKETS.map((b) => [b, 0]))
    needFirstContact.forEach((l) => { m[bucketOf(l.age)] += 1 })
    return m
  }, [needFirstContact])

  async function advance(lead, status) {
    setBusyId(lead.id)
    await supabase.from('leads').update({ status }).eq('id', lead.id)
    setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status } : l)))
    setBusyId(null)
  }

  if (loading) return <p className="text-sm text-sand-400">Loading follow-ups…</p>

  return (
    <div>
      <PageHead title="Follow-up" subtitle={`Leads waiting on you. "New" leads older than ${OVERDUE_DAYS} days are overdue.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting first contact" value={needFirstContact.length} hint="status = new" />
        <StatCard label="Overdue" value={overdue.length} hint={`new & ≥ ${OVERDUE_DAYS} days old`} />
        <StatCard label="Open (not won/lost)" value={open.length} hint="in some follow-up state" />
        <StatCard label="Oldest open lead" value={ageLabel(oldestAge)} hint="time since it came in" />
      </div>

      {/* Ageing buckets */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {BUCKETS.map((b) => (
          <div key={b} className={`card ${b === '8+ days' && bucketCounts[b] > 0 ? 'border-red-500/40' : ''}`}>
            <p className="text-xs uppercase tracking-wide text-sand-500">{b}</p>
            <p className={`mt-1 text-2xl font-bold ${b === '8+ days' && bucketCounts[b] > 0 ? 'text-red-300' : 'text-sand-100'}`}>{bucketCounts[b]}</p>
          </div>
        ))}
      </div>

      {/* Priority queue */}
      <h2 className="mt-8 mb-3 text-lg font-semibold">Priority queue</h2>
      {needFirstContact.length === 0 ? (
        <Empty>Nothing awaiting first contact. Inbox zero. 🎯</Empty>
      ) : (
        <div className="space-y-2">
          {needFirstContact.sort((a, b) => b.age - a.age).map((l) => {
            const isOverdue = l.age >= OVERDUE_DAYS
            return (
              <div key={l.id} className={`card flex flex-wrap items-center justify-between gap-3 ${isOverdue ? 'border-red-500/30' : ''}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sand-100">{l.name}</p>
                    {isOverdue && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">Overdue</span>}
                  </div>
                  <p className="truncate text-xs text-sand-500">
                    {l.email}{l.service ? ` · ${l.service}` : ''} · waiting {ageLabel(l.age)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${l.email}?subject=Your%20enquiry%20—%20Mumbi%20Technology%20Ventures`} className="btn-ghost py-1.5 text-xs">Email</a>
                  <button disabled={busyId === l.id} onClick={() => advance(l, 'contacted')} className="btn-primary py-1.5 text-xs">
                    Mark contacted
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* In-progress follow-ups */}
      {open.some((l) => l.status !== 'new') && (
        <>
          <h2 className="mt-8 mb-3 text-lg font-semibold">In progress</h2>
          <div className="overflow-hidden rounded-xl border border-ink-600">
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-left text-xs uppercase tracking-wide text-sand-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Lead</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Age</th>
                  <th className="px-4 py-3 font-semibold">Move to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600">
                {open.filter((l) => l.status !== 'new').sort((a, b) => b.age - a.age).map((l) => (
                  <tr key={l.id} className="hover:bg-ink-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sand-100">{l.name}</p>
                      <p className="text-xs text-sand-500">{l.service || '—'}</p>
                    </td>
                    <td className="px-4 py-3"><Badge status={l.status} /></td>
                    <td className="px-4 py-3 text-sand-500">{ageLabel(l.age)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {l.status === 'contacted' && <button onClick={() => advance(l, 'quoted')} className="btn-ghost py-1 text-xs">Quoted</button>}
                        {['contacted', 'quoted'].includes(l.status) && <button onClick={() => advance(l, 'won')} className="btn-ghost py-1 text-xs">Won</button>}
                        <button onClick={() => advance(l, 'lost')} className="rounded-lg border border-ink-600 px-3 py-1 text-xs text-sand-400 hover:border-red-500/50 hover:text-red-300">Lost</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
