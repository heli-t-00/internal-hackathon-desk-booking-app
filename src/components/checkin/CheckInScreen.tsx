import { useStore } from '../../store/StoreContext'
import { resourceLabel, todayKey } from '../../store/selectors'
import { slotLabel } from '../../store/time'

export function CheckInScreen() {
  const { state, dispatch } = useStore()
  const today = todayKey(state)
  const mine = state.bookings.filter(
    (b) => b.userId === state.currentUserId && b.date === today && (b.status === 'reserved' || b.status === 'checked_in'),
  )

  return (
    <div className="app-scroll">
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 24 }}>Check in</h1>
        <p className="muted" style={{ marginTop: 2 }}>Scan the QR on your desk so the seat isn't auto-released.</p>
      </div>

      {/* Faux QR scanner */}
      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <div
          aria-hidden
          style={{
            width: 150,
            height: 150,
            margin: '0 auto 16px',
            borderRadius: 16,
            background:
              'conic-gradient(#1f2a37 0 25%, #fff 0 50%, #1f2a37 0 75%, #fff 0) 0 0 / 28px 28px, #fff',
            border: '6px solid #1f2a37',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 30 }}>📷</div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>Point your camera at the desk QR</p>
      </div>

      {mine.length === 0 && (
        <div className="card" style={{ marginTop: 14, textAlign: 'center' }}>
          <p className="muted">No booking for today. Head to the floor plan to grab a desk.</p>
        </div>
      )}

      {mine.map((b) => {
        const checkedIn = b.status === 'checked_in'
        return (
          <div className="card" style={{ marginTop: 14 }} key={b.id}>
            <div className="row spread">
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{resourceLabel(state, b)}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{slotLabel(b.slot)} · today</div>
              </div>
              <span className="pill" style={checkedIn ? { background: 'var(--green-soft)', color: '#1c8049' } : {}}>
                {checkedIn ? '✓ Checked in' : '⏳ Awaiting check-in'}
              </span>
            </div>

            {!checkedIn ? (
              <>
                <p className="muted" style={{ fontSize: 12.5, margin: '12px 0' }}>
                  Auto-releases if not checked in within an hour of your slot — keeps occupancy data honest.
                </p>
                <button
                  className="btn block"
                  onClick={() => dispatch({ type: 'CHECK_IN', bookingId: b.id })}
                >
                  📲 Simulate QR scan — check in
                </button>
              </>
            ) : (
              <button
                className="btn block ghost"
                style={{ marginTop: 12 }}
                onClick={() => dispatch({ type: 'CANCEL_BOOKING', bookingId: b.id })}
              >
                Release my desk
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
