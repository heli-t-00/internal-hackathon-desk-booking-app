import type { Booking, CheckIn, StoreState, Team, User } from './types'
import { DESKS, ROOMS } from './floorplan'
import { addDays, isWeekend, toDateKey } from './time'

// Deterministic PRNG so the demo data is stable across reloads.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TEAMS: Team[] = [
  { id: 'platform', name: 'Platform', colour: 'var(--team-platform)' },
  { id: 'design', name: 'Design', colour: 'var(--team-design)' },
  { id: 'data', name: 'Data', colour: 'var(--team-data)' },
  { id: 'sales', name: 'Sales', colour: 'var(--team-sales)' },
]

const USERS: User[] = [
  { id: 'user-1', name: 'Aashvin', initials: 'AV', teamId: 'platform' },
  { id: 'user-ag', name: 'Aisha Gomez', initials: 'AG', teamId: 'design' },
  { id: 'user-af', name: 'Aran Foley', initials: 'AF', teamId: 'design' },
  { id: 'user-zs', name: 'Zoë Sharma', initials: 'ZS', teamId: 'data' },
  { id: 'user-ab', name: 'Ade Bello', initials: 'AB', teamId: 'platform' },
  { id: 'user-ar', name: 'Ana Ruiz', initials: 'AR', teamId: 'sales' },
  { id: 'user-mk', name: 'Mia Khan', initials: 'MK', teamId: 'data' },
  { id: 'user-jt', name: 'Jon Tan', initials: 'JT', teamId: 'sales' },
  { id: 'user-lp', name: 'Leo Park', initials: 'LP', teamId: 'platform' },
  { id: 'user-nd', name: 'Nina Dahl', initials: 'ND', teamId: 'design' },
  { id: 'user-rc', name: 'Raj Chand', initials: 'RC', teamId: 'data' },
  { id: 'user-eo', name: 'Eve Owusu', initials: 'EO', teamId: 'platform' },
]

// Occupancy ratio by weekday — Tue/Wed busy, Fri dead.
const RATIO_BY_DAY: Record<number, number> = { 1: 0.6, 2: 0.85, 3: 0.85, 4: 0.7, 5: 0.25 }

const ALL_DESK_NUMBERS = DESKS.map((d) => d.number)
const SALES_USERS = USERS.filter((u) => u.teamId === 'sales')
const NON_YOU_USERS = USERS.filter((u) => u.id !== 'user-1')

let counter = 0
const id = (p: string) => `${p}-${counter++}`

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function seedState(): StoreState {
  const rnd = mulberry32(20260618)

  const base = new Date()
  base.setHours(9, 15, 0, 0) // before the 10:00 no-show grace cutoff, so nothing releases on load
  const nowMs = base.getTime()
  const todayKey = toDateKey(nowMs)

  const bookings: Booking[] = []
  const checkIns: CheckIn[] = []

  const pushBooking = (b: Omit<Booking, 'id'>, withCheckIn: boolean) => {
    const bk: Booking = { ...b, id: id('bk') }
    bookings.push(bk)
    if (withCheckIn) checkIns.push({ id: id('ci'), bookingId: bk.id, at: bk.createdAt + 60_000 })
    return bk
  }

  // ---- ~2 weeks of history with deliberate patterns ----
  for (let back = 14; back >= 1; back--) {
    const dayMs = addDays(nowMs, -back)
    const dateKey = toDateKey(dayMs)
    if (isWeekend(dateKey)) continue
    const dow = new Date(dateKey + 'T00:00:00').getDay()
    const ratio = RATIO_BY_DAY[dow] ?? 0.5
    const count = Math.round(ALL_DESK_NUMBERS.length * ratio)
    const chosen = shuffle(ALL_DESK_NUMBERS, rnd).slice(0, count)
    for (const n of chosen) {
      const user = NON_YOU_USERS[Math.floor(rnd() * NON_YOU_USERS.length)]
      const noShow = rnd() < 0.2 // ~20% never checked in → spoils the data
      pushBooking(
        {
          resourceId: `desk-${n}`,
          resourceType: 'desk',
          userId: user.id,
          date: dateKey,
          slot: 'allday',
          status: noShow ? 'released' : 'checked_in',
          createdAt: dayMs,
        },
        !noShow,
      )
    }
    // Atlas hoarded by Sales nearly every day.
    if (rnd() < 0.85) {
      const u = SALES_USERS[Math.floor(rnd() * SALES_USERS.length)]
      pushBooking(
        { resourceId: 'room-atlas', resourceType: 'room', userId: u.id, date: dateKey, slot: 'allday', status: 'checked_in', createdAt: dayMs },
        true,
      )
    }
  }

  // ---- Your personal history (so "Your stats" has something to show) ----
  // You favour desk 30, usually come in Tue/Wed/Thu, with one no-show.
  let yourVisits = 0
  for (let back = 14; back >= 1; back--) {
    const dayMs = addDays(nowMs, -back)
    const dateKey = toDateKey(dayMs)
    if (isWeekend(dateKey)) continue
    const dow = new Date(dateKey + 'T00:00:00').getDay()
    if (![2, 3, 4].includes(dow)) continue // Tue/Wed/Thu person
    const deskNum = rnd() < 0.6 ? 30 : 7 // mostly desk 30
    const noShow = yourVisits === 1 // exactly one no-show in the window
    pushBooking(
      { resourceId: `desk-${deskNum}`, resourceType: 'desk', userId: 'user-1', date: dateKey, slot: 'allday', status: noShow ? 'released' : 'checked_in', createdAt: dayMs },
      !noShow,
    )
    yourVisits++
  }

  // ---- Today ----
  // Recognisable cluster (matches the screenshot initials), all checked in.
  const todayFixed: Array<[number, string]> = [
    [19, 'user-ag'],
    [20, 'user-af'],
    [21, 'user-ab'],
    [24, 'user-zs'],
    [25, 'user-mk'],
    [26, 'user-ar'],
  ]
  const occupiedToday = new Set<number>()
  for (const [n, uid] of todayFixed) {
    occupiedToday.add(n)
    pushBooking({ resourceId: `desk-${n}`, resourceType: 'desk', userId: uid, date: todayKey, slot: 'allday', status: 'checked_in', createdAt: nowMs - 2 * 3600_000 }, true)
  }

  // Your booking today (reserved, not yet checked in) — powers the hero + check-in + no-show demo.
  occupiedToday.add(30)
  pushBooking({ resourceId: 'desk-30', resourceType: 'desk', userId: 'user-1', date: todayKey, slot: 'allday', status: 'reserved', createdAt: nowMs - 3600_000 }, false)

  // Fill to 100% occupancy so the waitlist flow is immediately demoable.
  const target = ALL_DESK_NUMBERS.length
  const remaining = shuffle(ALL_DESK_NUMBERS.filter((n) => !occupiedToday.has(n)), rnd)
  let r = 0
  while (occupiedToday.size < target && r < remaining.length) {
    const n = remaining[r++]
    occupiedToday.add(n)
    const user = NON_YOU_USERS[Math.floor(rnd() * NON_YOU_USERS.length)]
    const checkedIn = rnd() < 0.7
    pushBooking(
      { resourceId: `desk-${n}`, resourceType: 'desk', userId: user.id, date: todayKey, slot: 'allday', status: checkedIn ? 'checked_in' : 'reserved', createdAt: nowMs - 2 * 3600_000 },
      checkedIn,
    )
  }

  // A couple of rooms booked today (Atlas hoard continues; Gerardus by Design).
  pushBooking({ resourceId: 'room-atlas', resourceType: 'room', userId: 'user-jt', date: todayKey, slot: 'allday', status: 'checked_in', createdAt: nowMs - 4 * 3600_000 }, true)
  pushBooking({ resourceId: 'room-gerardus', resourceType: 'room', userId: 'user-nd', date: todayKey, slot: 'morning', status: 'reserved', createdAt: nowMs - 3600_000 }, false)

  return {
    teams: TEAMS,
    users: USERS,
    desks: DESKS,
    rooms: ROOMS,
    bookings,
    checkIns,
    waitlist: [],
    currentUserId: 'user-1',
    nowMs,
    lastError: null,
    lastPromotion: null,
  }
}
