import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { unitPrice, computeTotals, money, makeQuoteRef, priceLabel, depositOf, DEPOSIT_PCT } from '../lib/quote.js'
import { draftFromDescription } from '../lib/quoteDraft.js'
import { STEPS, STEP_LABELS, assistantMessage, suggestedQuestions, answer } from '../lib/assistant.js'

const NGO_PCT = 10

export default function Start() {
  const [pricing, setPricing] = useState([])
  const [usdPerZmw, setUsdPerZmw] = useState(0)
  const [loading, setLoading] = useState(true)

  const [stepIdx, setStepIdx] = useState(0)
  const [description, setDescription] = useState('')
  const [summary, setSummary] = useState('')
  const [aiUsed, setAiUsed] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [drafting, setDrafting] = useState(false)

  const [selected, setSelected] = useState({})     // { [rowId]: qty }
  const [currency, setCurrency] = useState('ZMW')
  const [ngo, setNgo] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', notes: '' })

  const [quoteRef, setQuoteRef] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const step = STEPS[stepIdx]

  useEffect(() => {
    Promise.all([
      supabase.from('pricing').select('*').eq('active', true).order('sort_order'),
      supabase.from('exchange_rates').select('currency_code, rate_from_zmw').eq('currency_code', 'USD').maybeSingle(),
    ]).then(([p, r]) => {
      setPricing(p.data || [])
      setUsdPerZmw(Number(r.data?.rate_from_zmw) || 0)
      setLoading(false)
    })
  }, [])

  const items = useMemo(
    () =>
      pricing
        .filter((row) => selected[row.id])
        .map((row) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          price_zmw: Number(row.zmw_price) || 0,
          qty: selected[row.id],
          unit: unitPrice(row, currency, usdPerZmw),
        })),
    [pricing, selected, currency, usdPerZmw],
  )
  const totals = useMemo(() => computeTotals(items, ngo ? NGO_PCT : 0), [items, ngo])
  const deposit = depositOf(totals.total)
  const usdAvailable = usdPerZmw > 0 || pricing.some((r) => r.usd_price)

  function toggle(row) {
    setSelected((s) => {
      const next = { ...s }
      if (next[row.id]) delete next[row.id]
      else next[row.id] = 1
      return next
    })
  }
  function setQty(id, qty) { setSelected((s) => ({ ...s, [id]: Math.max(1, qty) })) }
  function update(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  const canContinue =
    (step === 'describe' && description.trim().length >= 10 && !drafting) ||
    (step === 'review' && items.length > 0) ||
    (step === 'details' && form.name.trim() && /\S+@\S+\.\S+/.test(form.email))

  // Read the description, ask the AI to match services + summarise. Falls back to
  // the manual picker if the AI isn't configured or errors.
  async function runDraft() {
    setDrafting(true)
    setError('')
    const res = await draftFromDescription(description.trim(), pricing)
    if (res.ok) {
      setSelected(res.selected || {})
      setSummary(res.summary || '')
      setAiUsed(true)
      setShowPicker(Object.keys(res.selected || {}).length === 0)
    } else {
      // Graceful fallback: keep their words as the summary, show the picker.
      setSummary('')
      setAiUsed(false)
      setShowPicker(true)
    }
    setDrafting(false)
    setStepIdx(STEPS.indexOf('review'))
  }

  async function saveQuote() {
    const ref = makeQuoteRef()
    const client_type = currency === 'USD' ? 'foreign' : 'local'
    const payloadItems = items.map(({ name, category, price_zmw, qty, unit }) => ({ name, category, price_zmw, qty, unit }))
    // Intake record for the admin. Fire-and-forget: RLS blocks reading it back.
    supabase.from('quote_requests').insert({
      ref, name: form.name, email: form.email, company: form.company,
      phone: form.phone, notes: description, status: 'new',
    })
    const { error: qErr } = await supabase.from('quotes').insert({
      ref, client_name: form.name, client_email: form.email, client_company: form.company,
      client_phone: form.phone, notes: form.notes, description, summary,
      items: payloadItems, currency, client_type,
      subtotal: totals.subtotal, discount: totals.discount, total: totals.total, deposit,
      status: 'submitted',
    })
    if (qErr) throw new Error(qErr.message)
    return ref
  }

  async function goNext() {
    setError('')
    if (step === 'describe') { await runDraft(); return }
    if (step === 'details') {
      setSaving(true)
      try {
        const ref = await saveQuote()
        setQuoteRef(ref)
        setStepIdx(STEPS.indexOf('done'))
      } catch (e) {
        setError(e.message || 'Could not submit your request. Please try again.')
      } finally {
        setSaving(false)
      }
      return
    }
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1))
  }
  function goBack() { setError(''); setStepIdx((i) => Math.max(0, i - 1)) }

  if (loading) return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-sand-400">Loading…</div>

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <p className="kicker">Request a service</p>
      <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Start your project</h1>
      <p className="mt-2 max-w-2xl text-sand-400">
        Describe what you need in your own words. We turn it into a clear summary and quote,
        you agree, and we send you a payment form to begin.
      </p>

      <Stepper stepIdx={stepIdx} onJump={(i) => i < stepIdx && setStepIdx(i)} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {step === 'describe' && (
            <DescribeStep description={description} setDescription={setDescription} drafting={drafting} />
          )}
          {step === 'review' && (
            <ReviewStep
              summary={summary} description={description} aiUsed={aiUsed}
              items={items} totals={totals} deposit={deposit}
              currency={currency} setCurrency={setCurrency} usdAvailable={usdAvailable}
              ngo={ngo} setNgo={setNgo}
              pricing={pricing} selected={selected} toggle={toggle} setQty={setQty}
              showPicker={showPicker} setShowPicker={setShowPicker}
            />
          )}
          {step === 'details' && <DetailsStep form={form} update={update} />}
          {step === 'done' && <DoneStep quoteRef={quoteRef} totals={totals} deposit={deposit} currency={currency} />}

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}

          {step !== 'done' && (
            <div className="mt-6 flex items-center justify-between">
              <button onClick={goBack} disabled={stepIdx === 0} className="btn-ghost disabled:opacity-40">← Back</button>
              <button onClick={goNext} disabled={!canContinue || saving} className="btn-primary disabled:opacity-50">
                {drafting ? 'Reading your request…' : saving ? 'Submitting…'
                  : step === 'describe' ? 'Summarise with AI →'
                  : step === 'details' ? 'Submit request →' : 'Agree & continue →'}
              </button>
            </div>
          )}
        </div>

        <Assistant step={step} ctx={{ items, totals, form, quoteRef, currency, summary }} />
      </div>
    </div>
  )
}

function Stepper({ stepIdx, onJump }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => {
        const done = i < stepIdx
        const active = i === stepIdx
        return (
          <button key={s} onClick={() => onJump(i)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active ? 'border-white/50 bg-white/10 text-sand-100'
              : done ? 'border-white/25 text-sand-200 hover:border-white/50'
              : 'border-ink-600 text-sand-500'
            }`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
              active || done ? 'bg-clay text-ink-900' : 'bg-ink-700 text-sand-400'
            }`}>{done ? '✓' : i + 1}</span>
            {STEP_LABELS[s]}
          </button>
        )
      })}
    </div>
  )
}

function DescribeStep({ description, setDescription, drafting }) {
  return (
    <div className="card">
      <label className="label">Describe your project</label>
      <textarea
        className="field min-h-[180px]"
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, 1200))}
        placeholder="e.g. I run a small water charity and need a website that shows our deployments, plus a simple form our field team can use offline to log new sites, and a dashboard I can check each week."
      />
      <p className="mt-2 flex justify-between text-xs text-sand-500">
        <span>Describe the goal, who it's for, and any deadline. No need to know our service names.</span>
        <span>{description.length}/1200</span>
      </p>
      {drafting && <p className="mt-2 text-xs text-sand-400">Reading your request and matching services…</p>}
    </div>
  )
}

function ReviewStep({
  summary, description, aiUsed, items, totals, deposit, currency, setCurrency,
  usdAvailable, ngo, setNgo, pricing, selected, toggle, setQty, showPicker, setShowPicker,
}) {
  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="font-semibold">What we understood</p>
          {aiUsed && <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sand-500">AI summary</span>}
        </div>
        <p className="mt-2 text-sm text-sand-300">
          {summary || `You described: “${description}”`}
        </p>
        {!aiUsed && (
          <p className="mt-2 text-xs text-sand-500">
            Automatic matching isn't available on this build, so pick the services that fit below.
          </p>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Your quote</p>
          <div className="flex items-center gap-3">
            {usdAvailable && (
              <div className="flex overflow-hidden rounded-sm border border-ink-600 text-xs">
                {['ZMW', 'USD'].map((c) => (
                  <button key={c} onClick={() => setCurrency(c)}
                    className={`px-3 py-1.5 ${currency === c ? 'bg-clay text-ink-900' : 'text-sand-300 hover:bg-ink-700'}`}>{c}</button>
                ))}
              </div>
            )}
            <button onClick={() => setShowPicker((v) => !v)} className="text-xs text-sand-400 underline-offset-2 hover:text-sand-100 hover:underline">
              {showPicker ? 'Done editing' : 'Edit services'}
            </button>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="mt-4 divide-y divide-ink-600">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-sand-200">{it.name}{it.qty > 1 ? ` ×${it.qty}` : ''}</span>
                <span className="text-sand-100">{money(it.unit * it.qty, currency)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-sand-400">No services selected yet. Use “Edit services” to choose what you need.</p>
        )}

        <label className="mt-4 flex items-center gap-2.5 text-sm text-sand-300">
          <input type="checkbox" checked={ngo} onChange={(e) => setNgo(e.target.checked)} />
          I represent a registered NGO ({NGO_PCT}% discount)
        </label>

        <div className="mt-4 space-y-1.5 border-t border-ink-600 pt-4 text-sm">
          <Row label="Subtotal" value={money(totals.subtotal, currency)} />
          {totals.discount > 0 && <Row label={`NGO discount (${NGO_PCT}%)`} value={`−${money(totals.discount, currency)}`} accent />}
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-sand-100">{money(totals.total, currency)}</span>
          </div>
          <div className="flex items-center justify-between pt-1 text-sand-300">
            <span>Deposit to start ({DEPOSIT_PCT}%)</span>
            <span className="font-semibold">{money(deposit, currency)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-sand-500">
          Prices come from our rate card — never invented. You pay a {DEPOSIT_PCT}% deposit to begin;
          the balance is settled later with us. A “from” service is confirmed in writing before work starts.
        </p>
      </div>

      {showPicker && (
        <div className="card">
          <p className="mb-3 text-sm font-semibold">Choose or adjust services</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {pricing.map((row) => {
              const on = !!selected[row.id]
              return (
                <div key={row.id} className={`card cursor-pointer ${on ? 'border-white/40 bg-white/5' : ''}`} onClick={() => toggle(row)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-sand-500">{row.category}</p>
                      <p className="mt-1 font-semibold text-sand-100">{row.name}</p>
                    </div>
                    <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border text-xs ${
                      on ? 'border-white bg-clay text-ink-900' : 'border-ink-600 text-transparent'
                    }`}>✓</span>
                  </div>
                  {(row.short_desc || row.description) && (
                    <p className="mt-2 text-sm text-sand-400">{row.short_desc || row.description}</p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-sand-200">{priceLabel(row, currency)}</p>
                  {on && (
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-sand-500">Qty</span>
                      <button onClick={() => setQty(row.id, selected[row.id] - 1)} className="h-6 w-6 rounded border border-ink-600 text-sand-300">−</button>
                      <span className="w-6 text-center text-sm">{selected[row.id]}</span>
                      <button onClick={() => setQty(row.id, selected[row.id] + 1)} className="h-6 w-6 rounded border border-ink-600 text-sand-300">+</button>
                    </div>
                  )}
                </div>
              )
            })}
            {pricing.length === 0 && (
              <p className="text-sm text-sand-400">No services are listed yet. Add them in the admin Pricing panel.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailsStep({ form, update }) {
  return (
    <div className="card">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input className="field" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your full name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="field" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="label">Company / organisation <span className="text-sand-500">(optional)</span></label>
          <input className="field" value={form.company} onChange={(e) => update('company', e.target.value)} />
        </div>
        <div>
          <label className="label">Phone <span className="text-sand-500">(for mobile money)</span></label>
          <input className="field" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+260…" />
        </div>
      </div>
      <div className="mt-4">
        <label className="label">Anything to add? <span className="text-sand-500">(optional)</span></label>
        <textarea className="field min-h-[80px]" value={form.notes} onChange={(e) => update('notes', e.target.value)}
          placeholder="A deadline, a link, or anything else that helps us." />
      </div>
    </div>
  )
}

function Row({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sand-400">{label}</span>
      <span className={accent ? 'text-sand-100' : 'text-sand-200'}>{value}</span>
    </div>
  )
}

function DoneStep({ quoteRef, totals, deposit, currency }) {
  return (
    <div className="card text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sand-100">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold">Request submitted</h2>
      <p className="mx-auto mt-2 max-w-md text-sand-400">
        Your reference is <span className="font-mono text-sand-100">{quoteRef}</span>. We'll review your
        request and send you a payment form for the {money(deposit, currency)} deposit
        {totals.total ? ` (${DEPOSIT_PCT}% of ${money(totals.total, currency)})` : ''}. We'll reach out by email or WhatsApp.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="btn-ghost">Back to home</Link>
        <Link to="/contact" className="btn-primary">Contact us</Link>
      </div>
    </div>
  )
}

function Assistant({ step, ctx }) {
  const msg = assistantMessage(step, ctx)
  const questions = suggestedQuestions(step)
  const [open, setOpen] = useState(true)
  const [reply, setReply] = useState('')

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="card">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-clay text-xs font-black text-ink-900">AI</span>
          <p className="text-sm font-semibold">Assistant</p>
          <button onClick={() => setOpen((v) => !v)} className="ml-auto text-xs text-sand-500 lg:hidden">
            {open ? 'Hide' : 'Show'}
          </button>
        </div>

        {open && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-sand-100">{msg.title}</p>
            <p className="mt-1.5 text-sm text-sand-400">{msg.body}</p>
            {msg.points?.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {msg.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-xs text-sand-300"><span className="mt-0.5 text-sand-100">•</span>{p}</li>
                ))}
              </ul>
            )}
            {questions.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {questions.map((q) => (
                  <button key={q} onClick={() => setReply(answer(q))}
                    className="block w-full rounded-lg border border-ink-600 px-3 py-2 text-left text-xs text-sand-300 transition hover:border-white/50 hover:text-sand-100">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {reply && <p className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-xs text-sand-200">{reply}</p>}
          </div>
        )}
      </div>
    </aside>
  )
}
