import type { Booking, ResourceId, Slot, StoreState, User } from './types'
import { toDateKey, weekdayShort } from './time'

const ACTIVE: Booking['status'][] = ['reserved', 'checked_in']

export function todayKey(state: StoreState): string {
  return toDateKey(state.nowMs)
}

export function userById(state: StoreState, id: string): User | undefined {
  return state.users.find((u) => u.id === id)
}

export function teamById(state: StoreState, id: string) {
  return state.teams.find((t) => t.id === id)
}

export function resourceLabel(state: StoreState, b: Pick<Booking, 'resourceId' | 'resourceType'>): string {
  if (b.resourceType === 'room') {
    return state.rooms.find((r) => r.id === b.resourceId)?.name ?? 'Room'
  }
  const d = state.desks.find((x) => x.id === b.resourceId)
  return d ? `Desk ${d.number}` : 'Desk'
}

// Active booking on a resource for a date/slot.
export function activeBookingFor(state: StoreState, resourceId: ResourceId, date: string, slot: Slot = 'allday'): Booking | undefined {
  return state.bookings.find(
    (b) =>
      b.resourceId === resourceId &&
      b.date === date &&
      ACTIVE.includes(b.status) &&
      (b.slot === 'allday' || slot === 'allday' || b.slot === slot),
  )
}

export type DeskCellStatus = 'free' | 'mine' | 'occupied'
export interface DeskCell {
  status: DeskCellStatus
  byUser?: User
  checkedIn: boolean
}

export function deskStatus(state: StoreState, deskId: ResourceId, date: string): DeskCell {
  const b = activeBookingFor(state, deskId, date)
  if (!b) return { status: 'free', checkedIn: false }
  const mine = b.userId === state.currentUserId
  return {
    status: mine ? 'mine' : 'occupied',
    byUser: userById(state, b.userId),
    checkedIn: b.status === 'checked_in',
  }
}

export function availabilityForDate(state: StoreState, date: string) {
  const total = state.desks.length
  let taken = 0
  for (const d of state.desks) if (activeBookingFor(state, d.id, date)) taken++
  const free = total - taken
  return { total, taken, free, pct: Math.round((taken / total) * 100) }
}

export function roomAvailabilityForDate(state: StoreState, date: string) {
  const total = state.rooms.length
  let taken = 0
  for (const r of state.rooms) if (activeBookingFor(state, r.id, date)) taken++
  return { total, taken, free: total - taken }
}

// ---- Your bookings ----
export function myNextBooking(state: StoreState): Booking | undefined {
  const today = todayKey(state)
  return state.bookings
    .filter((b) => b.userId === state.currentUserId && ACTIVE.includes(b.status) && b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)[0]
}

export interface MyStats {
  totalVisits: number
  checkInRate: number // 0..1
  favouriteDeskNumber: number | null
  daysInLastFortnight: number
}

export function myStats(state: StoreState): MyStats {
  const mine = state.bookings.filter((b) => b.userId === state.currentUserId && b.resourceType === 'desk' && b.status !== 'cancelled')
  const settled = mine.filter((b) => b.status === 'checked_in' || b.status === 'released')
  const checkedIn = settled.filter((b) => b.status === 'checked_in').length
  const checkInRate = settled.length ? checkedIn / settled.length : 1

  const counts = new Map<ResourceId, number>()
  for (const b of mine) counts.set(b.resourceId, (counts.get(b.resourceId) ?? 0) + 1)
  let favId: ResourceId | null = null
  let favN = 0
  for (const [rid, n] of counts) if (n > favN) ((favN = n), (favId = rid))
  const favouriteDeskNumber = favId ? state.desks.find((d) => d.id === favId)?.number ?? null : null

  return {
    totalVisits: settled.length,
    checkInRate,
    favouriteDeskNumber,
    daysInLastFortnight: new Set(settled.map((b) => b.date)).size,
  }
}

// ---- Others / office today ----
export interface PresentPerson {
  user: User
  resourceLabel: string
  checkedIn: boolean
}

export function whoIsInToday(state: StoreState): PresentPerson[] {
  const today = todayKey(state)
  return state.bookings
    .filter((b) => b.date === today && b.resourceType === 'desk' && ACTIVE.includes(b.status) && b.userId !== state.currentUserId)
    .map((b) => ({
      user: userById(state, b.userId)!,
      resourceLabel: resourceLabel(state, b),
      checkedIn: b.status === 'checked_in',
    }))
    .filter((p) => p.user)
}

export function teamPresenceToday(state: StoreState) {
  const present = whoIsInToday(state)
  const myTeam = userById(state, state.currentUserId)?.teamId
  const byTeam = new Map<string, number>()
  for (const p of present) byTeam.set(p.user.teamId, (byTeam.get(p.user.teamId) ?? 0) + 1)
  return state.teams
    .map((t) => ({ team: t, count: byTeam.get(t.id) ?? 0, isMine: t.id === myTeam }))
    .sort((a, b) => b.count - a.count)
}

// ---- Trends / admin ----
export interface DayUtil {
  day: string // Mon..Fri
  bookedPct: number
  checkedInPct: number
}

export function utilisationByWeekday(state: StoreState): DayUtil[] {
  const today = todayKey(state)
  const total = state.desks.length
  // group historical desk bookings by date
  const byDate = new Map<string, { booked: number; checkedIn: number }>()
  for (const b of state.bookings) {
    if (b.resourceType !== 'desk') continue
    if (b.date >= today) continue
    if (!['reserved', 'checked_in', 'released'].includes(b.status)) continue
    const e = byDate.get(b.date) ?? { booked: 0, checkedIn: 0 }
    e.booked++
    if (b.status === 'checked_in') e.checkedIn++
    byDate.set(b.date, e)
  }
  // average per weekday
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  const acc = new Map<string, { booked: number; checkedIn: number; days: number }>()
  for (const [date, e] of byDate) {
    const wd = weekdayShort(date)
    if (!order.includes(wd)) continue
    const a = acc.get(wd) ?? { booked: 0, checkedIn: 0, days: 0 }
    a.booked += e.booked
    a.checkedIn += e.checkedIn
    a.days += 1
    acc.set(wd, a)
  }
  return order.map((day) => {
    const a = acc.get(day)
    if (!a || a.days === 0) return { day, bookedPct: 0, checkedInPct: 0 }
    return {
      day,
      bookedPct: Math.round((a.booked / a.days / total) * 100),
      checkedInPct: Math.round((a.checkedIn / a.days / total) * 100),
    }
  })
}

export function quietestDay(state: StoreState): string {
  const util = utilisationByWeekday(state).filter((d) => d.bookedPct > 0)
  if (!util.length) return '—'
  return util.reduce((min, d) => (d.bookedPct < min.bookedPct ? d : min)).day
}

export function busiestDay(state: StoreState): string {
  const util = utilisationByWeekday(state)
  if (!util.length) return '—'
  return util.reduce((max, d) => (d.bookedPct > max.bookedPct ? d : max)).day
}

// No-show rate across history (booked but never checked in).
export function noShowRate(state: StoreState): number {
  const today = todayKey(state)
  const settled = state.bookings.filter((b) => b.date < today && ['checked_in', 'released'].includes(b.status))
  if (!settled.length) return 0
  const released = settled.filter((b) => b.status === 'released').length
  return Math.round((released / settled.length) * 100)
}
