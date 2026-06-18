import { useStore } from '../../store/StoreContext'
import { OccupancyGauge } from '../common/OccupancyGauge'
import { availabilityForDate, teamPresenceToday, todayKey, userById, whoIsInToday } from '../../store/selectors'

export function OfficeTodayCard() {
  const { state } = useStore()
  const today = todayKey(state)
  const avail = availabilityForDate(state, today)
  const present = whoIsInToday(state)
  const teams = teamPresenceToday(state)
  const myTeamName = state.teams.find((t) => t.id === userById(state, state.currentUserId)?.teamId)?.name
  const myTeamCount = teams.find((t) => t.isMine)?.count ?? 0
  const maxCount = Math.max(1, ...teams.map((t) => t.count))

  return (
    <div className="card">
      <div className="section-title">Office today</div>

      <div className="row" style={{ gap: 16, alignItems: 'center' }}>
        <OccupancyGauge pct={avail.pct} label="occupied" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{present.length} people in</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {myTeamCount} from {myTeamName} · {avail.free} desks free
          </div>
          {/* mini avatar row */}
          <div className="row" style={{ marginTop: 10 }}>
            {present.slice(0, 7).map((p, i) => (
              <span
                key={p.user.id}
                title={`${p.user.name} · ${p.resourceLabel}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fff',
                  background: state.teams.find((t) => t.id === p.user.teamId)?.colour,
                  marginLeft: i === 0 ? 0 : -8,
                  border: '2px solid #fff',
                }}
              >
                {p.user.initials}
              </span>
            ))}
            {present.length > 7 && (
              <span className="muted" style={{ marginLeft: 6, fontSize: 12 }}>
                +{present.length - 7}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* team presence bars */}
      <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
        {teams.map((t) => (
          <div key={t.team.id} className="row" style={{ gap: 10 }}>
            <span style={{ width: 62, fontSize: 12.5, fontWeight: t.isMine ? 700 : 500, color: t.isMine ? 'var(--ink)' : 'var(--ink-soft)' }}>
              {t.team.name}
            </span>
            <div style={{ flex: 1, height: 8, background: 'var(--surface-2)', borderRadius: 999 }}>
              <div style={{ width: `${(t.count / maxCount) * 100}%`, height: '100%', borderRadius: 999, background: t.team.colour }} />
            </div>
            <span className="muted" style={{ width: 18, textAlign: 'right', fontSize: 12 }}>
              {t.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
