import type { Desk, Room, Zone } from './types'

// Geometry traced from the real office floor-plan screenshot.
// Coordinate space: viewBox 0 0 1000 640. Kept separate from booking state
// so positions stay fixed while availability changes.

export const VIEWBOX = { w: 1000, h: 640 }

export const DESK_W = 34
export const DESK_H = 42

// Irregular building outline (the distinctive angular shape).
export const OUTLINE: string =
  'M315,205 L315,178 L632,30 L965,98 L992,300 L965,468 L928,604 ' +
  'L120,590 L70,360 L175,196 Z'

type ClusterDef = {
  // left column numbers (top→bottom) and right column numbers (top→bottom)
  left: number[]
  right: number[]
  leftX: number
  rightX: number
  rowYs: number[]
  zone: Zone
  standing?: number[]
}

const CLUSTERS: ClusterDef[] = [
  // Upper-mid-left block, desks 19–26 (4 rows)
  { left: [19, 20, 21, 22], right: [23, 24, 25, 26], leftX: 252, rightX: 302, rowYs: [212, 258, 304, 350], zone: 'standard' },
  // Centre block, desks 27–32 (3 rows)
  { left: [27, 28, 29], right: [30, 31, 32], leftX: 392, rightX: 442, rowYs: [252, 302, 352], zone: 'collab' },
  // Lower-left block, desks 16–18 / 13–15
  { left: [16, 17, 18], right: [13, 14, 15], leftX: 252, rightX: 302, rowYs: [452, 500, 548], zone: 'standard', standing: [16, 13] },
  // Lower-centre block, desks 10–12 / 7–9
  { left: [10, 11, 12], right: [7, 8, 9], leftX: 392, rightX: 442, rowYs: [452, 500, 548], zone: 'collab' },
  // Lower-centre-right block, desks 4–6 / 1–3
  { left: [4, 5, 6], right: [1, 2, 3], leftX: 512, rightX: 562, rowYs: [452, 500, 548], zone: 'standard' },
]

function buildDesks(): Desk[] {
  const desks: Desk[] = []
  for (const c of CLUSTERS) {
    c.left.forEach((n, i) => {
      desks.push({ id: `desk-${n}`, number: n, x: c.leftX, y: c.rowYs[i], zone: c.zone, standing: !!c.standing?.includes(n) })
    })
    c.right.forEach((n, i) => {
      desks.push({ id: `desk-${n}`, number: n, x: c.rightX, y: c.rowYs[i], zone: c.zone, standing: !!c.standing?.includes(n) })
    })
  }
  return desks.sort((a, b) => a.number - b.number)
}

export const DESKS: Desk[] = buildDesks()

export const ROOMS: Room[] = [
  { id: 'room-gerardus', name: 'Gerardus', capacity: 8, x: 332, y: 42, w: 150, h: 188 },
  { id: 'room-globe', name: 'Globe', capacity: 6, x: 500, y: 42, w: 112, h: 110 },
  { id: 'room-atlas', name: 'Atlas', capacity: 6, x: 490, y: 236, w: 112, h: 96 },
  { id: 'room-meridian', name: 'Meridian', capacity: 4, x: 700, y: 116, w: 96, h: 96 },
  { id: 'room-reflection', name: 'Reflection Room', capacity: 2, x: 706, y: 46, w: 100, h: 60 },
]

// Non-bookable zones drawn for realism / wayfinding.
export interface ZoneShape {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
}
export const LOUNGES: ZoneShape[] = [
  { id: 'salad', label: 'Salad', x: 70, y: 206, w: 150, h: 158 },
  { id: 'guest-lounge', label: 'Guest Lounge', x: 600, y: 56, w: 108, h: 120 },
]

export interface Amenity {
  id: string
  label: string
  icon: string
  x: number
  y: number
}
export const AMENITIES: Amenity[] = [
  { id: 'reception', label: 'Reception', icon: '🛎️', x: 612, y: 282 },
  { id: 'lockers', label: 'Lockers', icon: '🔒', x: 596, y: 420 },
  { id: 'kitchen', label: 'Kitchen', icon: '🍴', x: 800, y: 512 },
  { id: 'phone', label: 'Phone Booths', icon: '📞', x: 110, y: 545 },
  { id: 'stationary', label: 'Stationary', icon: '🗄️', x: 130, y: 452 },
  { id: 'printer', label: 'Printer', icon: '🖨️', x: 258, y: 408 },
  { id: 'fire', label: 'Fire Exit', icon: '🏃', x: 770, y: 270 },
  { id: 'toilets', label: 'Toilets', icon: '🚻', x: 760, y: 400 },
  { id: 'lift', label: 'Lift', icon: '🛗', x: 770, y: 320 },
]
