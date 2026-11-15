/**
 * AURA Intelligence — the on-device analysis engine.
 *
 * Everything here runs in the browser, needs no backend and no network, and is
 * deterministic: the same readings always give the same findings. It turns the
 * 14-day simulated vitals into
 *
 *   1. personal baselines (robust: median + MAD from the first week),
 *   2. drift scores and trend slopes against that baseline,
 *   3. a 7-day forecast with an empirical uncertainty band,
 *   4. cross-signal patterns (correlation, sleep-debt cascade),
 *   5. a readiness score with plain-language drivers,
 *   6. a personal response model used by the what-if simulator.
 *
 * Authority rule (unchanged from the rest of AURA): nothing produced here is an
 * official alert. Only the Tier 0 rules can raise one. These are advisory.
 */
import type { StatusLevel, VitalSign } from "../data/vitalsData";

/** Which way is "worse" for a signal. */
type Polarity = "high-bad" | "low-bad" | "both";

interface SignalSpec {
  id: string;
  short: string;
  polarity: Polarity;
  /** How much the signal counts toward readiness (sums to ~1). */
  weight: number;
  system: "cardiovascular" | "skeletal" | "nervous" | "immune";
  /** Smallest change a person would care about, in the signal's unit. */
  meaningful: number;
}

export const SIGNAL_SPECS: SignalSpec[] = [
  { id: "sleep", short: "Sleep", polarity: "low-bad", weight: 0.27, system: "nervous", meaningful: 0.4 },
  { id: "hrv", short: "HRV", polarity: "low-bad", weight: 0.22, system: "cardiovascular", meaningful: 3 },
  { id: "heart-rate", short: "Resting HR", polarity: "high-bad", weight: 0.14, system: "cardiovascular", meaningful: 2 },
  { id: "pvt", short: "Reaction time", polarity: "high-bad", weight: 0.17, system: "nervous", meaningful: 10 },
  { id: "vo2max", short: "VO₂ max", polarity: "low-bad", weight: 0.1, system: "cardiovascular", meaningful: 0.8 },
  { id: "weight", short: "Weight", polarity: "low-bad", weight: 0.05, system: "skeletal", meaningful: 0.8 },
  { id: "radiation", short: "Radiation dose", polarity: "high-bad", weight: 0.05, system: "immune", meaningful: 0.1 },
];

export type Direction = "worse" | "better" | "steady";

export interface SignalInsight {
  id: string;
  label: string;
  unit: string;
  system: SignalSpec["system"];
  history: number[];
  current: number;
  baseline: number;
  baselineSpread: number;
  /** Drift in baseline-spreads, positive = moved in the "worse" direction. */
  drift: number;
  /** Units per day over the 14-day window (raw, not polarity-adjusted). */
  slope: number;
  direction: Direction;
  /** Seven days ahead. */
  forecast: number[];
  band: number[];
  /** Days until the demo "usual" range edge is crossed, if the trend continues. */
  daysToEdge: number | null;
  status: StatusLevel;
  /** Plain-language one-liner. */
  sentence: string;
}

export interface Pattern {
  id: string;
  title: string;
  detail: string;
  /** 0 to 1, how strongly the data supports it. */
  confidence: number;
  systems: string[];
  evidence: string[];
  /** A prompt that explains the pattern when sent to the copilot. */
  ask: string;
}

export interface Driver {
  id: string;
  label: string;
  /** Points added to or taken from readiness relative to the personal baseline. */
  points: number;
}

export interface Recommendation {
  id: string;
  title: string;
  why: string;
  to: string;
  cta: string;
  priority: 1 | 2 | 3;
}

export interface Intelligence {
  readiness: number;
  readinessLabel: string;
  headline: string;
  summary: string;
  drivers: Driver[];
  signals: SignalInsight[];
  patterns: Pattern[];
  recommendations: Recommendation[];
  /** Per body-system finding used to light up the 3D body. */
  systemFindings: Record<string, { level: StatusLevel; label: string; detail: string }>;
  sleepDebtHours: number;
  response: ResponseModel;
}

/* ───────────────────────── small statistics helpers ───────────────────────── */

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Ordinary least squares on x = 0..n-1. */
function ols(ys: number[]) {
  const n = ys.length;
  const xm = (n - 1) / 2;
  const ym = mean(ys);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (i - xm) * (ys[i] - ym);
    sxx += (i - xm) ** 2;
  }
  const slope = sxx ? sxy / sxx : 0;
  const intercept = ym - slope * xm;
  const resid = ys.map((y, i) => y - (intercept + slope * i));
  const sd = Math.sqrt(mean(resid.map((r) => r * r)));
  return { slope, intercept, sd };
}

function pearson(a: number[], b: number[]) {
  const am = mean(a);
  const bm = mean(b);
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < a.length; i++) {
    sab += (a[i] - am) * (b[i] - bm);
    saa += (a[i] - am) ** 2;
    sbb += (b[i] - bm) ** 2;
  }
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
}

/** Regression of y on x: y = a + b·x. */
function regress(x: number[], y: number[]) {
  const xm = mean(x);
  const ym = mean(y);
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < x.length; i++) {
    sxy += (x[i] - xm) * (y[i] - ym);
    sxx += (x[i] - xm) ** 2;
  }
  const b = sxx ? sxy / sxx : 0;
  return { a: ym - b * xm, b, r: pearson(x, y) };
}

const fmt = (v: number, unit: string) => {
  const d = Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2;
  const n = Number(v.toFixed(d));
  if (unit === "h") {
    const h = Math.floor(Math.abs(v));
    const m = Math.round((Math.abs(v) - h) * 60);
    return `${h}h ${String(m).padStart(2, "0")}m`;
  }
  return `${n}${unit ? ` ${unit}` : ""}`;
};
export const formatSignal = fmt;

/* ───────────────────────────── response model ─────────────────────────────── */

/** Personal response model: how this person's PVT and HRV have moved with sleep. */
export interface ResponseModel {
  /** ms of PVT slowdown per hour of sleep lost (fitted on the 14 days). */
  pvtPerSleepHour: number;
  hrvPerSleepHour: number;
  pvtR: number;
  hrvR: number;
  sleepMean: number;
  pvtAtMean: number;
  hrvAtMean: number;
}

export interface WhatIfInput {
  /** Hours of sleep per night over the next week. */
  sleepHours: number;
  /** Extra aerobic minutes per day (assumed effect, not fitted). */
  aerobicMinutes: number;
}

export interface WhatIfResult {
  readiness: number;
  readinessIfNothingChanges: number;
  pvt: number;
  hrv: number;
  restingHr: number;
  sleepDebtHours: number;
  note: string;
}

/* ───────────────────────────────── analysis ───────────────────────────────── */

const SYSTEM_LABEL: Record<string, string> = {
  cardiovascular: "Cardiovascular",
  skeletal: "Skeletal & muscular",
  nervous: "Nervous system",
  immune: "Immune & radiation",
};

function insightFor(spec: SignalSpec, v: VitalSign, horizon = 7): SignalInsight {
  const h = v.spark;
  const base = h.slice(0, 7);
  const baseline = median(base);
  const spread = Math.max(
    median(base.map((x) => Math.abs(x - baseline))) * 1.4826,
    spec.meaningful / 1.4,
  );
  const current = mean(h.slice(-3));
  const raw = (current - baseline) / spread;
  const drift = spec.polarity === "high-bad" ? raw : spec.polarity === "low-bad" ? -raw : Math.abs(raw);
  const fit = ols(h);
  const forecast = Array.from({ length: horizon }, (_, i) => fit.intercept + fit.slope * (h.length + i));
  // Empirical band: residual spread, widening with the horizon like a random walk would.
  const band = forecast.map((_, i) => 1.64 * fit.sd * Math.sqrt(1 + (i + 1) / h.length) + 0.0001);
  const [lo, hi] = v.normalRange;
  let daysToEdge: number | null = null;
  if (fit.slope !== 0) {
    const target = fit.slope > 0 ? hi : lo;
    const d = (target - h[h.length - 1]) / fit.slope;
    if (d > 0 && d < 60 && (fit.slope > 0 ? h[h.length - 1] < hi : h[h.length - 1] > lo)) daysToEdge = Math.ceil(d);
  }
  const movedMeaningfully = Math.abs(current - baseline) >= spec.meaningful * 0.8;
  const worse = spec.polarity === "high-bad" ? current > baseline : current < baseline;
  const direction: Direction = !movedMeaningfully ? "steady" : worse ? "worse" : "better";
  const status: StatusLevel = drift >= 2.5 ? "act" : drift >= 1.2 && direction === "worse" ? "watch" : "normal";
  const label = spec.short;
  const sentence =
    direction === "steady"
      ? `${label} is holding close to your own first-week baseline of ${fmt(baseline, v.unit)}.`
      : `${label} is ${worse ? (spec.polarity === "high-bad" ? "up" : "down") : spec.polarity === "high-bad" ? "down" : "up"} about ${fmt(Math.abs(current - baseline), v.unit)} from your own baseline of ${fmt(baseline, v.unit)}${
          daysToEdge && direction === "worse" ? `, and would leave your usual range in roughly ${daysToEdge} days if that continues` : ""
        }.`;
  return {
    id: v.id,
    label,
    unit: v.unit,
    system: spec.system,
    history: h,
    current,
    baseline,
    baselineSpread: spread,
    drift,
    slope: fit.slope,
    direction,
    forecast,
    band,
    daysToEdge,
    status,
    sentence,
  };
}

function readinessFrom(signals: SignalInsight[]) {
  let score = 92;
  const drivers: Driver[] = [];
  for (const spec of SIGNAL_SPECS) {
    const s = signals.find((x) => x.id === spec.id);
    if (!s) continue;
    // Only drift in the worse direction costs points; it saturates at 4 spreads.
    const cost = clamp(s.drift, 0, 4) / 4;
    const points = -Math.round(cost * spec.weight * 100 * 0.62);
    score += points;
    drivers.push({ id: s.id, label: spec.short, points });
  }
  drivers.sort((a, b) => a.points - b.points);
  return { score: clamp(Math.round(score), 20, 99), drivers };
}

export function analyse(vitals: VitalSign[]): Intelligence {
  const signals = SIGNAL_SPECS.flatMap((spec) => {
    const v = vitals.find((x) => x.id === spec.id);
    return v ? [insightFor(spec, v)] : [];
  });
  const by = (id: string) => signals.find((s) => s.id === id);
  const sleep = by("sleep");
  const hrv = by("hrv");
  const hr = by("heart-rate");
  const pvt = by("pvt");
  const vo2 = by("vo2max");

  const { score, drivers } = readinessFrom(signals);
  const readinessLabel = score >= 85 ? "Ready" : score >= 70 ? "Mostly ready" : score >= 55 ? "Run down" : "Needs recovery";

  /* Sleep debt against a 7h 30m personal target, over the 14 days. */
  const target = 7.5;
  const sleepSeries = sleep?.history ?? [];
  const sleepDebtHours = Math.max(0, sleepSeries.reduce((n, h) => n + Math.max(0, target - h), 0));

  /* Personal response model fitted on the person's own 14 days. */
  const pvtSeries = pvt?.history ?? [];
  const hrvSeries = hrv?.history ?? [];
  const pvtFit = sleepSeries.length ? regress(sleepSeries, pvtSeries) : { a: 250, b: -10, r: 0 };
  const hrvFit = sleepSeries.length ? regress(sleepSeries, hrvSeries) : { a: 50, b: 5, r: 0 };
  const response: ResponseModel = {
    pvtPerSleepHour: -pvtFit.b,
    hrvPerSleepHour: hrvFit.b,
    pvtR: pvtFit.r,
    hrvR: hrvFit.r,
    sleepMean: mean(sleepSeries),
    pvtAtMean: mean(pvtSeries),
    hrvAtMean: mean(hrvSeries),
  };

  /* Patterns. */
  const patterns: Pattern[] = [];
  if (sleep && pvt && sleep.direction === "worse" && pvt.direction === "worse") {
    const r = pearson(sleep.history, pvt.history);
    patterns.push({
      id: "sleep-focus",
      title: "Reaction time is following your sleep",
      detail: `Over 14 days your reaction time has slowed as your sleep shortened (correlation ${r.toFixed(2)}). Each hour of sleep lost has gone with roughly ${Math.abs(response.pvtPerSleepHour).toFixed(0)} ms slower reactions.`,
      confidence: clamp(Math.abs(r), 0.3, 0.95),
      systems: ["nervous"],
      evidence: [sleep.sentence, pvt.sentence],
      ask: "Why is my reaction time getting slower?",
    });
  }
  if (sleep && hrv && hr && sleep.direction === "worse" && hrv.direction === "worse") {
    const conf = clamp((Math.min(3, sleep.drift) + Math.min(3, hrv.drift) + Math.max(0, Math.min(3, hr.drift))) / 9 + 0.25, 0.35, 0.9);
    patterns.push({
      id: "recovery-cascade",
      title: "A recovery debt is building",
      detail: `Shorter sleep, lower heart rate variability${hr.direction === "worse" ? " and a higher resting heart rate" : ""} are moving together. That combination is a common sign the body is carrying more load than it recovers from. It is a pattern in simulated readings, not a diagnosis.`,
      confidence: conf,
      systems: ["cardiovascular", "nervous"],
      evidence: [sleep.sentence, hrv.sentence, ...(hr.direction === "worse" ? [hr.sentence] : [])],
      ask: "Explain my recovery debt pattern.",
    });
  }
  if (vo2 && vo2.direction === "worse") {
    patterns.push({
      id: "fitness-drift",
      title: "Aerobic fitness is drifting down slowly",
      detail: `VO₂ max has eased from ${fmt(vo2.baseline, vo2.unit)} to ${fmt(vo2.current, vo2.unit)}. A slow steady drift like this is what long missions without enough cardio tend to show, and it is the easiest to turn around early.`,
      confidence: clamp(0.5 + Math.abs(vo2.drift) / 8, 0.5, 0.85),
      systems: ["cardiovascular"],
      evidence: [vo2.sentence],
      ask: "What can I do about my VO₂ max drifting down?",
    });
  }
  const rad = by("radiation");
  if (rad && rad.direction === "worse") {
    patterns.push({
      id: "dose-creep",
      title: "Radiation dose rate is creeping up",
      detail: `The daily dose estimate has risen from ${fmt(rad.baseline, rad.unit)} to ${fmt(rad.current, rad.unit)}. It remains inside the demo usual range; AURA is flagging the direction, not a limit.`,
      confidence: 0.55,
      systems: ["immune"],
      evidence: [rad.sentence],
      ask: "Should I be worried about my radiation dose trend?",
    });
  }
  patterns.sort((a, b) => b.confidence - a.confidence);

  /* Recommendations, ranked by what moves readiness most. */
  const recs: Recommendation[] = [];
  if (sleep && sleep.direction === "worse") {
    recs.push({
      id: "sleep",
      title: "Protect tonight’s sleep window",
      why: `You are about ${sleepDebtHours.toFixed(1)} h under your 7 h 30 m target across the last 14 days, and sleep is the signal moving your reaction time most.`,
      to: "/games/clock",
      cta: "Plan the day around it",
      priority: 1,
    });
  }
  if (pvt && pvt.direction === "worse") {
    recs.push({
      id: "pvt",
      title: "Re-test focus after a proper rest",
      why: "A fresh three-minute PVT tomorrow tells you whether the slowdown is sleep-driven and reversing.",
      to: "/pvt",
      cta: "Open the vigilance test",
      priority: 2,
    });
  }
  if ((hrv && hrv.direction === "worse") || (vo2 && vo2.direction === "worse")) {
    recs.push({
      id: "aerobic",
      title: "Keep today’s session lighter and aerobic",
      why: "With HRV below your range, an easy aerobic block supports recovery better than a hard lower-body session.",
      to: "/exercise",
      cta: "See the plan",
      priority: 2,
    });
  }
  recs.push({
    id: "checkin",
    title: "Add today’s check-in",
    why: "Mood, energy and stress give AURA context the wearable cannot see, so its reading is less likely to be wrong.",
    to: "/checkin",
    cta: "Start check-in",
    priority: 3,
  });

  /* Per-system findings for the 3D body. */
  const systemFindings: Intelligence["systemFindings"] = {};
  for (const sys of Object.keys(SYSTEM_LABEL)) {
    const mine = signals.filter((s) => s.system === sys);
    const worst = [...mine].sort((a, b) => b.drift - a.drift)[0];
    if (!worst) continue;
    const level: StatusLevel = worst.status;
    systemFindings[sys] = {
      level,
      label: SYSTEM_LABEL[sys],
      detail:
        worst.direction === "worse"
          ? worst.sentence
          : `${SYSTEM_LABEL[sys]} signals are steady against your own baseline.`,
    };
  }

  const worstDriver = drivers[0];
  const headline =
    score >= 85
      ? "Steady signals today."
      : worstDriver && worstDriver.points < 0
        ? `${worstDriver.label} is the one to look after.`
        : "A few signals to watch.";
  const nWorse = signals.filter((s) => s.direction === "worse").length;
  const summary = `AURA compared ${signals.length} signals with your own first-week baseline. ${nWorse} ${nWorse === 1 ? "has" : "have"} moved the wrong way${
    patterns[0] ? `, and the strongest pattern is: ${patterns[0].title.toLowerCase()}` : ""
  }.`;

  return {
    readiness: score,
    readinessLabel,
    headline,
    summary,
    drivers,
    signals,
    patterns,
    recommendations: recs.sort((a, b) => a.priority - b.priority),
    systemFindings,
    sleepDebtHours,
    response,
  };
}

/** What happens over the next week if sleep and aerobic time change. */
export function whatIf(intel: Intelligence, input: WhatIfInput): WhatIfResult {
  const r = intel.response;
  const sleep = intel.signals.find((s) => s.id === "sleep");
  const hrvS = intel.signals.find((s) => s.id === "hrv");
  const hrS = intel.signals.find((s) => s.id === "heart-rate");
  const pvtS = intel.signals.find((s) => s.id === "pvt");
  const nothing = sleep?.forecast.at(-1) ?? r.sleepMean;
  const project = (sleepHours: number, aerobic: number) => {
    const pvt = clamp((pvtS?.current ?? r.pvtAtMean) - r.pvtPerSleepHour * (sleepHours - (sleep?.current ?? r.sleepMean)) * 0.6, 200, 330);
    // Aerobic minutes: assumed, small, saturating (not fitted from this person's data).
    const aerobicGain = Math.min(aerobic, 40) / 40;
    const hrv = clamp((hrvS?.current ?? r.hrvAtMean) + r.hrvPerSleepHour * (sleepHours - (sleep?.current ?? r.sleepMean)) * 0.6 + aerobicGain * 3, 25, 75);
    const hr = clamp((hrS?.current ?? 64) - aerobicGain * 1.5 - Math.max(0, sleepHours - 6.5) * 0.4, 52, 80);
    const copy = intel.signals.map((s) => ({ ...s }));
    const set = (id: string, cur: number) => {
      const s = copy.find((x) => x.id === id);
      if (!s) return;
      const spec = SIGNAL_SPECS.find((x) => x.id === id)!;
      const raw = (cur - s.baseline) / s.baselineSpread;
      s.drift = spec.polarity === "high-bad" ? raw : -raw;
    };
    set("pvt", pvt);
    set("hrv", hrv);
    set("heart-rate", hr);
    set("sleep", sleepHours);
    return { readiness: readinessFrom(copy).score, pvt, hrv, hr };
  };
  const chosen = project(input.sleepHours, input.aerobicMinutes);
  const drift = project(clamp(nothing, 4.5, 9), 0);
  const debt = Math.max(0, intel.sleepDebtHours + 7 * Math.max(0, 7.5 - input.sleepHours) - 7 * Math.max(0, input.sleepHours - 7.5) * 0.5);
  return {
    readiness: chosen.readiness,
    readinessIfNothingChanges: drift.readiness,
    pvt: chosen.pvt,
    hrv: chosen.hrv,
    restingHr: chosen.hr,
    sleepDebtHours: debt,
    note:
      "Sleep effects come from the relationship AURA measured in your own 14 days. Aerobic effects are an assumption, kept small. This is an illustration, not a prediction.",
  };
}
