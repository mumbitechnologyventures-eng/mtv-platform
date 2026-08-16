import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { money, depositOf, DEPOSIT_PCT } from '../lib/quote.js'
import { payForQuote, paymentsConfigured } from '../lib/payments.js'
import Logo from '../components/Logo.jsx'

// Public deposit page reached from the link the admin sends (/pay/:ref).
// Loads the quote by ref, shows the summary + the deposit, and charges the
// deposit via Flutterwave — mobile money (local ZMW) or card (foreign USD).

export default function PayDeposit() {
  const { ref } = useParams()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.rpc('get_quote_by_ref', { p_ref: ref }).then(({ data }) => {
      setQuote((Array.isArray(data) ? data[0] : data) || null)
      setLoading(false)
    })
  }, [ref])

  const cur = quote?.currency || 'ZMW'
  const deposit = quote ? (quote.deposit != null ? Number(quote.deposit) : depositOf(quote.total)) : 0
  const alreadyPaid = quote && ['deposit_paid', 'in_progress', 'completed'].includes(quote.status)
  // Payment is only open once the admin has approved the quote (or sent the form).
  const payable = quote && ['approved', 'payment_sent'].includes(quote.status)
  const cancelled = quote && quote.status === 'cancelled'

  async function pay() {
    setError(''); setPaying(true)
    try {
      await payForQuote(
        { ref: quote.ref, amount: deposit, currency: cur },
        { name: quote.client_name, email: quote.client_email, phone: quote.client_phone },
      )
      setPaid(true)
    } catch (e) {
      if (e.message !== 'closed') setError(e.message || 'Payment could not be completed.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
      <Link to="/" className="mb-8"><Logo /></Link>

      {loading ? (
        <p className="text-sm text-sand-400">Loading your quote…</p>
      ) : !quote ? (
        <div className="card">
          <p className="font-semibold">Quote not found</p>
          <p className="mt-2 text-sm text-sand-400">
            We couldn't find a quote for reference <span className="font-mono text-sand-200">{ref}</span>.
            Check the link, or contact us.
          </p>
          <Link to="/contact" className="btn-primary mt-4 inline-flex">Contact us</Link>
        </div>
      ) : cancelled ? (
        <div className="card">
          <p className="font-semibold">This quote is no longer active</p>
          <p className="mt-2 text-sm text-sand-400">Reference <span className="font-mono text-sand-200">{quote.ref}</span> has been cancelled. Please contact us if this is unexpected.</p>
          <Link to="/contact" className="btn-primary mt-4 inline-flex">Contact us</Link>
        </div>
      ) : !payable && !paid && !alreadyPaid ? (
        <div className="card">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-sand-500">{quote.ref}</p>
          <p className="mt-2 font-semibold">Your quote is being reviewed</p>
          <p className="mt-2 text-sm text-sand-400">
            We're confirming the details before payment opens. You'll get the payment form from us by email or
            WhatsApp once it's approved — usually shortly.
          </p>
          <Link to="/" className="btn-ghost mt-4 inline-flex">Back to home</Link>
        </div>
      ) : paid || alreadyPaid ? (
        <div className="card text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-sand-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold">Deposit received</h1>
          <p className="mx-auto mt-2 max-w-sm text-sand-400">
            Thank you. Your deposit for <span className="font-mono text-sand-200">{quote.ref}</span> is recorded and
            we'll be in touch to start the work.
          </p>
          <Link to="/" className="btn-ghost mt-6 inline-flex">Back to home</Link>
        </div>
      ) : (
        <div className="card">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-sand-500">Payment form · {quote.ref}</p>
          <h1 className="mt-2 text-2xl font-bold">Deposit to start your project</h1>

          {(quote.summary || quote.description) && (
            <p className="mt-3 rounded-lg border border-white/10 bg-ink-800 px-3 py-2.5 text-sm text-sand-300">
              {quote.summary || quote.description}
            </p>
          )}

          <div className="mt-4 space-y-1.5 border-t border-ink-600 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-sand-400">Project total</span><span className="text-sand-200">{money(quote.total, cur)}</span></div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="font-semibold">Deposit now ({DEPOSIT_PCT}%)</span>
              <span className="text-2xl font-bold text-sand-100">{money(deposit, cur)}</span>
            </div>
          </div>

          <p className="mt-3 text-sm text-sand-400">
            {cur === 'USD'
              ? 'Pay by card. Payment is handled securely by Flutterwave.'
              : 'Pay with MTN, Airtel, or Zamtel mobile money, or a card. Handled securely by Flutterwave.'}
          </p>

          {error && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

          {paymentsConfigured ? (
            <button onClick={pay} disabled={paying} className="btn-primary mt-5 w-full disabled:opacity-50">
              {paying ? 'Opening payment…' : `Pay ${money(deposit, cur)}`}
            </button>
          ) : (
            <div className="mt-5 rounded-lg border border-ink-600 bg-ink-800 p-4 text-sm text-sand-300">
              Payment isn't switched on for this build yet. Add <code className="text-sand-100">VITE_FLW_PUBLIC_KEY</code> to enable it.
            </div>
          )}
          <p className="mt-3 text-xs text-sand-500">The balance is settled later, directly with us.</p>
        </div>
      )}
    </div>
  )
}
