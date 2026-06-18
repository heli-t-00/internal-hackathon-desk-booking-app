import type { Action, Booking, ResourceId, Slot, StoreState } from './types'
import { DAY_MS, slotStartHour, toDateKey } from './time'

const ACTIVE: Booking['status'][] = ['reserved', 'checked_in']

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

    case 'CANCEL_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map((b) => (b.id === action.bookingId ? { ...b, status: 'cancelled' } : b)),
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
      const bookings = state.bookings.map((b) => {
        if (b.status !== 'reserved') return b
        if (b.date !== todayKey) return b
        if (checkedInIds.has(b.id)) return b
        const past = nowHour >= slotStartHour(b.slot) + GRACE_MS / (60 * 60 * 1000)
        return past ? { ...b, status: 'released' as const } : b
      })
      return { ...state, bookings }
    }

    case 'FAST_FORWARD':
      return { ...state, nowMs: state.nowMs + action.minutes * 60 * 1000 }

    case 'CLEAR_ERROR':
      return { ...state, lastError: null }

    case 'SET_CURRENT_USER':
      return { ...state, currentUserId: action.userId }

    default:
      return state
  }
}

export { DAY_MS }
