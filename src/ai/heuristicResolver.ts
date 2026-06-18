import type { StoreState, Slot, Zone } from '../store/types'
import { activeBookingFor, todayKey, userById } from '../store/selectors'
import { addDays, prettyDate, toDateKey } from '../store/time'
import type { BookingIntent, ResolveResult } from './types'

// Offline natural-language resolver. Parses intent from free text, then picks a
// real, bookable resource using the live store. Drop-in replaceable by Claude.

const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function resolveDate(text: string, state: StoreState): string {
  const today = todayKey(state)
  if (/\btomorrow\b/.test(text)) return toDateKey(addDays(state.nowMs, 1))
  if (/\btoday\b/.test(text)) return today
  for (let i = 0; i < WEEKDAY_NAMES.length; i++) {
    if (text.includes(WEEKDAY_NAMES[i])) {
      // next occurrence of that weekday
      for (let d = 1; d <= 7; d++) {
        const ms = addDays(state.nowMs, d)
        if (new Date(ms).getDay() === i) return toDateKey(ms)
      }
    }
  }
  return today
}

function resolveSlot(text: string): Slot {
  if (/\bmorning\b|\bam\b/.test(text)) return 'morning'
  if (/\bafternoon\b|\bpm\b/.test(text)) return 'afternoon'
  return 'allday'
}

export function heuristicResolve(rawText: string, state: StoreState): ResolveResult {
  const text = rawText.toLowerCase()
  const date = resolveDate(text, state)
  const slot = resolveSlot(text)

  const wantsRoom = /\b(room|meeting|call|booth)\b/.test(text)
  const me = userById(state, state.currentUserId)!

  // Constraints
  const wantsQuiet = /\bquiet\b|\bfocus\b|\bhead ?down\b/.test(text)
  const wantsStanding = /\bstand(ing)?\b/.test(text)
  const wantsNearTeam = /\b(near|with|by)\b.*\b(team|colleagues|others)\b|\bmy team\b/.test(text)

  if (wantsRoom) {
    const room = state.rooms.find((r) => !activeBookingFor(state, r.id, date, slot))
    if (!room) return { ok: false, clarify: 'All meeting rooms are taken for that time — try another day or slot?' }
    return {
      ok: true,
      intent: {
        resourceType: 'room',
        resourceId: room.id,
        resourceLabel: room.name,
        date,
        dateLabel: prettyDate(date, todayKey(state)),
        slot,
        reason: `${room.name} is free and seats ${room.capacity}.`,
      },
    }
  }

  // Candidate free desks
  let candidates = state.desks.filter((d) => !activeBookingFor(state, d.id, date, slot))

  const reasons: string[] = []
  let zone: Zone | undefined
  if (wantsQuiet) {
    zone = 'quiet'
    const quiet = candidates.filter((d) => d.zone === 'quiet')
    if (quiet.length) {
      candidates = quiet
      reasons.push('in the quiet zone')
    } else {
      reasons.push('(no quiet desks free, so the calmest area)')
    }
  }
  if (wantsStanding) {
    const standing = candidates.filter((d) => d.standing)
    if (standing.length) {
      candidates = standing
      reasons.push('a standing desk')
    }
  }
  if (wantsNearTeam) {
    // prefer desks adjacent to where teammates are sitting today
    const teamDeskNumbers = state.bookings
      .filter((b) => b.date === date && b.resourceType === 'desk' && userById(state, b.userId)?.teamId === me.teamId)
      .map((b) => state.desks.find((d) => d.id === b.resourceId)?.number)
      .filter((n): n is number => n != null)
    if (teamDeskNumbers.length) {
      const near = candidates
        .map((d) => ({ d, dist: Math.min(...teamDeskNumbers.map((n) => Math.abs(n - d.number))) }))
        .sort((a, b) => a.dist - b.dist)
      candidates = near.map((x) => x.d)
      reasons.push(`near your ${state.teams.find((t) => t.id === me.teamId)?.name} teammates`)
    } else {
      reasons.push('(no teammates booked yet for that day)')
    }
  }

  if (!candidates.length) {
    return { ok: false, clarify: 'No desks match that for the day — want me to try a different day or drop the quiet/standing filter?' }
  }

  const desk = candidates[0]
  const where =
    reasons.length > 0 ? reasons.join(', ') : zone ? `in the ${zone} area` : 'with good availability nearby'
  return {
    ok: true,
    intent: {
      resourceType: 'desk',
      resourceId: desk.id,
      resourceLabel: `Desk ${desk.number}`,
      date,
      dateLabel: prettyDate(date, todayKey(state)),
      slot,
      reason: `Desk ${desk.number} — ${where}.`,
    },
  }
}
