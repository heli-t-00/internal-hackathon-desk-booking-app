import { useState } from 'react'
import { BottomSheet } from '../common/BottomSheet'
import { useStore } from '../../store/StoreContext'
import { activeBookingFor, deskStatus, isOfficeFull, myWaitlistEntry, todayKey, waitlistFor, waitlistPosition } from '../../store/selectors'
import { prettyDate, slotLabel } from '../../store/time'
import type { ResourceType, Slot } from '../../store/types'

export interface BookingTarget {
  resourceId: string
  resourceType: ResourceType
  title: string
  subtitle: string
}

const SLOTS: Slot[] = ['morning', 'afternoon', 'allday']

export function BookingSheet({ target, date: dateProp, onClose }: { target: BookingTarget | null; date?: string; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [slot, setSlot] = useState<Slot>('allday')
  const today = todayKey(state)
  const date = dateProp ?? today

  if (!target) return null

  const cell = target.resourceType === 'desk' ? deskStatus(state, target.resourceId, date) : null
  const isTeamMine = cell?.status === 'team_mine'
  const isTeamOther = cell?.status === 'team_other'
  const resourceTaken = !!activeBookingFor(state, target.resourceId, date, slot)
  const officeFull = target.resourceType === 'desk' && !isTeamMine && isOfficeFull(state, date, slot)
  const myEntry = target.resourceType === 'desk' ? myWaitlistEntry(state, date, slot) : undefined
  const myPos = myEntry ? waitlistPosition(state, myEntry.id) : undefined
  const queueLength = waitlistFor(state, date, slot).length

  const book = () => {
    dispatch({
      type: 'BOOK',
      resourceId: target.resourceId,
      resourceType: target.resourceType,
      userId: state.currentUserId,
      date,
      slot,
    })
    onClose()
  }

  const claimTeamDesk = () => {
    const booking = activeBookingFor(state, target!.resourceId, date)
    if (booking) dispatch({ type: 'CLAIM_TEAM_DESK', bookingId: booking.id, userId: state.currentUserId })
    onClose()
  }

  const joinWaitlist = () => {
    dispatch({ type: 'JOIN_WAITLIST', userId: state.currentUserId, date, slot })
    onClose()
  }

  const leaveWaitlist = () => {
    if (myEntry) dispatch({ type: 'LEAVE_WAITLIST', entryId: myEntry.id })
    onClose()
  }

  const slotPicker = (
    <>
      <div className="section-title" style={{ marginTop: 18 }}>
        {prettyDate(date, today)} · choose a slot
      </div>
      <div className="row" style={{ gap: 8 }}>
        {SLOTS.map((s) => (
          <button
            key={s}
            onClick={() => setSlot(s)}
            className="btn"
            style={{
              flex: 1,
              background: slot === s ? 'var(--brand)' : 'var(--surface-2)',
              color: slot === s ? '#fff' : 'var(--ink)',
            }}
          >
            {slotLabel(s)}
          </button>
        ))}
      </div>
    </>
  )

  // Desk is team-reserved for MY team — show claim option
  if (isTeamMine) {
    return (
      <BottomSheet open={!!target} onClose={onClose}>
        <h2 style={{ fontSize: 20 }}>{target.title}</h2>
        <p className="muted" style={{ marginTop: 4 }}>{target.subtitle}</p>
        <div style={{ marginTop: 18, padding: '14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#1d4ed8' }}>Reserved for your team</div>
          <div style={{ fontSize: 13, color: '#1e40af', marginTop: 4 }}>This desk is held for your team — claim it before the hold expires.</div>
        </div>
        <button className="btn block" style={{ marginTop: 12 }} onClick={claimTeamDesk}>
          Claim this desk
        </button>
      </BottomSheet>
    )
  }

  // Desk is team-reserved for ANOTHER team
  if (isTeamOther) {
    return (
      <BottomSheet open={!!target} onClose={onClose}>
        <h2 style={{ fontSize: 20 }}>{target.title}</h2>
        <p className="muted" style={{ marginTop: 4 }}>{target.subtitle}</p>
        <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 13.5, color: 'var(--ink-faint)' }}>
          This desk is currently held for another team. It will open to everyone once their hold window expires.
        </div>
        <button className="btn block" style={{ marginTop: 12, background: 'var(--surface-2)', color: 'var(--ink)' }} onClick={onClose}>
          Back to map
        </button>
      </BottomSheet>
    )
  }

  // Desk is taken but other desks are free — nudge back to the map
  if (resourceTaken && target.resourceType === 'desk' && !officeFull) {
    return (
      <BottomSheet open={!!target} onClose={onClose}>
        <h2 style={{ fontSize: 20 }}>{target.title}</h2>
        <p className="muted" style={{ marginTop: 4 }}>{target.subtitle}</p>
        {slotPicker}
        <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 13.5, color: 'var(--ink-faint)' }}>
          This desk is already booked for {slotLabel(slot).toLowerCase()}, but other desks are available — tap one on the map.
        </div>
        <button className="btn block" style={{ marginTop: 12, background: 'var(--surface-2)', color: 'var(--ink)' }} onClick={onClose}>
          Back to map
        </button>
      </BottomSheet>
    )
  }

  // Office is fully booked — show waitlist options
  if (officeFull) {
    if (myEntry) {
      return (
        <BottomSheet open={!!target} onClose={onClose}>
          <h2 style={{ fontSize: 20 }}>Office is full</h2>
          <p className="muted" style={{ marginTop: 4 }}>All desks are booked for {slotLabel(slot).toLowerCase()} on {prettyDate(date, today).toLowerCase()}.</p>
          {slotPicker}
          <div style={{ marginTop: 18, padding: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#15803d' }}>You're on the waitlist</div>
            <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
              Position #{myPos} of {queueLength} — we'll book you automatically if a spot opens.
            </div>
          </div>
          <button className="btn block" style={{ marginTop: 12, background: 'var(--surface-2)', color: 'var(--ink)' }} onClick={leaveWaitlist}>
            Leave waitlist
          </button>
        </BottomSheet>
      )
    }

    return (
      <BottomSheet open={!!target} onClose={onClose}>
        <h2 style={{ fontSize: 20 }}>Office is full</h2>
        <p className="muted" style={{ marginTop: 4 }}>All desks are booked for {slotLabel(slot).toLowerCase()} on {prettyDate(date, today).toLowerCase()}.</p>
        {slotPicker}
        <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 10, fontSize: 13.5, color: 'var(--ink-faint)' }}>
          {queueLength > 0 ? `${queueLength} ${queueLength === 1 ? 'person is' : 'people are'} already waiting.` : 'Join the waitlist and you\'ll be booked automatically if a desk opens up.'}
        </div>
        <button className="btn block" style={{ marginTop: 12 }} onClick={joinWaitlist}>
          Join waitlist for {slotLabel(slot).toLowerCase()}
        </button>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={!!target} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>{target.title}</h2>
      <p className="muted" style={{ marginTop: 4 }}>
        {target.subtitle}
      </p>
      {slotPicker}
      <button className="btn block" style={{ marginTop: 18 }} onClick={book}>
        Book {target.title}
      </button>
    </BottomSheet>
  )
}
