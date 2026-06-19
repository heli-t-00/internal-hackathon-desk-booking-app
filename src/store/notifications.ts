import type { StoreState } from './types'
import {
  availabilityForDate,
  busiestDay,
  noShowRate,
  quietestDay,
  resourceLabel,
  teamById,
  todayKey,
  userById,
  whoIsInToday,
} from './selectors'

export type NotifKind = 'friend' | 'cancellation' | 'release' | 'live' | 'analytics'

export interface AppNotif {
  id: string
  kind: NotifKind
  app: string // the "app" the notification comes from (grouping label, iOS-style)
  icon: string // emoji shown in the rounded app tile
  accent: string // background colour for the app tile
  title: string
  body: string
  ts: number // when it fired (ms) — used for ordering + "5m ago"
}

const MIN = 60_000

// Build the notification feed straight from store state, so it stays live:
// cancelling a booking or fast-forwarding the demo clock (no-show releases)
// both change what appears here.
export function buildNotifications(state: StoreState): AppNotif[] {
  const today = todayKey(state)
  const now = state.nowMs
  const me = state.currentUserId
  const out: AppNotif[] = []

  // --- Friends who've booked in / checked in today ---
  const friends = new Set(state.friendIds)
  for (const b of state.bookings) {
    if (!friends.has(b.userId) || b.date !== today) continue
    if (b.status !== 'reserved' && b.status !== 'checked_in') continue
    const u = userById(state, b.userId)
    if (!u) continue
    const where = resourceLabel(state, b)
    out.push({
      id: `n-friend-${b.id}`,
      kind: 'friend',
      app: 'Teammates',
      icon: '👋',
      accent: teamById(state, u.teamId)?.colour ?? 'var(--brand)',
      title: u.name,
      body: b.status === 'checked_in' ? `Checked in at ${where} — come say hi` : `Booked ${where} for today`,
      ts: b.createdAt,
    })
  }

  // --- Cancellations today: someone freed a spot ---
  for (const b of state.bookings) {
    if (b.date !== today || b.status !== 'cancelled' || b.userId === me) continue
    const u = userById(state, b.userId)
    out.push({
      id: `n-cancel-${b.id}`,
      kind: 'cancellation',
      app: 'Desk Booking',
      icon: '🔄',
      accent: 'var(--brand)',
      title: `${resourceLabel(state, b)} just opened up`,
      body: `${u?.name ?? 'Someone'} cancelled their booking — tap to grab it`,
      ts: b.createdAt,
    })
  }

  // --- No-show auto-releases today (this is what the +2h demo button triggers) ---
  for (const b of state.bookings) {
    if (b.date !== today || b.status !== 'released' || b.userId === me) continue
    out.push({
      id: `n-release-${b.id}`,
      kind: 'release',
      app: 'Desk Booking',
      icon: '🔓',
      accent: 'var(--amber)',
      title: `${resourceLabel(state, b)} released`,
      body: 'No check-in within the grace window — back in the pool',
      ts: now, // just happened as the clock advanced
    })
  }

  // --- Live office count ---
  const present = whoIsInToday(state).length
  const avail = availabilityForDate(state, today)
  out.push({
    id: 'n-live',
    kind: 'live',
    app: 'Office Pulse',
    icon: '🏢',
    accent: 'var(--green)',
    title: `${present} ${present === 1 ? 'person' : 'people'} in the office`,
    body: `${avail.pct}% full · ${avail.free} ${avail.free === 1 ? 'desk' : 'desks'} still free`,
    ts: now - 3 * MIN,
  })

  // --- General analytics ---
  out.push({
    id: 'n-analytics',
    kind: 'analytics',
    app: 'Insights',
    icon: '📊',
    accent: 'var(--brand-ink)',
    title: 'Your weekly pattern',
    body: `${busiestDay(state)} is busiest, ${quietestDay(state)} is quietest. ${noShowRate(state)}% of desks booked last fortnight were no-shows.`,
    ts: now - 47 * MIN,
  })

  return out.sort((a, b) => b.ts - a.ts)
}

export function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 45) return 'now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}
