import { useStore } from '../../store/StoreContext'
import { AMENITIES, DESK_H, DESK_W, DESKS, LOUNGES, OUTLINE, ROOMS, VIEWBOX } from '../../store/floorplan'
import { activeBookingFor, deskStatus, teamById, todayKey, userById } from '../../store/selectors'
import type { Desk, ResourceId, Room } from '../../store/types'

interface Props {
  interactive?: boolean
  selectedDeskIds?: Set<ResourceId>
  onSelectDesk?: (desk: Desk) => void
  onSelectRoom?: (room: Room) => void
  date?: string
}

export function FloorMap({ interactive = false, selectedDeskIds, onSelectDesk, onSelectRoom, date: dateProp }: Props) {
  const { state } = useStore()
  const date = dateProp ?? todayKey(state)

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      width="100%"
      style={{ display: 'block', userSelect: 'none' }}
      role="img"
      aria-label="Office floor plan"
    >
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
    </svg>
  )
}
