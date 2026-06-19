import { useEffect } from 'react'
import { useStore } from '../../store/StoreContext'

export function Toast() {
  const { state, dispatch } = useStore()

  useEffect(() => {
    if (!state.lastError) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 2600)
    return () => clearTimeout(t)
  }, [state.lastError, dispatch])

  useEffect(() => {
    if (!state.lastPromotion) return
    const t = setTimeout(() => dispatch({ type: 'CLEAR_PROMOTION' }), 5000)
    return () => clearTimeout(t)
  }, [state.lastPromotion, dispatch])

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 'calc(var(--tabbar-h) + 16px)',
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    zIndex: 60,
    pointerEvents: 'none',
  }

  return (
    <div style={containerStyle}>
      {state.lastError && (
        <div style={{ background: '#1f2a37', color: '#fff', padding: '11px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 500, maxWidth: 380, boxShadow: 'var(--shadow)' }}>
          ⚠️ {state.lastError}
        </div>
      )}
      {state.lastPromotion && (
        <div style={{ background: '#15803d', color: '#fff', padding: '11px 16px', borderRadius: 12, fontSize: 13.5, fontWeight: 500, maxWidth: 380, boxShadow: 'var(--shadow)' }}>
          ✅ {state.lastPromotion}
        </div>
      )}
    </div>
  )
}
