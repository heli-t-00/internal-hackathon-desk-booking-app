import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, onClose, children }: Props) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.4)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--surface)',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: '14px 16px calc(20px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 30px rgba(15,23,42,0.18)',
          animation: 'sheet-up 0.18s ease',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--line)', margin: '0 auto 14px' }} />
        {children}
      </div>
      <style>{`@keyframes sheet-up { from { transform: translateY(16px); opacity: 0.6 } to { transform: none; opacity: 1 } }`}</style>
    </div>
  )
}
