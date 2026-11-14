import ForecastPanel from "../components/ForecastPanel";
import RiskCard from "../components/RiskCard";
import SimulatedBanner from "../components/SimulatedBanner";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";
import {
  getBodySystems,
  getSimulatedVitals,
  type HazardTag,
  type VitalSign,
} from "../data/vitalsData";
import {
  Badge,
  Delta,
  Dialog,
  Icon,
  LineChart,
  PageHeader,
  Select,
  Status,
  Tabs,
} from "../components/ui";
import ModelViewport from "../components/body/ModelViewport";
import "../styles/health.css";

const HAZARDS: Array<HazardTag | "all"> = [
  "all",
  "Gravity",
  "Radiation",
  "Isolation",
  "Environment",
];
type Range = "7d" | "14d";

function rangeSeries(spark: number[], range: Range) {
  if (range === "14d") return spark;
  if (range === "7d") return spark.slice(-7);
  return Array.from({ length: 10 }, (_, index) => {
    const start = Math.floor((index * spark.length) / 10);
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) * spark.length) / 10),
    );
    const points = spark.slice(start, end);
    return points.reduce((sum, value) => sum + value, 0) / points.length;
  });
}
function rangeLabels(range: Range) {
  return range === "7d"
    ? ["7 days ago", "3 days ago", "Today"]
    : (range as string) === "30d"
      ? ["30 days ago", "15 days ago", "Today"]
      : ["14 days ago", "7 days ago", "Today"];
}
function displayValue(vital: VitalSign) {
  return vital.display || `${vital.value}${vital.unit ? ` ${vital.unit}` : ""}`;
}
const BASELINE_BANDS: Record<string, [number, number]> = {
  "heart-rate": [58, 68],
  "blood-pressure": [112, 126],
  spo2: [96, 99],
  temperature: [36.3, 36.9],
  weight: [71.8, 72.6],
  sleep: [7.08, 8.33],
  pvt: [224, 256],
  hrv: [52, 64],
  vo2max: [42.5, 46],
  radiation: [0.4, 0.9],
};
function baselineBand(vital: VitalSign): [number, number] {
  return BASELINE_BANDS[vital.id] || vital.normalRange;
}

export default function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const [hazard, setHazard] = useState<HazardTag | "all">("all");
  const [range, setRange] = useState<Range>("14d");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const vitals = useMemo(() => getSimulatedVitals(), []);
  const systems = useMemo(() => getBodySystems(), []);
  const tab = params.get("view") === "body" ? "body" : "metrics";
  const selected = vitals.find((vital) => vital.id === selectedId);
  const shown =
    hazard === "all"
      ? vitals
      : vitals.filter((vital) => vital.hazard === hazard);
  const watchCount = vitals.filter((vital) => vital.status !== "normal").length;
  const focusVital =
    vitals.find((vital) => vital.status === "watch") || vitals[0];
  const setTab = (value: string) => {
    setParams(value === "body" ? { view: "body" } : {});
  };

  return (
    <section className="health-page page">
      <PageHeader
        eyebrow="AURA / crew health"
        title="My health, in context"
        description={`Your own baseline is the reference point. ${watchCount} of ${vitals.length} demo signals are worth a closer look today.`}
        actions={
          <>
            <Badge tone="info" dot>
              Demo workspace
            </Badge>
            <span className="small-text">
              Updated across sources · confidence shown per signal
            </span>
          </>
        }
      />
      <div className="health-toolbar">
        <Tabs
          items={[
            { value: "metrics", label: "Metrics" },
            { value: "body", label: "Body view" },
          ]}
          value={tab}
          onChange={setTab}
          label="Health view"
        />
        <div className="row">
          <span className="small-text">Time range</span>
          <Select
            label="Chart time range"
            value={range}
            onChange={(value) => setRange(value as Range)}
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
          </Select>
        </div>
      </div>
      {tab === "body" ? (
        <BodyDashboard systems={systems} />
      ) : (
        <>
          <div className="health-overview">
            <div className="panel health-chart-panel">
              <div className="chart-title">
                <div>
                  <div className="eyebrow">Signal trend</div>
                  <strong>{focusVital.label}</strong>
                </div>
                <span>
                  {(range as string) === "30d"
                    ? "30-day view"
                    : range === "7d"
                      ? "7-day view"
                      : "14-day view"}
                </span>
              </div>
              <LineChart
                unit={focusVital.unit}
                values={rangeSeries(focusVital.spark, range)}
                range={baselineBand(focusVital)}
                color="var(--forest-2)"
                label={`${focusVital.label} demo trend against personal baseline`}
                dates={rangeLabels(range)}
              />
              <div className="chart-meta">
                <span>
                  Personal baseline <b>{focusVital.baseline}</b>
                </span>
                <span>
                  Confidence <b>{focusVital.confidence}%</b>
                </span>
                <span>
                  Source time <b>{focusVital.updated}</b>
                </span>
              </div>
            </div>
            <div className="panel health-snapshot">
              <div className="eyebrow">Today at a glance</div>
              <h2>Steady, with a few threads to follow.</h2>
              <div className="snapshot-value">
                {vitals.length - watchCount}
                <small> usual</small>
              </div>
              <div className="snapshot-rule" />
              <ul className="snapshot-list">
                <li>
                  <span>Signals in usual range</span>
                  <span>
                    {vitals.length - watchCount}/{vitals.length}
                  </span>
                </li>
                <li>
                  <span>Confidence floor</span>
                  <span>
                    {Math.min(...vitals.map((vital) => vital.confidence))}%
                  </span>
                </li>
                <li>
                  <span>Next useful action</span>
                  <span>Review check-in</span>
                </li>
              </ul>
              <Link to="/checkin" className="button secondary small">
                Open daily check-in <ChevronRight size={14} />
              </Link>
            </div>
          </div>
          <div className="health-section">
            <div className="health-section-heading">
              <div>
                <div className="eyebrow">Measures</div>
                <h2>Signals against your baseline</h2>
              </div>
              <span className="small-text">
                <CalendarDays
                  size={13}
                  style={{ display: "inline", verticalAlign: "-2px" }}
                />{" "}
                {(range as string) === "30d"
                  ? "30 days"
                  : range === "7d"
                    ? "7 days"
                    : "14 days"}{" "}
                · bands show own-normal
              </span>
            </div>
            <div
              className="health-filter-row"
              role="group"
              aria-label="Filter by hazard"
            >
              {HAZARDS.map((item) => (
                <button
                  key={item}
                  className="health-filter"
                  aria-pressed={hazard === item}
                  onClick={() => setHazard(item)}
                >
                  {item === "all" ? "All signals" : item}
                </button>
              ))}
            </div>
            <div className="health-grid-3" style={{ marginTop: 13 }}>
              {shown.map((vital) => (
                <MetricCard
                  key={vital.id}
                  vital={vital}
                  range={range}
                  onOpen={() => setSelectedId(vital.id)}
                />
              ))}
            </div>
            {shown.length === 0 && (
              <div className="empty-state" style={{ marginTop: 14 }}>
                <h3>No signals tagged with this hazard</h3>
                <p>Choose another filter to return to the demo measurements.</p>
              </div>
            )}
          </div>
          <div className="health-section">
            <div className="health-section-heading">
              <div>
                <div className="eyebrow">Systems</div>
                <h2>Body systems</h2>
              </div>
              <span className="small-text">Conditioning vs demo plan</span>
            </div>
            <div className="health-grid-3">
              {systems.map((system) => (
                <Link
                  key={system.id}
                  to={`/system/${system.id}`}
                  className="system-card"
                >
                  <div className="system-card-top">
                    <span className="system-icon">
                      <Icon name={system.icon} size={19} />
                    </span>
                    <div>
                      <h3>{system.name}</h3>
                      <Status
                        level={system.status}
                        label={system.statusLabel}
                      />
                    </div>
                    <span className="system-score">{system.score}</span>
                  </div>
                  <div className="score-bar">
                    <span style={{ width: `${system.score}%` }} />
                  </div>
                  <p>
                    {system.relatedMetrics.length} related signal
                    {system.relatedMetrics.length === 1 ? "" : "s"} ·{" "}
                    {system.hazards.join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
      <SimulatedBanner />
      <RiskCard />
      <ForecastPanel />
      <Dialog
        className="health-dialog"
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.label || "Metric detail"}
      >
        {selected && (
          <div className="dialog-body">
            <div>
              <div className="eyebrow">Personal signal · demo</div>
              <div className="dialog-value">{displayValue(selected)}</div>
              <p className="muted">
                {selected.statusLabel}. This comparison uses the displayed own
                baseline, not a population reference.
              </p>
            </div>
            <LineChart
              unit={selected.unit}
              values={rangeSeries(selected.spark, range)}
              range={baselineBand(selected)}
              color="var(--forest-2)"
              label={`${selected.label} detail trend`}
              dates={rangeLabels(range)}
            />
            <div className="grid-2">
              <div>
                <div className="field-label">Own baseline</div>
                <strong>{selected.baseline}</strong>
              </div>
              <div>
                <div className="field-label">Confidence</div>
                <strong>
                  {selected.confidence}% · {selected.updated}
                </strong>
              </div>
            </div>
            <div className="notice notice-info">
              Demo data only. A trend or baseline drift is informational and not
              a diagnosis.
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}

function MetricCard({
  vital,
  range,
  onOpen,
}: {
  vital: VitalSign;
  range: Range;
  onOpen: () => void;
}) {
  return (
    <button
      className="metric-card"
      onClick={onOpen}
      aria-label={`Open details for ${vital.label}`}
    >
      <div className="metric-card-header">
        <span className="metric-icon">
          <Icon name={vital.icon} size={17} />
        </span>
        <Status level={vital.status} label={vital.statusLabel} />
      </div>
      <div className="metric-label">{vital.label}</div>
      <div className="metric-value">
        {vital.display || vital.value}
        <small>{vital.unit}</small>
      </div>
      <div className="metric-baseline">Own baseline · {vital.baseline}</div>
      <LineChart
        compact
        values={rangeSeries(vital.spark, range)}
        range={baselineBand(vital)}
        color="var(--forest-2)"
        label={`${vital.label} ${range} demo trend`}
      />
      <div className="metric-footer">
        {vital.delta !== undefined ? (
          <Delta
            value={vital.delta}
            unit={vital.unit === "bpm" ? " bpm" : ""}
          />
        ) : (
          <span className="delta">Stable read</span>
        )}
        <span className="metric-updated">
          {vital.updated} · {vital.confidence}% demo confidence
        </span>
      </div>
    </button>
  );
}

function BodyDashboard({
  systems,
}: {
  systems: ReturnType<typeof getBodySystems>;
}) {
  return (
    <div className="body-layout">
      <ModelViewport systems={systems} />
      <aside className="panel body-context">
        <div className="eyebrow">Body view</div>
        <h2>See the systems together</h2>
        <p>
          The human anatomy atlas, with every tracked system in one calm
          view. The list beside it keeps each system — and its signals —
          discoverable.
        </p>
        <ul className="body-context-list">
          {systems.map((system) => (
            <li key={system.id}>
              <Link to={`/system/${system.id}`}>
                <span>{system.name}</span>
                <strong>
                  {system.score}{" "}
                  <ChevronRight
                    size={14}
                    style={{ display: "inline", verticalAlign: "-2px" }}
                  />
                </strong>
              </Link>
            </li>
          ))}
        </ul>
        <div className="demo-disclaimer">
          Plan scores are demo context, not clinical measurements.
        </div>
      </aside>
    </div>
  );
}
