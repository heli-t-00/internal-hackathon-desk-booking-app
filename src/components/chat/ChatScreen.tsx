import { useRef, useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { resolveBookingRequest } from '../../ai/resolveBookingRequest'
import type { BookingIntent } from '../../ai/types'
import { slotLabel } from '../../store/time'

interface Msg {
  from: 'user' | 'bot'
  text: string
  intent?: BookingIntent
}

const SUGGESTIONS = [
  'Book me a quiet desk near my team tomorrow morning',
  'Find a standing desk today',
  'I need a meeting room this afternoon',
]

export function ChatScreen({ onBooked }: { onBooked: () => void }) {
  const { state, dispatch } = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'bot', text: "Hey! Tell me what you need — e.g. “a quiet desk near my team tomorrow” — and I'll find the best free spot." },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const send = async (text: string) => {
    if (!text.trim() || thinking) return
    setInput('')
    setMsgs((m) => [...m, { from: 'user', text }])
    setThinking(true)
    const res = await resolveBookingRequest(text, state)
    setThinking(false)
    if (res.ok) {
      setMsgs((m) => [...m, { from: 'bot', text: res.intent.reason, intent: res.intent }])
    } else {
      setMsgs((m) => [...m, { from: 'bot', text: res.clarify }])
    }
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const confirm = (intent: BookingIntent) => {
    dispatch({
      type: 'BOOK',
      resourceId: intent.resourceId,
      resourceType: intent.resourceType,
      userId: state.currentUserId,
      date: intent.date,
      slot: intent.slot,
    })
    onBooked()
  }

  return (
    <div className="app-scroll" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 24 }}>Book with chat</h1>
        <p className="muted" style={{ marginTop: 2 }}>Describe what you need — no forms.</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <div
              style={{
                alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                marginLeft: m.from === 'user' ? 'auto' : 0,
                background: m.from === 'user' ? 'var(--brand)' : 'var(--surface)',
                color: m.from === 'user' ? '#fff' : 'var(--ink)',
                padding: '10px 14px',
                borderRadius: 16,
                borderBottomRightRadius: m.from === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.from === 'bot' ? 4 : 16,
                boxShadow: m.from === 'bot' ? 'var(--shadow-sm)' : 'none',
                fontSize: 14.5,
              }}
            >
              {m.text}
            </div>
            {m.intent && <ConfirmCard intent={m.intent} onConfirm={() => confirm(m.intent!)} />}
          </div>
        ))}
        {thinking && (
          <div className="pill" style={{ alignSelf: 'flex-start' }}>
            <span className="dots">thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* suggestions */}
      <div className="row" style={{ gap: 8, overflowX: 'auto', padding: '12px 0', flexWrap: 'nowrap' }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} className="pill" style={{ whiteSpace: 'nowrap', flexShrink: 0 }} onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* input */}
      <div
        className="row"
        style={{ gap: 8, position: 'sticky', bottom: 'calc(var(--tabbar-h) + 8px)', background: 'var(--bg)', paddingTop: 4 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Book me a desk…"
          style={{
            flex: 1,
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: '12px 14px',
            fontSize: 15,
            background: 'var(--surface)',
            outline: 'none',
          }}
        />
        <button className="btn" onClick={() => send(input)} style={{ padding: '0 16px' }}>
          ➤
        </button>
      </div>
    </div>
  )
}

function ConfirmCard({ intent, onConfirm }: { intent: BookingIntent; onConfirm: () => void }) {
  return (
    <div className="card" style={{ marginTop: 8, maxWidth: '85%' }}>
      <div className="row spread">
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{intent.resourceLabel}</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {intent.dateLabel} · {slotLabel(intent.slot)}
          </div>
        </div>
        <span className="pill green">Best match</span>
      </div>
      <button className="btn block" style={{ marginTop: 12 }} onClick={onConfirm}>
        Confirm booking
      </button>
    </div>
  )
}
