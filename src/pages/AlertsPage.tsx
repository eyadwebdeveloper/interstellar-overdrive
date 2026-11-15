import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import {
  Badge,
  Dialog,
  EmptyState,
  Icon,
  Notice,
  PageHeader,
  Panel,
  Status,
  Tabs,
} from "../components/ui";
import { type Alert, type StatusLevel } from "../data/vitalsData";
import { useAlerts } from "../hooks/useAura";
import SimulatedBanner from "../components/SimulatedBanner";
import { scopedKey, useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import { useCopilotStore } from "../stores/copilotStore";
import { timeAgo } from "../utils/dateUtils";
import "../styles/response.css";

type Lane = "all" | "official" | "advisory" | "reminders";
type StatusFilter = "all" | StatusLevel;

type UndoItem = { label: string; restore: () => void };

const laneItems = [
  { value: "all", label: "All" },
  { value: "official", label: "Official" },
  { value: "advisory", label: "Advisory" },
  { value: "reminders", label: "Reminders" },
];

const statusItems = [
  { value: "all", label: "Any status" },
  { value: "normal", label: "Normal" },
  { value: "watch", label: "Watch" },
  { value: "act", label: "Action" },
  { value: "emergency", label: "Emergency" },
];

const categoryItems = [
  { value: "all", label: "All categories" },
  { value: "cardiovascular", label: "Cardiovascular" },
  { value: "nervous", label: "Neuro & vision" },
  { value: "scheduling", label: "Scheduling" },
];

function isExpired(value: number | undefined) {
  return !value || value <= Date.now();
}

function alertCategory(alert: Alert) {
  if (alert.system === "cardiovascular") return "cardiovascular";
  if (alert.system === "nervous") return "nervous";
  return "scheduling";
}

function OfficialCard({
  alert,
  acknowledged,
  onAcknowledge,
  onDismiss,
  onSnooze,
  handled = false,
  onRestore,
}: {
  alert: Alert;
  acknowledged: boolean;
  onAcknowledge: () => void;
  onDismiss: () => void;
  onSnooze: () => void;
  handled?: boolean;
  onRestore?: () => void;
}) {
  return (
    <article
      className={`response-alert response-alert-${alert.level} ${acknowledged ? "is-handled" : ""}`}
    >
      <div className="spread alert-title-row">
        <div className="row alert-heading">
          <span className="alert-mark" aria-hidden="true">
            <ShieldAlert size={18} />
          </span>
          <div>
            <div className="eyebrow">
              Official rule {alert.ruleId || "notice"}
            </div>
            <h3>{alert.title}</h3>
          </div>
        </div>
        <Status
          level={alert.level}
          label={
            alert.level === "act"
              ? "Action"
              : alert.level === "emergency"
                ? "Emergency"
                : alert.level === "watch"
                  ? "Watch"
                  : "Normal"
          }
        />
      </div>
      <p className="alert-description">{alert.description}</p>
      {(alert.observed || alert.threshold) && (
        <div className="alert-evidence grid-2">
          <div>
            <span className="field-label">Observed</span>
            <strong>{alert.observed || "Not recorded"}</strong>
          </div>
          <div>
            <span className="field-label">Configured threshold</span>
            <strong>{alert.threshold || "Not configured"}</strong>
          </div>
        </div>
      )}
      {alert.action && (
        <p className="small-text alert-action">
          <strong>Documentation cue:</strong> {alert.action}
        </p>
      )}
      <div className="alert-meta row">
        <span>
          <Clock3 size={13} /> {timeAgo(alert.timestamp)}
        </span>
        <span>{alert.source}</span>
        {acknowledged && (
          <span className="handled-label">
            <Check size={13} /> Acknowledged
          </span>
        )}
      </div>
      <div className="row alert-actions">
        {!acknowledged && (
          <button className="button primary small" onClick={onAcknowledge}>
            <Check size={15} /> Acknowledge
          </button>
        )}
        {handled ? (
          <button
            className="button secondary small"
            onClick={() => onRestore?.()}
          >
            <RotateCcw size={15} /> Restore
          </button>
        ) : (
          <>
            <button className="button ghost small" onClick={onSnooze}>
              <Clock3 size={15} /> Snooze 1 hour
            </button>
            <button className="button ghost small" onClick={onDismiss}>
              <X size={15} /> Dismiss
            </button>
          </>
        )}
        {alert.system && (
          <Link className="text-link small-link" to={`/system/${alert.system}`}>
            Show system <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </article>
  );
}

function AdvisoryCard({
  alert,
  onDismiss,
  onSnooze,
  handled = false,
  onRestore,
}: {
  alert: Alert;
  onDismiss: () => void;
  onSnooze: () => void;
  handled?: boolean;
  onRestore?: () => void;
}) {
  const openWith = useCopilotStore((s) => s.openWith);
  return (
    <article className="response-advisory">
      <div className="spread alert-title-row">
        <div className="row alert-heading">
          <span className="advisory-mark" aria-hidden="true">
            <Sparkles size={17} />
          </span>
          <div>
            <div className="eyebrow">Pattern advisory · not a rule</div>
            <h3>{alert.title}</h3>
          </div>
        </div>
        <Badge tone="info">Advisory only</Badge>
      </div>
      <p className="alert-description">{alert.description}</p>
      <div className="advisory-meter">
        <span style={{ width: `${alert.confidence ?? 60}%` }} />
      </div>
      <div className="alert-meta row">
        <span>{alert.confidence ?? 60}% pattern confidence</span>
        <span>{timeAgo(alert.timestamp)}</span>
        <span>{alert.source}</span>
      </div>
      <Notice tone="info">
        This is a quiet on-device pattern notice. It has no clinical authority,
        does not page anyone, and does not change official alerts.
      </Notice>
      <div className="row alert-actions">
        {handled ? (
          <button
            className="button secondary small"
            onClick={() => onRestore?.()}
          >
            <RotateCcw size={15} /> Restore
          </button>
        ) : (
          <>
            <button className="button ghost small" onClick={onSnooze}>
              <Clock3 size={15} /> Snooze 1 hour
            </button>
            <button className="button ghost small" onClick={onDismiss}>
              <X size={15} /> Dismiss
            </button>
          </>
        )}
        <button
          className="button secondary small"
          onClick={() => openWith(`Explain this advisory pattern in plain language: ${alert.title}`)}
        >
          <Sparkles size={15} /> Explain with AURA
        </button>
        {alert.system && (
          <Link className="text-link small-link" to={`/system/${alert.system}`}>
            Show system <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </article>
  );
}

function ReminderCard({
  alert,
  onSnooze,
  onDismiss,
  handled = false,
  onRestore,
}: {
  alert: Alert;
  onSnooze: () => void;
  onDismiss: () => void;
  handled?: boolean;
  onRestore?: () => void;
}) {
  return (
    <article className="response-reminder row">
      <div className="reminder-icon">
        <BellRing size={18} />
      </div>
      <div className="stack compact-stack">
        <h3>{alert.title}</h3>
        <p className="small-text">{alert.description}</p>
        <span className="small-text muted">
          <Clock3 size={12} /> {timeAgo(alert.timestamp)} · {alert.source}
        </span>
      </div>
      <div className="row reminder-actions">
        {handled ? (
          <button
            className="button secondary small"
            onClick={() => onRestore?.()}
          >
            <RotateCcw size={15} /> Restore
          </button>
        ) : (
          <>
            <button className="button ghost small" onClick={onSnooze}>
              Snooze
            </button>
            <button
              className="icon-button"
              onClick={onDismiss}
              aria-label={`Dismiss ${alert.title}`}
            >
              <X size={17} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function AlertsPage() {
  const crewId = useCrewStore((state) => state.activeCrewId);
  const acknowledged = useAppStore((state) => state.acknowledged);
  const dismissed = useAppStore((state) => state.dismissed);
  const snoozed = useAppStore((state) => state.snoozed);
  const acknowledge = useAppStore((state) => state.acknowledge);
  const dismiss = useAppStore((state) => state.dismiss);
  const restore = useAppStore((state) => state.restore);
  const snooze = useAppStore((state) => state.snooze);
  const [lane, setLane] = useState<Lane>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [showHandled, setShowHandled] = useState(false);
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [undo, setUndo] = useState<UndoItem | null>(null);

  const alerts = useAlerts();
  const scoped = (alert: Alert) => scopedKey(alert.id, crewId);
  const isAcknowledged = (alert: Alert) =>
    alert.acknowledged || acknowledged[scoped(alert)] === true;
  const isDismissed = (alert: Alert) => dismissed[scoped(alert)] === true;
  const isSnoozed = (alert: Alert) => !isExpired(snoozed[scoped(alert)]);
  const matchesFilters = (alert: Alert) => {
    const laneMatch =
      lane === "all" ||
      (lane === "official" && alert.kind === "rule") ||
      (lane === "advisory" && alert.kind === "advisory") ||
      (lane === "reminders" && alert.kind === "reminder");
    const statusMatch = status === "all" || alert.level === status;
    const categoryMatch =
      category === "all" || alertCategory(alert) === category;
    const hiddenMatch =
      showHandled || (!isDismissed(alert) && !isSnoozed(alert));
    return laneMatch && statusMatch && categoryMatch && hiddenMatch;
  };
  const filtered = alerts.filter(matchesFilters);
  const official = filtered.filter((alert) => alert.kind === "rule");
  const advisories = filtered.filter((alert) => alert.kind === "advisory");
  const reminders = filtered.filter((alert) => alert.kind === "reminder");
  const openCount = alerts.filter(
    (alert) =>
      alert.kind === "rule" &&
      !isAcknowledged(alert) &&
      !isDismissed(alert) &&
      !isSnoozed(alert),
  ).length;
  const hiddenCount = alerts.filter(
    (alert) => isDismissed(alert) || isSnoozed(alert),
  ).length;

  const runAction = (alert: Alert, action: "dismiss" | "snooze") => {
    const id = alert.id;
    if (action === "dismiss") {
      dismiss(id, crewId);
      setUndo({
        label: `${alert.title} dismissed`,
        restore: () => restore(id, crewId),
      });
    } else {
      snooze(id, crewId, 60);
      setUndo({
        label: `${alert.title} snoozed for 1 hour`,
        restore: () => restore(id, crewId),
      });
    }
  };

  const visibleLane = lane === "all" ? "all" : lane;
  return (
    <section className="page response-page">
      <PageHeader
        eyebrow="Home / Alerts"
        title="A clear next look"
        description="Official rules, quieter pattern notes, and reminders live in separate lanes. Nothing here is a diagnosis."
        actions={
          <button
            className="button secondary small"
            onClick={() => setVisibilityOpen(true)}
          >
            <Eye size={16} /> Visibility
          </button>
        }
      />
      <SimulatedBanner />

      <div className="response-summary panel">
        <div>
          <span className="eyebrow">Open official alerts</span>
          <strong className="summary-number">{openCount}</strong>
          <span className="small-text muted">
            for {useCrewStore.getState().getActiveMember().name}
          </span>
        </div>
        <div className="summary-copy">
          <Badge tone={openCount ? "warning" : "success"} dot>
            {openCount ? "Review at your pace" : "No open official rules"}
          </Badge>
          <span className="small-text muted">
            {hiddenCount
              ? `${hiddenCount} hidden or snoozed`
              : "Nothing is hidden"}
          </span>
        </div>
      </div>

      <Panel
        className="filter-panel"
        title="Filter the view"
        subtitle="Filters change what is visible on this device only."
      >
        <div className="filter-grid">
          <div className="filter-group">
            <span className="field-label">
              <Filter size={13} /> Lane
            </span>
            <Tabs
              items={laneItems}
              value={visibleLane}
              onChange={(value) => setLane(value as Lane)}
              label="Alert lane"
            />
          </div>
          <label className="field">
            <span className="field-label">Status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as StatusFilter)
              }
            >
              {statusItems.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categoryItems.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      {(visibleLane === "all" || visibleLane === "official") && (
        <Panel
          title="Official alerts"
          subtitle="Rule-based signals with the observed value and configured threshold."
        >
          <div className="lane-label">
            <Icon name="shield-alert" size={17} />
            <span>Mission rules</span>
            <Badge tone={official.length ? "warning" : "success"}>
              {official.length} shown
            </Badge>
          </div>
          {official.length ? (
            <div className="stack">
              {official.map((alert) => (
                <OfficialCard
                  key={alert.id}
                  alert={alert}
                  acknowledged={isAcknowledged(alert)}
                  handled={isDismissed(alert) || isSnoozed(alert)}
                  onRestore={() => restore(alert.id, crewId)}
                  onAcknowledge={() => acknowledge(alert.id, crewId)}
                  onDismiss={() => runAction(alert, "dismiss")}
                  onSnooze={() => runAction(alert, "snooze")}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="shield-alert"
              title="No official alerts in this view"
              description={
                showHandled
                  ? "There are no rule-based alerts matching these filters."
                  : "Nothing needs your attention in the current window."
              }
            />
          )}
        </Panel>
      )}

      {(visibleLane === "all" || visibleLane === "advisory") && (
        <Panel
          className="advisory-panel"
          title="Advisory notices"
          subtitle="A quieter computational view, kept visually separate from official rules."
        >
          <div className="lane-label advisory-label">
            <Sparkles size={17} />
            <span>On-device pattern notes</span>
            <Badge tone="info">No clinical authority</Badge>
          </div>
          {advisories.length ? (
            <div className="stack">
              {advisories.map((alert) => (
                <AdvisoryCard
                  key={alert.id}
                  alert={alert}
                  handled={isDismissed(alert) || isSnoozed(alert)}
                  onRestore={() => restore(alert.id, crewId)}
                  onDismiss={() => runAction(alert, "dismiss")}
                  onSnooze={() => runAction(alert, "snooze")}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="brain"
              title="No advisory notices in this view"
              description="Pattern notices may be absent, dismissed, or snoozed."
            />
          )}
        </Panel>
      )}

      {(visibleLane === "all" || visibleLane === "reminders") && (
        <Panel
          title="Reminders"
          subtitle="Scheduling prompts are informational and reversible."
        >
          {reminders.length ? (
            <div className="stack">
              {reminders.map((alert) => (
                <ReminderCard
                  key={alert.id}
                  alert={alert}
                  handled={isDismissed(alert) || isSnoozed(alert)}
                  onRestore={() => restore(alert.id, crewId)}
                  onSnooze={() => runAction(alert, "snooze")}
                  onDismiss={() => runAction(alert, "dismiss")}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="activity"
              title="No reminders in this view"
              description="There are no scheduling prompts matching these filters."
            />
          )}
        </Panel>
      )}

      {undo && (
        <div className="undo-bar" role="status">
          <span>{undo.label}</span>
          <button
            className="button secondary small"
            onClick={() => {
              undo.restore();
              setUndo(null);
            }}
          >
            <RotateCcw size={14} /> Undo
          </button>
          <button
            className="icon-button"
            onClick={() => setUndo(null)}
            aria-label="Close undo message"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <Dialog
        className="response-dialog"
        open={visibilityOpen}
        onClose={() => setVisibilityOpen(false)}
        title="Visibility options"
      >
        <div className="dialog-body stack">
          <Notice tone="info">
            Acknowledgements stay attached to the selected crew member.
            Dismissed and snoozed items can be restored here.
          </Notice>
          <label className="toggle-row">
            <span>
              <strong>Show dismissed and snoozed</strong>
              <small>
                Keep handled items in the lanes with a quieter treatment.
              </small>
            </span>
            <input
              type="checkbox"
              checked={showHandled}
              onChange={(event) => setShowHandled(event.target.checked)}
            />
          </label>
          <div className="row dialog-actions">
            <button
              className="button secondary"
              onClick={() => {
                setShowHandled(false);
                setVisibilityOpen(false);
              }}
            >
              Done
            </button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}
