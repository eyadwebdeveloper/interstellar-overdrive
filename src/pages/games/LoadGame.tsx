import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bone,
  Dumbbell,
  Gauge,
  HeartPulse,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, PageHeader, Panel } from "../../components/ui";
import { useAppStore } from "../../stores/appStore";
import { useCrewStore } from "../../stores/crewStore";
import { FadeIn, useMotionAllowed, EASE } from "../../components/motion";
import {
  LOAD_CONFIG,
  LOAD_EVENTS,
  LOAD_INSIGHTS,
  LOAD_REALITY,
} from "../../data/gamesData";
import { Stars } from "./parts";
import "../../styles/games.css";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

interface Metrics {
  bone: number;
  muscle: number;
  fitness: number;
  fatigue: number;
}

interface Allocation {
  resistance: number;
  cardio: number;
  recovery: number;
}

const ZERO_ALLOC: Allocation = { resistance: 0, cardio: 0, recovery: 0 };

const START_METRICS: Metrics = {
  bone: 100,
  muscle: 100,
  fitness: 100,
  fatigue: LOAD_CONFIG.startFatigue,
};

const eventFor = (week: number) => LOAD_EVENTS.find((e) => e.week === week);
const budgetFor = (week: number) => (week === 3 ? 6 : week === 10 ? 8 : LOAD_CONFIG.budget);
const cardioCapFor = (week: number) => (week === 7 ? 2 : LOAD_CONFIG.budget);
const flatFatigueFor = (week: number) => (week === 5 ? 12 : 0);

function applyWeek(metrics: Metrics, alloc: Allocation, week: number): Metrics {
  const { decay, effects, passiveFatigueRelief } = LOAD_CONFIG;
  const fatigueGain =
    flatFatigueFor(week) +
    alloc.resistance * effects.resistance.fatigue +
    alloc.cardio * effects.cardio.fatigue +
    alloc.recovery * effects.recovery.fatigue -
    passiveFatigueRelief;
  const fatigue = clamp(metrics.fatigue + fatigueGain, 0, 100);
  const efficiency =
    fatigue >= LOAD_CONFIG.exhaustedAt
      ? 0.25
      : fatigue >= LOAD_CONFIG.overtrainingAt
        ? 0.5
        : 1;
  return {
    bone: clamp(
      metrics.bone -
        decay.bone +
        (alloc.resistance * effects.resistance.bone +
          alloc.cardio * effects.cardio.bone +
          alloc.recovery * effects.recovery.bone) *
          efficiency,
      0,
      100,
    ),
    muscle: clamp(
      metrics.muscle -
        decay.muscle +
        (alloc.resistance * effects.resistance.muscle +
          alloc.cardio * effects.cardio.muscle +
          alloc.recovery * effects.recovery.muscle) *
          efficiency,
      0,
      100,
    ),
    fitness: clamp(
      metrics.fitness -
        decay.fitness +
        (alloc.resistance * effects.resistance.fitness +
          alloc.cardio * effects.cardio.fitness +
          alloc.recovery * effects.recovery.fitness) *
          efficiency,
      0,
      100,
    ),
    fatigue,
  };
}

function insightFor(alloc: Allocation, before: Metrics, after: Metrics) {
  if (alloc.resistance === 0) return LOAD_INSIGHTS.noResistance;
  if (after.fatigue - before.fatigue >= 20) return LOAD_INSIGHTS.fatigueUp;
  if (alloc.recovery >= 4) return LOAD_INSIGHTS.recovery;
  if (alloc.resistance >= 5) return LOAD_INSIGHTS.resistance;
  return LOAD_INSIGHTS.balanced;
}

const composite = (m: Metrics) =>
  Math.round(m.bone * 0.45 + m.muscle * 0.3 + m.fitness * 0.15 + (100 - m.fatigue) * 0.1);

const starsFor = (score: number) =>
  score >= 93 ? 3 : score >= 86 ? 2 : score >= 78 ? 1 : 0;

const verdictFor = (stars: number) => {
  if (stars === 3) return "Return-ready. Bone, muscle and fitness all held their line.";
  if (stars === 2) return "A workable plan with a soft spot or two — see which bar gave way.";
  if (stars === 1) return "Marginal. The bars know why; take another round and shift the mix.";
  return "The weeks got away — compare with the twin who did nothing, then run it again.";
};

const twinNoCountermeasures: Metrics = {
  bone: clamp(100 - LOAD_CONFIG.weeks * LOAD_CONFIG.decay.bone, 0, 100),
  muscle: clamp(100 - LOAD_CONFIG.weeks * LOAD_CONFIG.decay.muscle, 0, 100),
  fitness: clamp(100 - LOAD_CONFIG.weeks * LOAD_CONFIG.decay.fitness, 0, 100),
  fatigue: 0,
};

const ACTIVITIES = [
  {
    key: "resistance" as const,
    name: "Resistance",
    icon: Dumbbell,
    blurb:
      "Squats, deadlifts, presses. The loading signal bone and muscle actually answer to.",
  },
  {
    key: "cardio" as const,
    name: "Cardio",
    icon: HeartPulse,
    blurb:
      "Cycle and treadmill. Heart, vessels and work capacity — weak for bone, vital for return.",
  },
  {
    key: "recovery" as const,
    name: "Recovery",
    icon: Gauge,
    blurb:
      "Sleep, meals, downtime. Quietly lowers fatigue; gains only count if the body absorbs them.",
  },
];

export default function LoadGame() {
  const member = useCrewStore((s) => s.getActiveMember());
  const results = useAppStore((s) => s.gameResults);
  const saveGameResult = useAppStore((s) => s.saveGameResult);
  const motionOk = useMotionAllowed();
  const [week, setWeek] = useState(1);
  const [metrics, setMetrics] = useState<Metrics>(START_METRICS);
  const [alloc, setAlloc] = useState<Allocation>(ZERO_ALLOC);
  const [insight, setInsight] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const saved = useRef(false);

  const budget = budgetFor(week);
  const cardioCap = cardioCapFor(week);
  const event = eventFor(week);
  const used = alloc.resistance + alloc.cardio + alloc.recovery;

  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    const score = composite(metrics);
    const stars = starsFor(score);
    saveGameResult({
      crewId: member.id,
      gameId: "load",
      score,
      maxScore: 100,
      stars,
      summary: `Bone ${Math.round(metrics.bone)} · muscle ${Math.round(
        metrics.muscle,
      )} · fatigue ${Math.round(metrics.fatigue)}`,
    });
  }, [finished, member.id, metrics, saveGameResult]);

  const step = (key: keyof Allocation, delta: number) => {
    setAlloc((current) => {
      const cap = key === "cardio" ? cardioCap : LOAD_CONFIG.budget;
      const next = clamp(current[key] + delta, 0, cap);
      const total = current.resistance + current.cardio + current.recovery;
      if (delta > 0 && total >= budget) return current;
      return { ...current, [key]: next };
    });
  };

  const lockWeek = () => {
    const after = applyWeek(metrics, alloc, week);
    setInsight(insightFor(alloc, metrics, after));
    setMetrics(after);
    if (week >= LOAD_CONFIG.weeks) {
      setFinished(true);
    } else {
      setWeek((n) => n + 1);
      setAlloc(ZERO_ALLOC);
    }
  };

  const restart = () => {
    saved.current = false;
    setWeek(1);
    setMetrics(START_METRICS);
    setAlloc(ZERO_ALLOC);
    setInsight(null);
    setFinished(false);
  };

  const pastRuns = results.filter(
    (r) => r.crewId === member.id && r.gameId === "load",
  );
  const best = pastRuns.reduce((top, r) => Math.max(top, r.score), 0);
  const score = finished ? composite(metrics) : 0;
  const stars = starsFor(score);

  const metricRows = [
    {
      key: "bone" as const,
      label: LOAD_CONFIG.labels.bone,
      value: metrics.bone,
      icon: <Bone size={15} aria-hidden="true" />,
    },
    {
      key: "muscle" as const,
      label: LOAD_CONFIG.labels.muscle,
      value: metrics.muscle,
      icon: <Dumbbell size={15} aria-hidden="true" />,
    },
    {
      key: "fitness" as const,
      label: LOAD_CONFIG.labels.fitness,
      value: metrics.fitness,
      icon: <HeartPulse size={15} aria-hidden="true" />,
    },
    {
      key: "fatigue" as const,
      label: LOAD_CONFIG.labels.fatigue,
      value: metrics.fatigue,
      icon: <Gauge size={15} aria-hidden="true" />,
    },
  ];

  return (
    <div className="page games-page load">
      <PageHeader
        eyebrow="Training room · Countermeasures"
        title="Load bearing"
        description="Twelve mission weeks, a tight budget of crew time. Split it between resistance work, cardio and recovery — and watch what unloading does when you don't."
        actions={
          <Link to="/games" className="button ghost small">
            <ArrowLeft size={15} /> Training room
          </Link>
        }
      />
      <div className="games-topbar">
        <div className="row">
          <Badge tone="info" dot>
            12 weeks · turn-based
          </Badge>
          <Badge>5 minutes</Badge>
        </div>
        {pastRuns.length > 0 && (
          <span className="game-card-best">
            <Stars value={starsFor(best)} /> Best {best}
          </span>
        )}
      </div>
      <div className="game-layout">
        <Panel
          className="load"
          title={finished ? "Mission block complete" : `Week ${week} — planning`}
          subtitle={
            finished
              ? "How the twelve weeks added up"
              : `Allocate the week's crew time · ${budget} units available`
          }
        >
          {!finished ? (
            <>
              <div className="load-metrics">
                {metricRows.map((row) => (
                  <div
                    key={row.key}
                    className={`load-metric ${row.key === "fatigue" ? "fatigue" : ""} ${
                      row.key === "fatigue" && metrics.fatigue >= LOAD_CONFIG.exhaustedAt
                        ? "critical"
                        : row.key === "fatigue" && metrics.fatigue >= LOAD_CONFIG.overtrainingAt
                          ? "hot"
                          : row.key !== "fatigue" && metrics[row.key] < 85
                            ? "low"
                            : row.key !== "fatigue" && metrics[row.key] < 78
                              ? "very-low"
                              : ""
                    }`}
                  >
                    <div className="load-metric-head">
                      <span>{row.label}</span>
                      {row.key === "fatigue" ? (
                        <strong>{Math.round(row.value)}</strong>
                      ) : (
                        <strong>
                          {Math.round(row.value)}
                          <small> /100</small>
                        </strong>
                      )}
                    </div>
                    <div
                      className="load-bar"
                      role="progressbar"
                      aria-label={`${row.label}: ${Math.round(row.value)} of 100`}
                      aria-valuenow={Math.round(row.value)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <i style={{ width: `${clamp(row.value, 0, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="load-week-strip" aria-label="Mission week progress">
                {Array.from({ length: LOAD_CONFIG.weeks }, (_, i) => (
                  <span
                    key={i}
                    className={`load-dot ${i + 1 < week ? "done" : ""} ${
                      i + 1 === week ? "current" : ""
                    }`}
                  />
                ))}
                <span className="load-week-label">
                  Week {week} of {LOAD_CONFIG.weeks}
                </span>
              </div>
              <AnimatePresence initial={false}>
                {event && (
                  <motion.div
                    className="load-event"
                    key={event.week}
                    role="status"
                    initial={motionOk ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={motionOk ? { opacity: 0, y: -8 } : undefined}
                    transition={
                      motionOk ? { duration: 0.28, ease: EASE } : { duration: 0 }
                    }
                  >
                    <Lightbulb size={17} aria-hidden="true" />
                    <div>
                      <strong>Mission event · {event.title}</strong>
                      <p>{event.note}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="load-alloc">
                {ACTIVITIES.map((activity) => (
                  <div
                    key={activity.key}
                    className={`load-activity ${
                      activity.key === "cardio" && cardioCap < LOAD_CONFIG.budget
                        ? "limited"
                        : ""
                    }`}
                  >
                    <div className="load-activity-head">
                      <activity.icon size={19} />
                      <strong>{activity.name}</strong>
                    </div>
                    <p>{activity.blurb}</p>
                    <div className="load-stepper">
                      <motion.button
                        type="button"
                        aria-label={`Remove one unit from ${activity.name}`}
                        onClick={() => step(activity.key, -1)}
                        disabled={alloc[activity.key] === 0}
                        whileTap={motionOk ? { scale: 0.88 } : undefined}
                      >
                        –
                      </motion.button>
                      <motion.span
                        className="load-stepper-value"
                        key={`${activity.key}-${alloc[activity.key]}`}
                        initial={motionOk ? { opacity: 0, y: 5 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={
                          motionOk ? { duration: 0.16, ease: EASE } : { duration: 0 }
                        }
                      >
                        {alloc[activity.key]}
                        <small>units</small>
                      </motion.span>
                      <motion.button
                        type="button"
                        aria-label={`Add one unit to ${activity.name}`}
                        onClick={() => step(activity.key, 1)}
                        disabled={
                          used >= budget ||
                          (activity.key === "cardio" &&
                            alloc.cardio >= cardioCap)
                        }
                        whileTap={motionOk ? { scale: 0.88 } : undefined}
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="load-budget">
                <span className="load-budget-strong">
                  {used} of {budget} units placed
                </span>
                <div className="load-budget-bar">
                  <i style={{ width: `${(used / budget) * 100}%` }} />
                </div>
                <span className="small-text muted">
                  Unspent units do nothing — recovery is a choice, not a leftover.
                </span>
              </div>
              <div className="load-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={lockWeek}
                >
                  Lock week {week}
                </button>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {insight && (
                  <motion.p
                    className="load-insight"
                    key={insight}
                    role="status"
                    aria-live="polite"
                    initial={motionOk ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    exit={motionOk ? { opacity: 0, y: -8 } : undefined}
                    transition={
                      motionOk ? { duration: 0.26, ease: EASE } : { duration: 0 }
                    }
                  >
                    <Lightbulb size={16} aria-hidden="true" />
                    <span>{insight}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="games-result">
              <span className="eyebrow-result">
                Twelve weeks complete · {member.name}
              </span>
              <h2>{verdictFor(stars)}</h2>
              <Stars value={stars} />
              <p>
                Composite {score} of 100 — bone {Math.round(metrics.bone)},
                muscle {Math.round(metrics.muscle)}, fitness{" "}
                {Math.round(metrics.fitness)}, fatigue{" "}
                {Math.round(metrics.fatigue)}.
              </p>
              <div className="games-result-actions">
                <button
                  type="button"
                  className="button primary"
                  onClick={restart}
                >
                  <RotateCcw size={16} /> Run it again
                </button>
                <Link to="/games/clock" className="button secondary">
                  Next: Keep the clock
                </Link>
              </div>
            </div>
          )}
          {finished && (
            <>
              <FadeIn delay={0.14}>
              <div className="load-compare" aria-label="Your result versus doing nothing">
                {(
                  [
                    ["bone", LOAD_CONFIG.labels.bone],
                    ["muscle", LOAD_CONFIG.labels.muscle],
                    ["fitness", LOAD_CONFIG.labels.fitness],
                  ] as const
                ).map(([key, label]) => (
                  <div className="load-compare-row" key={key}>
                    <div>
                      <span>{label}</span>
                      <span>
                        you {Math.round(metrics[key])} · couch{" "}
                        {Math.round(twinNoCountermeasures[key])}
                      </span>
                    </div>
                    <div className="load-bar">
                      <i style={{ width: `${metrics[key]}%` }} />
                    </div>
                    <div className="load-bar ghost">
                      <i style={{ width: `${twinNoCountermeasures[key]}%` }} />
                    </div>
                  </div>
                ))}
                <div className="load-compare-legend">
                  <span>
                    <i /> Your twelve weeks
                  </span>
                  <span className="ghost-key">
                    <i /> No countermeasures at all
                  </span>
                </div>
              </div>
              <p className="load-summary-real">{LOAD_REALITY}</p>
              </FadeIn>
            </>
          )}
        </Panel>
        <aside className="game-side">
          <Panel title="The rules, briefly" subtitle="Illustrative model">
            <p className="small-text muted" style={{ lineHeight: 1.6 }}>
              Every week, unloading costs a little bone, muscle and fitness.
              Resistance answers bone loudest; cardio protects heart and
              vessels; recovery clears fatigue. Train past{" "}
              {LOAD_CONFIG.overtrainingAt} fatigue and every gain lands at half
              effect — past {LOAD_CONFIG.exhaustedAt}, a quarter. Mission events
              will not always give you a full budget.
            </p>
          </Panel>
          <Panel title="Recent blocks" subtitle="This crew member only">
            {pastRuns.length ? (
              <div className="clock-log">
                {pastRuns.slice(0, 4).map((r) => (
                  <div className="clock-log-row" key={r.id}>
                    <Dumbbell size={15} aria-hidden="true" />
                    <strong>
                      {new Date(r.at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                    <span className="clock-log-points">{r.score} pts</span>
                    <Stars value={r.stars} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small-text">
                No finished blocks yet — a completed twelve weeks saves here.
              </p>
            )}
          </Panel>
          <div className="games-quiet">
            <Bone size={17} />
            <p>
              This planner compresses real physiology into a playable round:
              bone, muscle and heart all decondition without loading, and the
              mix you keep across weeks is the countermeasure. The summary
              quotes the real rates.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
