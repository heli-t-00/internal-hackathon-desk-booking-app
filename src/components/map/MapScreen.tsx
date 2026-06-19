import { useState } from 'react'
import { FloorMap } from './FloorMap'
import { MapLegend } from './MapLegend'
import { BookingSheet, type BookingTarget } from './BookingSheet'
import { useStore, useCurrentUser } from '../../store/StoreContext'
import { deskStatus, todayKey } from '../../store/selectors'
import { addDays, isWeekend, prettyDate, slotLabel, toDateKey, weekdayShort } from '../../store/time'
import type { Desk, ResourceId, Room, Slot } from '../../store/types'

const HOLD_OPTIONS = [
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
]

const SLOTS: Slot[] = ['morning', 'afternoon', 'allday']

export function MapScreen() {
  const { state, dispatch } = useStore()
  const me = useCurrentUser()
  const today = todayKey(state)

  const dates: string[] = []
  for (let d = 0; dates.length < 7; d++) {
    const key = toDateKey(addDays(state.nowMs, d))
    if (!isWeekend(key)) dates.push(key)
  }

  const [selectedDate, setSelectedDate] = useState(today)
  const [target, setTarget] = useState<BookingTarget | null>(null)
  const [reserveMode, setReserveMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<ResourceId>>(new Set())
  const [holdMinutes, setHoldMinutes] = useState(60)
  const [reserveSlot, setReserveSlot] = useState<Slot>('allday')

  const toggleReserveMode = () => {
    setReserveMode((v) => !v)
    setSelectedIds(new Set())
  }

  const handleDeskClick = (d: Desk) => {
    if (reserveMode) {
      const cell = deskStatus(state, d.id, selectedDate)
      if (cell.status !== 'free') return
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.has(d.id) ? next.delete(d.id) : next.add(d.id)
        return next
      })
      return
    }
    setTarget({
      resourceId: d.id,
      resourceType: 'desk',
      title: `Desk ${d.number}`,
      subtitle: `${d.zone === 'quiet' ? 'Quiet zone' : d.zone === 'collab' ? 'Collaboration area' : 'Standard desk'}${d.standing ? ' · standing desk' : ''}`,
    })
  }

  const confirmReservation = () => {
    if (selectedIds.size === 0) return
    dispatch({
      type: 'BLOCK_DESKS_FOR_TEAM',
      teamId: me.teamId,
      createdBy: me.id,
      deskIds: Array.from(selectedIds),
      date: selectedDate,
      slot: reserveSlot,
      holdMinutes,
    })
    setReserveMode(false)
    setSelectedIds(new Set())
  }

  return (
    <div className="app-scroll">
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24 }}>Floor plan</h1>
          <p className="muted" style={{ marginTop: 2 }}>
            {reserveMode ? 'Tap free desks to select' : 'Tap a free desk or room to book'}
          </p>
        </div>
        <button
          className="btn"
          onClick={toggleReserveMode}
          style={{
            fontSize: 12,
            padding: '6px 12px',
            marginTop: 4,
            background: reserveMode ? 'var(--brand)' : 'var(--surface-2)',
            color: reserveMode ? '#fff' : 'var(--ink)',
            whiteSpace: 'nowrap',
          }}
        >
          {reserveMode ? 'Cancel' : 'Reserve for team'}
        </button>
      </div>

      {/* Date strip */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 4 }}>
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => { setSelectedDate(d); setTarget(null) }}
            style={{
              flexShrink: 0,
              padding: '7px 12px',
              borderRadius: 12,
              background: selectedDate === d ? 'var(--brand)' : 'var(--surface-2)',
              color: selectedDate === d ? '#fff' : 'var(--ink)',
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div>{weekdayShort(d)}</div>
            <div style={{ fontSize: 10, fontWeight: 400, marginTop: 1, opacity: 0.85 }}>
              {d === today ? 'Today' : new Date(d + 'T00:00:00').getDate()}
            </div>
          </button>
        ))}
      </div>

      {!reserveMode && <MapLegend />}

      <div className="card" style={{ marginTop: 14, padding: 8, overflow: 'hidden' }}>
        <FloorMap
          interactive
          date={selectedDate}
          selectedDeskIds={reserveMode ? selectedIds : undefined}
          onSelectDesk={handleDeskClick}
          onSelectRoom={(r: Room) =>
            !reserveMode && setTarget({
              resourceId: r.id,
              resourceType: 'room',
              title: r.name,
              subtitle: `Meeting room · seats ${r.capacity}`,
            })
          }
        />
      </div>

      {reserveMode && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Reserve for {me.teamId.toUpperCase()} team</div>

          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 12 }}>
            {selectedIds.size === 0 ? 'Tap free desks on the map to select them.' : `${selectedIds.size} desk${selectedIds.size !== 1 ? 's' : ''} selected`}
          </div>

          <div className="section-title" style={{ marginBottom: 6 }}>Slot</div>
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            {SLOTS.map((s) => (
              <button
                key={s}
                className="btn"
                onClick={() => setReserveSlot(s)}
                style={{ flex: 1, fontSize: 12, background: reserveSlot === s ? 'var(--brand)' : 'var(--surface-2)', color: reserveSlot === s ? '#fff' : 'var(--ink)' }}
              >
                {slotLabel(s)}
              </button>
            ))}
          </div>

          <div className="section-title" style={{ marginBottom: 6 }}>Hold window</div>
          <div className="row" style={{ gap: 8, marginBottom: 14 }}>
            {HOLD_OPTIONS.map((o) => (
              <button
                key={o.minutes}
                className="btn"
                onClick={() => setHoldMinutes(o.minutes)}
                style={{ flex: 1, fontSize: 12, background: holdMinutes === o.minutes ? 'var(--brand)' : 'var(--surface-2)', color: holdMinutes === o.minutes ? '#fff' : 'var(--ink)' }}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            className="btn block"
            disabled={selectedIds.size === 0}
            onClick={confirmReservation}
            style={{ opacity: selectedIds.size === 0 ? 0.4 : 1 }}
          >
            Reserve {selectedIds.size > 0 ? selectedIds.size : ''} desk{selectedIds.size !== 1 ? 's' : ''} for team
          </button>
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8, textAlign: 'center' }}>
            Teammates will be notified and can claim a desk. Unclaimed desks open to everyone after the hold window.
          </p>
        </div>
      )}

      <BookingSheet target={target} date={selectedDate} onClose={() => setTarget(null)} />
    </div>
  )
}
