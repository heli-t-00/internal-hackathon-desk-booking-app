import { useState } from 'react'
import { DashboardScreen } from './components/dashboard/DashboardScreen'
import { MapScreen } from './components/map/MapScreen'
import { ChatScreen } from './components/chat/ChatScreen'
import { CheckInScreen } from './components/checkin/CheckInScreen'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { Toast } from './components/common/Toast'
import { DemoClock } from './components/common/DemoClock'

export type Tab = 'home' | 'map' | 'chat' | 'checkin' | 'admin'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'chat', label: 'Book', icon: '💬' },
  { id: 'checkin', label: 'Check in', icon: '📲' },
  { id: 'admin', label: 'Insights', icon: '📊' },
]

export function App() {
  const [tab, setTab] = useState<Tab>('home')

  return (
    <>
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
