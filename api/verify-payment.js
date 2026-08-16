// Vercel serverless function. Confirms a Flutterwave payment on the server so a
// client cannot mark their own quote as paid. Never expose FLW_SECRET_KEY or the
// Supabase service-role key to the browser — set them as project env vars.
//
// Required env vars (server-side, NOT prefixed with VITE_):
//   FLW_SECRET_KEY              Flutterwave secret key
//   SUPABASE_URL                e.g. https://fbgkawricmthukaoxqco.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   Supabase service-role key (bypasses RLS)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ status: 'error', message: 'Method not allowed' })
    return
  }

  const { FLW_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!FLW_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ status: 'error', message: 'Payment verification is not configured on the server.' })
    return
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  } catch {
    res.status(400).json({ status: 'error', message: 'Invalid request body.' })
    return
  }
  const transaction_id = body.transaction_id
  const tx_ref = body.tx_ref
  // Strict validation: both must be short, plain strings. Rejects anything
  // oversized or non-string before it touches a query or an upstream call.
  const okStr = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max
  if (!okStr(String(transaction_id), 64) || !okStr(tx_ref, 64)) {
    res.status(400).json({ status: 'error', message: 'Missing or invalid transaction_id or tx_ref.' })
    return
  }

  const sb = {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  }

  try {
    // 1) Look up the quote we expect to be paid.
    const qres = await fetch(
      `${SUPABASE_URL}/rest/v1/quotes?ref=eq.${encodeURIComponent(tx_ref)}&select=*`,
      { headers: sb.headers },
    )
    const quotes = await qres.json()
    const quote = Array.isArray(quotes) ? quotes[0] : null
    if (!quote) {
      res.status(404).json({ status: 'error', message: 'Quote not found.' })
      return
    }

    // 2) Verify the transaction directly with Flutterwave.
    const vres = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`,
      { headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` } },
    )
    const v = await vres.json()
    const t = v && v.data
    // Expected charge is the deposit (if set), otherwise the full total.
    const expected = Number(quote.deposit) > 0 ? Number(quote.deposit) : Number(quote.total)
    const ok =
      v.status === 'success' &&
      t &&
      t.status === 'successful' &&
      Number(t.amount) >= expected &&
      String(t.currency) === String(quote.currency)

    // 3) Record the payment (success or failure) for the audit trail.
    await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
      method: 'POST',
      headers: sb.headers,
      body: JSON.stringify({
        quote_id: quote.id,
        quote_ref: quote.ref,
        provider: 'flutterwave',
        tx_ref,
        provider_ref: String(transaction_id),
        amount: t ? t.amount : null,
        currency: t ? t.currency : quote.currency,
        status: ok ? 'successful' : 'failed',
        raw: t || v || {},
      }),
    })

    if (!ok) {
      res.status(200).json({ status: 'failed', message: 'Payment was not successful or did not match the quote.' })
      return
    }

    // 4) Mark the deposit paid.
    await fetch(`${SUPABASE_URL}/rest/v1/quotes?ref=eq.${encodeURIComponent(tx_ref)}`, {
      method: 'PATCH',
      headers: { ...sb.headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'deposit_paid', paid_at: new Date().toISOString() }),
    })
    // Move the request along too, if linked.
    if (quote.request_id) {
      await fetch(`${SUPABASE_URL}/rest/v1/quote_requests?id=eq.${quote.request_id}`, {
        method: 'PATCH',
        headers: { ...sb.headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'deposit_paid' }),
      })
    }

    res.status(200).json({ status: 'paid', ref: tx_ref })
  } catch (e) {
    res.status(500).json({ status: 'error', message: 'Verification failed on the server.' })
  }
}
