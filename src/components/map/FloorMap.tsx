import { useStore } from '../../store/StoreContext'
import {
  AMENITIES, CONTEXT_OFFSET, CONTEXT_VIEWBOX,
  DESK_H, DESK_W, DESKS, LOUNGES, OUTLINE, ROOMS,
} from '../../store/floorplan'
import { activeBookingFor, deskStatus, teamById, todayKey, userById } from '../../store/selectors'
import type { Desk, ResourceId, Room } from '../../store/types'

interface Props {
  interactive?: boolean
  selectedDeskIds?: Set<ResourceId>
  onSelectDesk?: (desk: Desk) => void
  onSelectRoom?: (room: Room) => void
  date?: string
}

// Surrounding street context for 1 Clink Street, SE1 (south bank of the Thames).
// Office sits just south of Clink Street with the Thames to the north.
function SurroundingContext() {
  const W = CONTEXT_VIEWBOX.w
  const H = CONTEXT_VIEWBOX.h
  const ox = CONTEXT_OFFSET.x
  const oy = CONTEXT_OFFSET.y

  const officeLeft = ox + 60
  const officeRight = ox + 1000
  const officeTop = oy + 30
  const officeBottom = oy + 610

  const clinkyRoad = oy + 2
  const clinkyH = oy - 30
  const banksideRoad = clinkyRoad - 30
  const banksideH = 28
  const embankY = banksideRoad - 38
  const embankH = 36
  const riverH = embankY

  const parkStreetY = officeBottom + 22
  const parkStreetH = 30

  return (
    <g>
      {/* ── Base map background ── */}
      <rect x={0} y={0} width={W} height={H} fill="#cbd4de" />

      {/* ── River Thames ── */}
      <rect x={0} y={0} width={W} height={riverH} fill="#7fafc8" />
      <text
        x={W / 2} y={Math.max(riverH / 2 + 10, 40)}
        textAnchor="middle" fontSize={22} fontWeight={800}
        fill="#5f8ea8" letterSpacing={8} opacity={0.8}
      >
        RIVER THAMES
      </text>

      {/* ── Embankment (riverside walk) ── */}
      <rect x={0} y={riverH} width={W} height={embankH} fill="#aec5d2" />
      <text x={60} y={riverH + embankH - 10} fontSize={10} fontWeight={600} fill="#7a9fb5">BANKSIDE RIVERSIDE WALK</text>

      {/* ── Bankside road ── */}
      <rect x={0} y={embankY + embankH} width={W} height={banksideH} fill="#dde4ec" />
      <text x={40} y={embankY + embankH + 19} fontSize={11} fontWeight={700} fill="#9ab2c2">BANKSIDE</text>

      {/* ── Clink Street (narrow east-west lane) ── */}
      <rect x={0} y={banksideRoad + banksideH} width={W} height={Math.max(clinkyH, 20)} fill="#e2e8f0" />
      <text x={40} y={banksideRoad + banksideH + 14} fontSize={10} fontWeight={700} fill="#8aa8ba">CLINK STREET</text>

      {/* ── West buildings (Winchester Palace / Clink Prison area) ── */}
      <rect x={15} y={officeTop} width={officeLeft - 30} height={260} rx={8} fill="#bac6d2" />
      <rect x={35} y={officeTop + 30} width={officeLeft - 70} height={180} rx={4} fill="#c8d2dc" opacity={0.6} />
      <text x={(officeLeft - 15) / 2} y={officeTop + 155} textAnchor="middle" fontSize={11} fontWeight={700} fill="#8096a8">WINCHESTER</text>
      <text x={(officeLeft - 15) / 2} y={officeTop + 170} textAnchor="middle" fontSize={11} fontWeight={700} fill="#8096a8">PALACE</text>

      <rect x={15} y={officeTop + 280} width={officeLeft - 50} height={110} rx={6} fill="#c0ccda" />
      <text x={(officeLeft - 35) / 2} y={officeTop + 335} textAnchor="middle" fontSize={10} fontWeight={600} fill="#8096a8">CLINK MUSEUM</text>

      <rect x={15} y={officeTop + 410} width={officeLeft - 50} height={officeBottom - (officeTop + 410) - 10} rx={6} fill="#bac6d2" />

      {/* ── East buildings ── */}
      <rect x={officeRight + 10} y={officeTop} width={W - officeRight - 20} height={220} rx={8} fill="#bac6d2" />
      <rect x={officeRight + 10} y={officeTop + 240} width={W - officeRight - 20} height={160} rx={8} fill="#c0ccda" />
      <rect x={officeRight + 10} y={officeTop + 420} width={W - officeRight - 20} height={officeBottom - (officeTop + 420) - 10} rx={8} fill="#bac6d2" />

      {/* ── Park Street (south lane) ── */}
      <rect x={0} y={parkStreetY} width={W} height={parkStreetH} fill="#e2e8f0" />
      <text x={40} y={parkStreetY + 20} fontSize={11} fontWeight={700} fill="#8aa8ba">PARK STREET</text>

      {/* ── South buildings ── */}
      {[
        [15, 160], [190, 280], [490, 220], [730, 200], [950, 160], [1130, 180],
      ].map(([bx, bw], i) => (
        <rect
          key={i}
          x={bx}
          y={parkStreetY + parkStreetH + 6}
          width={bw}
          height={H - (parkStreetY + parkStreetH + 12)}
          rx={6}
          fill={i % 2 === 0 ? '#b8c4d0' : '#c2ced8'}
        />
      ))}

      {/* ── Address label ── */}
      <text
        x={ox + 500} y={officeBottom + 14}
        textAnchor="middle" fontSize={12} fontWeight={700}
        fill="#667788" letterSpacing={1}
      >
        1 CLINK STREET · SE1 9DG
      </text>

      {/* ── Location pin ── */}
      <text x={ox + 490} y={officeTop - 8} textAnchor="middle" fontSize={18}>📍</text>
    </g>
  )
}

export function FloorMap({ interactive = false, selectedDeskIds, onSelectDesk, onSelectRoom, date: dateProp }: Props) {
  const { state } = useStore()
  const date = dateProp ?? todayKey(state)
  const ox = CONTEXT_OFFSET.x
  const oy = CONTEXT_OFFSET.y

  return (
    <svg
      viewBox={`0 0 ${CONTEXT_VIEWBOX.w} ${CONTEXT_VIEWBOX.h}`}
      width="100%"
      style={{ display: 'block', userSelect: 'none' }}
      role="img"
      aria-label="Office floor plan — 1 Clink Street"
    >
      <SurroundingContext />

      {/* All office content offset to sit inside the surrounding context */}
      <g transform={`translate(${ox}, ${oy})`}>
        {/* Floor */}
        <path d={OUTLINE} fill="#e9eef5" stroke="var(--slate)" strokeWidth={6} strokeLinejoin="round" />

        {/* Lounge zones */}
        {LOUNGES.map((z) => (
          <g key={z.id}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={10} fill="var(--sage)" opacity={0.7} />
            <text x={z.x + z.w / 2} y={z.y + z.h - 12} textAnchor="middle" fontSize={13} fontWeight={700} fill="#5d6e4d">
              {z.label.toUpperCase()}
            </text>
          </g>
        ))}

        {/* Amenities */}
        {AMENITIES.map((a) => (
          <g key={a.id}>
            <circle cx={a.x} cy={a.y} r={15} fill="#cfd9e6" />
            <text x={a.x} y={a.y + 5} textAnchor="middle" fontSize={14}>
              {a.icon}
            </text>
            <text x={a.x} y={a.y + 30} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--ink-faint)">
              {a.label}
            </text>
          </g>
        ))}

        {/* Rooms */}
        {ROOMS.map((room) => {
          const b = activeBookingFor(state, room.id, date)
          const team = b ? teamById(state, userById(state, b.userId)?.teamId ?? '') : undefined
          const free = !b
          return (
            <g
              key={room.id}
              onClick={interactive && free ? () => onSelectRoom?.(room) : undefined}
              style={{ cursor: interactive && free ? 'pointer' : 'default' }}
            >
              <rect
                x={room.x}
                y={room.y}
                width={room.w}
                height={room.h}
                rx={10}
                fill={free ? 'var(--sage)' : team?.colour ?? 'var(--slate)'}
                opacity={free ? 0.55 : 0.28}
                stroke={free ? '#9bb07f' : team?.colour ?? 'var(--slate)'}
                strokeWidth={1.5}
              />
              <circle cx={room.x + room.w / 2} cy={room.y + room.h / 2 - 6} r={9} fill={free ? 'var(--green)' : 'var(--slate)'} />
              <text x={room.x + room.w / 2} y={room.y + room.h - 10} textAnchor="middle" fontSize={12} fontWeight={700} fill="#445">
                {room.name.toUpperCase()}
              </text>
            </g>
          )
        })}

        {/* Desks */}
        {DESKS.map((desk) => {
          const cell = deskStatus(state, desk.id, date)
          const team = cell.byUser ? teamById(state, cell.byUser.teamId) : undefined
          const reservedTeam = cell.teamReservedFor ? teamById(state, cell.teamReservedFor) : undefined
          const free = cell.status === 'free'
          const mine = cell.status === 'mine'
          const teamMine = cell.status === 'team_mine'
          const teamOther = cell.status === 'team_other'
          const isSelected = selectedDeskIds?.has(desk.id) ?? false

          const fill = free || isSelected ? (isSelected ? '#dbeafe' : '#ffffff') : mine ? '#dbeafe' : teamMine ? (reservedTeam?.colour ?? '#dbeafe') + '33' : teamOther ? '#f3f4f6' : 'rgba(0,0,0,0)'
          const stroke = isSelected ? 'var(--brand)' : mine ? 'var(--brand)' : free ? 'var(--line)' : teamMine ? reservedTeam?.colour ?? 'var(--brand)' : teamOther ? reservedTeam?.colour ?? 'var(--slate)' : team?.colour ?? 'var(--slate)'
          const strokeWidth = mine || isSelected || teamMine ? 2.5 : 1.5
          const strokeDasharray = teamMine || teamOther ? '4 2' : undefined
          const cx = desk.x
          const cy = desk.y
          const clickable = interactive && !mine && (free || teamMine || teamOther)
          return (
            <g
              key={desk.id}
              onClick={clickable ? () => onSelectDesk?.(desk) : undefined}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
            >
              <rect
                x={cx - DESK_W / 2}
                y={cy - DESK_H / 2}
                width={DESK_W}
                height={DESK_H}
                rx={7}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
              />
              {!free && !mine && !teamMine && !teamOther && team && (
                <rect x={cx - DESK_W / 2} y={cy - DESK_H / 2} width={DESK_W} height={DESK_H} rx={7} fill={team.colour} opacity={0.16} />
              )}
              {free ? (
                <circle cx={cx} cy={cy} r={9} fill={isSelected ? 'var(--brand)' : 'var(--green)'} />
              ) : teamMine ? (
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill={reservedTeam?.colour ?? 'var(--brand)'}>CLAIM</text>
              ) : teamOther ? (
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--ink-faint)">HELD</text>
              ) : (
                <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={mine ? 'var(--brand-ink)' : team?.colour ?? '#445'}>
                  {mine ? 'You' : cell.byUser?.initials}
                </text>
              )}
              <text x={cx + DESK_W / 2 + 3} y={cy - DESK_H / 2 + 11} fontSize={10} fontWeight={600} fill="var(--ink-faint)">
                {desk.number}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
