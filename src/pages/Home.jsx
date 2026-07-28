import { Link } from 'react-router-dom'
import { useSiteContent } from '../hooks/useSiteContent.js'
import { toLines, toPairs } from '../lib/format.js'

function Section({ children, className = '' }) {
  return <section className={`mx-auto max-w-6xl px-5 ${className}`}>{children}</section>
}

export default function Home() {
  const { content: c } = useSiteContent()

  const trust = toLines(c.trustbar)
  const badItems = toLines(c.problem_bad)
  const goodItems = toLines(c.problem_good)
  const processSteps = toPairs(c.process_steps)
  const guarantees = toPairs(c.guarantees)
  const security = toPairs(c.security_items)

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <Section className="relative pt-24 pb-20 md:pt-40 md:pb-32">
          <div className="max-w-4xl">
            {c.hero_eyebrow && (
              <span className="reveal inline-flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.28em] text-sand-400">
                <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                {c.hero_eyebrow}
              </span>
            )}
            <h1 className="reveal mt-6 text-5xl font-bold leading-[0.98] tracking-tight md:text-7xl lg:text-8xl" style={{ animationDelay: '0.05s' }}>
              {c.hero_title || 'Software, websites and automation —'}{' '}
              <span className="gradient-text">{c.hero_accent || 'built to solve real problems.'}</span>
            </h1>
            <p className="reveal mt-8 max-w-xl text-lg leading-relaxed text-sand-200" style={{ animationDelay: '0.12s' }}>
              {c.hero_subtitle}
            </p>
            <div className="reveal mt-10 flex flex-wrap gap-4" style={{ animationDelay: '0.18s' }}>
              <Link to="/start" className="btn-primary">{c.hero_cta_primary || 'Request a quote'}</Link>
              <Link to="/pricing" className="btn-ghost">{c.hero_cta_secondary || 'See pricing'}</Link>
            </div>
          </div>
        </Section>
      </div>

      {/* Trust bar */}
      {trust.length > 0 && (
        <div className="border-y border-ink-600 bg-ink-800">
          <Section className="flex flex-wrap items-center gap-x-8 gap-y-2 py-4 text-sm text-sand-400">
            {trust.map((t) => (
              <span key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                {t}
              </span>
            ))}
          </Section>
        </div>
      )}

      {/* Why us — comparison */}
      <Section className="py-16 md:py-20">
        <p className="kicker">{c.problem_kicker}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold md:text-4xl">{c.problem_title}</h2>
        <p className="mt-3 max-w-2xl text-sand-400">{c.problem_sub}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="card border-ink-600">
            <p className="font-semibold text-sand-200">{c.problem_bad_title || 'The usual experience'}</p>
            <ul className="mt-4 space-y-2.5">
              {badItems.map((i) => (
                <li key={i} className="flex gap-2.5 text-sm text-sand-400">
                  <span className="mt-0.5 text-sand-500">✕</span>{i}
                </li>
              ))}
            </ul>
          </div>
          <div className="card border-clay/40 bg-clay/5">
            <p className="font-semibold text-clay">{c.problem_good_title || 'Working with MTV'}</p>
            <ul className="mt-4 space-y-2.5">
              {goodItems.map((i) => (
                <li key={i} className="flex gap-2.5 text-sm text-sand-200">
                  <span className="mt-0.5 text-clay">✓</span>{i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Services teaser */}
      <div className="border-y border-ink-600 bg-ink-800">
        <Section className="py-16 md:py-20">
          <p className="kicker">{c.services_kicker}</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold md:text-4xl">{c.services_title}</h2>
          <p className="mt-3 max-w-2xl text-sand-400">{c.services_sub}</p>
          <div className="mt-8">
            <Link to="/pricing" className="btn-primary">Browse all services &amp; pricing →</Link>
          </div>
        </Section>
      </div>

      {/* Process */}
      <Section className="py-16 md:py-20">
        <p className="kicker">{c.process_kicker}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold md:text-4xl">{c.process_title}</h2>
        <p className="mt-3 max-w-2xl text-sand-400">{c.process_sub}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((s, idx) => (
            <div key={s.title} className="card">
              <span className="font-mono text-sm text-clay">0{idx + 1}</span>
              <p className="mt-2 font-semibold">{s.title}</p>
              <p className="mt-1.5 text-sm text-sand-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Guarantees */}
      {guarantees.length > 0 && (
        <div className="border-y border-ink-600 bg-ink-800">
          <Section className="py-16 md:py-20">
            <p className="kicker">{c.guar_kicker}</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">{c.guar_title}</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {guarantees.map((g) => (
                <div key={g.title} className="flex gap-3">
                  <span className="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-clay/15 text-xs text-clay">✓</span>
                  <div>
                    <p className="font-semibold">{g.title}</p>
                    <p className="mt-1 text-sm text-sand-400">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Trust & Security */}
      {security.length > 0 && (
        <Section className="py-16 md:py-20">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-clay/15 text-clay">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <p className="kicker">{c.security_kicker || 'Trust & security'}</p>
          </div>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold md:text-4xl">{c.security_title}</h2>
          <p className="mt-3 max-w-2xl text-sand-400">{c.security_sub}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {security.map((s) => (
              <div key={s.title} className="card">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clay/10 text-clay">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </div>
                <p className="mt-3 font-semibold">{s.title}</p>
                <p className="mt-1.5 text-sm text-sand-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* CTA */}
      <Section className="py-16 md:py-24">
        <div className="rounded-2xl border border-clay/30 bg-gradient-to-br from-ink-800 to-ink-700 p-8 text-center md:p-14">
          <h2 className="text-3xl font-bold md:text-4xl">{c.cta_title || 'Ready to see a number for your project?'}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sand-300">{c.cta_sub}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/start" className="btn-primary">{c.cta_primary || 'Request a quote'}</Link>
            <Link to="/pricing" className="btn-ghost">{c.cta_secondary || 'Browse pricing first'}</Link>
          </div>
        </div>
      </Section>
    </div>
  )
}
