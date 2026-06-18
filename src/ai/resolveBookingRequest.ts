import type { StoreState } from '../store/types'
import { heuristicResolve } from './heuristicResolver'
import { claudeResolve } from './claudeResolver'
import type { ResolveResult } from './types'

const USE_CLAUDE = import.meta.env.VITE_USE_CLAUDE === 'true'

// Single seam the chat UI calls. Swap heuristic ↔ Claude via one env flag.
export async function resolveBookingRequest(text: string, state: StoreState): Promise<ResolveResult> {
  if (USE_CLAUDE) return claudeResolve(text, state)
  // tiny delay so the chat feels like it's "thinking"
  await new Promise((r) => setTimeout(r, 280))
  return heuristicResolve(text, state)
}
