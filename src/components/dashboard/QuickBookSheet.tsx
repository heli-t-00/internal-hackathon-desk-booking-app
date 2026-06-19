import { useState } from 'react'
import { BottomSheet } from '../common/BottomSheet'
import { useStore, useCurrentUser } from '../../store/StoreContext'
import { activeBookingFor, myStats, todayKey } from '../../store/selectors'
import { addDays, isWeekend, prettyDate, slotLabel, toDateKey, weekdayShort } from '../../store/time'
import type { Desk, Slot, StoreState } from '../../store/types'

const SLOTS: Slot[] = ['morning', 'afternoon', 'allday']

function preferredZone(state: StoreState, userId: string): string | null {
  const mine = state.bookings.filter((b) => b.userId === userId && b.resourceType === 'desk').slice(-20)
  if (!mine.length) return null
  const counts: Record<string, number> = {}
  for (const b of mine) {
    const zone = state.desks.find((d) => d.id === b.resourceId)?.zone
    if (zone) counts[zone] = (counts[zone] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

function preferStanding(state: StoreState, userId: string): boolean {
  const mine = state.bookings.filter((b) => b.userId === userId && b.resourceType === 'desk')
  if (!mine.length) return false
  const standingCount = mine.filter((b) => state.desks.find((d) => d.id === b.resourceId)?.standing).length
  return standingCount > mine.length / 3
}

interface Recommendation {
  desk: Desk
  reason: string
  score: number
}

function recommend(state: StoreState, userId: string, date: string, slot: Slot): Recommendation[] {
  const me = state.users.find((u) => u.id === userId)
  const freeDesks = state.desks.filter((d) => !activeBookingFor(state, d.id, date, slot))
  if (!freeDesks.length) return []

  const usageCount: Record<string, number> = {}
  for (const b of state.bookings.filter((b) => b.userId === userId && b.resourceType === 'desk')) {
    usageCount[b.resourceId] = (usageCount[b.resourceId] ?? 0) + 1
  }

  const zone = preferredZone(state, userId)
  const likeStanding = preferStanding(state, userId)

  const teamDeskNumbers = state.bookings
    .filter(
      (b) =>
        b.date === date &&
        b.resourceType === 'desk' &&
        state.users.find((u) => u.id === b.userId)?.teamId === me?.teamId &&
        b.userId !== userId,
    )
    .map((b) => state.desks.find((d) => d.id === b.resourceId)?.number)
    .filter((n): n is number => n != null)

  return freeDesks
    .map((desk) => {
      let score = 0
      const reasons: string[] = []

      const timesUsed = usageCount[desk.id] ?? 0
      if (timesUsed > 0) {
        score += timesUsed * 3
        reasons.push('your usual desk')
      }
      if (zone && desk.zone === zone && timesUsed === 0) {
        score += 2
        reasons.push(`${desk.zone} zone`)
      }
      if (likeStanding && desk.standing) {
        score += 2
        if (!reasons.length) reasons.push('standing desk')
      }
      if (teamDeskNumbers.length) {
        const dist = Math.min(...teamDeskNumbers.map((n) => Math.abs(n - desk.number)))
        score += Math.max(0, 5 - dist)
        if (dist <= 3 && !reasons.length) reasons.push('near your team')
      }

      const fallback =
        desk.zone === 'quiet' ? 'quiet zone' : desk.zone === 'collab' ? 'collab area' : 'standard desk'
      return { desk, score, reason: reasons[0] ?? fallback }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export function QuickBookSheet({
  open,
  onClose,
  onBooked,
}: {
  open: boolean
  onClose: () => void
  onBooked: () => void
}) {
  const { state, dispatch } = useStore()
  const me = useCurrentUser()
  const today = todayKey(state)

  const dates: string[] = []
  for (let d = 0; dates.length < 7; d++) {
    const key = toDateKey(addDays(state.nowMs, d))
    if (!isWeekend(key)) dates.push(key)
  }

  const [selectedDate, setSelectedDate] = useState(dates[0])
  const [slot, setSlot] = useState<Slot>('allday')

  const recs = recommend(state, me.id, selectedDate, slot)

  const book = (deskId: string) => {
    dispatch({ type: 'BOOK', resourceId: deskId, resourceType: 'desk', userId: me.id, date: selectedDate, slot })
    onClose()
    onBooked()
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>Quick book a desk</h2>

      <div className="section-title" style={{ marginTop: 16, marginBottom: 8 }}>Date</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDate(d)}
            style={{
              flexShrink: 0,
              padding: '8px 12px',
              borderRadius: 12,
              background: selectedDate === d ? 'var(--brand)' : 'var(--surface-2)',
              color: selectedDate === d ? '#fff' : 'var(--ink)',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div>{weekdayShort(d)}</div>
            <div style={{ fontSize: 11, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
              {d === today ? 'Today' : new Date(d + 'T00:00:00').getDate()}
            </div>
          </button>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 16, marginBottom: 8 }}>Time slot</div>
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

      <div className="section-title" style={{ marginTop: 16, marginBottom: 8 }}>
        Recommended for you · {prettyDate(selectedDate, today)}
      </div>
      {recs.length === 0 ? (
        <div
          style={{
            fontSize: 13,
            color: 'var(--ink-faint)',
            padding: '12px 14px',
            background: 'var(--surface-2)',
            borderRadius: 10,
          }}
        >
          No desks available for this slot.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recs.map(({ desk, reason }, i) => (
            <div
              key={desk.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--surface)',
                borderRadius: 12,
                boxShadow: 'var(--shadow-sm)',
                border: i === 0 ? '1.5px solid var(--brand)' : '1px solid var(--line)',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Desk {desk.number}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
                  {desk.zone === 'quiet' ? 'Quiet zone' : desk.zone === 'collab' ? 'Collaboration' : 'Standard'}
                  {desk.standing ? ' · standing' : ''} · {reason}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i === 0 && (
                  <span className="pill green" style={{ fontSize: 11 }}>
                    Best match
                  </span>
                )}
                <button className="btn" style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => book(desk.id)}>
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  )
}