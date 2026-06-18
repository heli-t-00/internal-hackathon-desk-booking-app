import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../../store/StoreContext'
import { OccupancyGauge } from '../common/OccupancyGauge'
import {
  availabilityForDate,
  busiestDay,
  noShowRate,
  quietestDay,
  todayKey,
  utilisationByWeekday,
} from '../../store/selectors'

export function AdminDashboard() {
  const { state } = useStore()
  const today = todayKey(state)
  const avail = availabilityForDate(state, today)
  const util = utilisationByWeekday(state)
  const noShow = noShowRate(state)
  const quiet = quietestDay(state)
  const busy = busiestDay(state)

  return (
    <div className="app-scroll">
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 24 }}>Office insights</h1>
        <p className="muted" style={{ marginTop: 2 }}>What "busy" actually means — from real check-in data.</p>
      </div>

      {/* headline stats */}
      <div className="row" style={{ gap: 12 }}>
        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <OccupancyGauge pct={avail.pct} size={76} />
          <div>
            <div style={{ fontWeight: 800 }}>Today</div>
            <div className="muted" style={{ fontSize: 12.5 }}>{avail.taken}/{avail.total} desks</div>
          </div>
        </div>
        <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
          <OccupancyGauge pct={noShow} size={76} label="no-show" />
          <div>
            <div style={{ fontWeight: 800 }}>No-shows</div>
            <div className="muted" style={{ fontSize: 12.5 }}>booked, never used</div>
          </div>
        </div>
      </div>

      {/* utilisation chart */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="section-title">Booked vs actually used (by weekday)</div>
        <div style={{ height: 200, marginLeft: -18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={util} barGap={2}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--ink-faint)' }} />
              <YAxis tickLine={false} axisLine={false} width={32} tick={{ fontSize: 11, fill: 'var(--ink-faint)' }} unit="%" />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} formatter={(v: number) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="Booked" dataKey="bookedPct" fill="#bfdbfe" radius={[5, 5, 0, 0]} />
              <Bar name="Checked in" dataKey="checkedInPct" fill="var(--brand)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          The gap between the bars is wasted space — desks reserved but never checked into.
        </p>
      </div>

      {/* insights */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="section-title">What the data says</div>
        <Insight icon="📈" text={`${busy} is the busiest day — consider capping team blocks.`} />
        <Insight icon="📉" text={`${quiet} is the quietest — push flexible folks here to balance load.`} />
        <Insight icon="🚪" text={`Atlas is monopolised by Sales — most days, all fortnight.`} />
        <Insight icon="♻️" text={`${noShow}% of bookings were no-shows — auto-release reclaimed that space.`} />
      </div>
    </div>
  )
}

function Insight({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="row" style={{ gap: 10, padding: '8px 0', borderTop: '1px solid var(--line)' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 14 }}>{text}</span>
    </div>
  )
}
