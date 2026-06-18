import { useState } from 'react'
import { FloorMap } from './FloorMap'
import { MapLegend } from './MapLegend'
import { BookingSheet, type BookingTarget } from './BookingSheet'
import { useStore } from '../../store/StoreContext'
import { todayKey } from '../../store/selectors'
import { prettyDate } from '../../store/time'
import type { Desk, Room } from '../../store/types'

export function MapScreen() {
  const { state } = useStore()
  const today = todayKey(state)
  const [target, setTarget] = useState<BookingTarget | null>(null)

  return (
    <div className="app-scroll">
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 24 }}>Floor plan</h1>
        <p className="muted" style={{ marginTop: 2 }}>
          {prettyDate(today, today)} · tap a free desk or room to book
        </p>
      </div>

      <MapLegend />

      <div className="card" style={{ marginTop: 14, padding: 8, overflow: 'hidden' }}>
        <FloorMap
          interactive
          onSelectDesk={(d: Desk) =>
            setTarget({
              resourceId: d.id,
              resourceType: 'desk',
              title: `Desk ${d.number}`,
              subtitle: `${d.zone === 'quiet' ? 'Quiet zone' : d.zone === 'collab' ? 'Collaboration area' : 'Standard desk'}${d.standing ? ' · standing desk' : ''}`,
            })
          }
          onSelectRoom={(r: Room) =>
            setTarget({
              resourceId: r.id,
              resourceType: 'room',
              title: r.name,
              subtitle: `Meeting room · seats ${r.capacity}`,
            })
          }
        />
      </div>

      <BookingSheet target={target} onClose={() => setTarget(null)} />
    </div>
  )
}
