import type { StoreState } from '../store/types'
import { heuristicResolve } from './heuristicResolver'
import type { ResolveResult } from './types'

export async function resolveBookingRequest(text: string, state: StoreState): Promise<ResolveResult> {
  await new Promise((r) => setTimeout(r, 280))
  return heuristicResolve(text, state)
}
