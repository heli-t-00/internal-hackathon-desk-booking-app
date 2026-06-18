// Date + demo-clock helpers. All "today" logic flows through nowMs in the store
// so the FAST_FORWARD demo button can move time without touching real wall-clock.

export const DAY_MS = 24 * 60 * 60 * 1000

export function toDateKey(ms: number): string {
  const d = new Date(ms)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(ms: number, n: number): number {
  return ms + n * DAY_MS
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function weekdayShort(dateKey: string): string {
  return WEEKDAYS[new Date(dateKey + 'T00:00:00').getDay()]
}
export function weekdayLong(dateKey: string): string {
  return WEEKDAYS_LONG[new Date(dateKey + 'T00:00:00').getDay()]
}
export function isWeekend(dateKey: string): boolean {
  const d = new Date(dateKey + 'T00:00:00').getDay()
  return d === 0 || d === 6
}

// Human label like "Tue 23 Jun" / "Today" / "Tomorrow"
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function prettyDate(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return 'Today'
  const d = new Date(dateKey + 'T00:00:00')
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function slotLabel(slot: 'morning' | 'afternoon' | 'allday'): string {
  return slot === 'morning' ? 'Morning' : slot === 'afternoon' ? 'Afternoon' : 'All day'
}

// Minutes-into-day a slot starts (for no-show grace logic).
export function slotStartHour(slot: 'morning' | 'afternoon' | 'allday'): number {
  return slot === 'afternoon' ? 13 : 9
}
