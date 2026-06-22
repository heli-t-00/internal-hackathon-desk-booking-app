import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { buildNotifications, timeAgo, type AppNotif } from '../../store/notifications'

// Generic "iPhone" wallpaper — layered gradients so we don't ship an image asset.
const WALLPAPER =
  'radial-gradient(120% 80% at 18% 8%, rgba(120,150,255,0.65) 0%, transparent 55%),' +
  'radial-gradient(120% 90% at 88% 18%, rgba(214,120,220,0.55) 0%, transparent 55%),' +
  'radial-gradient(140% 120% at 60% 100%, rgba(60,180,200,0.45) 0%, transparent 50%),' +
  'linear-gradient(160deg, #1b2350 0%, #3a1f63 52%, #5d2480 100%)'

const SNAP = 'transform 0.36s cubic-bezier(0.32, 0.72, 0, 1)'

export function NotificationCenter() {
  const { state } = useStore()
  const notifs = buildNotifications(state)

  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(0) // 0 = closed, 1 = fully open (tracks finger mid-drag)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startY: number; startAmount: number; moved: number } | null>(null)

  // When `open` flips without a drag (tap / dim / handle), animate to the snapped position.
  useEffect(() => {
    if (!dragging) setAmount(open ? 1 : 0)
  }, [open, dragging])

  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    drag.current = { startY: e.clientY, startAmount: open ? 1 : 0, moved: 0 }
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dy = e.clientY - d.startY
    d.moved = Math.max(d.moved, Math.abs(dy))
    const h = window.innerHeight || 800
    setAmount(Math.min(1, Math.max(0, d.startAmount + dy / h)))
  }
  const onPointerUp = () => {
    const d = drag.current
    if (!d) return
    const tapped = d.moved < 6
    const next = tapped ? !open : amount > 0.35
    drag.current = null
    setDragging(false)
    setOpen(next)
  }

  const dragHandlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp }
  const transition = dragging ? 'none' : SNAP

  return (
    <>
      {/* Pull tab — the thing you drag down from the top of the screen */}
      <button
        {...dragHandlers}
        aria-label="Open notifications"
        style={{
          position: 'fixed',
          top: 'calc(var(--tracker-h) + 8px + env(safe-area-inset-top))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 46,
          opacity: 1 - amount,
          pointerEvents: amount > 0.5 ? 'none' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          touchAction: 'none',
          padding: '6px 14px 7px',
          borderRadius: 16,
          background: 'rgba(31,42,55,0.82)',
          backdropFilter: 'blur(8px)',
          color: '#fff',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span style={{ width: 30, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.6)' }} />
        <span className="row" style={{ gap: 6, fontSize: 11.5, fontWeight: 600 }}>
          Notifications
          {notifs.length > 0 && (
            <span
              style={{
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 999,
                background: 'var(--red)',
                color: '#fff',
                fontSize: 10.5,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {notifs.length}
            </span>
          )}
        </span>
      </button>

      {/* Dim layer behind the shade — tap to dismiss */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 70,
          background: '#000',
          opacity: amount * 0.4,
          transition: dragging ? 'none' : 'opacity 0.36s ease',
          pointerEvents: amount > 0.05 ? 'auto' : 'none',
        }}
      />

      {/* The shade itself */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          width: '100%',
          maxWidth: 460,
          height: '100dvh',
          zIndex: 80,
          transform: `translateX(-50%) translateY(${(amount - 1) * 100}%)`,
          transition,
          background: WALLPAPER,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: amount > 0 ? '0 24px 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Lock-screen clock — also the grab area for dragging the shade back up */}
        <div
          {...dragHandlers}
          style={{
            paddingTop: 'calc(20px + env(safe-area-inset-top))',
            paddingBottom: 14,
            textAlign: 'center',
            touchAction: 'none',
            cursor: 'grab',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, opacity: 0.85 }}>{formatDate(state.nowMs)}</div>
          <div style={{ fontSize: 68, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: 2 }}>
            {formatTime(state.nowMs)}
          </div>
        </div>

        {/* Notification stack */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {notifs.map((n) => (
            <NotifCard key={n.id} n={n} now={state.nowMs} />
          ))}
        </div>

        {/* Bottom handle — drag up / tap to close */}
        <div
          {...dragHandlers}
          style={{
            flexShrink: 0,
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
            paddingTop: 8,
            display: 'flex',
            justifyContent: 'center',
            touchAction: 'none',
            cursor: 'grab',
          }}
        >
          <span style={{ width: 134, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.85)' }} />
        </div>
      </div>
    </>
  )
}

function NotifCard({ n, now }: { n: AppNotif; now: number }) {
  return (
    <div
      style={{
        background: 'rgba(250,250,253,0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 18,
        padding: 12,
        color: 'var(--ink)',
        display: 'flex',
        gap: 11,
        boxShadow: '0 1px 1px rgba(0,0,0,0.04)',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          fontSize: 19,
          background: n.accent,
        }}
      >
        {n.icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row spread" style={{ gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-faint)' }}>
            {n.app}
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)', flexShrink: 0 }}>{timeAgo(n.ts, now)}</span>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginTop: 2 }}>{n.title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-soft)', marginTop: 1, lineHeight: 1.32 }}>{n.body}</div>
      </div>
    </div>
  )
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
}
