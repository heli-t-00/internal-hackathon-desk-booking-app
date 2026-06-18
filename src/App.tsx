import { useState } from 'react'
import { DashboardScreen } from './components/dashboard/DashboardScreen'
import { MapScreen } from './components/map/MapScreen'
import { ChatScreen } from './components/chat/ChatScreen'
import { CheckInScreen } from './components/checkin/CheckInScreen'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { Toast } from './components/common/Toast'
import { DemoClock } from './components/common/DemoClock'
import { useStore } from './store/StoreContext'
import { todayKey } from './store/selectors'

export type Tab = 'home' | 'map' | 'chat' | 'checkin' | 'admin'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'chat', label: 'Book', icon: '💬' },
  { id: 'checkin', label: 'Check in', icon: '📲' },
  { id: 'admin', label: 'Insights', icon: '📊' },
]

function AashvinTracker() {
  const { state } = useStore()
  const today = todayKey(state)
  const hasBooking = state.bookings.some(
    (b) => b.userId === 'user-1' && b.date === today && b.resourceType === 'desk' && (b.status === 'reserved' || b.status === 'checked_in'),
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 460,
        zIndex: 50,
        background: hasBooking ? '#16a34a' : '#dc2626',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '6px 12px',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span>Aashvin tracker</span>
      <span style={{ width: 1, background: 'rgba(255,255,255,0.4)', alignSelf: 'stretch' }} />
      {hasBooking ? (
        <span>✅ Desk booked for today</span>
      ) : (
        <span>No desk booked today <strong style={{ fontSize: 16 }}>!</strong></span>
      )}
    </div>
  )
}

export function App() {
  const [tab, setTab] = useState<Tab>('home')

  return (
    <>
      <AashvinTracker />
      {tab === 'home' && <DashboardScreen onNavigate={setTab} />}
      {tab === 'map' && <MapScreen />}
      {tab === 'chat' && <ChatScreen onBooked={() => setTab('home')} />}
      {tab === 'checkin' && <CheckInScreen />}
      {tab === 'admin' && <AdminDashboard />}

      <DemoClock />
      <Toast />

      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 460,
          height: 'var(--tabbar-h)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--line)',
          display: 'grid',
          gridTemplateColumns: `repeat(${TABS.length}, 1fr)`,
          zIndex: 40,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                color: active ? 'var(--brand)' : 'var(--ink-faint)',
                fontWeight: active ? 700 : 500,
              }}
            >
              <span style={{ fontSize: 19, filter: active ? 'none' : 'grayscale(0.4)' }}>{t.icon}</span>
              <span style={{ fontSize: 10.5 }}>{t.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
