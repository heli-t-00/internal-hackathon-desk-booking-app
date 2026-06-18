import { Bar, BarChart, Cell, ResponsiveContainer, XAxis } from 'recharts'
import { useStore } from '../../store/StoreContext'
import { busiestDay, myStats, quietestDay, utilisationByWeekday } from '../../store/selectors'

export function MyStatsCard() {
  const { state } = useStore()
  const stats = myStats(state)
  const util = utilisationByWeekday(state)
  const quiet = quietestDay(state)
  const busy = busiestDay(state)

  return (
    <div className="card">
      <div className="section-title">Your patterns</div>

      <div className="row" style={{ gap: 10 }}>
        <Stat value={`${Math.round(stats.checkInRate * 100)}%`} label="Check-in rate" />
        <Stat value={stats.favouriteDeskNumber ? `#${stats.favouriteDeskNumber}` : '—'} label="Favourite desk" />
        <Stat value={`${stats.daysInLastFortnight}`} label="Days in (2wks)" />
      </div>

      <div className="section-title" style={{ marginTop: 20 }}>Office trends</div>
      <div style={{ height: 110, marginLeft: -6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={util} barCategoryGap={14}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--ink-faint)' }} />
            <Bar dataKey="bookedPct" radius={[6, 6, 0, 0]}>
              {util.map((d) => (
                <Cell
                  key={d.day}
                  fill={d.day === busy ? 'var(--brand)' : d.day === quiet ? '#cbd5e1' : '#bfdbfe'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        <strong style={{ color: 'var(--ink)' }}>{busy}</strong> is busiest ·{' '}
        <strong style={{ color: 'var(--ink)' }}>{quiet}</strong> is quietest — easiest day to grab a good spot.
      </p>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
        {label}
      </div>
    </div>
  )
}
