import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { PageHead, Empty } from '../../components/ui.jsx'

const TIERS = ['from', 'quote', 'hourly', 'monthly', 'per_page', 'per_document']
const BLANK = {
  category: '', name: '', tier: 'from', zmw_price: 0, ngo_discount: 35,
  timeline: '', description: '', includes: [], is_primary: false, active: true, sort_order: 0,
}

export default function PricingAdmin() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('pricing').select('*').order('category').order('sort_order')
    setItems(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing({ ...BLANK }) }
  function openEdit(it) { setEditing({ ...it, includes: it.includes || [] }) }

  async function save() {
    setSaving(true)
    const payload = {
      category: editing.category,
      name: editing.name,
      tier: editing.tier,
      zmw_price: Number(editing.zmw_price) || 0,
      ngo_discount: Number(editing.ngo_discount) || 0,
      timeline: editing.timeline || null,
      description: editing.description || null,
      includes: editing.includes,
      is_primary: !!editing.is_primary,
      active: !!editing.active,
      sort_order: Number(editing.sort_order) || 0,
      updated_at: new Date().toISOString(),
    }
    if (editing.id) {
      await supabase.from('pricing').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('pricing').insert(payload)
    }
    setSaving(false); setEditing(null); load()
  }

  async function toggleActive(it) {
    await supabase.from('pricing').update({ active: !it.active }).eq('id', it.id)
    setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, active: !x.active } : x)))
  }

  async function remove(it) {
    if (!confirm(`Delete "${it.name}"? This cannot be undone.`)) return
    await supabase.from('pricing').delete().eq('id', it.id)
    setItems((xs) => xs.filter((x) => x.id !== it.id))
  }

  return (
    <div>
      <PageHead
        title="Pricing"
        subtitle="Services shown on the public pricing page. Prices are in ZMW."
        action={<button onClick={openNew} className="btn-primary">+ New service</button>}
      />

      {loading ? (
        <p className="text-sm text-sand-400">Loading…</p>
      ) : items.length === 0 ? (
        <Empty>No services yet.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-600">
          <table className="w-full text-sm">
            <thead className="bg-ink-800 text-left text-xs uppercase tracking-wide text-sand-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price (ZMW)</th>
                <th className="px-4 py-3 font-semibold">Live</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sand-100">{it.name}{it.is_primary && <span className="ml-2 text-xs text-clay">★</span>}</p>
                    <p className="text-xs text-sand-500">{it.tier}{it.timeline ? ` · ${it.timeline}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-sand-300">{it.category}</td>
                  <td className="px-4 py-3 text-sand-300">{it.tier === 'quote' || !it.zmw_price ? 'Quote' : `K${Number(it.zmw_price).toLocaleString()}`}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(it)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${it.active ? 'bg-green-500/15 text-green-300' : 'bg-ink-700 text-sand-400'}`}>
                      {it.active ? 'Live' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(it)} className="text-sm text-clay hover:underline">Edit</button>
                    <button onClick={() => remove(it)} className="ml-3 text-sm text-red-400 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setEditing(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing.id ? 'Edit service' : 'New service'}</h2>
              <button onClick={() => setEditing(null)} className="text-sand-400 hover:text-sand-100">✕</button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Name</label><input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><label className="label">Category</label><input className="field" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tier</label>
                  <select className="field" value={editing.tier} onChange={(e) => setEditing({ ...editing, tier: e.target.value })}>
                    {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Price (ZMW)</label><input type="number" className="field" value={editing.zmw_price} onChange={(e) => setEditing({ ...editing, zmw_price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">NGO %</label><input type="number" className="field" value={editing.ngo_discount} onChange={(e) => setEditing({ ...editing, ngo_discount: e.target.value })} /></div>
                <div><label className="label">Sort</label><input type="number" className="field" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })} /></div>
                <div><label className="label">Timeline</label><input className="field" value={editing.timeline || ''} onChange={(e) => setEditing({ ...editing, timeline: e.target.value })} /></div>
              </div>
              <div><label className="label">Description</label><textarea rows={2} className="field resize-none" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div>
                <label className="label">Includes (one per line)</label>
                <textarea rows={4} className="field resize-none" value={(editing.includes || []).join('\n')} onChange={(e) => setEditing({ ...editing, includes: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-clay" checked={editing.is_primary} onChange={(e) => setEditing({ ...editing, is_primary: e.target.checked })} /> Popular</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-clay" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Live</label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={save} disabled={saving || !editing.name || !editing.category} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
