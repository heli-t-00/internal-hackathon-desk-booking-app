import { useState } from 'react'
import { NextBookingCard } from './NextBookingCard'
import { MapPreviewTile } from './MapPreviewTile'
import { OfficeTodayCard } from './OfficeTodayCard'
import { MyStatsCard } from './MyStatsCard'
import { WaitlistCard } from './WaitlistCard'
import { TeamReservationCard } from './TeamReservationCard'
import { QuickBookSheet } from './QuickBookSheet'
import { useCurrentUser, useStore } from '../../store/StoreContext'
import { todayKey } from '../../store/selectors'
import { prettyDate, weekdayLong } from '../../store/time'
import type { Tab } from '../../App'

export function DashboardScreen({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { state } = useStore()
  const me = useCurrentUser()
  const today = todayKey(state)
  const [quickBookOpen, setQuickBookOpen] = useState(false)

  return (
    <div className="app-scroll">
      <header style={{ marginBottom: 16 }}>
        <p className="muted" style={{ fontSize: 13 }}>
          {weekdayLong(today)} · {prettyDate(today, today) === 'Today' ? 'good to see you' : ''}
        </p>
        <h1 style={{ fontSize: 26 }}>Hi {me.name} 👋</h1>
      </header>

      <div className="row" style={{ gap: 10, marginBottom: 16 }}>
        <button
          className="btn block"
          style={{ flex: 1, padding: '14px 0', fontSize: 15, fontWeight: 700 }}
          onClick={() => setQuickBookOpen(true)}
        >
          ⚡ Quick book
        </button>
        <button
          className="btn"
          style={{
            flex: 1,
            padding: '14px 0',
            fontSize: 15,
            fontWeight: 700,
            background: 'var(--surface-2)',
            color: 'var(--ink)',
          }}
          onClick={() => onNavigate('chat')}
        >
          💬 Chat to book
        </button>
      </div>

      <NextBookingCard onBook={() => onNavigate('map')} />
      <TeamReservationCard onNavigate={onNavigate} />
      <WaitlistCard />
      <MapPreviewTile onOpen={() => onNavigate('map')} />
      <OfficeTodayCard />
      <MyStatsCard />

      <QuickBookSheet
        open={quickBookOpen}
        onClose={() => setQuickBookOpen(false)}
        onBooked={() => setQuickBookOpen(false)}
      />
    </div>
  )
}
