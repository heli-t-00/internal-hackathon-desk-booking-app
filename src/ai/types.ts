import type { ResourceType, Slot } from '../store/types'

export interface BookingIntent {
  resourceType: ResourceType
  resourceId: string
  resourceLabel: string
  date: string // YYYY-MM-DD
  dateLabel: string
  slot: Slot
  reason: string // human-readable "why this one"
}

export type ResolveResult = { ok: true; intent: BookingIntent } | { ok: false; clarify: string }
