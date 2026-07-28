import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { PageHead, StatCard, Badge, Empty } from '../../components/ui.jsx'
import { ChartCard, LineTrend, BarSeries, Donut } from '../../components/charts.jsx'
import {
  leadsOverTime, leadsByStatus, topServices, funnel, winRate,
  sumBy, fmtK, CHART_COLORS,
} from '../../lib/metrics.js'

const RANGES = [
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
  { days: 365, label: '1y' },
]

export default function Dashboard() {
  const [leads, setLeads] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(90)

  useEffect(() => {
    Promise.all([
      supabase.from('leads').select('id, name, email, service, status, created_at').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, price_zmw, status, created_at'),
    ]).then(([l, p]) => {
      setLeads(l.data || [])
      setProjects(p.data || [])
      setLoading(false)
    })
  }, [])

  const inRange = useMemo(() => {
    const cutoff = Date.now() - range * 86400000
    return leads.filter((l) => new Date(l.created_at).getTime() >= cutoff)
  }, [leads, range])

  const trend = useMemo(() => leadsOverTime(inRange, Math.min(range, 90)), [inRange, range])
  const byStatus = useMemo(() => leadsByStatus(inRange), [inRange])
  const services = useMemo(() => topServices(inRange), [inRange])
  const funnelData = useMemo(() => funnel(inRange), [inRange])

  const newCount = inRange.filter((l) => l.status === 'new').length
  const wonCount = inRange.filter((l) => l.status === 'won').length
  const bookedRevenue = sumBy(projects.filter((p) => p.status !== 'complete'), 'price_zmw')
  const activeProjects = projects.filter((p) => p.status !== 'complete').length

  if (loading) return <p className="text-sm text-sand-400">Loading dashboard…</p>

  return (
    <div>
      <PageHead
        title="Overview"
        subtitle="Leads, conversion and pipeline health."
        action={
          <div className="flex overflow-hidden rounded-lg border border-ink-600">
            {RANGES.map((r) => (
              <button key={r.days} onClick={() => setRange(r.days)}
                className={`px-3 py-1.5 text-sm ${range === r.days ? 'bg-clay text-ink-900' : 'text-sand-300 hover:bg-ink-700'}`}>
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Leads (in range)" value={inRange.length} hint={`${newCount} still new`} />
        <StatCard label="Won" value={wonCount} hint={`${winRate(inRange)}% win rate (of decided)`} />
        <StatCard label="Active projects" value={activeProjects} hint="in the pipeline" />
        <StatCard label="Pipeline value" value={fmtK(bookedRevenue)} hint="active, not yet complete" />
      </div>

      {inRange.length === 0 ? (
        <Empty>No leads in this range yet.</Empty>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ChartCard title="Leads over time" hint={`New enquiries per day · last ${Math.min(range, 90)} days`}>
                <LineTrend data={trend} />
              </ChartCard>
            </div>
            <ChartCard title="By status">
              <Donut data={byStatus} />
            </ChartCard>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ChartCard title="Top requested services">
              {services.length ? <BarSeries data={services} x="name" y="count" horizontal /> : <Empty>No services tagged.</Empty>}
            </ChartCard>
            <ChartCard title="Conversion funnel" hint="Leads reaching each stage">
              <BarSeries data={funnelData} x="name" y="value" color={CHART_COLORS.green} />
            </ChartCard>
          </div>
        </>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent leads</h2>
        <Link to="/admin/leads" className="text-sm font-medium text-clay hover:underline">View all →</Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-ink-600">
        <table className="w-full text-sm">
          <thead className="bg-ink-800 text-left text-xs uppercase tracking-wide text-sand-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-600">
            {leads.slice(0, 6).map((l) => (
              <tr key={l.id} className="hover:bg-ink-800/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-sand-100">{l.name}</p>
                  <p className="text-xs text-sand-500">{l.email}</p>
                </td>
                <td className="px-4 py-3 text-sand-300">{l.service || '—'}</td>
                <td className="px-4 py-3"><Badge status={l.status} /></td>
                <td className="px-4 py-3 text-sand-500">{new Date(l.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
