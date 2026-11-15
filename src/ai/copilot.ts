/**
 * AURA Copilot.
 *
 * Two answer paths, one interface:
 *   - live:      POST /api/copilot (serverless function that calls Claude with the
 *                API key kept server-side). Used only when the function reports it
 *                is configured.
 *   - on-device: a grounded answer built from the AURA analysis engine. Always
 *                available, works offline, never invents numbers.
 *
 * Both paths receive the same compact context, so answers cite the same readings.
 */
import { analyse, formatSignal, whatIf, type Intelligence } from "./engine";
import { getSimulatedVitals } from "../data/vitalsData";

export interface CopilotAction {
  label: string;
  to: string;
}

export interface CopilotAnswer {
  text: string;
  evidence: string[];
  actions: CopilotAction[];
  followUps: string[];
}

export interface CopilotContext {
  crewName: string;
  role: string;
  missionDay: number;
  openOfficialAlerts: number;
  recentCheckin?: { mood: number; energy: number; stress: number; sleepMinutes: number } | null;
  backend: "live" | "fallback" | "loading";
  riskBand?: string;
  intel: Intelligence;
}

export const SUGGESTED_PROMPTS = [
  "How am I doing today?",
  "Why is my reaction time slower?",
  "What should I do before tonight?",
  "What happens if I sleep 8 hours all week?",
  "Show me what AURA is watching",
  "How does AURA work?",
];

/* ─────────────────────────────── remote status ────────────────────────────── */

const ENDPOINT = import.meta.env.VITE_COPILOT_ENDPOINT ?? "/api/copilot";
export type RemoteStatus = "unknown" | "live" | "off";
let remoteStatus: RemoteStatus = "unknown";
let probe: Promise<RemoteStatus> | null = null;

/** Ask the serverless function whether a model key is configured. Cached for the session. */
export function probeRemote(): Promise<RemoteStatus> {
  if (remoteStatus !== "unknown") return Promise.resolve(remoteStatus);
  probe ??= (async () => {
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(ENDPOINT, { signal: ctrl.signal, headers: { Accept: "application/json" } });
      window.clearTimeout(timer);
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.includes("json")) return (remoteStatus = "off");
      const body = (await res.json()) as { configured?: boolean };
      return (remoteStatus = body.configured ? "live" : "off");
    } catch {
      return (remoteStatus = "off");
    }
  })();
  return probe;
}
export const getRemoteStatus = () => remoteStatus;

/* ───────────────────────────────── context ────────────────────────────────── */

/** Compact, number-only context sent to the model and used by the local engine. */
export function serialiseContext(ctx: CopilotContext) {
  const { intel } = ctx;
  return {
    person: { name: ctx.crewName, role: ctx.role, missionDay: ctx.missionDay },
    simulated: true,
    readiness: { score: intel.readiness, label: intel.readinessLabel, drivers: intel.drivers.slice(0, 4) },
    signals: intel.signals.map((s) => ({
      signal: s.label,
      unit: s.unit,
      baseline: +s.baseline.toFixed(2),
      current: +s.current.toFixed(2),
      driftInBaselineSpreads: +s.drift.toFixed(2),
      direction: s.direction,
      slopePerDay: +s.slope.toFixed(3),
      forecastIn7Days: +s.forecast[6].toFixed(2),
      daysToLeaveUsualRange: s.daysToEdge,
      last14Days: s.history,
    })),
    patterns: intel.patterns.map((p) => ({ title: p.title, confidence: +p.confidence.toFixed(2), detail: p.detail })),
    sleepDebtHoursLast14Days: +intel.sleepDebtHours.toFixed(1),
    personalResponse: {
      reactionMsSlowerPerSleepHourLost: +intel.response.pvtPerSleepHour.toFixed(1),
      hrvMsPerSleepHour: +intel.response.hrvPerSleepHour.toFixed(1),
    },
    officialAlertsOpen: ctx.openOfficialAlerts,
    latestCheckin: ctx.recentCheckin ?? null,
    modelBackend: ctx.backend,
    riskBand: ctx.riskBand ?? null,
  };
}

export function buildContext(partial: Omit<CopilotContext, "intel"> & { intel?: Intelligence }): CopilotContext {
  return { ...partial, intel: partial.intel ?? analyse(getSimulatedVitals()) };
}

/* ───────────────────────────── on-device answers ──────────────────────────── */

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

const EMERGENCY = [
  "chest pain", "can't breathe", "cannot breathe", "not breathing", "unconscious", "bleeding", "stroke", "seizure",
  "overdose", "suicid", "kill myself", "faint", "collapsed", "emergency", "severe pain", "choking", "heart attack",
];

function signal(intel: Intelligence, id: string) {
  return intel.signals.find((s) => s.id === id);
}

export function answerLocally(question: string, ctx: CopilotContext): CopilotAnswer {
  const q = question.toLowerCase();
  const { intel } = ctx;
  const first = ctx.crewName.split(" ").pop() ?? "there";

  if (EMERGENCY.some((w) => q.includes(w))) {
    return {
      text:
        "This sounds like it could be urgent. I can’t assess an emergency and I’m not a clinician. Please follow your official emergency procedures and alert your crew medical officer now.\n\nThe Medical event workflow can help you document what is happening while you get help. In this prototype nothing is transmitted to anyone.",
      evidence: [],
      actions: [{ label: "Open medical event", to: "/medical-event" }],
      followUps: [],
    };
  }

  const sleep = signal(intel, "sleep");
  const hrv = signal(intel, "hrv");
  const hr = signal(intel, "heart-rate");
  const pvt = signal(intel, "pvt");
  const vo2 = signal(intel, "vo2max");
  const rad = signal(intel, "radiation");
  const evidenceFor = (...xs: (typeof sleep)[]) =>
    xs.filter(Boolean).map((s) => `${s!.label}: ${formatSignal(s!.current, s!.unit)} now vs ${formatSignal(s!.baseline, s!.unit)} baseline`);

  /* How does AURA work / is this AI? */
  if (has(q, "how does aura", "how do you work", "how does this work", "what is aura", "are you ai", "what model", "who are you", "how do you know")) {
    return {
      text:
        `I’m AURA’s copilot. Three layers sit under me, and they are kept strictly apart:\n\n- **Rules (Tier 0)** are fixed, transparent thresholds. Only they can raise an official alert.\n- **Patterns (Tier 1)** compare each signal with *your own* first-week baseline and look for signals moving together.\n- **Forecast and risk (Tier 2)** project the next 7 days with an uncertainty band${ctx.backend === "live" ? " and use the connected backend model" : ""}.\n\nI explain what those layers found, using the numbers on screen. I don’t diagnose, I don’t create alerts, and every reading here is simulated.`,
      evidence: [`Analysing ${intel.signals.length} signals against personal baselines`],
      actions: [{ label: "See how AURA thinks", to: "/intelligence" }],
      followUps: ["How am I doing today?", "What is a personal baseline?"],
    };
  }
  if (has(q, "baseline")) {
    return {
      text:
        "A personal baseline is *your own* normal, not a population average. AURA takes the median of your first week of readings and the typical wobble around it. A reading is “drifting” when it moves several of those wobbles away, which is why 6 h of sleep can matter for you and not for someone else.",
      evidence: sleep ? evidenceFor(sleep) : [],
      actions: [{ label: "Open the signals table", to: "/intelligence" }],
      followUps: ["How am I doing today?"],
    };
  }

  /* What if / simulate */
  if (has(q, "what if", "if i sleep", "simulate", "sleep 8", "sleep 7", "sleep more", "what happens if")) {
    const m = q.match(/(\d(?:\.\d)?)\s*(?:h|hours?|hrs?)/);
    const hours = m ? Math.min(9, Math.max(5, Number(m[1]))) : 8;
    const r = whatIf(intel, { sleepHours: hours, aerobicMinutes: 0 });
    return {
      text:
        `If you average **${hours} h** of sleep for the next week, AURA estimates readiness could move from **${r.readinessIfNothingChanges}** (if nothing changes) to about **${r.readiness}**. Reaction time would be near ${Math.round(r.pvt)} ms and HRV near ${Math.round(r.hrv)} ms.\n\nThe sleep effect comes from how *your* reaction time and HRV moved with sleep over the last 14 days. It’s an illustration, not a prediction.`,
      evidence: [
        `Personal fit: about ${Math.abs(intel.response.pvtPerSleepHour).toFixed(0)} ms slower reaction per hour of sleep lost (r = ${intel.response.pvtR.toFixed(2)})`,
      ],
      actions: [{ label: "Try the what-if simulator", to: "/intelligence#what-if" }],
      followUps: ["What should I do before tonight?"],
    };
  }

  /* Sleep */
  if (has(q, "sleep", "tired", "rest", "insomnia", "bed")) {
    const debt = intel.sleepDebtHours.toFixed(1);
    return {
      text:
        `${first}, your sleep is ${sleep && sleep.direction === "worse" ? "the signal to look after first" : "steady"}. ${sleep?.sentence ?? ""}\n\nOver 14 days you’re about **${debt} h** under a 7 h 30 m target. Reaction time has tracked it (r = ${intel.response.pvtR.toFixed(2)}), so recovering sleep is the highest-leverage change available.`,
      evidence: evidenceFor(sleep, pvt),
      actions: [
        { label: "Plan the day around sleep", to: "/games/clock" },
        { label: "Log a check-in", to: "/checkin" },
      ],
      followUps: ["What happens if I sleep 8 hours all week?", "Why is my reaction time slower?"],
    };
  }

  /* Focus / PVT */
  if (has(q, "reaction", "pvt", "focus", "alert", "attention", "slow")) {
    return {
      text:
        `${pvt?.sentence ?? ""}\n\n${intel.patterns.find((p) => p.id === "sleep-focus")?.detail ?? "Reaction time varies with sleep, workload and time of day."}\n\nA fresh three-minute test after a proper rest is the cleanest way to see whether this is reversing.`,
      evidence: evidenceFor(pvt, sleep),
      actions: [{ label: "Take the vigilance test", to: "/pvt" }],
      followUps: ["What happens if I sleep 8 hours all week?"],
    };
  }

  /* Heart / HRV */
  if (has(q, "heart", "hrv", "pulse", "cardio", "vo2", "fitness")) {
    return {
      text:
        `${hr?.sentence ?? ""} ${hrv?.sentence ?? ""} ${vo2?.sentence ?? ""}\n\n${ctx.riskBand && ctx.riskBand !== "none" ? `The Tier 2 risk model also reports an **${ctx.riskBand}** deconditioning pattern. ` : ""}These are advisory patterns in simulated data. They can’t create an official alert, and none of this is a diagnosis.`,
      evidence: evidenceFor(hr, hrv, vo2),
      actions: [
        { label: "Open cardiovascular system", to: "/system/cardiovascular" },
        { label: "See it on the 3D body", to: "/body" },
      ],
      followUps: ["What should I do before tonight?"],
    };
  }

  /* Radiation */
  if (has(q, "radiation", "dose", "msv", "solar")) {
    return {
      text:
        `${rad?.sentence ?? ""}\n\nIt is still inside the demo usual range. AURA is highlighting the direction of travel, not crossing a limit. Official radiation alerts come from Tier 0 rules, not from me.`,
      evidence: evidenceFor(rad),
      actions: [{ label: "Open metrics", to: "/dashboard" }],
      followUps: ["How am I doing today?"],
    };
  }

  /* Exercise */
  if (has(q, "exercise", "workout", "train", "session", "gym", "run", "lift")) {
    const eased = hrv?.direction === "worse";
    return {
      text:
        `${eased ? "With HRV below your range, an easier aerobic block will support recovery better than a hard session today." : "Your recovery signals are steady, so today’s planned session looks reasonable."} Resistance work protects bone and muscle on orbit, so the aim is to keep it going, not skip it.\n\n${vo2?.sentence ?? ""}`,
      evidence: evidenceFor(hrv, vo2),
      actions: [{ label: "Open exercise plan", to: "/exercise" }],
      followUps: ["What happens if I sleep 8 hours all week?"],
    };
  }

  /* Body / 3D */
  if (has(q, "body", "3d", "anatomy", "show me where", "organ")) {
    const worst = Object.entries(intel.systemFindings).sort((a, b) => (a[1].level === "normal" ? 1 : 0) - (b[1].level === "normal" ? 1 : 0))[0];
    return {
      text:
        `The body view lights the systems AURA is watching. Right now **${worst ? worst[1].label : "no system"}** carries the main finding: ${worst?.[1].detail ?? ""}\n\nOn the full atlas you can orbit, zoom and tap any structure to bring its system forward.`,
      evidence: [],
      actions: [
        { label: "Open the 3D body", to: "/body" },
        { label: "AI findings on the body", to: "/intelligence#body" },
      ],
      followUps: ["How am I doing today?"],
    };
  }

  /* Forecast */
  if (has(q, "forecast", "next week", "predict", "trend", "heading", "future", "will my")) {
    const lines = intel.signals
      .filter((s) => ["sleep", "hrv", "heart-rate", "pvt"].includes(s.id))
      .map((s) => `- **${s.label}:** ${formatSignal(s.forecast[6], s.unit)} in 7 days (± ${formatSignal(s.band[6], s.unit)})`);
    return {
      text: `If today’s trends simply continue, AURA expects:\n\n${lines.join("\n")}\n\nThe band is an empirical spread, not a calibrated interval. Change the inputs in the simulator to see what shifts it.`,
      evidence: [],
      actions: [{ label: "Open forecasts", to: "/intelligence#signals" }],
      followUps: ["What happens if I sleep 8 hours all week?"],
    };
  }

  /* Alerts / watching */
  if (has(q, "alert", "watching", "notice", "warning", "rule", "pattern", "flag")) {
    const patterns = intel.patterns.slice(0, 3).map((p) => `- **${p.title}** (${Math.round(p.confidence * 100)}% support)`);
    return {
      text:
        `${ctx.openOfficialAlerts ? `There ${ctx.openOfficialAlerts === 1 ? "is" : "are"} **${ctx.openOfficialAlerts} official alert${ctx.openOfficialAlerts === 1 ? "" : "s"}** waiting for review. Those come from fixed rules and are separate from anything I say.\n\n` : "No official rule alerts are open.\n\n"}AURA’s advisory patterns right now:\n\n${patterns.join("\n") || "- Nothing unusual against your baseline."}`,
      evidence: [],
      actions: [{ label: "Review alerts", to: "/alerts" }, { label: "Open patterns", to: "/intelligence#patterns" }],
      followUps: ["Why is my reaction time slower?"],
    };
  }

  /* What to do */
  if (has(q, "what should i", "recommend", "advice", "tonight", "today", "plan", "do now", "next step", "help me")) {
    const recs = intel.recommendations.slice(0, 3);
    return {
      text: `Here is what would help most, in order:\n\n${recs.map((r, i) => `${i + 1}. **${r.title}.** ${r.why}`).join("\n")}`,
      evidence: [`Readiness ${intel.readiness}/100 · ${intel.readinessLabel}`],
      actions: recs.slice(0, 3).map((r) => ({ label: r.cta, to: r.to })),
      followUps: ["What happens if I sleep 8 hours all week?", "Show me what AURA is watching"],
    };
  }

  /* Check-in context */
  if (has(q, "mood", "stress", "energy", "check-in", "checkin", "feel")) {
    const c = ctx.recentCheckin;
    return {
      text: c
        ? `Your latest check-in: mood ${c.mood}/5, energy ${c.energy}/5, stress ${c.stress}/5 and about ${Math.round(c.sleepMinutes / 60 * 10) / 10} h of sleep. ${c.energy <= 2 && sleep?.direction === "worse" ? "Low energy alongside short sleep fits the recovery pattern AURA sees in the wearable data." : "That sits alongside the wearable readings above rather than replacing them."}`
        : "I don’t have a check-in from you yet today. A one-minute check-in gives AURA mood, energy and stress, which the wearable can’t measure.",
      evidence: [],
      actions: [{ label: c ? "View check-ins" : "Start check-in", to: "/checkin" }],
      followUps: ["How am I doing today?"],
    };
  }

  /* Default: overview, always grounded. */
  const top = intel.drivers.filter((d) => d.points < 0).slice(0, 3);
  return {
    text:
      `${first}, your readiness is **${intel.readiness}/100 · ${intel.readinessLabel}**. ${intel.summary}\n\n${top.length ? `What’s costing you most: ${top.map((d) => `**${d.label}** (${d.points} pts)`).join(", ")}.` : "Nothing is pulling readiness down."}\n\n${intel.recommendations[0] ? `Best next step: **${intel.recommendations[0].title}.**` : ""}`,
    evidence: [`${intel.signals.length} signals vs your own first-week baseline`, `Sleep debt ≈ ${intel.sleepDebtHours.toFixed(1)} h over 14 days`],
    actions: [{ label: "Open AURA Intelligence", to: "/intelligence" }],
    followUps: ["Why is my reaction time slower?", "What should I do before tonight?", "How does AURA work?"],
  };
}

/* ───────────────────────────────── streaming ──────────────────────────────── */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Streams plain-text deltas from the live endpoint. Throws on any failure so the
 * caller can fall back to the on-device engine.
 */
export async function askLive(
  turns: ChatTurn[],
  ctx: CopilotContext,
  onDelta: (text: string) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: turns.slice(-10), context: serialiseContext(ctx) }),
  });
  if (!res.ok || !res.body) throw new Error(`Copilot endpoint answered ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let got = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) {
      got = true;
      onDelta(chunk);
    }
  }
  if (!got) throw new Error("Empty answer");
}

/** Types an on-device answer out so it reads like a live response. */
export async function typeOut(text: string, onDelta: (t: string) => void, signal: AbortSignal, fast = false) {
  const parts = text.match(/\S+\s*/g) ?? [text];
  // Aim for about two seconds however long the answer is, so long answers never drag.
  const delay = fast ? 0 : Math.min(26, Math.max(6, 2000 / parts.length));
  for (let i = 0; i < parts.length; i++) {
    if (signal.aborted) return;
    onDelta(parts[i]);
    await new Promise((r) => window.setTimeout(r, delay * (0.7 + Math.random() * 0.6)));
  }
}
