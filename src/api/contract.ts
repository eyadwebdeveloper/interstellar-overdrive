/**
 * AURA backend wire contract.
 *
 * The local Python demo server returns these snapshots after running the
 * simulator and models. Astronaut IDs refer to virtual test subjects.
 *
 * Authority rule (AI plan): only `tier0.alerts` may become an official alert.
 * Everything under `tier1` and `tier2` is advisory.
 */

/** Tier 0 levels, exactly as emitted by tier0.LEVELS. */
export type Tier0Level = 'informational' | 'watch' | 'elevated' | 'urgent_review'

export interface Tier0Alert {
  scope: 'body' | 'station'
  astro_id: string | null
  station_id: string
  signal: string
  rule: string
  level: Tier0Level
  alert_day: number
  end_day: number
  explanation: string
}

/** Tier 1 notice, as notices.Notice.as_dict(). Never an official alert. */
export interface Tier1Notice {
  day: number
  source: string
  strangeness: number
  explanation: string
}

/** Tier 2a bands from tier2a.BANDS. */
export type RiskBand = 'none' | 'early' | 'established'

export interface Tier2Risk {
  band: RiskBand
  /** Max class probability, 0 to 1. */
  confidence: number
  /** Short plain-language reasons, e.g. "Resting HR trending up over 14 days". */
  drivers: string[]
}

export interface ForecastSeries {
  signal: string
  unit: string
  /** Last observed days, oldest first. */
  history: number[]
  /** Forecast mean per future day. */
  mu: number[]
  /** Half-width of the model's empirical forecast band; not a calibrated interval. */
  band: number[]
}

export interface Tier2Forecast {
  horizon_days: number
  backend: 'trend_baseline' | 'ridge' | 'gru'
  series: ForecastSeries[]
}

export interface AuraSnapshot {
  astro_id: string
  day: number
  generated_at: string
  /** The backend is a simulation; always true in this prototype. */
  simulated: boolean
  tier0: { alerts: Tier0Alert[] }
  tier1: { notices: Tier1Notice[] }
  tier2: { risk: Tier2Risk | null; forecast: Tier2Forecast | null }
}

export interface HealthResponse {
  status: 'ok'
  simulated?: boolean
}
