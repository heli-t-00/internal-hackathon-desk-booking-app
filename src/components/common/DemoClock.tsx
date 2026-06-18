import { useStore } from '../../store/StoreContext'

// Floating demo control: advance the clock to trigger no-show auto-release.
export function DemoClock() {
  const { state, dispatch } = useStore()
  const t = new Date(state.nowMs)
  const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(10px + env(safe-area-inset-top))',
        right: 10,
        zIndex: 45,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(31,42,55,0.9)',
        color: '#fff',
        padding: '5px 6px 5px 12px',
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span>🕑 {time}</span>
      <button
        onClick={() => dispatch({ type: 'FAST_FORWARD', minutes: 120 })}
        style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 999, padding: '4px 10px', fontWeight: 700 }}
      >
        +2h ⏩
      </button>
    </div>
  )
}
