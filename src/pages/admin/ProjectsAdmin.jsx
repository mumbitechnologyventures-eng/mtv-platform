import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { PageHead, Badge, Empty } from '../../components/ui.jsx'
import { PROJECT_STAGES, makeRef } from '../../lib/pipeline.js'

const BLANK = {
  client_name: '', client_email: '', client_company: '', service_name: '',
  service_category: '', price_zmw: 0, currency: 'ZMW', deposit_pct: 50,
  timeline: '', objective: '', status: 'agreement',
}

export default function ProjectsAdmin() {
  const [projects, setProjects] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [draft, setDraft] = useState({ ...BLANK })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('active')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
    supabase.from('leads').select('id, name, email, company, service').order('created_at', { ascending: false }).limit(50)
      .then(({ data }) => setLeads(data || []))
  }, [])

  function prefillFromLead(id) {
    const lead = leads.find((l) => l.id === id)
    if (!lead) { setDraft((d) => ({ ...d, lead_id: null })); return }
    setDraft((d) => ({
      ...d,
      lead_id: lead.id,
      client_name: lead.name || '',
      client_email: lead.email || '',
      client_company: lead.company || '',
      service_name: lead.service || '',
    }))
  }

  async function create() {
    setSaving(true)
    const payload = {
      ...draft,
      ref: makeRef(),
      price_zmw: Number(draft.price_zmw) || 0,
      deposit_pct: Number(draft.deposit_pct) || 0,
    }
    const { error } = await supabase.from('projects').insert(payload)
    setSaving(false)
    if (error) { alert(error.message); return }
    setShowNew(false); setDraft({ ...BLANK }); load()
  }

  const shown = projects.filter((p) => filter === 'all' || (filter === 'active' ? p.status !== 'complete' : p.status === 'complete'))

  return (
    <div>
      <PageHead
        title="Projects"
        subtitle="The client-project pipeline: agreement → welcome → brief → invoice → in progress → delivery → report → complete."
        action={<button onClick={() => setShowNew(true)} className="btn-primary">+ New project</button>}
      />

      <div className="mb-4 flex gap-2">
        {['active', 'complete', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${filter === f ? 'border-clay bg-clay/10 text-clay' : 'border-ink-600 text-sand-300'}`}>{f}</button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-sand-400">Loading…</p>
      ) : shown.length === 0 ? (
        <Empty>No projects in this view. Create one from a lead or from scratch.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((p) => {
            const step = PROJECT_STAGES.indexOf(p.status) + 1
            return (
              <Link key={p.id} to={`/admin/projects/${p.id}`} className="card block transition hover:border-clay/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{p.client_name}</p>
                    <p className="text-xs text-sand-500">{p.client_company || p.client_email}</p>
                  </div>
                  <Badge status={p.status} />
                </div>
                <p className="mt-3 text-sm text-sand-300">{p.service_name || 'Untitled service'}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-sand-500">
                  <span className="font-mono">{p.ref}</span>
                  <span>{p.price_zmw ? `K${Number(p.price_zmw).toLocaleString()}` : 'No price'}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full bg-clay" style={{ width: `${(step / PROJECT_STAGES.length) * 100}%` }} />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-sand-500">Step {step} of {PROJECT_STAGES.length}</p>
              </Link>
            )
          })}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setShowNew(false)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New project</h2>
              <button onClick={() => setShowNew(false)} className="text-sand-400 hover:text-sand-100">✕</button>
            </div>

            <div className="mt-5 space-y-4">
              {leads.length > 0 && (
                <div>
                  <label className="label">Start from a lead (optional)</label>
                  <select className="field" onChange={(e) => prefillFromLead(e.target.value)}>
                    <option value="">— none / manual —</option>
                    {leads.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.service || 'no service'}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Client name</label><input className="field" value={draft.client_name} onChange={(e) => setDraft({ ...draft, client_name: e.target.value })} /></div>
                <div><label className="label">Client email</label><input className="field" value={draft.client_email} onChange={(e) => setDraft({ ...draft, client_email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Company</label><input className="field" value={draft.client_company} onChange={(e) => setDraft({ ...draft, client_company: e.target.value })} /></div>
                <div><label className="label">Service</label><input className="field" value={draft.service_name} onChange={(e) => setDraft({ ...draft, service_name: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Price (ZMW)</label><input type="number" className="field" value={draft.price_zmw} onChange={(e) => setDraft({ ...draft, price_zmw: e.target.value })} /></div>
                <div><label className="label">Deposit %</label><input type="number" className="field" value={draft.deposit_pct} onChange={(e) => setDraft({ ...draft, deposit_pct: e.target.value })} /></div>
                <div><label className="label">Timeline</label><input className="field" value={draft.timeline} onChange={(e) => setDraft({ ...draft, timeline: e.target.value })} /></div>
              </div>
              <div><label className="label">Objective</label><textarea rows={2} className="field resize-none" value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })} /></div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={create} disabled={saving || !draft.client_name} className="btn-primary">{saving ? 'Creating…' : 'Create project'}</button>
              <button onClick={() => setShowNew(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
