// ---- Core domain types (single source of truth for the whole app) ----

export type TeamId = string
export type UserId = string
export type ResourceId = string // desk-12, room-atlas

export type Slot = 'morning' | 'afternoon' | 'allday'
export type Zone = 'standard' | 'quiet' | 'collab'

export interface Team {
  id: TeamId
  name: string
  colour: string
}

export interface User {
  id: UserId
  name: string
  initials: string
  teamId: TeamId
}

export interface Desk {
  id: ResourceId
  number: number // 1..32, matches the floor plan
  x: number
  y: number
  zone: Zone
  standing: boolean
}

export interface Room {
  id: ResourceId
  name: string
  capacity: number
  // bounding box on the floor plan
  x: number
  y: number
  w: number
  h: number
}

export type ResourceType = 'desk' | 'room'

export type BookingStatus = 'reserved' | 'checked_in' | 'released' | 'cancelled'

export interface Booking {
  id: string
  resourceId: ResourceId
  resourceType: ResourceType
  userId: UserId
  date: string // YYYY-MM-DD
  slot: Slot
  status: BookingStatus
  createdAt: number
}

export interface CheckIn {
  id: string
  bookingId: string
  at: number
}

export interface StoreState {
  teams: Team[]
  users: User[]
  desks: Desk[]
  rooms: Room[]
  bookings: Booking[]
  checkIns: CheckIn[]
  currentUserId: UserId
  nowMs: number // demo clock
  lastError: string | null
}

// ---- Actions ----
export type Action =
  | { type: 'BOOK'; resourceId: ResourceId; resourceType: ResourceType; userId: UserId; date: string; slot: Slot }
  | { type: 'CANCEL_BOOKING'; bookingId: string }
  | { type: 'EDIT_BOOKING'; bookingId: string; patch: Partial<Pick<Booking, 'date' | 'slot' | 'resourceId'>> }
  | { type: 'CHECK_IN'; bookingId: string }
  | { type: 'RELEASE_NO_SHOWS' }
  | { type: 'FAST_FORWARD'; minutes: number }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_CURRENT_USER'; userId: UserId }
