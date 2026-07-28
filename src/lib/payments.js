// Flutterwave inline checkout. The PUBLIC key is safe in the browser; the SECRET
// key never touches the client — payment is confirmed server-side by
// /api/verify-payment. If no public key is set, the flow falls back to a clear
// "not configured" message instead of failing silently.

const SCRIPT_SRC = 'https://checkout.flutterwave.com/v3.js'

export const PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY || ''
export const paymentsConfigured = Boolean(PUBLIC_KEY)

let loading = null
function loadScript() {
  if (window.FlutterwaveCheckout) return Promise.resolve()
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load the payment library. Check your connection and try again.'))
    document.body.appendChild(s)
  })
  return loading
}

// quote: { ref, currency, amount?, total? }  form: { name, email, phone }
// `amount` is what to charge (e.g. the 50% deposit); falls back to `total`.
// Resolves with the verified result on success; rejects on error/close.
export async function payForQuote(quote, form) {
  if (!paymentsConfigured) {
    throw new Error('Payment is not set up yet. Add VITE_FLW_PUBLIC_KEY to enable it.')
  }
  await loadScript()

  const charge = quote.amount != null ? quote.amount : quote.total

  return new Promise((resolve, reject) => {
    window.FlutterwaveCheckout({
      public_key: PUBLIC_KEY,
      tx_ref: quote.ref,
      amount: charge,
      currency: quote.currency || 'ZMW',
      // Local clients pay by mobile money or card; foreign (USD) pay by card.
      payment_options: (quote.currency || 'ZMW') === 'USD' ? 'card' : 'mobilemoneyzambia, card',
      customer: {
        email: form.email,
        phone_number: form.phone || '',
        name: form.name || '',
      },
      customizations: {
        title: 'Mumbi Technology Ventures',
        description: `Payment for quote ${quote.ref}`,
      },
      callback: async (resp) => {
        try {
          const verified = await verifyPayment({
            transaction_id: resp.transaction_id,
            tx_ref: quote.ref,
          })
          if (verified.status === 'paid') resolve(verified)
          else reject(new Error(verified.message || 'Payment could not be confirmed.'))
        } catch (e) {
          reject(e)
        }
      },
      onclose: () => reject(new Error('closed')),
    })
  })
}

async function verifyPayment(payload) {
  const r = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(t || 'Verification failed. If money left your account, keep your reference and contact us.')
  }
  return r.json()
}
