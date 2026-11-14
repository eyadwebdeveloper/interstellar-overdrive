import { create } from 'zustand'
import { auraApi } from '../api/client'
import { isSnapshot } from '../api/adapters'
import type { AuraSnapshot } from '../api/contract'
import { getFallbackSnapshot } from '../data/fallbackSnapshot'

/** live = backend answered with a valid snapshot; fallback = built-in demo data. */
export type AuraSource = 'loading' | 'live' | 'fallback'

interface AuraState {
  source: AuraSource
  snapshot: AuraSnapshot | null
  astroId: string | null
  lastLive: string | null
  error: string | null
  refresh: (astroId: string) => Promise<void>
}

let inflight: AbortController | null = null

export const useAuraStore = create<AuraState>()((set, get) => ({
  source: 'loading',
  snapshot: null,
  astroId: null,
  lastLive: null,
  error: null,
  refresh: async (astroId) => {
    inflight?.abort()
    const ctrl = new AbortController()
    inflight = ctrl
    // Keep showing the previous snapshot for the same person while refreshing.
    if (get().astroId !== astroId) set({ astroId, source: 'loading', snapshot: null })
    try {
      const data = await auraApi.snapshot(astroId, ctrl.signal)
      if (ctrl.signal.aborted) return
      if (!isSnapshot(data)) throw new Error('Backend response did not match the expected shape')
      set({ source: 'live', snapshot: data, astroId, lastLive: new Date().toISOString(), error: null })
    } catch (err) {
      if (ctrl.signal.aborted) return
      set({
        source: 'fallback',
        snapshot: getFallbackSnapshot(astroId),
        astroId,
        error: err instanceof Error ? err.message : 'Backend unavailable',
      })
    }
  },
}))
