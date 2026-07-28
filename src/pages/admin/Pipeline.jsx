import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { PageHead, StatCard, Empty } from '../../components/ui.jsx'
import { ChartCard, BarSeries } from '../../components/charts.jsx'
import { PROJECT_STAGES } from '../../lib/pipeline.js'
import { pipelineByStage, sumBy, depositDue, fmtK, CHART_COLORS } from '../../lib/metrics.js'

export default function Pipeline() {
  const [projects, setProjects] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('project_docs').select('project_id, type, status, data'),
    ]).then(([p, d]) => {
      setProjects(p.data || [])
      setDocs(d.data || [])
      setLoading(false)
    })
  }, [])

  const stageData = useMemo(() => pipelineByStage(projects, PROJECT_STAGES), [projects])

  const active = projects.filter((p) => p.status !== 'complete')
  const booked = sumBy(projects, 'price_zmw')
  const activeValue = sumBy(active, 'price_zmw')
  const completedValue = sumBy(projects.filter((p) => p.status === 'complete'), 'price_zmw')

  // Deposits: sum of deposit invoices marked paid vs still outstanding.
  const invoicePaid = docs.filter((d) => d.type === 'invoice' && d.status === 'paid')
    .reduce((a, d) => a + (Number(d.data?.amount) || 0), 0)
  const depositsExpected = active.reduce((a, p) => a + depositDue(p), 0)

  const chartValue = stageData.filter((s) => s.value > 0).map((s) => ({ name: s.label, count: s.value }))

  if (loading) return <p className="text-sm text-sand-400">Loading pipeline…</p>

  return (
    <div>
      <PageHead title="Revenue & pipeline" subtitle="Where value sits in the pipeline, and what's been collected." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total booked" value={fmtK(booked)} hint={`${projects.length} projects`} />
        <StatCard label="Active pipeline" value={fmtK(activeValue)} hint={`${active.length} in progress`} />
        <StatCard label="Deposits collected" value={fmtK(invoicePaid)} hint={`${fmtK(depositsExpected)} expected on active`} />
        <StatCard label="Delivered value" value={fmtK(completedValue)} hint="completed projects" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pipeline value by stage" hint="Sum of project prices (ZMW)">
          {chartValue.length ? <BarSeries data={chartValue} x="name" y="count" color={CHART_COLORS.clay} /> : <Empty>No priced projects.</Empty>}
        </ChartCard>
        <ChartCard title="Projects by stage" hint="Count of projects at each stage">
          <BarSeries data={stageData.map((s) => ({ name: s.label, count: s.count }))} x="name" y="count" color={CHART_COLORS.blue} />
        </ChartCard>
      </div>

      {/* Kanban */}
      <h2 className="mt-8 mb-3 text-lg font-semibold">Board</h2>
      {projects.length === 0 ? (
        <Empty>No projects yet.</Empty>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PROJECT_STAGES.map((stage) => {
            const list = projects.filter((p) => p.status === stage)
            const value = sumBy(list, 'price_zmw')
            return (
              <div key={stage} className="w-60 flex-none">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-sand-300 capitalize">{stage.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-[10px] text-sand-500">{list.length}</span>
                </div>
                <div className="space-y-2 rounded-xl border border-ink-600 bg-ink-800/50 p-2" style={{ minHeight: 80 }}>
                  {list.map((p) => (
                    <Link key={p.id} to={`/admin/projects/${p.id}`} className="block rounded-lg border border-ink-600 bg-ink-800 p-3 transition hover:border-clay/50">
                      <p className="text-sm font-medium text-sand-100">{p.client_name}</p>
                      <p className="truncate text-xs text-sand-500">{p.service_name || '—'}</p>
                      <p className="mt-1.5 text-xs font-semibold text-clay">{p.price_zmw ? fmtK(p.price_zmw) : 'No price'}</p>
                    </Link>
                  ))}
                  {list.length === 0 && <p className="px-2 py-3 text-center text-xs text-sand-600">—</p>}
                </div>
                {value > 0 && <p className="mt-1.5 px-1 font-mono text-[10px] text-sand-500">{fmtK(value)}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
