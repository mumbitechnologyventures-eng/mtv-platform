import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { money, depositOf } from '../../lib/quote.js'

// The admin inbox: incoming quote requests. Every quote is a DRAFT until you
// approve it — payment is blocked until then. You can also override the total
// before approving, so a big project can't be underpriced through the AI.

const STATUSES = ['submitted', 'approved', 'payment_sent', 'deposit_paid', 'in_progress', 'completed', 'cancelled']
const STATUS_LABEL = {
  submitted: 'Needs review', approved: 'Approved', payment_sent: 'Form sent',
  deposit_paid: 'Deposit paid', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
}
// Statuses from which a payment form may be sent (i.e. approved or beyond).
const SENDABLE = ['approved', 'payment_sent', 'deposit_paid', 'in_progress', 'completed']

export default function RequestsAdmin() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
    if (error) setErr(error.message)
    setRows(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function patchLocal(id, patch) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function setStatus(id, status) {
    patchLocal(id, { status })
    await supabase.from('quotes').update({ status }).eq('id', id)
  }

  // Override the total: recompute the 50% deposit, snapshot the original once.
  async function savePrice(row, newTotal, note) {
    const total = Math.max(0, Math.round(Number(newTotal) || 0))
    const deposit = depositOf(total)
    const original_total = row.original_total != null ? row.original_total : row.total
    const patch = { total, deposit, admin_note: note ?? row.admin_note ?? '', original_total }
    patchLocal(row.id, patch)
    await supabase.from('quotes').update(patch).eq('id', row.id)
  }

  if (loading) return <p className="text-sm text-sand-400">Loading requests…</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Requests</h1>
          <p className="mt-1 text-sm text-sand-400">Every quote needs your approval before it can be paid. Adjust the price if needed, then approve and send.</p>
        </div>
        <button onClick={load} className="btn-ghost text-xs">Refresh</button>
      </div>

      {err && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</p>}

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-sand-400">No requests yet. They appear here when a visitor submits the quote flow.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((q) => <RequestCard key={q.id} q={q} onStatus={setStatus} onSavePrice={savePrice} />)}
        </div>
      )}
    </div>
  )
}

function RequestCard({ q, onStatus, onSavePrice }) {
  const cur = q.currency || 'ZMW'
  const deposit = q.deposit != null ? Number(q.deposit) : depositOf(q.total)
  const approved = SENDABLE.includes(q.status)
  const adjusted = q.original_total != null && Number(q.original_total) !== Number(q.total)

  const [priceOpen, setPriceOpen] = useState(false)
  const [priceInput, setPriceInput] = useState(String(Math.round(Number(q.total) || 0)))
  const [note, setNote] = useState(q.admin_note || '')

  const payLink = `${window.location.origin}/pay/${q.ref}`
  const msg =
    `Hi ${q.client_name || ''}, here is the payment form for your MTV project (${q.ref}). ` +
    `Deposit ${money(deposit, cur)} to begin: ${payLink}`
  const phone = (q.client_phone || '').replace(/[^\d]/g, '')
  const waHref = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
  const mailHref = `mailto:${q.client_email || ''}?subject=${encodeURIComponent(`Payment form — ${q.ref}`)}&body=${encodeURIComponent(msg)}`

  function copyLink() { navigator.clipboard?.writeText(payLink) }
  function markSent(e) {
    if (!approved) { e.preventDefault(); return }
    if (q.status === 'approved') onStatus(q.id, 'payment_sent')
  }
  function savePrice() { onSavePrice(q, priceInput, note); setPriceOpen(false) }

  return (
    <div className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-sand-500">{q.ref} · {q.client_type === 'foreign' ? 'Foreign' : 'Local'}</p>
          <p className="mt-1 font-semibold text-sand-100">{q.client_name || 'Unknown'} · <span className="text-sand-400">{q.client_email}</span></p>
          {q.client_company && <p className="text-sm text-sand-400">{q.client_company}</p>}
        </div>
        <span className={`rounded-sm border px-2.5 py-1 text-xs ${
          q.status === 'submitted' ? 'border-white/40 bg-white/10 text-sand-100' : 'border-white/15 text-sand-200'
        }`}>{STATUS_LABEL[q.status] || q.status}</span>
      </div>

      {(q.summary || q.description) && (
        <p className="mt-3 rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-sand-300">{q.summary || q.description}</p>
      )}

      {Array.isArray(q.items) && q.items.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-sand-400">
          {q.items.map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>{it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</span>
              <span className="text-sand-300">{money((it.unit || 0) * (it.qty || 1), cur)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-600 pt-3 text-sm">
        <span className="text-sand-400">
          Total <span className="text-sand-100">{money(q.total, cur)}</span>
          {adjusted && <span className="ml-2 text-xs text-sand-500">(was {money(q.original_total, cur)})</span>}
        </span>
        <span className="text-sand-400">Deposit (50%) <span className="font-semibold text-sand-100">{money(deposit, cur)}</span></span>
        <button onClick={() => setPriceOpen((v) => !v)} className="text-xs text-sand-400 underline-offset-2 hover:text-sand-100 hover:underline">
          {priceOpen ? 'Cancel' : 'Adjust price'}
        </button>
      </div>

      {priceOpen && (
        <div className="mt-3 rounded-lg border border-white/10 bg-ink-800 p-3">
          <label className="label">New total ({cur})</label>
          <input className="field" type="number" min="0" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
          <label className="label mt-3">Note (why — for your records)</label>
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. scope larger than the AI matched" />
          <button onClick={savePrice} className="btn-primary mt-3 text-xs">Save price</button>
          <p className="mt-2 text-xs text-sand-500">Deposit recalculates to 50% of the new total.</p>
        </div>
      )}
      {q.admin_note && !priceOpen && <p className="mt-2 text-xs text-sand-500">Note: {q.admin_note}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {q.status === 'submitted' ? (
          <>
            <button onClick={() => onStatus(q.id, 'approved')} className="btn-primary text-xs">Approve</button>
            <button onClick={() => onStatus(q.id, 'cancelled')} className="btn-ghost text-xs">Decline</button>
            <span className="text-xs text-sand-500">Approve to unlock the payment form.</span>
          </>
        ) : (
          <>
            <a href={approved ? waHref : undefined} target="_blank" rel="noreferrer" onClick={markSent}
              className={`btn-primary text-xs ${approved ? '' : 'pointer-events-none opacity-40'}`}>Send via WhatsApp</a>
            <a href={approved ? mailHref : undefined} onClick={markSent}
              className={`btn-ghost text-xs ${approved ? '' : 'pointer-events-none opacity-40'}`}>Send via email</a>
            <button onClick={copyLink} className="btn-ghost text-xs">Copy pay link</button>
          </>
        )}
        <select value={q.status} onChange={(e) => onStatus(q.id, e.target.value)} className="field ml-auto w-auto text-xs">
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>
      {q.client_type === 'foreign' && (
        <p className="mt-2 text-xs text-sand-500">Foreign client — they pay by card on the form (Flutterwave).</p>
      )}
    </div>
  )
}
