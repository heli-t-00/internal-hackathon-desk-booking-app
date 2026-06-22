import React, { useEffect, useRef, useState } from 'react'
import { FloorMap } from './FloorMap'
import { BookingSheet, type BookingTarget } from './BookingSheet'
import { useStore, useCurrentUser } from '../../store/StoreContext'
import { activeBookingFor, availabilityForDate, deskStatus, todayKey } from '../../store/selectors'
import { CONTEXT_OFFSET, CONTEXT_VIEWBOX, DESK_H, DESK_W, DESKS, ROOMS } from '../../store/floorplan'
import { addDays, isWeekend, slotLabel, toDateKey, weekdayLong, weekdayShort } from '../../store/time'
import type { ResourceId, Slot } from '../../store/types'

const HOLD_OPTIONS = [
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
]

const SLOTS: Slot[] = ['morning', 'afternoon', 'allday']

const MIN_SCALE = 0.2
const MAX_SCALE = 6

export function MapScreen() {
  const { state, dispatch } = useStore()
  const me = useCurrentUser()
  const today = todayKey(state)

  const dates: string[] = []
  for (let d = 0; dates.length < 7; d++) {
    const key = toDateKey(addDays(state.nowMs, d))
    if (!isWeekend(key)) dates.push(key)
  }

  const [selectedDate, setSelectedDate] = useState(today)
  const [target, setTarget] = useState<BookingTarget | null>(null)
  const [reserveMode, setReserveMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<ResourceId>>(new Set())
  const [holdMinutes, setHoldMinutes] = useState(60)
  const [reserveSlot, setReserveSlot] = useState<Slot>('allday')
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [ready, setReady] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastPinchDist = useRef<number | null>(null)
  const dragDelta = useRef(0)

  function applyTransform(t: { x: number; y: number; scale: number }) {
    transformRef.current = t
    setTransform(t)
  }

  // Fit the floor plan to the screen on mount + attach non-passive wheel handler
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const scale = Math.min(width / CONTEXT_VIEWBOX.w, height / CONTEXT_VIEWBOX.h) * 0.95
    const x = (width - CONTEXT_VIEWBOX.w * scale) / 2
    const y = (height - CONTEXT_VIEWBOX.h * scale) / 2
    applyTransform({ x, y, scale })
    setReady(true)

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const t = transformRef.current
      const ratio = e.deltaY < 0 ? 1.15 : 0.87
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * ratio))
      const r = newScale / t.scale
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      applyTransform({ scale: newScale, x: cx - r * (cx - t.x), y: cy - r * (cy - t.y) })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  function clientToSVG(clientX: number, clientY: number) {
    const rect = containerRef.current!.getBoundingClientRect()
    const t = transformRef.current
    return {
      svgX: (clientX - rect.left - t.x) / t.scale,
      svgY: (clientY - rect.top - t.y) / t.scale,
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) dragDelta.current = 0
    lastPinchDist.current = null
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    const prev = pointers.current.get(e.pointerId)!
    const dx = e.clientX - prev.x
    const dy = e.clientY - prev.y
    dragDelta.current += Math.abs(dx) + Math.abs(dy)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      const t = transformRef.current
      applyTransform({ ...t, x: t.x + dx, y: t.y + dy })
    } else if (pts.length >= 2) {
      const [a, b] = pts
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      if (lastPinchDist.current !== null) {
        const ratio = dist / lastPinchDist.current
        const t = transformRef.current
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * ratio))
        const r = newScale / t.scale
        const rect = containerRef.current!.getBoundingClientRect()
        const cx = (a.x + b.x) / 2 - rect.left
        const cy = (a.y + b.y) / 2 - rect.top
        applyTransform({ scale: newScale, x: cx - r * (cx - t.x), y: cy - r * (cy - t.y) })
      }
      lastPinchDist.current = dist
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    const isOnly = pointers.current.size === 1
    const wasTap = dragDelta.current < 8 && isOnly
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) lastPinchDist.current = null

    if (!wasTap) return

    // Convert client coords → SVG space → office-local space
    const raw = clientToSVG(e.clientX, e.clientY)
    const svgX = raw.svgX - CONTEXT_OFFSET.x
    const svgY = raw.svgY - CONTEXT_OFFSET.y

    // Hit-test desks
    const desk = DESKS.find(
      (d) =>
        svgX >= d.x - DESK_W / 2 - 4 &&
        svgX <= d.x + DESK_W / 2 + 4 &&
        svgY >= d.y - DESK_H / 2 - 4 &&
        svgY <= d.y + DESK_H / 2 + 4,
    )
    if (desk) {
      const cell = deskStatus(state, desk.id, selectedDate)
      if (reserveMode) {
        if (cell.status !== 'free') return
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.has(desk.id) ? next.delete(desk.id) : next.add(desk.id)
          return next
        })
        return
      }
      if (cell.status === 'free' || cell.status === 'team_mine' || cell.status === 'team_other') {
        setTarget({
          resourceId: desk.id,
          resourceType: 'desk',
          title: `Desk ${desk.number}`,
          subtitle: `${desk.zone === 'quiet' ? 'Quiet zone' : desk.zone === 'collab' ? 'Collaboration area' : 'Standard desk'}${desk.standing ? ' · standing desk' : ''}`,
        })
      }
      return
    }

    // Hit-test rooms
    const room = ROOMS.find(
      (r) => svgX >= r.x && svgX <= r.x + r.w && svgY >= r.y && svgY <= r.y + r.h,
    )
    if (room && !activeBookingFor(state, room.id, selectedDate)) {
      setTarget({
        resourceId: room.id,
        resourceType: 'room',
        title: room.name,
        subtitle: `Meeting room · seats ${room.capacity}`,
      })
    }
  }

  function zoomBy(factor: number) {
    const t = transformRef.current
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const cx = width / 2
    const cy = height / 2
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * factor))
    const r = newScale / t.scale
    applyTransform({ scale: newScale, x: cx - r * (cx - t.x), y: cy - r * (cy - t.y) })
  }

  function resetView() {
    const el = containerRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const scale = Math.min(width / CONTEXT_VIEWBOX.w, height / CONTEXT_VIEWBOX.h) * 0.95
    const x = (width - CONTEXT_VIEWBOX.w * scale) / 2
    const y = (height - CONTEXT_VIEWBOX.h * scale) / 2
    applyTransform({ x, y, scale })
  }

  const confirmReservation = () => {
    if (selectedIds.size === 0) return
    dispatch({
      type: 'BLOCK_DESKS_FOR_TEAM',
      teamId: me.teamId,
      createdBy: me.id,
      deskIds: Array.from(selectedIds),
      date: selectedDate,
      slot: reserveSlot,
      holdMinutes,
    })
    setReserveMode(false)
    setSelectedIds(new Set())
  }

  const avail = availabilityForDate(state, selectedDate)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        bottom: 'var(--tabbar-h)',
        overflow: 'hidden',
        background: '#b8c8d8',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Pannable / zoomable canvas */}
      <div
        style={{
          position: 'absolute',
          width: CONTEXT_VIEWBOX.w,
          height: CONTEXT_VIEWBOX.h,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          opacity: ready ? 1 : 0,
        }}
      >
        <FloorMap
          interactive
          date={selectedDate}
          selectedDeskIds={reserveMode ? selectedIds : undefined}
        />
      </div>

      {/* Top overlay — day label + availability + date strip */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={chipStyle}>{weekdayLong(selectedDate)}</div>
          <div style={{ ...chipStyle, display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--green)', fontSize: 10 }}>●</span>
            {avail.free} free
            <span style={{ color: 'var(--line-strong)' }}>·</span>
            {avail.pct}% full
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', pointerEvents: 'all' }}>
          {dates.map((d) => (
            <button
              key={d}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => { setSelectedDate(d); setTarget(null) }}
              style={{
                flexShrink: 0,
                padding: '6px 10px',
                borderRadius: 12,
                background: selectedDate === d ? 'var(--brand)' : 'rgba(255,255,255,0.9)',
                color: selectedDate === d ? '#fff' : 'var(--ink)',
                fontSize: 11,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.14)',
              }}
            >
              <div>{weekdayShort(d)}</div>
              <div style={{ fontSize: 9, fontWeight: 400, marginTop: 1, opacity: 0.85 }}>
                {d === today ? 'Today' : new Date(d + 'T00:00:00').getDate()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 10,
        }}
      >
        <ZoomBtn label="+" onClick={() => zoomBy(1.4)} radius="10px 10px 0 0" />
        <ZoomBtn label="⊙" onClick={resetView} radius="0" fontSize={15} />
        <ZoomBtn label="−" onClick={() => zoomBy(0.71)} radius="0 0 10px 10px" />
      </div>

      {/* Bottom overlay — reserve button + legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 12,
          right: 66,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', pointerEvents: 'all' }}>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => { setReserveMode((v) => !v); setSelectedIds(new Set()) }}
            style={{
              fontSize: 12,
              padding: '6px 14px',
              borderRadius: 20,
              background: reserveMode ? 'var(--brand)' : 'rgba(255,255,255,0.92)',
              color: reserveMode ? '#fff' : 'var(--ink)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {reserveMode ? 'Cancel' : 'Reserve for team'}
          </button>
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 14,
            padding: '7px 14px',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          }}
        >
          {state.teams.map((team) => (
            <LegendDot key={team.id} colour={team.colour} label={team.name} />
          ))}
          <LegendDot colour="var(--green)" label="Free" />
          <LegendDot colour="var(--brand)" label="Yours" />
        </div>
      </div>

      {/* Reserve mode panel */}
      {reserveMode && (
        <div
          style={{
            position: 'absolute',
            bottom: 130,
            left: 12,
            right: 12,
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            pointerEvents: 'all',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="section-title" style={{ marginBottom: 8 }}>Reserve for {me.teamId.toUpperCase()} team</div>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 10 }}>
            {selectedIds.size === 0 ? 'Tap free desks on the map to select them.' : `${selectedIds.size} desk${selectedIds.size !== 1 ? 's' : ''} selected`}
          </div>

          <div className="section-title" style={{ marginBottom: 6 }}>Slot</div>
          <div className="row" style={{ gap: 8, marginBottom: 10 }}>
            {SLOTS.map((s) => (
              <button
                key={s}
                className="btn"
                onClick={() => setReserveSlot(s)}
                style={{ flex: 1, fontSize: 12, background: reserveSlot === s ? 'var(--brand)' : 'var(--surface-2)', color: reserveSlot === s ? '#fff' : 'var(--ink)' }}
              >
                {slotLabel(s)}
              </button>
            ))}
          </div>

          <div className="section-title" style={{ marginBottom: 6 }}>Hold window</div>
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            {HOLD_OPTIONS.map((o) => (
              <button
                key={o.minutes}
                className="btn"
                onClick={() => setHoldMinutes(o.minutes)}
                style={{ flex: 1, fontSize: 12, background: holdMinutes === o.minutes ? 'var(--brand)' : 'var(--surface-2)', color: holdMinutes === o.minutes ? '#fff' : 'var(--ink)' }}
              >
                {o.label}
              </button>
            ))}
          </div>

          <button
            className="btn block"
            disabled={selectedIds.size === 0}
            onClick={confirmReservation}
            style={{ opacity: selectedIds.size === 0 ? 0.4 : 1 }}
          >
            Reserve {selectedIds.size > 0 ? selectedIds.size : ''} desk{selectedIds.size !== 1 ? 's' : ''} for team
          </button>
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 8, textAlign: 'center' }}>
            Teammates will be notified and can claim a desk. Unclaimed desks open to everyone after the hold window.
          </p>
        </div>
      )}

      <BookingSheet target={target} date={selectedDate} onClose={() => setTarget(null)} />
    </div>
  )
}

const chipStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: 22,
  padding: '7px 16px',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--ink)',
  boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
}

function ZoomBtn({
  label,
  onClick,
  radius,
  fontSize = 20,
}: {
  label: string
  onClick: () => void
  radius: string
  fontSize?: number
}) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        background: 'rgba(255,255,255,0.96)',
        border: 'none',
        borderRadius: radius,
        fontSize,
        fontWeight: 700,
        color: 'var(--ink)',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  )
}

function LegendDot({ colour, label }: { colour: string; label: string }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 11, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
      <div style={{ width: 9, height: 9, borderRadius: '50%', background: colour, flexShrink: 0 }} />
      {label}
    </div>
  )
}
