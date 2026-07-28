import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { PageHead } from '../../components/ui.jsx'

export default function RatesAdmin() {
  const [rates, setRates] = useState([])
  const [saving, setSaving] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('exchange_rates').select('*').order('currency_code')
      .then(({ data }) => { setRates(data || []); setLoading(false) })
  }, [])

  function edit(code, val) {
    setRates((rs) => rs.map((r) => (r.currency_code === code ? { ...r, rate_from_zmw: val } : r)))
  }

  async function save(r) {
    setSaving(r.currency_code)
    await supabase.from('exchange_rates')
      .update({ rate_from_zmw: Number(r.rate_from_zmw), updated_at: new Date().toISOString() })
      .eq('currency_code', r.currency_code)
    setSaving(null)
  }

  return (
    <div>
      <PageHead
        title="Exchange rates"
        subtitle="Rate = value of 1 ZMW in that currency. Used to convert prices on the public pricing page."
      />
      {loading ? (
        <p className="text-sm text-sand-400">Loading…</p>
      ) : (
        <div className="max-w-lg space-y-3">
          {rates.map((r) => (
            <div key={r.currency_code} className="card flex items-center gap-4">
              <span className="text-2xl">{r.flag}</span>
              <div className="flex-1">
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-sand-500">{r.currency_code} · {r.symbol}</p>
              </div>
              <input
                type="number"
                step="0.0001"
                disabled={r.currency_code === 'ZMW'}
                value={r.rate_from_zmw}
                onChange={(e) => edit(r.currency_code, e.target.value)}
                className="field w-32 disabled:opacity-50"
              />
              <button
                onClick={() => save(r)}
                disabled={r.currency_code === 'ZMW' || saving === r.currency_code}
                className="btn-ghost"
              >
                {saving === r.currency_code ? '…' : 'Save'}
              </button>
            </div>
          ))}
          <p className="text-xs text-sand-500">
            Example: at 0.037, K1,000 shows as $37. ZMW is the base and stays at 1.
          </p>
        </div>
      )}
    </div>
  )
}
