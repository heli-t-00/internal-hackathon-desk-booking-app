import { useStore } from '../../store/StoreContext'
import { myWaitlistEntries, waitlistPosition, resourceLabel } from '../../store/selectors'
import { prettyDate, slotLabel } from '../../store/time'
import { todayKey } from '../../store/selectors'

export function WaitlistCard() {
  const { state, dispatch } = useStore()
  const entries = myWaitlistEntries(state)
  const today = todayKey(state)

  if (entries.length === 0) return null

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="section-title" style={{ marginBottom: 10 }}>Waitlist</div>
      {entries.map((entry) => {
        const pos = waitlistPosition(state, entry.id)
        const isPast = entry.date < today
        return (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid var(--line)',
              opacity: isPast ? 0.5 : 1,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {prettyDate(entry.date, today)} · {slotLabel(entry.slot)}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                {isPast ? 'Expired' : `Position #${pos} on the waitlist`}
              </div>
            </div>
            <button
              className="btn"
              style={{ fontSize: 12, padding: '5px 12px', background: 'var(--surface-2)', color: 'var(--ink)' }}
              onClick={() => dispatch({ type: 'LEAVE_WAITLIST', entryId: entry.id })}
            >
              Leave
            </button>
          </div>
        )
      })}
      <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 10 }}>
        You'll be booked automatically and notified when a desk opens up.
      </p>
    </div>
  )
}
