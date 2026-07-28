import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { PageHead } from '../../components/ui.jsx'

// Edits the site_content key/value store. Admins can read every section
// (including 'Business', which is hidden from anonymous visitors by RLS).
export default function ContentAdmin() {
  const [rows, setRows] = useState([])
  const [dirty, setDirty] = useState({})
  const [loading, setLoading] = useState(true)
  const [savedKey, setSavedKey] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('site_content').select('*').order('section').order('sort_order')
    setRows(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function change(key, value) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, value } : r)))
    setDirty((d) => ({ ...d, [key]: true }))
  }

  async function save(row) {
    await supabase.from('site_content')
      .update({ value: row.value, updated_at: new Date().toISOString() })
      .eq('key', row.key)
    setDirty((d) => { const n = { ...d }; delete n[row.key]; return n })
    setSavedKey(row.key)
    setTimeout(() => setSavedKey(null), 1500)
  }

  const sections = [...new Set(rows.map((r) => r.section || 'general'))]

  return (
    <div>
      <PageHead title="Site content" subtitle="Every editable string on the public site. Multi-item fields use one item per line (some as: Title | Description)." />

      {loading ? (
        <p className="text-sm text-sand-400">Loading…</p>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section}>
              <h2 className="mb-3 flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-clay">
                {section}
                <span className="h-px flex-1 bg-ink-600" />
              </h2>
              <div className="space-y-4">
                {rows.filter((r) => (r.section || 'general') === section).map((row) => {
                  const multiline = (row.value || '').includes('\n') || (row.value || '').length > 70
                  return (
                    <div key={row.key} className="card">
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-sm font-medium text-sand-200">{row.label || row.key}</label>
                        <code className="font-mono text-[10px] text-sand-500">{row.key}</code>
                      </div>
                      {multiline ? (
                        <textarea rows={Math.min(8, (row.value || '').split('\n').length + 1)} className="field resize-y font-mono text-xs" value={row.value || ''} onChange={(e) => change(row.key, e.target.value)} />
                      ) : (
                        <input className="field" value={row.value || ''} onChange={(e) => change(row.key, e.target.value)} />
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <button onClick={() => save(row)} disabled={!dirty[row.key]} className="btn-ghost py-1.5 text-xs disabled:opacity-40">Save</button>
                        {savedKey === row.key && <span className="text-xs text-green-400">Saved ✓</span>}
                        {dirty[row.key] && savedKey !== row.key && <span className="text-xs text-clay">Unsaved</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
