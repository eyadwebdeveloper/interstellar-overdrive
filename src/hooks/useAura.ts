import { useEffect, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { snapshotToAlerts } from '../api/adapters'
import { getFallbackAlerts } from '../data/fallbackSnapshot'
import type { Alert } from '../data/vitalsData'
import { useAuraStore } from '../stores/auraStore'
import { useCrewStore } from '../stores/crewStore'

const POLL_MS = 60_000

/** Mount once (AppShell). Fetches for the active crew member and polls while visible. */
export function useAuraSync() {
  const crewId = useCrewStore((s) => s.activeCrewId)
  const refresh = useAuraStore((s) => s.refresh)
  useEffect(() => {
    void refresh(crewId)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(crewId)
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [crewId, refresh])
}

export function useAuraSource() {
  return useAuraStore(
    useShallow((s) => ({ source: s.source, error: s.error, lastLive: s.lastLive })),
  )
}

/**
 * All alerts. Live: Tier 0 -> official, Tier 1/2 -> advisory, reminders from local demo data.
 * Fallback or loading: the original demo alerts, unchanged.
 */
export function useAlerts(): Alert[] {
  const source = useAuraStore((s) => s.source)
  const snapshot = useAuraStore((s) => s.snapshot)
  return useMemo(() => {
    const demo = getFallbackAlerts()
    if (source !== 'live' || !snapshot) return demo
    return snapshotToAlerts(snapshot, demo.filter((a) => a.kind === 'reminder'))
  }, [source, snapshot])
}

export const useRisk = () => useAuraStore((s) => s.snapshot?.tier2.risk ?? null)
export const useForecast = () => useAuraStore((s) => s.snapshot?.tier2.forecast ?? null)
