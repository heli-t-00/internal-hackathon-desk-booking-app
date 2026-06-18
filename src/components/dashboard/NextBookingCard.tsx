import { useStore } from '../../store/StoreContext'
import { myNextBooking, resourceLabel, todayKey } from '../../store/selectors'
import { prettyDate, slotLabel } from '../../store/time'

export function NextBookingCard({ onBook }: { onBook: () => void }) {
  const { state, dispatch } = useStore()
  const today = todayKey(state)
  const booking = myNextBooking(state)

  if (!booking) {
    return (
      <div className="card" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>
        <div className="section-title" style={{ color: 'rgba(255,255,255,0.7)' }}>Your spot</div>
        <h2 style={{ fontSize: 20 }}>No desk booked yet</h2>
        <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>
          The office is filling up today — grab one before they're gone.
        </p>
        <button className="btn block" style={{ marginTop: 14, background: '#fff', color: 'var(--brand-ink)' }} onClick={onBook}>
          🔍 Book a desk
        </button>
      </div>
    )
  }

  const isToday = booking.date === today
  const label = resourceLabel(state, booking)
  const checkedIn = booking.status === 'checked_in'

  return (
    <div className="card" style={{ background: 'linear-gradient(135deg,#1e40af,#2563eb)', color: '#fff' }}>
      <div className="row spread">
        <div className="section-title" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {isToday ? 'Today' : 'Next booking'}
        </div>
        <span
          className="pill"
          style={{ background: checkedIn ? 'rgba(52,179,106,0.25)' : 'rgba(255,255,255,0.18)', color: '#fff' }}
        >
          {checkedIn ? '✓ Checked in' : 'Reserved'}
        </span>
      </div>

      <h2 style={{ fontSize: 28, marginTop: 4 }}>{label}</h2>
      <p style={{ opacity: 0.9, marginTop: 4, fontSize: 14 }}>
        {prettyDate(booking.date, today)} · {slotLabel(booking.slot)}
      </p>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isToday && !checkedIn && (
          <button
            className="btn block"
            style={{ background: '#fff', color: 'var(--brand-ink)' }}
            onClick={() => dispatch({ type: 'CHECK_IN', bookingId: booking.id })}
          >
            📲 Check in
          </button>
        )}
        <div className="row" style={{ gap: 10 }}>
          <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.16)', color: '#fff' }} onClick={onBook}>
            Change desk
          </button>
          <button
            className="btn"
            style={{ flex: 1, background: 'rgba(239,68,68,0.35)', color: '#fff' }}
            onClick={() => dispatch({ type: 'CANCEL_BOOKING', bookingId: booking.id })}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

