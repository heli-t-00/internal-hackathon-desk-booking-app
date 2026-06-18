import { useEffect } from 'react'
import { useStore } from '../../store/StoreContext'

// Shows the reducer's lastError (e.g. a double-booking rejection) then auto-dismisses.
export function Toast() {
  const { state, dispatch } = useStore()
  useEffect(() => {
    if (!state.lastError) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 2600)
    return () => clearTimeout(t)
  }, [state.lastError, dispatch])

  if (!state.lastError) return null
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(var(--tabbar-h) + 16px)',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 60,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: '#1f2a37',
          color: '#fff',
          padding: '11px 16px',
          borderRadius: 12,
          fontSize: 13.5,
          fontWeight: 500,
          maxWidth: 380,
          boxShadow: 'var(--shadow)',
        }}
      >
        ⚠️ {state.lastError}
      </div>
    </div>
  )
}
