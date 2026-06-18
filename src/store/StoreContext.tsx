import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
import type { Action, StoreState } from './types'
import { reducer } from './reducer'
import { seedState } from './seed'

interface StoreCtx {
  state: StoreState
  dispatch: React.Dispatch<Action>
}

const Ctx = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedState)

  // Auto-release un-checked-in bookings as the demo clock advances.
  useEffect(() => {
    dispatch({ type: 'RELEASE_NO_SHOWS' })
  }, [state.nowMs])

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within <StoreProvider>')
  return ctx
}

export function useCurrentUser() {
  const { state } = useStore()
  return state.users.find((u) => u.id === state.currentUserId)!
}
