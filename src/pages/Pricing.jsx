import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useSiteContent } from '../hooks/useSiteContent.js'
import {
  convert, formatMoney, withDiscount, tierPrefix, tierSuffix, toPairs,
} from '../lib/format.js'

export default function Pricing() {
  const { content: c } = useSiteContent()
  const [items, setItems] = useState([])
  const [rates, setRates] = useState([])
  const [currency, setCurrency] = useState('ZMW')
  const [ngo, setNgo] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('pricing').select('*').eq('active', true).order('sort_order'),
      supabase.from('exchange_rates').select('*'),
    ]).then(([p, r]) => {
      setItems(p.data || [])
      setRates(r.data || [])
      setLoading(false)
    })
  }, [])

  const rate = useMemo(
    () => rates.find((r) => r.currency_code === currency) || { rate_from_zmw: 1, symbol: 'K' },
    [rates, currency]
  )

  const grouped = useMemo(() => {
    const map = {}
    items.forEach((it) => {
      ;(map[it.category] ||= []).push(it)
    })
    return Object.entries(map).sort((a, b) => {
      const sa = Math.min(...a[1].map((i) => i.sort_order ?? 999))
      const sb = Math.min(...b[1].map((i) => i.sort_order ?? 999))
      return sa - sb
    })
  }, [items])

  const allInNotes = toPairs(c.pricing_allin)
  const faq = toPairs(c.pricing_faq)

  function priceLabel(item) {
    if (item.tier === 'quote' || Number(item.zmw_price) === 0) {
      return { big: 'Quote', small: 'on request' }
    }
    const discounted = withDiscount(item.zmw_price, ngo, item.ngo_discount)
    const amount = convert(discounted, rate.rate_from_zmw)
    return {
      pre: tierPrefix(item.tier),
      big: formatMoney(amount, rate),
      small: tierSuffix(item.tier),
    }
  }

  return (
    <div>
      <div className="border-b border-ink-600 bg-ink-800">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h1 className="text-4xl font-extrabold md:text-5xl">{c.pricing_heading || 'Fixed. All-in. No surprises.'}</h1>
          <p className="mt-3 max-w-2xl text-sand-300">{c.pricing_intro}</p>

          {/* Controls */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-sand-500">Currency</span>
              <div className="flex overflow-hidden rounded-lg border border-ink-600">
                {rates.map((r) => (
                  <button
                    key={r.currency_code}
                    onClick={() => setCurrency(r.currency_code)}
                    className={`px-3 py-1.5 text-sm font-medium transition ${
                      currency === r.currency_code ? 'bg-clay text-ink-900' : 'text-sand-300 hover:bg-ink-700'
                    }`}
                  >
                    <span className="mr-1">{r.flag}</span>{r.currency_code}
                  </button>
                ))}
              </div>
            </div>

            {items.some((i) => Number(i.ngo_discount) > 0) && (
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-ink-600 bg-ink-900 px-3 py-1.5">
                <input type="checkbox" checked={ngo} onChange={(e) => setNgo(e.target.checked)} className="accent-clay" />
                <span className="text-sm text-sand-200">
                  {c.pricing_tier_ngo || 'NGO / Non-profit discount'}
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-14">
        {loading ? (
          <p className="text-sand-400">Loading services…</p>
        ) : (
          <div className="space-y-12">
            {grouped.map(([category, list]) => (
              <div key={category}>
                <h2 className="mb-4 flex items-center gap-3 text-sm font-mono uppercase tracking-widest text-clay">
                  {category}
                  <span className="h-px flex-1 bg-ink-600" />
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {list.map((item) => {
                    const p = priceLabel(item)
                    const open = openId === item.id
                    return (
                      <div key={item.id} className={`card flex flex-col ${item.is_primary ? 'border-clay/40' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-semibold leading-snug">{item.name}</h3>
                          {item.is_primary && (
                            <span className="flex-none rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-bold uppercase text-clay">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="mt-2 flex-1 text-sm text-sand-400">{item.description}</p>

                        <div className="mt-4 flex items-end gap-1.5">
                          {p.pre && <span className="pb-1 text-xs text-sand-500">{p.pre}</span>}
                          <span className="text-2xl font-bold text-sand-100">{p.big}</span>
                          {p.small && <span className="pb-1 text-sm text-sand-500">{p.small}</span>}
                        </div>
                        {item.timeline && (
                          <p className="mt-1 font-mono text-xs text-sand-500">⏱ {item.timeline}</p>
                        )}

                        {Array.isArray(item.includes) && item.includes.length > 0 && (
                          <div className="mt-3 border-t border-ink-600 pt-3">
                            <button
                              onClick={() => setOpenId(open ? null : item.id)}
                              className="flex w-full items-center justify-between text-xs font-semibold text-sand-300 hover:text-clay"
                            >
                              What&apos;s included
                              <span>{open ? '−' : '+'}</span>
                            </button>
                            {open && (
                              <ul className="mt-2.5 space-y-1.5">
                                {item.includes.map((inc) => (
                                  <li key={inc} className="flex gap-2 text-xs text-sand-400">
                                    <span className="text-clay">✓</span>{inc}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        <Link
                          to={`/contact?service=${encodeURIComponent(item.name)}`}
                          className="btn-ghost mt-4 w-full"
                        >
                          Request this
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All-in notes */}
        {allInNotes.length > 0 && (
          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {allInNotes.map((n) => (
              <div key={n.title} className="card">
                <p className="font-semibold text-clay">{n.title}</p>
                <p className="mt-1.5 text-sm text-sand-400">{n.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {faq.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold">Questions, answered</h2>
            <div className="mt-6 divide-y divide-ink-600 rounded-xl border border-ink-600">
              {faq.map((q) => (
                <details key={q.title} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-medium text-sand-100 marker:hidden">
                    {q.title}
                  </summary>
                  <p className="mt-2 text-sm text-sand-400">{q.desc}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
