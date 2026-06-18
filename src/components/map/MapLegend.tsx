import { useStore } from '../../store/StoreContext'
import { availabilityForDate, todayKey } from '../../store/selectors'

export function MapLegend() {
  const { state } = useStore()
  const avail = availabilityForDate(state, todayKey(state))
  return (
    <div className="card" style={{ padding: 12 }}>
      <div className="row spread" style={{ marginBottom: 10 }}>
        <span className="pill green">{avail.free} desks free</span>
        <span className="muted" style={{ fontSize: 13 }}>
          {avail.pct}% occupied today
        </span>
      </div>
      <div className="row" style={{ gap: 14, flexWrap: 'wrap', fontSize: 12 }}>
        <Key colour="var(--green)" label="Free" />
        <Key colour="var(--brand)" label="You" ring />
        {state.teams.map((t) => (
          <Key key={t.id} colour={t.colour} label={t.name} />
        ))}
      </div>
    </div>
  )
}

function Key({ colour, label, ring }: { colour: string; label: string; ring?: boolean }) {
  return (
    <span className="row" style={{ gap: 6 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 4,
          background: ring ? 'transparent' : colour,
          border: ring ? `2px solid ${colour}` : 'none',
          display: 'inline-block',
        }}
      />
      <span className="muted">{label}</span>
    </span>
  )
}
