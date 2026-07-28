import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { PageHead, Badge, Empty } from '../../components/ui.jsx'

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost']

export default function LeadsAdmin() {
  const [leads, setLeads] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(null)

  async function load() {
    setLoading(true)
    let q = supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function setStatus(id, status) {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
    setActive((a) => (a && a.id === id ? { ...a, status } : a))
  }

  return (
    <div>
      <PageHead title="Leads" subtitle="Enquiries from the website contact form." />

      <div className="mb-4 flex flex-wrap gap-2">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition ${
              filter === s ? 'border-clay bg-clay/10 text-clay' : 'border-ink-600 text-sand-300 hover:border-sand-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-sand-400">Loading…</p>
      ) : leads.length === 0 ? (
        <Empty>No leads in this view.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-600">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left text-xs uppercase tracking-wide text-sand-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Service / budget</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {leads.map((l) => (
                <tr key={l.id} onClick={() => setActive(l)} className="cursor-pointer hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sand-100">{l.name}</p>
                    <p className="text-xs text-sand-500">{l.email}{l.company ? ` · ${l.company}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-sand-300">
                    {l.service || '—'}
                    {l.budget && <span className="block text-xs text-sand-500">{l.budget}</span>}
                  </td>
                  <td className="px-4 py-3"><Badge status={l.status} /></td>
                  <td className="px-4 py-3 text-sand-500">{new Date(l.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setActive(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-ink-800 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{active.name}</h2>
                <p className="text-sm text-sand-400">{active.email}</p>
              </div>
              <button onClick={() => setActive(null)} className="text-sand-400 hover:text-sand-100">✕</button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <Field label="Company" value={active.company} />
              <Field label="Service" value={active.service} />
              <Field label="Budget" value={active.budget} />
              <Field label="Source" value={active.source} />
              <Field label="Country / timezone" value={[active.country_name || active.country, active.timezone].filter(Boolean).join(' · ')} />
              <Field label="Their local time" value={active.local_time} />
              <div>
                <p className="label">Message</p>
                <p className="whitespace-pre-wrap rounded-lg border border-ink-600 bg-ink-900 p-3 text-sand-200">{active.message}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="label">Set status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(active.id, s)}
                    className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                      active.status === s ? 'border-clay bg-clay/10 text-clay' : 'border-ink-600 text-sand-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <a
              href={`mailto:${active.email}?subject=Your%20quote%20from%20Mumbi%20Technology%20Ventures`}
              className="btn-primary mt-6 w-full"
            >
              Reply by email
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-sand-200">{value}</p>
    </div>
  )
}
