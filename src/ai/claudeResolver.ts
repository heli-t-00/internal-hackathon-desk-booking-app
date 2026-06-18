import type { StoreState } from '../store/types'
import { heuristicResolve } from './heuristicResolver'
import type { ResolveResult } from './types'

// Stretch goal — real Claude wiring (currently delegates to the heuristic).
//
// To go live:
//  1. Add a Vite dev proxy in vite.config.ts forwarding /api/anthropic →
//     https://api.anthropic.com with the API key injected proxy-side (keeps the
//     key out of the bundle and sidesteps CORS).
//  2. POST to /api/anthropic/v1/messages with model "claude-sonnet-4-6",
//     a system prompt listing the current free desks/rooms + team/zone metadata,
//     and structured outputs:
//       output_config: { format: { type: "json_schema", schema: BOOKING_INTENT_SCHEMA } }
//     (no assistant prefill — it 400s on this model family).
//  3. Parse the returned BookingIntent and return { ok: true, intent }.
export async function claudeResolve(text: string, state: StoreState): Promise<ResolveResult> {
  // Placeholder: until the proxy + key are wired, fall back to the heuristic so
  // the demo never breaks.
  return heuristicResolve(text, state)
}
