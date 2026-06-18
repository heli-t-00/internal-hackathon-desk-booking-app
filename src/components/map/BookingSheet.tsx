import { useState } from 'react'
import { BottomSheet } from '../common/BottomSheet'
import { useStore } from '../../store/StoreContext'
import { todayKey } from '../../store/selectors'
import { prettyDate, slotLabel } from '../../store/time'
import type { ResourceType, Slot } from '../../store/types'

export interface BookingTarget {
  resourceId: string
  resourceType: ResourceType
  title: string
  subtitle: string
}

const SLOTS: Slot[] = ['morning', 'afternoon', 'allday']

export function BookingSheet({ target, onClose }: { target: BookingTarget | null; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [slot, setSlot] = useState<Slot>('allday')
  const today = todayKey(state)

  if (!target) return null

  const book = () => {
    dispatch({
      type: 'BOOK',
      resourceId: target.resourceId,
      resourceType: target.resourceType,
      userId: state.currentUserId,
      date: today,
      slot,
    })
    onClose()
  }

  return (
    <BottomSheet open={!!target} onClose={onClose}>
      <h2 style={{ fontSize: 20 }}>{target.title}</h2>
      <p className="muted" style={{ marginTop: 4 }}>
        {target.subtitle}
      </p>

      <div className="section-title" style={{ marginTop: 18 }}>
        {prettyDate(today, today)} · choose a slot
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

      <button className="btn block" style={{ marginTop: 18 }} onClick={book}>
        Book {target.title}
      </button>
    </BottomSheet>
  )
}
