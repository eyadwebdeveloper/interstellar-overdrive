import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  Printer,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Dialog,
  EmptyState,
  Notice,
  PageHeader,
  Panel,
  Progress,
} from "../components/ui";
import { getSimulatedVitals } from "../data/vitalsData";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import "../styles/response.css";

const STEPS = [
  "Patient & location",
  "Symptoms",
  "Vitals",
  "Notes & policy",
  "Review",
  "Saved locally",
];
const REGIONS = [
  "Head",
  "Chest",
  "Abdomen",
  "Back",
  "Arm",
  "Leg",
  "Skin",
  "General",
];
const CONTEXTS = [
  "At rest",
  "During exercise",
  "After EVA",
  "During sleep",
  "After a procedure",
  "Unclear",
];
const SYMPTOMS = [
  "Pain",
  "Dizziness",
  "Shortness of breath",
  "Nausea",
  "Bleeding",
  "Numbness",
  "Feverish feeling",
  "Confusion",
  "Other",
];
const OTHER_SYMPTOM_ERROR = "Describe the other symptom or sign.";
const CHECKLIST = [
  "I recorded observations in neutral, descriptive language.",
  "I included relevant equipment, medication, and context notes.",
  "If this may be serious, I will follow the approved mission emergency procedure.",
];

type PatientMode = "self" | "proxy";

type ReportState = {
  patientMode: PatientMode;
  patientId: string;
  region: string;
  context: string;
  symptoms: string[];
  otherSymptom: string;
  onset: string;
  severity: number;
  vitals: Record<string, boolean>;
  medicationNotes: string;
  equipmentNotes: string;
  additionalNotes: string;
  checklist: boolean[];
  policyAcknowledged: boolean;
};

const initialState: ReportState = {
  patientMode: "self",
  patientId: "",
  region: "",
  context: "",
  symptoms: [],
  otherSymptom: "",
  onset: "",
  severity: 0,
  vitals: {
    "heart-rate": true,
    "blood-pressure": true,
    spo2: true,
    temperature: true,
  },
  medicationNotes: "",
  equipmentNotes: "",
  additionalNotes: "",
  checklist: CHECKLIST.map(() => false),
  policyAcknowledged: false,
};

function displayVital(value: {
  id: string;
  display?: string;
  value: number;
  unit: string;
}) {
  return value.display || `${value.value}${value.unit ? ` ${value.unit}` : ""}`;
}

export default function MedicalEventPage() {
  const navigate = useNavigate();
  const crew = useCrewStore((state) => state.crew);
  const activeCrewId = useCrewStore((state) => state.activeCrewId);
  const saveMessage = useAppStore((state) => state.saveMessage);
  const [step, setStep] = useState(1);
  const [report, setReport] = useState<ReportState>({
    ...initialState,
    patientId: activeCrewId,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [queueId, setQueueId] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [showProcedure, setShowProcedure] = useState(false);

  const vitals = useMemo(
    () =>
      getSimulatedVitals().filter((vital) =>
        ["heart-rate", "blood-pressure", "spo2", "temperature"].includes(
          vital.id,
        ),
      ),
    [],
  );
  const patientName =
    crew.find((person) => person.id === report.patientId)?.name ||
    "Selected crew member";
  function setField<K extends keyof ReportState>(
    key: K,
    value: ReportState[K],
  ) {
    setReport((current) => ({ ...current, [key]: value }));
  }
  const toggleSymptom = (symptom: string) => {
    const isSelected = report.symptoms.includes(symptom);
    setField(
      "symptoms",
      isSelected
        ? report.symptoms.filter((item) => item !== symptom)
        : [...report.symptoms, symptom],
    );
    if (symptom === "Other" && isSelected)
      setErrors((current) =>
        current.filter((error) => error !== OTHER_SYMPTOM_ERROR),
      );
  };
  const toggleVital = (id: string) =>
    setField("vitals", { ...report.vitals, [id]: !report.vitals[id] });
  const toggleChecklist = (index: number) =>
    setField(
      "checklist",
      report.checklist.map((checked, current) =>
        current === index ? !checked : checked,
      ),
    );

  const validate = () => {
    const nextErrors: string[] = [];
    if (step === 1) {
      if (!report.patientId)
        nextErrors.push("Select the person this report is about.");
      if (!report.region)
        nextErrors.push("Select the closest location or region.");
      if (!report.context)
        nextErrors.push("Select the context in which this was observed.");
    }
    if (step === 2) {
      if (!report.symptoms.length)
        nextErrors.push("Select at least one symptom or choose Other.");
      if (report.symptoms.includes("Other") && !report.otherSymptom.trim())
        nextErrors.push(OTHER_SYMPTOM_ERROR);
      if (!report.onset) nextErrors.push("Record when it began.");
    }
    if (step === 4) {
      if (!report.checklist.every(Boolean))
        nextErrors.push("Review each documentation checklist item.");
      if (!report.policyAcknowledged)
        nextErrors.push("Acknowledge the training and procedure note.");
    }
    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const next = () => {
    if (!validate()) return;
    setStep((current) => Math.min(current + 1, STEPS.length));
    setErrors([]);
  };
  const back = () => {
    setErrors([]);
    if (step === 1) navigate(-1);
    else setStep((current) => current - 1);
  };

  const summary = {
    queueId,
    savedAt,
    patient: patientName,
    patientMode: report.patientMode,
    location: { region: report.region, context: report.context },
    symptoms: report.symptoms,
    otherSymptom: report.otherSymptom,
    onset: report.onset,
    severity: report.severity,
    vitals: vitals
      .filter((vital) => report.vitals[vital.id])
      .map((vital) => ({ label: vital.label, value: displayVital(vital) })),
    medicationNotes: report.medicationNotes,
    equipmentNotes: report.equipmentNotes,
    additionalNotes: report.additionalNotes,
    trainingChecklistAcknowledged: report.checklist.every(Boolean),
    procedureNoteAcknowledged: report.policyAcknowledged,
  };

  const submitLocally = () => {
    const id = `demo-event-${Date.now()}`;
    const now = new Date().toISOString();
    const payload = { ...summary, queueId: id, savedAt: now };
    saveMessage({
      crewId: activeCrewId,
      recipient: "Local medical event queue · demo",
      text: JSON.stringify(payload),
    });
    setQueueId(id);
    setSavedAt(now);
    setStep(6);
    setErrors([]);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${queueId || "aura-medical-event-demo"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="page response-page event-page">
      <PageHeader
        eyebrow="Focused documentation / demo"
        title="Record a medical event"
        description="A structured local report for training and review. This form does not diagnose, treat, or contact Earth."
        actions={
          <Badge tone="neutral">
            <FileText size={14} /> Local only
          </Badge>
        }
      />
      <div className="event-progress">
        <div className="spread">
          <span className="eyebrow">
            Step {step} of {STEPS.length}
          </span>
          <span className="small-text muted">{STEPS[step - 1]}</span>
        </div>
        <Progress
          value={(step / STEPS.length) * 100}
          label={`Step ${step} of ${STEPS.length}`}
        />
      </div>

      {step < 6 && (
        <div className="event-top-actions">
          <button className="button ghost small" onClick={back}>
            <ArrowLeft size={15} /> {step === 1 ? "Exit" : "Back"}
          </button>
        </div>
      )}
      {errors.length > 0 && (
        <Notice tone="warning">
          <strong>Before continuing:</strong>
          <ul className="error-list">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Notice>
      )}

      {step === 1 && (
        <Panel
          title="Who and where?"
          subtitle="Choose a person and the closest observation context. No body model is used."
        >
          <div className="stack">
            <div className="field">
              <span className="field-label">Reporting for</span>
              <div className="choice-grid">
                <button
                  className={`choice-card${report.patientMode === "self" ? " selected" : ""}`}
                  onClick={() => {
                    setField("patientMode", "self");
                    setField("patientId", activeCrewId);
                  }}
                >
                  <strong>Self</strong>
                  <span>
                    {crew.find((person) => person.id === activeCrewId)?.name}
                  </span>
                </button>
                <button
                  className={`choice-card${report.patientMode === "proxy" ? " selected" : ""}`}
                  onClick={() => setField("patientMode", "proxy")}
                >
                  <strong>Proxy</strong>
                  <span>Another crew member</span>
                </button>
              </div>
            </div>
            {report.patientMode === "proxy" && (
              <label className="field">
                <span className="field-label">Person observed</span>
                <select
                  value={report.patientId}
                  onChange={(event) =>
                    setField("patientId", event.target.value)
                  }
                >
                  <option value="">Select a crew member</option>
                  {crew.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {person.role}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="field">
              <span className="field-label">Closest region</span>
              <div
                className="chip-group"
                role="radiogroup"
                aria-label="Closest body region"
              >
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    role="radio"
                    aria-checked={report.region === region}
                    className={`choice-chip${report.region === region ? " selected" : ""}`}
                    onClick={() => setField("region", region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field-label">Context</span>
              <div
                className="chip-group"
                role="radiogroup"
                aria-label="Observation context"
              >
                {CONTEXTS.map((context) => (
                  <button
                    key={context}
                    role="radio"
                    aria-checked={report.context === context}
                    className={`choice-chip${report.context === context ? " selected" : ""}`}
                    onClick={() => setField("context", context)}
                  >
                    {context}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {step === 2 && (
        <Panel
          title="What was observed?"
          subtitle="Use plain descriptions. A symptom selection is not a diagnosis."
        >
          <div className="stack">
            <div className="field">
              <span className="field-label">Symptoms or signs</span>
              <div className="chip-group">
                {SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    aria-pressed={report.symptoms.includes(symptom)}
                    className={`choice-chip${report.symptoms.includes(symptom) ? " selected" : ""}`}
                    onClick={() => toggleSymptom(symptom)}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>
            {report.symptoms.includes("Other") && (
              <label className="field">
                <span className="field-label">Other symptom or sign</span>
                <input
                  value={report.otherSymptom}
                  onChange={(event) => {
                    const value = event.target.value;
                    setField("otherSymptom", value);
                    if (value.trim())
                      setErrors((current) =>
                        current.filter(
                          (error) => error !== OTHER_SYMPTOM_ERROR,
                        ),
                      );
                  }}
                  placeholder="Describe what you noticed"
                />
              </label>
            )}
            <label className="field">
              <span className="field-label">Onset</span>
              <select
                value={report.onset}
                onChange={(event) => setField("onset", event.target.value)}
              >
                <option value="">Select one</option>
                <option>Just now</option>
                <option>Within the last hour</option>
                <option>Earlier today</option>
                <option>More than one day ago</option>
                <option>Unknown</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">
                Severity as described by patient / observer: {report.severity}{" "}
                of 10
              </span>
              <input
                type="range"
                min="0"
                max="10"
                value={report.severity}
                onChange={(event) =>
                  setField("severity", Number(event.target.value))
                }
              />
              <div className="range-labels">
                <span>0 · none</span>
                <span>10 · worst described</span>
              </div>
            </label>
          </div>
        </Panel>
      )}

      {step === 3 && (
        <Panel
          title="Vitals snapshot"
          subtitle="Select which demo readings belong in this report. Blood pressure is shown as systolic/diastolic."
        >
          <div className="stack">
            <Notice tone="info">
              These are simulated readings from the current demo session. They
              are a snapshot, not a clinical conclusion.
            </Notice>
            <div className="vitals-snapshot">
              {vitals.map((vital) => (
                <label
                  className={`vital-row${report.vitals[vital.id] ? " selected" : ""}`}
                  key={vital.id}
                >
                  <input
                    type="checkbox"
                    checked={report.vitals[vital.id]}
                    onChange={() => toggleVital(vital.id)}
                  />
                  <span>
                    <strong>{vital.label}</strong>
                    <small>
                      {vital.updated} · own baseline {vital.baseline}
                    </small>
                  </span>
                  <b>{displayVital(vital)}</b>
                </label>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {step === 4 && (
        <Panel
          title="Notes and training policy"
          subtitle="Capture context without turning this checklist into a treatment protocol."
        >
          <div className="stack">
            <label className="field">
              <span className="field-label">Medication notes</span>
              <textarea
                rows={3}
                value={report.medicationNotes}
                onChange={(event) =>
                  setField("medicationNotes", event.target.value)
                }
                placeholder="Medication name, last recorded use, or none noted"
              />
            </label>
            <label className="field">
              <span className="field-label">Equipment notes</span>
              <textarea
                rows={3}
                value={report.equipmentNotes}
                onChange={(event) =>
                  setField("equipmentNotes", event.target.value)
                }
                placeholder="Equipment involved, readings, alarms, or none noted"
              />
            </label>
            <label className="field">
              <span className="field-label">Additional notes</span>
              <textarea
                rows={4}
                value={report.additionalNotes}
                onChange={(event) =>
                  setField("additionalNotes", event.target.value)
                }
                placeholder="Neutral observations and relevant context"
              />
            </label>
            <div className="checklist">
              <span className="field-label">Documentation checklist</span>
              {CHECKLIST.map((item, index) => (
                <label className="check-row" key={item}>
                  <input
                    type="checkbox"
                    checked={report.checklist[index]}
                    onChange={() => toggleChecklist(index)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
            <label className="policy-row">
              <input
                type="checkbox"
                checked={report.policyAcknowledged}
                onChange={(event) =>
                  setField("policyAcknowledged", event.target.checked)
                }
              />
              <span>
                <strong>I understand this is a training/demo record.</strong>
                <small>
                  For a serious or immediately dangerous situation, follow the
                  approved mission emergency procedure.
                </small>
              </span>
            </label>
          </div>
        </Panel>
      )}

      {step === 5 && (
        <Panel
          title="Review before saving"
          subtitle="Check the report summary. Going back keeps every field intact."
        >
          <div className="review-summary">
            <div className="review-section">
              <span className="eyebrow">Person & location</span>
              <strong>
                {patientName} ·{" "}
                {report.patientMode === "proxy" ? "proxy" : "self"}
              </strong>
              <span>
                {report.region} · {report.context}
              </span>
            </div>
            <div className="review-section">
              <span className="eyebrow">Symptoms</span>
              <strong>{report.symptoms.join(", ")}</strong>
              <span>
                {report.onset} · severity {report.severity}/10
                {report.otherSymptom ? ` · ${report.otherSymptom}` : ""}
              </span>
            </div>
            <div className="review-section">
              <span className="eyebrow">Vitals snapshot</span>
              <strong>
                {vitals
                  .filter((vital) => report.vitals[vital.id])
                  .map((vital) => `${vital.label}: ${displayVital(vital)}`)
                  .join(" · ") || "No vitals selected"}
              </strong>
            </div>
            <div className="review-section">
              <span className="eyebrow">Notes</span>
              <span>
                {report.medicationNotes || "No medication notes"} ·{" "}
                {report.equipmentNotes || "No equipment notes"} ·{" "}
                {report.additionalNotes || "No additional notes"}
              </span>
            </div>
          </div>
          <Notice tone="warning">
            Saving creates a local simulated queue record only. It does not send
            a report to Earth or guarantee review timing.
          </Notice>
        </Panel>
      )}

      {step === 6 && (
        <Panel
          className="saved-panel"
          title="Saved locally"
          subtitle="The report is now a local simulated queue record."
        >
          <div className="saved-mark">
            <Check size={27} />
          </div>
          <EmptyState
            title="Your documentation is ready"
            description="No real contact was made and no response timing is implied. Keep the approved mission emergency procedure as the authority for serious situations."
            icon="shield"
          >
            <div className="saved-metadata">
              <span>
                <strong>Queue metadata</strong> {queueId}
              </span>
              <span>
                Saved at{" "}
                {savedAt ? new Date(savedAt).toLocaleString() : "local time"}
              </span>
              <span>Patient: {patientName}</span>
            </div>
            <div className="row saved-actions">
              <button className="button primary small" onClick={downloadJson}>
                <Download size={15} /> Download JSON
              </button>
              <button
                className="button secondary small"
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print summary
              </button>
              <button
                className="button ghost small"
                onClick={() => navigate("/")}
              >
                <ArrowRight size={15} /> Back to home
              </button>
            </div>
          </EmptyState>
        </Panel>
      )}

      {step < 6 && (
        <div className="event-footer">
          <span className="small-text muted">
            Progress is saved in this screen until you leave.
          </span>
          {step === 5 ? (
            <button className="button primary" onClick={submitLocally}>
              <Save size={17} /> Save locally
            </button>
          ) : (
            <button className="button primary" onClick={next}>
              Next <ArrowRight size={17} />
            </button>
          )}
        </div>
      )}
      <div className="event-help">
        <button
          className="button ghost small"
          onClick={() => setShowProcedure(true)}
        >
          <ShieldCheck size={15} /> Procedure note
        </button>
      </div>
      <Dialog
        className="response-dialog"
        open={showProcedure}
        onClose={() => setShowProcedure(false)}
        title="Procedure reminder"
      >
        <div className="dialog-body stack">
          <Notice tone="warning">
            This form is documentation only. If a situation may be serious or
            immediately dangerous, stop and follow the approved mission
            emergency procedure.
          </Notice>
          <p className="small-text muted">
            This training checklist intentionally avoids treatment instructions.
            Use the mission-approved procedure and qualified crew roles for any
            response.
          </p>
          <button
            className="button secondary"
            onClick={() => setShowProcedure(false)}
          >
            Understood
          </button>
        </div>
      </Dialog>
    </section>
  );
}
