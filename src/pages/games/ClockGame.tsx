import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Coffee,
  Dumbbell,
  Lamp,
  Moon,
  RotateCcw,
  Sun,
  TriangleAlert,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, PageHeader, Panel } from "../../components/ui";
import { useAppStore } from "../../stores/appStore";
import { useCrewStore } from "../../stores/crewStore";
import { FadeIn, useMotionAllowed, EASE } from "../../components/motion";
import { CLOCK_FACT, CLOCK_MAX, CLOCK_STEPS } from "../../data/gamesData";
import { Stars } from "./parts";
import "../../styles/games.css";

const CHIP_ICONS: Record<string, LucideIcon> = {
  "wake-light": Sun,
  caffeine: Coffee,
  training: Dumbbell,
  meals: UtensilsCrossed,
  "ops-drift": TriangleAlert,
  "evening-light": Lamp,
  "sleep-window": Moon,
};

const CHIP_LABELS: Record<string, string> = {
  "wake-light": "Light",
  caffeine: "Caffeine",
  training: "Training",
  meals: "Meals",
  "ops-drift": "Late EVA",
  "evening-light": "Wind-down",
  "sleep-window": "Sleep",
};

const toHours = (at: string) => {
  const [h, m] = at.split(":").map(Number);
  return h + (m || 0) / 60;
};

const polar = (hours: number, radius: number): [number, number] => {
  const angle = ((hours / 24) * 360 - 90) * (Math.PI / 180);
  return [130 + radius * Math.cos(angle), 130 + radius * Math.sin(angle)];
};

const arcPath = (fromHours: number, toHours: number, radius: number) => {
  const [x1, y1] = polar(fromHours, radius);
  const [x2, y2] = polar(toHours, radius);
  const large = toHours - fromHours > 12 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
};

const chipStyle = (at: string): { left: string; top: string } => {
  const hours = toHours(at);
  const angle = ((hours / 24) * 360 - 90) * (Math.PI / 180);
  return {
    left: `${50 + 39 * Math.cos(angle)}%`,
    top: `${50 + 39 * Math.sin(angle)}%`,
  };
};

const isNight = (at: string) => {
  const h = toHours(at);
  return h >= 20.5 || h <= 6.5;
};

export default function ClockGame() {
  const member = useCrewStore((s) => s.getActiveMember());
  const results = useAppStore((s) => s.gameResults);
  const saveGameResult = useAppStore((s) => s.saveGameResult);
  const motionOk = useMotionAllowed();
  const [stepIndex, setStepIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const saved = useRef(false);

  const totalSteps = CLOCK_STEPS.length;
  const step = stepIndex < totalSteps ? CLOCK_STEPS[stepIndex] : null;
  const finished = stepIndex >= totalSteps;
  const chosenCount = Object.keys(choices).length;
  const points = CLOCK_STEPS.reduce(
    (sum, s) => sum + (choices[s.id] !== undefined ? s.options[choices[s.id]].points : 0),
    0,
  );
  const alignment = Math.round(
    Math.max(0, Math.min(100, (points / CLOCK_MAX) * 100)),
  );
  const stars = alignment >= 85 ? 3 : alignment >= 65 ? 2 : alignment >= 45 ? 1 : 0;
  const verdict =
    alignment >= 85
      ? "Anchored. The clock knows exactly where it stands."
      : alignment >= 65
        ? "Drifting, not wrecked — most anchors held."
        : "Unmoored. The day and the clock disagree.";

  useEffect(() => {
    if (!finished || saved.current) return;
    saved.current = true;
    saveGameResult({
      crewId: member.id,
      gameId: "clock",
      score: alignment,
      maxScore: 100,
      stars,
      summary: `${points} of ${CLOCK_MAX} rhythm points`,
    });
  }, [finished, member.id, alignment, points, saveGameResult, stars]);

  const choose = (optionIndex: number) => {
    if (!step) return;
    setChoices((current) => ({ ...current, [step.id]: optionIndex }));
  };

  const next = () => setStepIndex((n) => n + 1);

  const restart = () => {
    saved.current = false;
    setStepIndex(0);
    setChoices({});
  };

  const melatoninPath = useMemo(() => {
    const p = Math.max(0, Math.min(1, points / CLOCK_MAX));
    const center = 3.5 + (1 - p) * 2.2;
    const sigma = 1.7 + (1 - p) * 3.4;
    const amp = 0.32 + 0.66 * p;
    const pointsList: string[] = [];
    for (let i = 0; i <= 48; i += 1) {
      const t = (i / 48) * 24;
      const value =
        amp * Math.exp(-((t - center) ** 2) / (2 * sigma * sigma));
      const x = 22 + (t / 24) * 256;
      const y = 72 - value * 56;
      pointsList.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pointsList.join(" ");
  }, [points]);

  const pastRuns = results.filter(
    (r) => r.crewId === member.id && r.gameId === "clock",
  );
  const best = pastRuns.reduce((top, r) => Math.max(top, r.score), 0);

  return (
    <div className="page games-page clock">
      <PageHeader
        eyebrow="Training room · Sleep & rhythm"
        title="Keep the clock"
        description="One day in orbit, seven decisions. Light, caffeine, meals and sleep either hold the body clock together or pull it apart — watch the dial as you choose."
        actions={
          <Link to="/games" className="button ghost small">
            <ArrowLeft size={15} /> Training room
          </Link>
        }
      />
      <div className="games-topbar">
        <div className="row">
          <Badge tone="info" dot>
            {totalSteps} decisions
          </Badge>
          <Badge>3 minutes</Badge>
        </div>
        {pastRuns.length > 0 && (
          <span className="game-card-best">
            <Stars value={best >= 85 ? 3 : best >= 65 ? 2 : best >= 45 ? 1 : 0} />{" "}
            Best {best}%
          </span>
        )}
      </div>
      <div className="game-layout">
        <Panel
          className="clock"
          title={finished ? "The day you built" : "Your day on the dial"}
          subtitle={
            finished
              ? `${alignment}% rhythm alignment`
              : `Decision ${Math.min(stepIndex + 1, totalSteps)} of ${totalSteps}`
          }
        >
          <div className="clock-layout">
            <div className="clock-dial-wrap">
              <div className="clock-dial">
                <svg viewBox="0 0 260 260" aria-hidden="true">
                  <circle
                    cx="130"
                    cy="130"
                    r="104"
                    fill="none"
                    stroke="#e5e9e1"
                    strokeWidth="1"
                  />
                  <path
                    d={arcPath(6.5, 21, 96)}
                    fill="none"
                    stroke="#cbe7d3"
                    strokeWidth="13"
                    strokeLinecap="round"
                  />
                  <path
                    d={arcPath(21, 30.5, 96)}
                    fill="none"
                    stroke="#dde3ef"
                    strokeWidth="13"
                    strokeLinecap="round"
                  />
                  {[0, 6, 12, 18].map((h) => {
                    const [tx, ty] = polar(h, 118);
                    return (
                      <text
                        key={h}
                        x={tx}
                        y={ty + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#6d7973"
                      >
                        {String(h).padStart(2, "0")}
                      </text>
                    );
                  })}
                </svg>
                {CLOCK_STEPS.filter(
                  (s) => choices[s.id] !== undefined,
                ).map((s) => {
                  const option = s.options[choices[s.id]];
                  const at = option.chipAt || s.at;
                  const Icon = CHIP_ICONS[s.id];
                  return (
                    <span
                      key={s.id}
                      className={`clock-chip ${isNight(at) ? "night" : ""}`}
                      style={chipStyle(at)}
                    >
                      <Icon size={13} aria-hidden="true" />
                      {CHIP_LABELS[s.id]}
                    </span>
                  );
                })}
                <div className="clock-dial-center">
                  <div>
                    <span className="clock-meter-value">{alignment}%</span>
                    <span>aligned</span>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="clock-meter"
              role="progressbar"
              aria-label={`Rhythm alignment ${alignment} of 100`}
              aria-valuenow={alignment}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span>Rhythm alignment</span>
              <div className="load-bar">
                <i style={{ width: `${alignment}%` }} />
              </div>
              <span>{alignment}%</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
            {!finished && step && (
              <motion.div
                className="clock-decision"
                key={step.id}
                initial={motionOk ? { opacity: 0, x: 26 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={motionOk ? { opacity: 0, x: -18 } : undefined}
                transition={
                  motionOk ? { duration: 0.22, ease: EASE } : { duration: 0 }
                }
              >
                <div className="clock-decision-head">
                  <Badge tone="info" dot>
                    {step.topic}
                  </Badge>
                  <span className="clock-at">{step.at}</span>
                </div>
                <h3>{step.prompt}</h3>
                <div className="clock-options">
                  {step.options.map((option, index) => {
                    const chosen = choices[step.id] === index;
                    const anyChosen = choices[step.id] !== undefined;
                    return (
                      <motion.button
                        key={option.label}
                        type="button"
                        className={`clock-option ${
                          chosen ? "chosen" : anyChosen ? "dimmed" : ""
                        } ${option.points < 0 ? "negative" : ""}`}
                        onClick={() => choose(index)}
                        disabled={anyChosen}
                        aria-pressed={chosen}
                        animate={
                          motionOk
                            ? chosen
                              ? option.points < 0
                                ? { x: [0, -6, 5, -3, 0] }
                                : { scale: [1, 1.03, 1] }
                              : { x: 0, scale: 1 }
                            : undefined
                        }
                        transition={
                          motionOk
                            ? { duration: 0.34, ease: "easeInOut" }
                            : undefined
                        }
                        whileTap={motionOk ? { scale: 0.97 } : undefined}
                      >
                        <span>
                          {option.label}
                          {chosen && (
                            <small className="clock-option-why">
                              {option.why}
                            </small>
                          )}
                        </span>
                        {anyChosen && (
                          <span className="clock-option-points">
                            {option.points > 0 ? `+${option.points}` : option.points}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                {choices[step.id] !== undefined && (
                  <div className="load-actions">
                    <button
                      type="button"
                      className="button primary"
                      onClick={next}
                    >
                      {stepIndex + 1 === totalSteps ? "See the day" : "Next decision"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
            </AnimatePresence>
            {finished && (
              <>
                <div className="games-result">
                  <span className="eyebrow-result">
                    Day complete · {member.name}
                  </span>
                  <h2>{verdict}</h2>
                  <Stars value={stars} />
                  <p>
                    {points} of {CLOCK_MAX} rhythm points — {alignment}%{" "}
                    alignment. Saved for this profile.
                  </p>
                  <div className="games-result-actions">
                    <button
                      type="button"
                      className="button primary"
                      onClick={restart}
                    >
                      <RotateCcw size={16} /> Build another day
                    </button>
                    <Link to="/games/facts" className="button secondary">
                      Next: Fact from fiction
                    </Link>
                  </div>
                </div>
                <FadeIn className="clock-melatonin" delay={0.14}>
                  <h3>Projected melatonin</h3>
                  <p>
                    {alignment >= 65
                      ? "A clear night-time rise, peaking in the small hours — what a protected clock produces."
                      : "Flattened and late: with weak anchors, the hormone barely commits to a night."}
                  </p>
                  <svg
                    viewBox="0 0 300 84"
                    role="img"
                    aria-label={`Projected melatonin curve at ${alignment} percent alignment`}
                  >
                    <rect x="22" y="8" width="69" height="64" fill="#edf2f6" />
                    <rect x="245" y="8" width="33" height="64" fill="#edf2f6" />
                    <line x1="22" y1="72" x2="278" y2="72" stroke="#e5e9e1" />
                    {[0, 6, 12, 18, 24].map((h) => (
                      <text
                        key={h}
                        x={22 + (h / 24) * 256}
                        y="82"
                        textAnchor="middle"
                        fontSize="8.5"
                        fill="#6d7973"
                      >
                        {String(h).padStart(2, "0")}
                      </text>
                    ))}
                    <motion.path
                      d={melatoninPath}
                      fill="none"
                      stroke="#26584b"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={motionOk ? { pathLength: 0 } : false}
                      animate={{ pathLength: 1 }}
                      transition={
                        motionOk
                          ? { duration: 0.9, ease: "easeInOut", delay: 0.3 }
                          : { duration: 0 }
                      }
                    />
                  </svg>
                  <p className="small-text muted">
                    Illustrative shape — evening light and caffeine decide how
                    tall and how punctual this curve is.
                  </p>
                </FadeIn>
              </>
            )}
          </div>
        </Panel>
        <aside className="game-side">
          <Panel title="Decisions made" subtitle="With their rhythm points">
            {chosenCount ? (
              <div className="clock-log">
                {CLOCK_STEPS.filter((s) => choices[s.id] !== undefined).map(
                  (s) => {
                    const option = s.options[choices[s.id]];
                    return (
                      <div className="clock-log-row" key={s.id}>
                        {CHIP_ICONS[s.id] &&
                          (() => {
                            const Icon = CHIP_ICONS[s.id];
                            return <Icon size={15} aria-hidden="true" />;
                          })()}
                        <strong>{s.topic}</strong>
                        <span
                          className={`clock-log-points ${
                            option.points < 0 ? "negative" : ""
                          }`}
                        >
                          {option.points > 0
                            ? `+${option.points}`
                            : option.points}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            ) : (
              <p className="muted small-text">
                Nothing decided yet — the dial fills as you choose.
              </p>
            )}
          </Panel>
          <Panel title="Recent days" subtitle="This crew member only">
            {pastRuns.length ? (
              <div className="clock-log">
                {pastRuns.slice(0, 4).map((r) => (
                  <div className="clock-log-row" key={r.id}>
                    <Moon size={15} aria-hidden="true" />
                    <strong>
                      {new Date(r.at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </strong>
                    <span className="clock-log-points">{r.score}%</span>
                    <Stars value={r.stars} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small-text">
                No finished days yet — a completed day saves here.
              </p>
            )}
          </Panel>
          <div className="games-quiet">
            <Moon size={17} />
            <p>{CLOCK_FACT}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
