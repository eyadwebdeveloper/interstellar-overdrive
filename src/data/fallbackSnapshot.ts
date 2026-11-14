import type { AuraSnapshot } from '../api/contract'
import { getActiveAlerts, type Alert } from './vitalsData'

/**
 * Offline fallback. The existing hand-written demo alerts stay exactly as they
 * were (official rule alerts, advisory notices, reminders). Forecast and risk
 * are static simulated values, clearly labelled in the UI.
 */
export function getFallbackAlerts(): Alert[] {
  return getActiveAlerts()
}

const trend = (start: number, step: number, n: number, wobble: number[]) =>
  Array.from({ length: n }, (_, i) => +(start + step * i + wobble[i % wobble.length]).toFixed(1))

export function getFallbackSnapshot(astroId: string): AuraSnapshot {
  const wob = [0.4, -0.3, 0.2, -0.5, 0.3, 0.1, -0.2]
  return {
    astro_id: astroId,
    day: 96,
    generated_at: new Date().toISOString(),
    simulated: true,
    tier0: { alerts: [] },
    tier1: { notices: [] },
    tier2: {
      risk: {
        band: 'early',
        confidence: 0.61,
        drivers: [
          'Resting heart rate has crept up over 14 days',
          'Heart rate variability is below your own range',
        ],
      },
      forecast: {
        horizon_days: 14,
        backend: 'trend_baseline',
        series: [
          {
            signal: 'resting_hr',
            unit: 'bpm',
            history: trend(62, 0.12, 30, wob),
            mu: trend(65.8, 0.12, 14, [0]),
            band: Array.from({ length: 14 }, (_, i) => +(1.8 + i * 0.12).toFixed(1)),
          },
          {
            signal: 'hrv_rmssd',
            unit: 'ms',
            history: trend(58, -0.25, 30, wob.map((v) => v * 3)),
            mu: trend(50.4, -0.25, 14, [0]),
            band: Array.from({ length: 14 }, (_, i) => +(4 + i * 0.3).toFixed(1)),
          },
          {
            signal: 'sleep_hours',
            unit: 'h',
            history: trend(7.1, -0.01, 30, wob.map((v) => v * 0.6)),
            mu: trend(6.8, -0.01, 14, [0]),
            band: Array.from({ length: 14 }, (_, i) => +(0.6 + i * 0.03).toFixed(2)),
          },
        ],
      },
    },
  }
}
