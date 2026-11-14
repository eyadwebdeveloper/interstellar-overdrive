import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Check,
  ChevronRight,
  ClipboardCheck,
  Mic,
  Moon,
  Save,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Badge,
  EmptyState,
  PageHeader,
  Panel,
  Progress,
  Status,
  Tabs,
} from "../components/ui";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import "../styles/workflows.css";

type Mood = 1 | 2 | 3 | 4 | 5;
type Quality = "light" | "moderate" | "heavy";
type Workload = "Light" | "Moderate" | "Heavy";
type Step = "feel" | "rest" | "notes" | "review";
type CheckinDraft = {
  step: Step;
  mood: Mood;
  energy: number;
  stress: number;
  sleepHours: number;
  sleepMinutes: number;
  sleepQuality: Quality;
  workload: Workload;
  notes: string;
};

const CHECKIN_DRAFTS_KEY = "aura-checkin-drafts-v1";

const steps: { value: Step; label: string }[] = [
  { value: "feel", label: "How you feel" },
  { value: "rest", label: "Rest & workload" },
  { value: "notes", label: "Notes" },
  { value: "review", label: "Review" },
];

const moodOptions: { value: Mood; label: string; hint: string }[] = [
  { value: 1, label: "Very low", hint: "Need a gentler day" },
  { value: 2, label: "Low", hint: "A little depleted" },
  { value: 3, label: "Okay", hint: "Holding steady" },
  { value: 4, label: "Good", hint: "Ready for most work" },
  { value: 5, label: "Great", hint: "Feeling strong today" },
];

const qualityOptions: { value: Quality; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Restless or interrupted" },
  { value: "moderate", label: "Moderate", hint: "Some recovery" },
  { value: "heavy", label: "Deep", hint: "Solid and restorative" },
];

function readDrafts(): Record<string, CheckinDraft> {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(CHECKIN_DRAFTS_KEY) || "{}",
    );
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, CheckinDraft>)
      : {};
  } catch {
    return {};
  }
}

function readDraft(crewId: string): CheckinDraft | null {
  const candidate = readDrafts()[crewId] as unknown as
    Record<string, unknown> | undefined;
  if (
    !candidate ||
    !steps.some((item) => item.value === candidate.step) ||
    ![1, 2, 3, 4, 5].includes(candidate.mood as number) ||
    typeof candidate.energy !== "number" ||
    candidate.energy < 1 ||
    candidate.energy > 5 ||
    typeof candidate.stress !== "number" ||
    candidate.stress < 1 ||
    candidate.stress > 5 ||
    typeof candidate.sleepHours !== "number" ||
    candidate.sleepHours < 0 ||
    candidate.sleepHours > 16 ||
    typeof candidate.sleepMinutes !== "number" ||
    candidate.sleepMinutes < 0 ||
    candidate.sleepMinutes > 59 ||
    !["light", "moderate", "heavy"].includes(
      candidate.sleepQuality as string,
    ) ||
    !["Light", "Moderate", "Heavy"].includes(candidate.workload as string) ||
    typeof candidate.notes !== "string"
  )
    return null;
  return {
    step: candidate.step as Step,
    mood: candidate.mood as Mood,
    energy: candidate.energy,
    stress: candidate.stress,
    sleepHours: candidate.sleepHours,
    sleepMinutes: candidate.sleepMinutes,
    sleepQuality: candidate.sleepQuality as Quality,
    workload: candidate.workload as Workload,
    notes: candidate.notes,
  };
}

function writeDraft(crewId: string, draft: CheckinDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CHECKIN_DRAFTS_KEY,
      JSON.stringify({ ...readDrafts(), [crewId]: draft }),
    );
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
}

function clearDraft(crewId: string) {
  if (typeof window === "undefined") return;
  try {
    const drafts = readDrafts();
    delete drafts[crewId];
    window.localStorage.setItem(CHECKIN_DRAFTS_KEY, JSON.stringify(drafts));
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
}

function ScaleField({
  label,
  value,
  onChange,
  low,
  high,
  lowLabel,
  highLabel,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  low: string;
  high: string;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="scale-field">
      <div className="spread">
        <span className="field-label">{label}</span>
        <strong className="scale-value">
          {value}
          <span>/5</span>
        </strong>
      </div>
      <input
        aria-label={label}
        type="range"
        min="1"
        max="5"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="scale-caption">
        <span>
          {low} · {lowLabel}
        </span>
        <span>
          {high} · {highLabel}
        </span>
      </div>
    </div>
  );
}

export default function CheckinPage() {
  const member = useCrewStore((state) => state.getActiveMember());
  const missionDay = useCrewStore((state) => state.getMissionDay());
  const checkins = useAppStore((state) => state.checkins);
  const saveCheckin = useAppStore((state) => state.saveCheckin);
  const [step, setStep] = useState<Step>("feel");
  const [mood, setMood] = useState<Mood>(3);
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(2);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepMinutes, setSleepMinutes] = useState(10);
  const [sleepQuality, setSleepQuality] = useState<Quality>("moderate");
  const [workload, setWorkload] = useState<Workload>("Moderate");
  const [notes, setNotes] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [draftCrewId, setDraftCrewId] = useState<string | null>(null);

  useEffect(() => {
    const draft = readDraft(member.id);
    if (draft) {
      setStep(draft.step);
      setMood(draft.mood);
      setEnergy(draft.energy);
      setStress(draft.stress);
      setSleepHours(draft.sleepHours);
      setSleepMinutes(draft.sleepMinutes);
      setSleepQuality(draft.sleepQuality);
      setWorkload(draft.workload);
      setNotes(draft.notes);
    } else {
      setStep("feel");
      setMood(3);
      setEnergy(3);
      setStress(2);
      setSleepHours(7);
      setSleepMinutes(10);
      setSleepQuality("moderate");
      setWorkload("Moderate");
      setNotes("");
    }
    setSavedId(null);
    setError("");
    setDraftCrewId(member.id);
  }, [member.id]);

  useEffect(() => {
    if (draftCrewId !== member.id || savedId) return;
    writeDraft(member.id, {
      step,
      mood,
      energy,
      stress,
      sleepHours,
      sleepMinutes,
      sleepQuality,
      workload,
      notes,
    });
  }, [
    draftCrewId,
    energy,
    member.id,
    mood,
    notes,
    savedId,
    sleepHours,
    sleepMinutes,
    sleepQuality,
    step,
    stress,
    workload,
  ]);

  const crewHistory = useMemo(
    () => checkins.filter((record) => record.crewId === member.id),
    [checkins, member.id],
  );
  const latest = crewHistory[0];
  const currentIndex = steps.findIndex((item) => item.value === step);
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const sleepMinutesTotal = sleepHours * 60 + sleepMinutes;

  const goNext = () => {
    setError("");
    if (
      step === "rest" &&
      (sleepHours < 0 ||
        sleepHours > 16 ||
        sleepMinutes < 0 ||
        sleepMinutes > 59)
    ) {
      setError("Enter sleep between 0–16 hours and 0–59 minutes.");
      return;
    }
    if (step !== "review") setStep(steps[currentIndex + 1].value);
  };

  const goBack = () => {
    setError("");
    if (step !== "feel") setStep(steps[currentIndex - 1].value);
  };

  const save = () => {
    if (savedId) return;
    if (
      sleepHours < 0 ||
      sleepHours > 16 ||
      sleepMinutes < 0 ||
      sleepMinutes > 59
    ) {
      setError("Please correct the sleep duration before saving.");
      setStep("rest");
      return;
    }
    const id = crypto.randomUUID();
    saveCheckin({
      crewId: member.id,
      mood,
      stress,
      energy,
      sleepMinutes: sleepMinutesTotal,
      sleepQuality,
      workload,
      notes: notes.trim(),
    });
    clearDraft(member.id);
    setSavedId(id);
  };

  return (
    <section className="page workflow-page checkin-page">
      <PageHeader
        eyebrow={`Daily check-in · Mission day ${missionDay}`}
        title={`A quiet read on ${member.name.split(" ").pop()}`}
        description="A short, personal baseline check. Your answers stay with this crew profile and are not a diagnosis."
        actions={
          <Badge tone="info" dot>
            About 1 min
          </Badge>
        }
      />

      {savedId ? (
        <div className="completion-layout">
          <Panel className="completion-panel">
            <div className="completion-mark">
              <Check size={22} />
            </div>
            <div className="eyebrow">Recorded for {member.name}</div>
            <h2>Check-in complete</h2>
            <p className="muted">
              Saved just now. This snapshot will shape the context shown in your
              next AURA review.
            </p>
            <div className="summary-grid">
              <div>
                <span className="small-text">Feeling</span>
                <strong>{mood}/5</strong>
              </div>
              <div>
                <span className="small-text">Sleep</span>
                <strong>
                  {sleepHours}h {String(sleepMinutes).padStart(2, "0")}m
                </strong>
              </div>
              <div>
                <span className="small-text">Energy</span>
                <strong>{energy}/5</strong>
              </div>
              <div>
                <span className="small-text">Workload</span>
                <strong>{workload}</strong>
              </div>
            </div>
            <div className="row wrap-row">
              <Link className="button primary" to="/pvt">
                <Activity size={16} /> Run vigilance test
              </Link>
              <Link className="button secondary" to="/">
                Return home
              </Link>
            </div>
          </Panel>
          <Panel
            title="Separate tests"
            subtitle="Choose when you have the attention for a timed task."
          >
            <div className="test-list">
              <Link className="test-row" to="/pvt">
                <span className="test-icon">
                  <Zap size={17} />
                </span>
                <span>
                  <strong>Psychomotor vigilance test</strong>
                  <small>Working · 3 minutes</small>
                </span>
                <ChevronRight size={17} />
              </Link>
              <div className="test-row planned">
                <span className="test-icon">
                  <ClipboardCheck size={17} />
                </span>
                <span>
                  <strong>Grip endurance</strong>
                  <small>Planned · hardware integration pending</small>
                </span>
                <Badge>Planned</Badge>
              </div>
              <div className="test-row planned">
                <span className="test-icon">
                  <Sparkles size={17} />
                </span>
                <span>
                  <strong>Mood screen</strong>
                  <small>Planned · not part of this prototype</small>
                </span>
                <Badge>Planned</Badge>
              </div>
            </div>
          </Panel>
        </div>
      ) : (
        <>
          <div className="workflow-progress panel quiet-panel">
            <div className="spread">
              <span className="eyebrow">
                Step {currentIndex + 1} of {steps.length}
              </span>
              <span className="small-text">{steps[currentIndex].label}</span>
            </div>
            <Progress
              value={progress}
              label={`Check-in progress: ${Math.round(progress)} percent`}
            />
            <div className="step-dots" aria-hidden="true">
              {steps.map((item, index) => (
                <span
                  key={item.value}
                  className={index <= currentIndex ? "active" : ""}
                />
              ))}
            </div>
          </div>

          <div className="checkin-layout">
            <Panel className="flow-panel">
              <Tabs
                items={steps}
                value={step}
                onChange={(value) => setStep(value as Step)}
                label="Check-in steps"
              />
              {step === "feel" && (
                <div className="step-content">
                  <div>
                    <div className="eyebrow">Right now</div>
                    <h2>How is your body and mind today?</h2>
                    <p className="muted">
                      There is no ideal answer. A small honest signal is more
                      useful than a polished one.
                    </p>
                  </div>
                  <div className="choice-grid mood-grid">
                    {moodOptions.map((option) => (
                      <button
                        type="button"
                        key={option.value}
                        className={`choice-card ${mood === option.value ? "selected" : ""}`}
                        aria-pressed={mood === option.value}
                        onClick={() => setMood(option.value)}
                      >
                        <span className="choice-number">{option.value}</span>
                        <strong>{option.label}</strong>
                        <small>{option.hint}</small>
                      </button>
                    ))}
                  </div>
                  <div className="scale-stack">
                    <ScaleField
                      label="Energy"
                      value={energy}
                      onChange={setEnergy}
                      low="1"
                      high="5"
                      lowLabel="drained"
                      highLabel="full"
                    />
                    <ScaleField
                      label="Stress"
                      value={stress}
                      onChange={setStress}
                      low="1"
                      high="5"
                      lowLabel="calm"
                      highLabel="strained"
                    />
                  </div>
                </div>
              )}
              {step === "rest" && (
                <div className="step-content">
                  <div>
                    <div className="eyebrow">Recovery context</div>
                    <h2>How did you rest, and what is ahead?</h2>
                    <p className="muted">
                      Sleep is recorded as hours and minutes so your trend
                      remains precise.
                    </p>
                  </div>
                  <div className="field-grid">
                    <label className="field">
                      <span className="field-label">Sleep hours</span>
                      <input
                        type="number"
                        min="0"
                        max="16"
                        value={sleepHours}
                        onChange={(event) =>
                          setSleepHours(Number(event.target.value))
                        }
                      />
                    </label>
                    <label className="field">
                      <span className="field-label">Additional minutes</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={sleepMinutes}
                        onChange={(event) =>
                          setSleepMinutes(Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                  <div>
                    <span className="field-label">Sleep quality</span>
                    <div className="choice-grid three">
                      {qualityOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          className={`choice-card compact ${sleepQuality === option.value ? "selected" : ""}`}
                          aria-pressed={sleepQuality === option.value}
                          onClick={() => setSleepQuality(option.value)}
                        >
                          <strong>{option.label}</strong>
                          <small>{option.hint}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="field-label">Expected workload</span>
                    <div className="choice-grid three">
                      {(["Light", "Moderate", "Heavy"] as Workload[]).map(
                        (item) => (
                          <button
                            type="button"
                            key={item}
                            className={`choice-card compact ${workload === item ? "selected" : ""}`}
                            aria-pressed={workload === item}
                            onClick={() => setWorkload(item)}
                          >
                            <strong>{item}</strong>
                            <small>
                              {item === "Light"
                                ? "Maintenance"
                                : item === "Moderate"
                                  ? "Planned duties"
                                  : "High demand"}
                            </small>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
              {step === "notes" && (
                <div className="step-content">
                  <div>
                    <div className="eyebrow">Optional context</div>
                    <h2>Anything worth carrying forward?</h2>
                    <p className="muted">
                      A few words can help your future self or a clinician
                      understand the signal. You can leave this blank.
                    </p>
                  </div>
                  <label className="field">
                    <span className="field-label">
                      Notes <span className="muted">(optional)</span>
                    </span>
                    <textarea
                      rows={6}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="For example: woke once during the sleep cycle, shoulders feel tight…"
                    />
                  </label>
                  <div className="notice notice-info">
                    <Mic size={17} />
                    <span>
                      Voice notes are unavailable in this prototype. Type a
                      short note instead.
                    </span>
                  </div>
                </div>
              )}
              {step === "review" && (
                <div className="step-content">
                  <div>
                    <div className="eyebrow">Ready to record</div>
                    <h2>Review your check-in</h2>
                    <p className="muted">
                      This creates one timestamped record for {member.name}. You
                      can start a new check-in later; records are not
                      overwritten.
                    </p>
                  </div>
                  <div className="review-list">
                    <div>
                      <span>Feeling</span>
                      <strong>
                        {mood}/5 ·{" "}
                        {moodOptions.find((item) => item.value === mood)?.label}
                      </strong>
                    </div>
                    <div>
                      <span>Energy / stress</span>
                      <strong>
                        {energy}/5 · {stress}/5
                      </strong>
                    </div>
                    <div>
                      <span>Sleep</span>
                      <strong>
                        {sleepHours}h {String(sleepMinutes).padStart(2, "0")}m ·{" "}
                        {sleepQuality}
                      </strong>
                    </div>
                    <div>
                      <span>Workload</span>
                      <strong>{workload}</strong>
                    </div>
                    <div>
                      <span>Notes</span>
                      <strong>{notes.trim() || "None added"}</strong>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="flow-actions">
                <button
                  type="button"
                  className="button ghost"
                  onClick={goBack}
                  disabled={step === "feel"}
                >
                  Back
                </button>
                {step === "review" ? (
                  <button
                    type="button"
                    className="button primary"
                    onClick={save}
                  >
                    <Save size={16} /> Save check-in
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button primary"
                    onClick={goNext}
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </Panel>
            <aside className="context-rail">
              <Panel
                className="baseline-panel"
                title="Your recent signal"
                subtitle="Only this crew profile · demo data"
              >
                <div className="baseline-value">
                  <span>
                    {latest
                      ? latest.sleepMinutes >= 60
                        ? `${Math.floor(latest.sleepMinutes / 60)}h ${latest.sleepMinutes % 60}m`
                        : `${latest.sleepMinutes}m`
                      : "—"}
                  </span>
                  <small>last sleep record</small>
                </div>
                {latest ? (
                  <>
                    <div className="row baseline-row">
                      <span>Feeling</span>
                      <strong>{latest.mood}/5</strong>
                    </div>
                    <div className="row baseline-row">
                      <span>Energy</span>
                      <strong>{latest.energy}/5</strong>
                    </div>
                    <Status
                      level={latest.stress >= 4 ? "watch" : "normal"}
                      label={
                        latest.stress >= 4
                          ? "Stress worth noting"
                          : "Within your recent range"
                      }
                    />
                  </>
                ) : (
                  <EmptyState
                    icon="moon"
                    title="First signal"
                    description="Your first saved check-in will appear here."
                  />
                )}
              </Panel>
              <Panel className="next-test" title="Next best step">
                <div className="row">
                  <span className="test-icon">
                    <Activity size={17} />
                  </span>
                  <div>
                    <strong>Vigilance test</strong>
                    <p className="small-text">
                      Separate, 3-minute attention check
                    </p>
                  </div>
                </div>
                <Link className="text-link" to="/pvt">
                  Open test <ChevronRight size={14} />
                </Link>
              </Panel>
            </aside>
          </div>
        </>
      )}

      {!savedId && (
        <div className="checkin-footer-note">
          <Moon size={15} />
          <span>
            Sleep is entered in exact hours and minutes. AURA uses personal
            trends, not population averages.
          </span>
        </div>
      )}
    </section>
  );
}
