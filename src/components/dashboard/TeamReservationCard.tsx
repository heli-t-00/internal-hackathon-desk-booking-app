import { useStore, useCurrentUser } from '../../store/StoreContext'
import { myTeamNotifications, myTeamReservation, teamById, todayKey } from '../../store/selectors'
import type { Tab } from '../../App'

export function TeamReservationCard({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { state, dispatch } = useStore()
  const me = useCurrentUser()
  const today = todayKey(state)
  const notifications = myTeamNotifications(state)
  const myReservation = myTeamReservation(state, today)
  const myTeam = teamById(state, me.teamId)

  // Show the booker their own reservation status
  if (myReservation && myReservation.createdBy === me.id) {
    const claimed = state.bookings.filter(
      (b) => myReservation.deskIds.includes(b.resourceId) && b.date === today && b.status === 'reserved',
    ).length
    const held = state.bookings.filter(
      (b) => myReservation.deskIds.includes(b.resourceId) && b.date === today && b.status === 'team_reserved',
    ).length
    const expiryTime = new Date(myReservation.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
      <div className="card" style={{ marginTop: 14, borderLeft: `3px solid ${myTeam?.colour ?? 'var(--brand)'}` }}>
        <div className="section-title" style={{ marginBottom: 8 }}>Team reservation</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {myReservation.deskIds.length} desks held for {myTeam?.name} team
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>
          {claimed} claimed · {held} still available · expires {expiryTime}
        </div>
        <button
          className="btn"
          style={{ marginTop: 12, fontSize: 12, padding: '5px 12px', background: 'var(--surface-2)', color: 'var(--ink)' }}
          onClick={() => dispatch({ type: 'CANCEL_TEAM_RESERVATION', reservationId: myReservation.id })}
        >
          Cancel reservation
        </button>
      </div>
    )
  }

  // Show teammates the invite notification
  if (notifications.length === 0) return null

  const notif = notifications[0]

  return (
    <div className="card" style={{ marginTop: 14, borderLeft: `3px solid ${myTeam?.colour ?? 'var(--brand)'}` }}>
      <div className="section-title" style={{ marginBottom: 8 }}>Team desk invite</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{notif.message}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn block" onClick={() => onNavigate('map')} style={{ fontSize: 13 }}>
          Claim a desk
        </button>
        <button
          className="btn"
          style={{ fontSize: 13, padding: '6px 14px', background: 'var(--surface-2)', color: 'var(--ink)' }}
          onClick={() => dispatch({ type: 'DISMISS_NOTIFICATION', notificationId: notif.id })}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
