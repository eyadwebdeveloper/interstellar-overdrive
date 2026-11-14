import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  PauseCircle,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge, Panel, Progress } from "../components/ui";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import "../styles/workflows.css";

const TOTAL_SECONDS = 180;
const LAPSE_MS = 500;
type Phase = "ready" | "countdown" | "wait" | "stim" | "done" | "aborted";

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

function clearTimer(timer: { current: number | null }) {
  if (timer.current !== null) {
    window.clearTimeout(timer.current);
    window.clearInterval(timer.current);
    timer.current = null;
  }
}

export default function PvtPage() {
  const navigate = useNavigate();
  const member = useCrewStore((state) => state.getActiveMember());
  const pastTests = useAppStore((state) => state.pvt);
  const savePvt = useAppStore((state) => state.savePvt);
  const [phase, setPhase] = useState<Phase>("ready");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [liveReaction, setLiveReaction] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [lapses, setLapses] = useState(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const [abortMessage, setAbortMessage] = useState("");
  const stimulusAt = useRef(0);
  const startedAt = useRef(0);
  const lapseMarked = useRef(false);
  const lastInputAt = useRef(0);
  const reactionsRef = useRef<number[]>([]);
  const lapsesRef = useRef(0);
  const falseStartsRef = useRef(0);
  const stimulusTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const reactionTimer = useRef<number | null>(null);
  const elapsedTimer = useRef<number | null>(null);
  const saved = useRef(false);

  const clearTrialTimers = useCallback(() => {
    clearTimer(stimulusTimer);
    clearTimer(countdownTimer);
    clearTimer(reactionTimer);
  }, []);
  const clearElapsedTimer = useCallback(() => clearTimer(elapsedTimer), []);
  const clearTimers = useCallback(() => {
    clearTrialTimers();
    clearElapsedTimer();
  }, [clearElapsedTimer, clearTrialTimers]);
  const complete = useCallback(() => {
    if (phase === "done" || phase === "aborted") return;
    clearTimers();
    setElapsed(TOTAL_SECONDS);
    setPhase("done");
    if (!saved.current) {
      saved.current = true;
      const values = reactionsRef.current;
      savePvt({
        crewId: member.id,
        mean: values.length
          ? Math.round(
              values.reduce((sum, value) => sum + value, 0) / values.length,
            )
          : 0,
        lapses: lapsesRef.current,
        falseStarts: falseStartsRef.current,
        taps: values.length,
      });
    }
  }, [clearTimers, member.id, phase, savePvt]);

  const scheduleTrial = useCallback(() => {
    clearTimer(stimulusTimer);
    setPhase("wait");
    lapseMarked.current = false;
    const wait = 2000 + Math.random() * 8000;
    stimulusTimer.current = window.setTimeout(() => {
      stimulusTimer.current = null;
      stimulusAt.current = performance.now();
      setLiveReaction(0);
      setPhase("stim");
    }, wait);
  }, []);

  const start = () => {
    clearTimers();
    saved.current = false;
    reactionsRef.current = [];
    lapsesRef.current = 0;
    falseStartsRef.current = 0;
    setReactions([]);
    setLapses(0);
    setFalseStarts(0);
    setElapsed(0);
    setCountdown(3);
    setPhase("countdown");
  };

  useEffect(() => {
    if (phase !== "countdown") return;
    const id = window.setInterval(
      () =>
        setCountdown((value) => {
          if (value <= 1) {
            window.clearInterval(id);
            if (countdownTimer.current === id) countdownTimer.current = null;
            startedAt.current = performance.now();
            scheduleTrial();
            return 0;
          }
          return value - 1;
        }),
      1000,
    );
    countdownTimer.current = id;
    return () => {
      window.clearInterval(id);
      if (countdownTimer.current === id) countdownTimer.current = null;
    };
  }, [phase, scheduleTrial]);
  useEffect(() => {
    if (!["wait", "stim"].includes(phase)) return;
    const id = window.setInterval(() => {
      const current = Math.max(
        0,
        Math.floor((performance.now() - startedAt.current) / 1000),
      );
      setElapsed(current);
      if (current >= TOTAL_SECONDS) complete();
    }, 100);
    elapsedTimer.current = id;
    return () => {
      window.clearInterval(id);
      if (elapsedTimer.current === id) elapsedTimer.current = null;
    };
  }, [phase, complete]);
  useEffect(() => {
    if (phase !== "stim") return;
    const id = window.setInterval(() => {
      const reaction = Math.round(performance.now() - stimulusAt.current);
      setLiveReaction(reaction);
      if (reaction >= LAPSE_MS && !lapseMarked.current) {
        lapseMarked.current = true;
        lapsesRef.current += 1;
        setLapses(lapsesRef.current);
      }
    }, 20);
    reactionTimer.current = id;
    return () => {
      window.clearInterval(id);
      if (reactionTimer.current === id) reactionTimer.current = null;
    };
  }, [phase]);
  useEffect(() => {
    const onVisibility = () => {
      if (
        document.visibilityState === "hidden" &&
        ["countdown", "wait", "stim"].includes(phase)
      ) {
        clearTimers();
        setAbortMessage(
          "Test cancelled because the page was hidden. Timing is not reliable after an interruption.",
        );
        setPhase("aborted");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [clearTimers, phase]);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const interact = () => {
    const now = performance.now();
    if (now - lastInputAt.current < 120) return;
    lastInputAt.current = now;
    if (phase === "ready") {
      start();
      return;
    }
    if (phase === "wait") {
      falseStartsRef.current += 1;
      setFalseStarts(falseStartsRef.current);
      clearTimer(stimulusTimer);
      scheduleTrial();
      return;
    }
    if (phase === "stim") {
      const reaction = Math.round(now - stimulusAt.current);
      reactionsRef.current = [...reactionsRef.current, reaction];
      setReactions(reactionsRef.current);
      if (reaction >= LAPSE_MS && !lapseMarked.current) {
        lapseMarked.current = true;
        lapsesRef.current += 1;
        setLapses(lapsesRef.current);
      }
      scheduleTrial();
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !["wait", "stim"].includes(phase) ||
        event.defaultPrevented ||
        event.repeat ||
        ![" ", "Enter"].includes(event.key)
      )
        return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("button, a, input, textarea, select") &&
        !target.closest(".pvt-pad")
      )
        return;
      event.preventDefault();
      interact();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cancel = () => {
    clearTimers();
    setAbortMessage(
      "The run was closed before completion. No result was saved.",
    );
    setPhase("aborted");
  };
  const crewTests = useMemo(
    () => pastTests.filter((record) => record.crewId === member.id),
    [pastTests, member.id],
  );
  const mean = reactions.length
    ? Math.round(
        reactions.reduce((sum, value) => sum + value, 0) / reactions.length,
      )
    : 0;
  const active = ["countdown", "wait", "stim"].includes(phase);

  return (
    <section className="page workflow-page focus-page pvt-page">
      <div className="focus-top">
        <Link className="back-link" to="/checkin">
          <ArrowLeft size={15} /> Back to check-in
        </Link>
        <button
          type="button"
          className="button ghost small"
          onClick={() => {
            if (active) cancel();
            navigate("/checkin");
          }}
        >
          <X size={15} /> Close
        </button>
      </div>
      <header className="focus-heading">
        <div className="eyebrow">Attention check · {member.name}</div>
        <h1>Psychomotor vigilance</h1>
        <p className="muted">
          A three-minute stimulus test. Tap or press Space when the counter
          appears; early taps count as false starts.
        </p>
        <div className="row focus-badges">
          <Badge tone="info" dot>
            3:00 timed
          </Badge>
          <Badge>Personal trend only</Badge>
        </div>
      </header>
      <Panel className="pvt-stage">
        <div className="pvt-stage-top">
          <span className="small-text">
            {phase === "ready"
              ? "Ready when you are"
              : phase === "done"
                ? "Run complete"
                : phase === "aborted"
                  ? "Run cancelled"
                  : "In progress"}
          </span>
          <strong>{formatClock(Math.max(TOTAL_SECONDS - elapsed, 0))}</strong>
        </div>
        <Progress
          value={(elapsed / TOTAL_SECONDS) * 100}
          label={`Test progress: ${Math.round((elapsed / TOTAL_SECONDS) * 100)} percent`}
        />
        {phase === "ready" && (
          <div className="pvt-instruction">
            <Eye size={25} />
            <h2>Settle your gaze</h2>
            <p>
              Place one finger over the response area. The first tap starts a
              short countdown, then the test begins.
            </p>
            <button
              type="button"
              className="button primary large"
              onClick={start}
            >
              Start 3-minute test
            </button>
          </div>
        )}
        {phase === "countdown" && (
          <div className="pvt-pad countdown-pad" aria-live="assertive">
            <span>Starting in</span>
            <strong>{countdown}</strong>
          </div>
        )}
        {["wait", "stim"].includes(phase) && (
          <div
            className={`pvt-pad ${phase}`}
            role="button"
            tabIndex={0}
            aria-label={
              phase === "stim"
                ? "Reaction response area, press Space or tap"
                : "Waiting for stimulus, tap only if you want to record a false start"
            }
            onPointerDown={(event) => {
              event.preventDefault();
              interact();
            }}
            onKeyDown={(event) => {
              if (
                (event.key === " " || event.key === "Enter") &&
                !event.repeat
              ) {
                event.preventDefault();
                interact();
              }
            }}
          >
            {phase === "stim" ? (
              <>
                <span className="stimulus-number">{liveReaction}</span>
                <small>ms</small>
              </>
            ) : (
              <span className="waiting-dot" aria-hidden="true" />
            )}
          </div>
        )}
        {phase === "done" && (
          <div className="pvt-result">
            <div className="completion-mark">
              <Check size={22} />
            </div>
            <div>
              <div className="eyebrow">Saved for {member.name}</div>
              <h2>Test complete</h2>
              <p className="muted">
                Average reaction time: <strong>{mean || "—"} ms</strong> across{" "}
                {reactions.length} responses.
              </p>
            </div>
            <div className="result-grid">
              <div>
                <span>Average</span>
                <strong>
                  {mean || "—"}
                  <small>ms</small>
                </strong>
              </div>
              <div>
                <span>Lapses</span>
                <strong>{lapses}</strong>
              </div>
              <div>
                <span>False starts</span>
                <strong>{falseStarts}</strong>
              </div>
              <div>
                <span>Responses</span>
                <strong>{reactions.length}</strong>
              </div>
            </div>
            <p className="notice notice-info">
              <ShieldAlert size={17} /> This is a trend signal, not a diagnosis.
              Consider sleep, workload, and how you feel before interpreting it.
            </p>
            <div className="row wrap-row">
              <button
                type="button"
                className="button secondary"
                onClick={start}
              >
                <RotateCcw size={16} /> Run again
              </button>
              <Link className="button primary" to="/checkin">
                Done
              </Link>
            </div>
          </div>
        )}
        {phase === "aborted" && (
          <div className="pvt-instruction">
            <PauseCircle size={25} />
            <h2>Run cancelled</h2>
            <p>{abortMessage}</p>
            <button type="button" className="button primary" onClick={start}>
              Restart test
            </button>
          </div>
        )}
        <div className="pvt-stage-footer">
          <span>
            {phase === "stim"
              ? "Respond now"
              : phase === "wait"
                ? "Wait for the counter"
                : phase === "countdown"
                  ? "Get ready"
                  : phase === "done"
                    ? "Saved once"
                    : "No result yet"}
          </span>
          {active && (
            <button type="button" className="text-button" onClick={cancel}>
              Cancel run
            </button>
          )}
        </div>
      </Panel>
      {active && (
        <p className="keyboard-note">
          Keyboard: Space or Enter responds. Timing pauses and the run cancels
          if this page becomes hidden.
        </p>
      )}
      <div className="pvt-lower">
        <Panel title="Live run" subtitle="Actual data from this run">
          <div className="live-grid">
            <div>
              <span>Latest reaction</span>
              <strong>
                {reactions.length
                  ? `${reactions[reactions.length - 1]} ms`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Lapses ≥500 ms</span>
              <strong>{lapses}</strong>
            </div>
            <div>
              <span>False starts</span>
              <strong>{falseStarts}</strong>
            </div>
          </div>
        </Panel>
        <Panel
          title="Recent saved tests"
          subtitle="Actual crew history · not the demo baseline"
        >
          {crewTests.length ? (
            <div className="pvt-history">
              {crewTests.slice(0, 4).map((record) => (
                <div className="pvt-history-row" key={record.id}>
                  <span>
                    {new Date(record.at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <strong>{record.mean || "—"} ms</strong>
                  <span>
                    {record.lapses} lapse{record.lapses === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="small-text">
              No saved runs for this crew member yet.
            </p>
          )}
          <div className="demo-baseline">
            <span className="small-text">Demo baseline</span>
            <strong>224–256 ms</strong>
            <span className="small-text">
              Illustrative reference only · not mixed with actual runs
            </span>
          </div>
        </Panel>
      </div>
      <div className="focus-footnote">
        Timing uses <code>performance.now()</code>. Results are saved once only
        when the full three-minute run completes.
      </div>
    </section>
  );
}
