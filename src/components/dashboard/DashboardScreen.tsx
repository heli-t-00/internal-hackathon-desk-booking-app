import { NextBookingCard } from './NextBookingCard'
import { MapPreviewTile } from './MapPreviewTile'
import { OfficeTodayCard } from './OfficeTodayCard'
import { MyStatsCard } from './MyStatsCard'
import { WaitlistCard } from './WaitlistCard'
import { useCurrentUser, useStore } from '../../store/StoreContext'
import { todayKey } from '../../store/selectors'
import { prettyDate, weekdayLong } from '../../store/time'
import type { Tab } from '../../App'

export function DashboardScreen({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const { state } = useStore()
  const me = useCurrentUser()
  const today = todayKey(state)

  return (
    <div className="app-scroll">
      <header style={{ marginBottom: 16 }}>
        <p className="muted" style={{ fontSize: 13 }}>
          {weekdayLong(today)} · {prettyDate(today, today) === 'Today' ? 'good to see you' : ''}
        </p>
        <h1 style={{ fontSize: 26 }}>Hi {me.name} 👋</h1>
      </header>

      <NextBookingCard onBook={() => onNavigate('map')} />
      <WaitlistCard />
      <MapPreviewTile onOpen={() => onNavigate('map')} />
      <OfficeTodayCard />
      <MyStatsCard />
    </div>
  )
}
