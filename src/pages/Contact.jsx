import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useSiteContent } from '../hooks/useSiteContent.js'

const BUDGETS = ['Under K2,000', 'K2,000 – K10,000', 'K10,000 – K50,000', 'K50,000+', 'Not sure yet']

// Best-effort visitor context. Stored on the lead so follow-up can respect
// the client's timezone. Fails silently if the browser blocks it.
function localContext() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return {
      timezone: tz,
      local_time: new Date().toLocaleString('en-US', { timeZone: tz }),
      utc_offset: String(-new Date().getTimezoneOffset() / 60),
    }
  } catch {
    return {}
  }
}

export default function Contact() {
  const { content: c } = useSiteContent()
  const [params] = useSearchParams()
  const [services, setServices] = useState([])
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', company: '', service: '', budget: '', message: '',
  })

  useEffect(() => {
    supabase.from('pricing').select('name').eq('active', true).order('sort_order')
      .then(({ data }) => setServices((data || []).map((d) => d.name)))
  }, [])

  useEffect(() => {
    const s = params.get('service')
    if (s) setForm((f) => ({ ...f, service: s }))
  }, [params])

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setStatus('sending'); setErrorMsg('')
    const payload = {
      ...form,
      source: 'website',
      status: 'new',
      ...localContext(),
    }
    const { error } = await supabase.from('leads').insert(payload)
    if (error) {
      setStatus('error'); setErrorMsg(error.message)
    } else {
      setStatus('done')
      setForm({ name: '', email: '', company: '', service: '', budget: '', message: '' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="kicker">Request a quote</p>
      <h1 className="mt-2 text-4xl font-extrabold">Tell us what you&apos;re trying to solve</h1>
      <p className="mt-3 text-sand-300">
        No sales pitch, no pressure. Share a little about your project and you&apos;ll get a clear,
        written quote back — the number you agree to is the number you pay.
      </p>
      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-ink-600 bg-ink-800 px-4 py-3">
        <svg className="mt-0.5 flex-none text-clay" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <p className="text-xs text-sand-400">
          Your details are sent over a secure connection, stored with strict access controls, and
          used only to prepare your quote. We never sell or share your information.
        </p>
      </div>

      {status === 'done' ? (
        <div className="mt-8 rounded-xl border border-clay/40 bg-clay/5 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-clay/15 text-2xl text-clay">✓</div>
          <p className="mt-4 text-lg font-semibold">Thank you — we&apos;ve got it</p>
          <p className="mt-2 text-sm text-sand-400">
            Your enquiry is safely in. We&apos;ll read it properly and come back with a clear written quote by
            email — usually within one working day. If it&apos;s urgent, just reply to that email and it reaches
            us directly.
          </p>
          <button className="btn-ghost mt-6" onClick={() => setStatus('idle')}>Send another</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input required className="field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input required type="email" className="field" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label">Company / organisation</label>
              <input className="field" value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Service</label>
              <select className="field" value={form.service} onChange={(e) => update('service', e.target.value)}>
                <option value="">Select a service…</option>
                {services.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="Something else">Something else</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Budget range</label>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => update('budget', b)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    form.budget === b ? 'border-clay bg-clay/10 text-clay' : 'border-ink-600 text-sand-300 hover:border-sand-500'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">What do you need? *</label>
            <textarea required rows={5} className="field resize-none" value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Describe the problem you want solved, any deadline, and what success looks like." />
          </div>

          {status === 'error' && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              Couldn&apos;t send: {errorMsg}
            </p>
          )}

          <button type="submit" disabled={status === 'sending'} className="btn-primary w-full sm:w-auto">
            {status === 'sending' ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}
    </div>
  )
}
