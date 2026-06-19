import type { Action, AppNotification, Booking, ResourceId, Slot, StoreState, TeamReservation, WaitlistEntry } from './types'
import { DAY_MS, slotStartHour, toDateKey } from './time'

const ACTIVE: Booking['status'][] = ['reserved', 'checked_in', 'team_reserved']

function slotsOverlap(a: Slot, b: Slot): boolean {
  if (a === 'allday' || b === 'allday') return true
  return a === b
}

export function isConflict(
  state: StoreState,
  resourceId: ResourceId,
  date: string,
  slot: Slot,
  ignoreBookingId?: string,
): boolean {
  return state.bookings.some(
    (b) =>
      b.id !== ignoreBookingId &&
      b.resourceId === resourceId &&
      b.date === date &&
      ACTIVE.includes(b.status) &&
      slotsOverlap(b.slot, slot),
  )
}

const GRACE_MS = 60 * 60 * 1000 // an hour after the slot starts → counts as a no-show

function nextId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

// Promote the first waitlisted user for a freed desk slot. Returns updated waitlist,
// the new booking (if any), and a promotion message if the current user was promoted.
function promoteWaitlist(
  state: StoreState,
  freedResourceId: ResourceId,
  freedDate: string,
  freedSlot: Slot,
  waitlist: WaitlistEntry[],
): { waitlist: WaitlistEntry[]; newBooking: Booking | null; promotionMsg: string | null } {
  const idx = waitlist.findIndex((w) => w.date === freedDate && slotsOverlap(w.slot, freedSlot))
  if (idx === -1) return { waitlist, newBooking: null, promotionMsg: null }

  const entry = waitlist[idx]
  const newWaitlist = waitlist.filter((_, i) => i !== idx)
  const desk = state.desks.find((d) => d.id === freedResourceId)
  const newBooking: Booking = {
    id: nextId('bk'),
    resourceId: freedResourceId,
    resourceType: 'desk',
    userId: entry.userId,
    date: entry.date,
    slot: entry.slot,
    status: 'reserved',
    createdAt: state.nowMs,
  }

  const promotionMsg =
    entry.userId === state.currentUserId
      ? `A spot opened up! You've been booked for ${desk ? `Desk ${desk.number}` : 'a desk'} from the waitlist.`
      : null

  return { waitlist: newWaitlist, newBooking, promotionMsg }
}

export function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'BOOK': {
      const { resourceId, resourceType, userId, date, slot } = action
      if (isConflict(state, resourceId, date, slot)) {
        return { ...state, lastError: 'That spot is already taken for this slot — pick another.' }
      }
      const booking: Booking = {
        id: nextId('bk'),
        resourceId,
        resourceType,
        userId,
        date,
        slot,
        status: 'reserved',
        createdAt: state.nowMs,
      }
      return { ...state, bookings: [...state.bookings, booking], lastError: null }
    }

    case 'CANCEL_BOOKING': {
      const cancelled = state.bookings.find((b) => b.id === action.bookingId)
      const bookings = state.bookings.map((b) => (b.id === action.bookingId ? { ...b, status: 'cancelled' as const } : b))
      if (!cancelled || cancelled.resourceType !== 'desk') return { ...state, bookings }

      const { waitlist, newBooking, promotionMsg } = promoteWaitlist(
        state,
        cancelled.resourceId,
        cancelled.date,
        cancelled.slot,
        state.waitlist,
      )
      return {
        ...state,
        bookings: newBooking ? [...bookings, newBooking] : bookings,
        waitlist,
        lastPromotion: promotionMsg ?? state.lastPromotion,
      }
    }

    case 'EDIT_BOOKING': {
      const target = state.bookings.find((b) => b.id === action.bookingId)
      if (!target) return state
      const next = { ...target, ...action.patch }
      if (isConflict(state, next.resourceId, next.date, next.slot, target.id)) {
        return { ...state, lastError: 'That change clashes with an existing booking.' }
      }
      return {
        ...state,
        bookings: state.bookings.map((b) => (b.id === target.id ? next : b)),
        lastError: null,
      }
    }

    case 'CHECK_IN': {
      const target = state.bookings.find((b) => b.id === action.bookingId)
      if (!target) return state
      return {
        ...state,
        bookings: state.bookings.map((b) => (b.id === target.id ? { ...b, status: 'checked_in' } : b)),
        checkIns: [...state.checkIns, { id: nextId('ci'), bookingId: target.id, at: state.nowMs }],
      }
    }

    case 'RELEASE_NO_SHOWS': {
      const todayKey = toDateKey(state.nowMs)
      const nowHour = new Date(state.nowMs).getHours() + new Date(state.nowMs).getMinutes() / 60
      const checkedInIds = new Set(state.checkIns.map((c) => c.bookingId))
      const releasedIds = new Set<string>()

      const bookings = state.bookings.map((b) => {
        if (b.status !== 'reserved') return b
        if (b.date !== todayKey) return b
        if (checkedInIds.has(b.id)) return b
        const past = nowHour >= slotStartHour(b.slot) + GRACE_MS / (60 * 60 * 1000)
        if (past) { releasedIds.add(b.id); return { ...b, status: 'released' as const } }
        return b
      })

      // Promote waitlisted users for each freed desk slot
      let waitlist = [...state.waitlist]
      const promoted: Booking[] = []
      let lastPromotion: string | null = state.lastPromotion

      for (const b of state.bookings) {
        if (!releasedIds.has(b.id) || b.resourceType !== 'desk') continue
        const result = promoteWaitlist(state, b.resourceId, b.date, b.slot, waitlist)
        waitlist = result.waitlist
        if (result.newBooking) promoted.push(result.newBooking)
        if (result.promotionMsg) lastPromotion = result.promotionMsg
      }

      // Expire team reservations whose hold window has passed
      const expiredReservations = state.teamReservations.filter((r) => state.nowMs >= r.expiresAt)
      const expiredIds = new Set(expiredReservations.map((r) => r.id))
      const expiredDeskIds = new Set(expiredReservations.flatMap((r) => r.deskIds))
      const bookingsAfterExpiry = [...bookings, ...promoted].map((b) =>
        b.status === 'team_reserved' && expiredDeskIds.has(b.resourceId) ? { ...b, status: 'released' as const } : b,
      )

      return {
        ...state,
        bookings: bookingsAfterExpiry,
        waitlist,
        lastPromotion,
        teamReservations: state.teamReservations.filter((r) => !expiredIds.has(r.id)),
        notifications: state.notifications.filter((n) => !expiredIds.has(n.reservationId)),
      }
    }

    case 'FAST_FORWARD':
      return { ...state, nowMs: state.nowMs + action.minutes * 60 * 1000 }

    case 'CLEAR_ERROR':
      return { ...state, lastError: null }

    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId }

    case 'JOIN_WAITLIST': {
      const { userId, date, slot } = action
      const alreadyOn = state.waitlist.some((w) => w.userId === userId && w.date === date && slotsOverlap(w.slot, slot))
      if (alreadyOn) return state
      const entry: WaitlistEntry = { id: nextId('wl'), userId, date, slot, createdAt: state.nowMs }
      return { ...state, waitlist: [...state.waitlist, entry] }
    }

    case 'LEAVE_WAITLIST':
      return { ...state, waitlist: state.waitlist.filter((w) => w.id !== action.entryId) }

    case 'CLEAR_PROMOTION':
      return { ...state, lastPromotion: null }

    case 'BLOCK_DESKS_FOR_TEAM': {
      const { teamId, createdBy, deskIds, date, slot, holdMinutes } = action
      const expiresAt = state.nowMs + holdMinutes * 60 * 1000
      const reservation: TeamReservation = {
        id: nextId('tr'),
        teamId,
        createdBy,
        deskIds,
        date,
        slot,
        expiresAt,
      }
      const newBookings: Booking[] = deskIds
        .filter((deskId) => !isConflict(state, deskId, date, slot))
        .map((deskId) => ({
          id: nextId('bk'),
          resourceId: deskId,
          resourceType: 'desk' as const,
          userId: createdBy,
          date,
          slot,
          status: 'team_reserved' as const,
          createdAt: state.nowMs,
        }))

      // Notify all teammates (everyone in teamId except the booker)
      const teammates = state.users.filter((u) => u.teamId === teamId && u.id !== createdBy)
      const expiryTime = new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const newNotifications: AppNotification[] = teammates.map((u) => ({
        id: nextId('notif'),
        userId: u.id,
        teamId,
        reservationId: reservation.id,
        message: `Your team has ${newBookings.length} desk${newBookings.length !== 1 ? 's' : ''} reserved — claim yours before ${expiryTime}.`,
        createdAt: state.nowMs,
      }))

      return {
        ...state,
        bookings: [...state.bookings, ...newBookings],
        teamReservations: [...state.teamReservations, reservation],
        notifications: [...state.notifications, ...newNotifications],
      }
    }

    case 'CLAIM_TEAM_DESK': {
      const { bookingId, userId } = action
      const booking = state.bookings.find((b) => b.id === bookingId)
      if (!booking || booking.status !== 'team_reserved') return state
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? { ...b, userId, status: 'reserved' as const } : b,
        ),
      }
    }

    case 'CANCEL_TEAM_RESERVATION': {
      const reservation = state.teamReservations.find((r) => r.id === action.reservationId)
      if (!reservation) return state
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          reservation.deskIds.includes(b.resourceId) && b.date === reservation.date && b.status === 'team_reserved'
            ? { ...b, status: 'cancelled' as const }
            : b,
        ),
        teamReservations: state.teamReservations.filter((r) => r.id !== action.reservationId),
        notifications: state.notifications.filter((n) => n.reservationId !== action.reservationId),
      }
    }

    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.notificationId) }

    default:
      return state
  }
}

export { DAY_MS }
