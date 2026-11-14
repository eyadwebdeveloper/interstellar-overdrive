import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Clock,
  Dumbbell,
  Flame,
  HeartPulse,
  Pause,
  Play,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Badge,
  Dialog,
  LineChart,
  PageHeader,
  Panel,
  Progress,
  Tabs,
} from "../components/ui";
import { getExerciseSessions, type ExerciseSession } from "../data/vitalsData";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import "../styles/workflows.css";

type View = "today" | "plan" | "history";
type Device = "ARED" | "T2" | "CEVIS" | "iRED";
type FinishPayload = {
  seconds: number;
  completedSets: number;
  totalSets: number;
  rpe: number;
  complete: boolean;
};

const devices: {
  id: Device;
  name: string;
  detail: string;
  description: string;
  icon: typeof Dumbbell;
}[] = [
  {
    id: "ARED",
    name: "ARED",
    detail: "Resistance",
    description:
      "Advanced Resistive Exercise Device · lower and upper body loading",
    icon: Dumbbell,
  },
  {
    id: "T2",
    name: "T2",
    detail: "Treadmill",
    description:
      "Treadmill with harness · intervals and continuous aerobic work",
    icon: Timer,
  },
  {
    id: "CEVIS",
    name: "CEVIS",
    detail: "Cycle",
    description:
      "Cycle Ergometer with Vibration Isolation · low-impact aerobic work",
    icon: HeartPulse,
  },
  {
    id: "iRED",
    name: "iRED",
    detail: "Elastic",
    description:
      "Interim Resistive Exercise Device · compact strength sessions",
    icon: TrendingUp,
  },
];

const weekPlan = [
  { day: "Mon", title: "Resistance", detail: "Lower body", tone: "forest" },
  { day: "Tue", title: "Intervals", detail: "T2 treadmill", tone: "mint" },
  { day: "Wed", title: "Recovery", detail: "Mobility", tone: "quiet" },
  { day: "Thu", title: "Resistance", detail: "Upper body", tone: "forest" },
  { day: "Fri", title: "Continuous", detail: "CEVIS cycle", tone: "mint" },
  { day: "Sat", title: "Resistance", detail: "Full body", tone: "forest" },
  { day: "Sun", title: "Rest", detail: "Unstructured", tone: "quiet" },
];

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

function SessionDialog({
  session,
  equipment,
  onClose,
  onFinish,
}: {
  session: ExerciseSession;
  equipment: string;
  onClose: () => void;
  onFinish: (payload: FinishPayload) => void;
}) {
  const totalSets = session.sets ?? 3;
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sets, setSets] = useState<boolean[]>(() =>
    Array.from({ length: totalSets }, () => false),
  );
  const [rpe, setRpe] = useState(session.rpe ?? 6);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setElapsed((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const completedSets = sets.filter(Boolean).length;
  const canFinish = completedSets === totalSets && elapsed >= 30;
  const save = (complete: boolean) =>
    onFinish({ seconds: elapsed, completedSets, totalSets, rpe, complete });

  return (
    <Dialog
      open
      onClose={onClose}
      title={session.name}
      className="session-dialog workflow-dialog"
    >
      <div className="dialog-kicker">
        <Badge tone="warning" dot>
          Demo session
        </Badge>
        <span className="small-text">
          {equipment} · Awaiting flight-surgeon approval
        </span>
      </div>
      <p className="muted">
        This is a training plan example, not an approved live prescription. Stop
        if symptoms appear.
      </p>
      <div className="runner-stats">
        <div>
          <span>Elapsed</span>
          <strong>{formatTime(elapsed)}</strong>
        </div>
        <div>
          <span>Sets</span>
          <strong>
            {completedSets}/{totalSets}
          </strong>
        </div>
        <div>
          <span>Target</span>
          <strong>RPE {session.rpe ?? "—"}</strong>
        </div>
      </div>
      <div className="runner-controls">
        <button
          type="button"
          className="button secondary"
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
          {paused ? "Resume timer" : "Pause timer"}
        </button>
        <span className="small-text">
          {paused ? "Timer paused" : "Timer running"}
        </span>
      </div>
      <div className="set-list">
        <div className="spread">
          <div>
            <span className="eyebrow">Set tracking</span>
            <p className="small-text">
              {session.reps
                ? `${session.reps} reps · ${session.load ?? "body weight"}`
                : "Work interval"}
            </p>
          </div>
          <strong>{Math.round((completedSets / totalSets) * 100)}%</strong>
        </div>
        <Progress
          value={(completedSets / totalSets) * 100}
          label="Set completion"
        />
        {sets.map((done, index) => (
          <label className={`set-row ${done ? "done" : ""}`} key={index}>
            <input
              type="checkbox"
              checked={done}
              onChange={() =>
                setSets((items) =>
                  items.map((item, itemIndex) =>
                    itemIndex === index ? !item : item,
                  ),
                )
              }
            />
            <span>
              <strong>Set {index + 1}</strong>
              <small>
                {session.reps
                  ? `${session.reps} reps at ${session.load ?? "body weight"}`
                  : "Timed work interval"}
              </small>
            </span>
            <Check size={16} />
          </label>
        ))}
      </div>
      <label className="field">
        <span className="field-label">
          Actual RPE <strong>{rpe}/10</strong>
        </span>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={rpe}
          onChange={(event) => setRpe(Number(event.target.value))}
        />
      </label>
      <div className="dialog-actions">
        <button type="button" className="button ghost" onClick={onClose}>
          Close without saving
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => save(false)}
        >
          Save partial session
        </button>
        <button
          type="button"
          className="button primary"
          disabled={!canFinish}
          onClick={() => save(true)}
        >
          <Check size={16} /> Finish session
        </button>
      </div>
      {!canFinish && (
        <p className="form-hint">
          Complete every set and spend at least 00:30 in the session to finish.
          You can save a partial session at any time.
        </p>
      )}
    </Dialog>
  );
}

export default function ExercisePage() {
  const member = useCrewStore((state) => state.getActiveMember());
  const records = useAppStore((state) => state.sessions);
  const saveSession = useAppStore((state) => state.saveSession);
  const [view, setView] = useState<View>("today");
  const [device, setDevice] = useState<Device>("ARED");
  const [running, setRunning] = useState<ExerciseSession | null>(null);
  const [notice, setNotice] = useState("");

  const actualHistory = useMemo(
    () => records.filter((record) => record.crewId === member.id),
    [records, member.id],
  );
  const planned = getExerciseSessions().map((session) => ({
    ...session,
    completed: actualHistory.some(
      (record) =>
        record.sessionId === session.id &&
        record.completed === true &&
        new Date(record.at).toDateString() === new Date().toDateString(),
    ),
  }));
  const next = planned.find((session) => !session.completed) ?? planned[0];
  const selectedDevice =
    devices.find((item) => item.id === device) ?? devices[0];
  const completedCount = planned.filter((session) => session.completed).length;

  const finish = (payload: FinishPayload) => {
    if (!running) return;
    saveSession({
      crewId: member.id,
      sessionId: running.id,
      name: running.name,
      seconds: payload.seconds,
      completedSets: payload.completedSets,
      totalSets: payload.totalSets,
      rpe: payload.rpe,
      completed: payload.complete,
      equipment: device,
    });
    setNotice(
      payload.complete
        ? `${running.name} logged to ${member.name}'s history.`
        : `Partial ${running.name} saved. You can return to it later.`,
    );
    setRunning(null);
    setView("history");
  };

  return (
    <section className="page workflow-page exercise-page">
      <PageHeader
        eyebrow="Training workspace"
        title="Exercise"
        description={`A flexible training view for ${member.name}. Keep the plan visible, then record what actually happened.`}
        actions={
          <Badge tone="warning" dot>
            Demo plan · approval pending
          </Badge>
        }
      />
      <div className="exercise-layout">
        <div className="exercise-main">
          <Panel className="exercise-hero">
            <div>
              <div className="eyebrow">Today’s focus · Demo session</div>
              <h2>{next.name}</h2>
              <p>
                {next.sets
                  ? `${next.sets} sets × ${next.reps} reps · ${next.load}`
                  : `${next.duration} minutes · ${next.intensity} intensity`}{" "}
                · target RPE {next.rpe ?? "—"}
              </p>
              <div className="row wrap-row">
                <button
                  type="button"
                  className="button primary"
                  onClick={() => setRunning(next)}
                >
                  <Play size={16} />{" "}
                  {next.completed ? "Repeat demo session" : "Start session"}
                </button>
                <span className="hero-meta">
                  <Clock size={15} /> {next.duration} min
                </span>
              </div>
            </div>
            <div className="hero-aside">
              <span className="small-text">This week</span>
              <strong>{completedCount}/3</strong>
              <span className="small-text">
                planned sessions marked complete
              </span>
            </div>
          </Panel>
          {notice && (
            <div className="notice notice-success">
              <Check size={17} />
              <span>{notice}</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Dismiss notice"
                onClick={() => setNotice("")}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <Tabs
            items={[
              { value: "today", label: "Today" },
              { value: "plan", label: "This week" },
              { value: "history", label: "History" },
            ]}
            value={view}
            onChange={(value) => setView(value as View)}
            label="Exercise views"
          />
          {view === "today" && (
            <>
              <Panel
                title="Session list"
                subtitle="A demonstration plan is shown separately from your recorded sessions."
                action={<Badge>Plan</Badge>}
              >
                <div className="session-list">
                  {planned.map((session) => (
                    <div
                      className={`session-row ${session.completed ? "complete" : ""}`}
                      key={session.id}
                    >
                      <span className="session-kind">
                        <IconForType type={session.type} />
                      </span>
                      <div className="session-copy">
                        <strong>{session.name}</strong>
                        <span>
                          {session.duration} min · {session.intensity} ·{" "}
                          {session.musclesWorked.slice(0, 2).join(" + ")}
                        </span>
                      </div>
                      {session.completed ? (
                        <Badge tone="success" dot>
                          Done
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Start ${session.name}`}
                          onClick={() => setRunning(session)}
                        >
                          <Play size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel
                title="Weekly volume"
                subtitle="Sample trend · demonstration data"
              >
                <LineChart
                  values={[7.1, 8.4, 4.2, 9.6, 8.9]}
                  label="Demo weekly exercise volume"
                  dates={[
                    "4 weeks ago",
                    "3 weeks ago",
                    "2 weeks ago",
                    "Last week",
                    "This week",
                  ]}
                />
                <div className="chart-caption">
                  <span>
                    <strong>8.9k</strong> demo kg·reps
                  </span>
                  <span>Target 10.5k</span>
                </div>
                <p className="small-text">
                  The chart is illustrative. Actual recorded sessions appear in
                  History and are not mixed into this sample trend.
                </p>
              </Panel>
            </>
          )}
          {view === "plan" && (
            <Panel
              title="This week"
              subtitle="A sprint-style template, not a clinical prescription."
            >
              <div className="week-grid">
                {weekPlan.map((item, index) => (
                  <div
                    className={`week-day ${item.tone} ${index === 3 ? "current" : ""}`}
                    key={item.day}
                  >
                    <span>{item.day}</span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                ))}
              </div>
              <div className="plan-summary">
                <div>
                  <strong>3</strong>
                  <span>resistance days</span>
                </div>
                <div>
                  <strong>2</strong>
                  <span>aerobic days</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>recovery block</span>
                </div>
              </div>
              <div className="notice notice-warning">
                <span>
                  <strong>Pending flight-surgeon approval.</strong> This plan is
                  a clear simulation for the prototype; do not treat it as an
                  active prescription.
                </span>
              </div>
            </Panel>
          )}
          {view === "history" && (
            <Panel
              title="Recorded sessions"
              subtitle="Actual sessions saved for this crew member."
            >
              {actualHistory.length ? (
                <div className="history-list">
                  {actualHistory.map((record) => (
                    <div className="history-row" key={record.id}>
                      <span className="history-date">
                        {new Date(record.at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div>
                        <strong>{record.name}</strong>
                        <span>
                          {formatTime(record.seconds)} · {record.completedSets}/
                          {record.totalSets} sets · RPE {record.rpe} ·{" "}
                          {record.equipment || "Demo equipment"}
                        </span>
                      </div>
                      <Badge
                        tone={
                          (record.completed ??
                          record.completedSets === record.totalSets)
                            ? "success"
                            : "warning"
                        }
                      >
                        {(record.completed ??
                        record.completedSets === record.totalSets)
                          ? "Complete"
                          : "Partial"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-history">
                  <BarChart3 size={22} />
                  <strong>No recorded sessions yet</strong>
                  <span>
                    Start a demo session to create an actual crew history entry.
                  </span>
                </div>
              )}
              <p className="small-text history-note">
                Only completed or explicitly saved partial sessions appear here.
                The training plan above remains demo data.
              </p>
            </Panel>
          )}
        </div>
        <aside className="exercise-rail">
          <Panel
            title="Choose equipment"
            subtitle="Selection changes the session context."
          >
            <div className="device-list">
              {devices.map((item) => {
                const DeviceIcon = item.icon;
                return (
                  <button
                    type="button"
                    className={`device-card ${device === item.id ? "selected" : ""}`}
                    aria-pressed={device === item.id}
                    onClick={() => setDevice(item.id)}
                    key={item.id}
                  >
                    <span className="device-icon">
                      <DeviceIcon size={18} />
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.detail}</small>
                    </span>
                    {device === item.id && <Check size={16} />}
                  </button>
                );
              })}
            </div>
            <div className="device-detail">
              <span className="eyebrow">Selected device</span>
              <strong>
                {selectedDevice.name} · {selectedDevice.detail}
              </strong>
              <p>{selectedDevice.description}</p>
            </div>
          </Panel>
          <Panel title="Readiness note">
            <div className="readiness-block">
              <div className="readiness-ring">
                {Math.round((completedCount / 3) * 100)}%
              </div>
              <div>
                <strong>Keep the signal honest</strong>
                <p className="small-text">
                  Adjust for how you feel. A partial record is more useful than
                  an unrecorded effort.
                </p>
              </div>
            </div>
          </Panel>
        </aside>
      </div>
      {running && (
        <SessionDialog
          equipment={device}
          session={running}
          onClose={() => setRunning(null)}
          onFinish={finish}
        />
      )}
    </section>
  );
}

function IconForType({ type }: { type: string }) {
  if (type === "cardio") return <Flame size={18} />;
  if (type === "flexibility") return <TrendingUp size={18} />;
  return <Dumbbell size={18} />;
}
