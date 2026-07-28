// Thin wrappers around Recharts with the MTV futuristic dark theme baked in,
// so pages stay readable and consistent.
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { CHART_COLORS } from '../lib/metrics.js'

const tip = {
  contentStyle: {
    background: 'rgba(10,12,26,0.92)',
    border: '1px solid rgba(52,229,255,0.25)',
    borderRadius: 10,
    fontSize: 12,
    boxShadow: '0 8px 30px -8px rgba(52,229,255,0.35)',
  },
  labelStyle: { color: '#eef2fb' },
  itemStyle: { color: '#c3cce6' },
}

export function ChartCard({ title, hint, children, height = 240 }) {
  return (
    <div className="card">
      <div className="mb-3">
        <p className="text-sm font-semibold text-sand-100">{title}</p>
        {hint && <p className="text-xs text-sand-500">{hint}</p>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  )
}

export function LineTrend({ data, x = 'label', y = 'count' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.clay} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.clay} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey={x} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
        <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey={y} stroke={CHART_COLORS.clay} strokeWidth={2.5}
          fill="url(#trendFill)" dot={false}
          activeDot={{ r: 4, fill: CHART_COLORS.clay, stroke: '#05060f', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function BarSeries({ data, x = 'name', y = 'count', color = CHART_COLORS.clay, horizontal = false }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 12, left: horizontal ? 8 : -18, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
            <YAxis type="category" dataKey={x} width={130} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fill: CHART_COLORS.axis, fontSize: 11 }} />
          </>
        )}
        <Tooltip {...tip} cursor={{ fill: 'rgba(52,229,255,0.08)' }} />
        <Bar dataKey={y} fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Donut({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
          {data.map((d, i) => <Cell key={i} fill={d.color || CHART_COLORS.clay} />)}
        </Pie>
        <Tooltip {...tip} />
      </PieChart>
    </ResponsiveContainer>
  )
}
