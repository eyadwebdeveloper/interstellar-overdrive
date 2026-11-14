import type { Alert, StatusLevel } from '../data/vitalsData'
import type { AuraSnapshot, Tier0Alert, Tier0Level, Tier1Notice } from './contract'

const LEVEL_MAP: Record<Tier0Level, StatusLevel> = {
  informational: 'normal',
  watch: 'watch',
  elevated: 'act',
  urgent_review: 'emergency',
}

const SIGNAL_LABEL: Record<string, string> = {
  resting_hr: 'Resting heart rate',
  hrv_rmssd: 'Heart rate variability',
  sleep_hours: 'Sleep duration',
  active_min: 'Activity',
  skin_temp_c: 'Skin temperature',
  mood_score: 'Mood check-in',
  fatigue_score: 'Fatigue check-in',
  co2_ppm: 'Cabin CO2',
  cabin_temp_c: 'Cabin temperature',
  rh_pct: 'Cabin humidity',
  noise_db: 'Cabin noise',
  dose_usv_day: 'Cabin radiation dose rate',
}

export const signalLabel = (signal: string) => SIGNAL_LABEL[signal] ?? signal

const SYSTEM_BY_SIGNAL: Record<string, string> = {
  resting_hr: 'cardiovascular',
  hrv_rmssd: 'cardiovascular',
  sleep_hours: 'nervous',
  mood_score: 'nervous',
  fatigue_score: 'nervous',
}

/** Day numbers become timestamps relative to the snapshot's own generation time. */
function dayToIso(snapshot: AuraSnapshot, day: number): string {
  const base = Date.parse(snapshot.generated_at)
  const t = Number.isFinite(base) ? base : Date.now()
  return new Date(t - Math.max(0, snapshot.day - day) * 86_400_000).toISOString()
}

/** Tier 0 is the only producer of official ("rule") alerts. */
export function tier0ToAlert(a: Tier0Alert, s: AuraSnapshot): Alert {
  const level = LEVEL_MAP[a.level] ?? 'watch'
  return {
    id: `t0:${a.scope}:${a.station_id}:${a.astro_id ?? 'all'}:${a.signal}:${a.rule}:${a.alert_day}`,
    kind: 'rule',
    type: level === 'emergency' || level === 'act' ? 'critical' : level === 'watch' ? 'warning' : 'info',
    level,
    title: `${signalLabel(a.signal)}: ${a.rule}`,
    description: a.explanation,
    ruleId: a.rule,
    observed: a.explanation,
    system: SYSTEM_BY_SIGNAL[a.signal],
    timestamp: dayToIso(s, a.alert_day),
    source: a.scope === 'station' ? 'Cabin rules (Tier 0)' : 'Personal rules (Tier 0)',
    acknowledged: false,
    category: 'Official alerts · rules',
  }
}

/** Tier 1 notices are advisory only: kind is fixed to "advisory" and never "rule". */
export function noticeToAlert(n: Tier1Notice, s: AuraSnapshot): Alert {
  return {
    id: `t1:${n.source}:${n.day}`,
    kind: 'advisory',
    type: 'advisory',
    level: 'watch',
    title: 'Pattern notice',
    description: n.explanation,
    confidence: Math.round(Math.min(1, Math.max(0, n.strangeness)) * 100),
    system: n.source.includes('tier1b') ? undefined : 'cardiovascular',
    timestamp: dayToIso(s, n.day),
    source: 'Pattern analysis (Tier 1)',
    acknowledged: false,
    category: 'Advisory notices',
  }
}

export function riskToAlert(s: AuraSnapshot): Alert | null {
  const r = s.tier2.risk
  if (!r || r.band === 'none') return null
  return {
    id: `t2a:${r.band}:${s.day}`,
    kind: 'advisory',
    type: 'advisory',
    level: 'watch',
    title: r.band === 'early' ? 'Early deconditioning pattern' : 'Established deconditioning pattern',
    description: r.drivers.join('. ') || 'Heart rate and variability have moved away from your own range.',
    confidence: Math.round(r.confidence * 100),
    system: 'cardiovascular',
    timestamp: s.generated_at,
    source: 'Risk model (Tier 2)',
    acknowledged: false,
    category: 'Advisory notices',
  }
}

/** Newest first within each lane. Official and advisory items never share a source. */
export function snapshotToAlerts(s: AuraSnapshot, reminders: Alert[]): Alert[] {
  const official = s.tier0.alerts.map((a) => tier0ToAlert(a, s))
  const advisory = [...s.tier1.notices.map((n) => noticeToAlert(n, s)), riskToAlert(s)].filter(
    (x): x is Alert => x !== null,
  )
  const byTime = (a: Alert, b: Alert) => Date.parse(b.timestamp) - Date.parse(a.timestamp)
  return [...official.sort(byTime), ...advisory.sort(byTime), ...reminders]
}

/** Reject payloads that do not match the contract instead of rendering garbage. */
export function isSnapshot(x: unknown): x is AuraSnapshot {
  if (!x || typeof x !== 'object') return false
  const s = x as Partial<AuraSnapshot>
  return (
    typeof s.astro_id === 'string' &&
    typeof s.day === 'number' &&
    typeof s.generated_at === 'string' &&
    Array.isArray(s.tier0?.alerts) &&
    Array.isArray(s.tier1?.notices) &&
    typeof s.tier2 === 'object' &&
    s.tier2 !== null
  )
}
