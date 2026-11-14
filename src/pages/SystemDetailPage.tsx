import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Dumbbell, MessageCircle } from "lucide-react";
import { getBodySystems, getSimulatedVitals } from "../data/vitalsData";
import { Badge, Icon, PageHeader, Status } from "../components/ui";
import ModelViewport from "../components/body/ModelViewport";
import "../styles/health.css";

export default function SystemDetailPage() {
  const { systemId } = useParams<{ systemId: string }>();
  const systems = getBodySystems();
  const vitals = getSimulatedVitals();
  const system = systems.find((item) => item.id === systemId);

  if (!system)
    return (
      <section className="health-page page">
        <Link to="/dashboard" className="button ghost small">
          <ArrowLeft size={14} /> Back to health
        </Link>
        <div className="empty-state" style={{ marginTop: 24 }}>
          <h1>System not found</h1>
          <p>This demo system is not available in the current workspace.</p>
          <Link to="/dashboard" className="button primary">
            Return to dashboard
          </Link>
        </div>
      </section>
    );

  const related = vitals.filter((vital) =>
    system.relatedMetrics.includes(vital.id),
  );
  return (
    <section className="health-page page">
      <PageHeader
        eyebrow="AURA / body system"
        title={system.name}
        description="A focused view of the signals connected to this system and the actions already available in the workspace."
        actions={
          <>
            <Badge tone="info" dot>
              Demo context
            </Badge>
            <Link to="/dashboard" className="button ghost small">
              <ArrowLeft size={14} /> All health
            </Link>
          </>
        }
      />
      <div className="system-layout">
        <div className="system-viewer">
          <ModelViewport systems={systems} activeSystemId={system.id} />
          <p className="demo-disclaimer">
            The atlas brings this system forward and quiets the rest. Use the
            linked metrics and actions alongside it. Plan scores are demo data.
          </p>
        </div>
        <aside className="system-side">
          <section className="panel">
            <div className="eyebrow">Plan signal</div>
            <div className="score-lockup">
              <div className="score-number">
                {system.score}
                <small>demo score / 100</small>
              </div>
              <div>
                <Status level={system.status} label={system.statusLabel} />
                <p className="small-text" style={{ marginTop: 7 }}>
                  A comparison with the current demo plan, not a clinical
                  result.
                </p>
              </div>
            </div>
            <div className="score-bar" style={{ marginTop: 18 }}>
              <span style={{ width: `${system.score}%` }} />
            </div>
            <div className="hazard-list">
              {system.hazards.map((hazard) => (
                <span className="hazard" key={hazard}>
                  {hazard}
                </span>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Related measures</div>
                <h2>Signals to review</h2>
              </div>
            </div>
            <div className="related-metrics">
              {related.map((vital) => (
                <Link to="/dashboard" key={vital.id} className="related-metric">
                  <div>
                    <strong>{vital.label}</strong>
                    <span>
                      {vital.statusLabel} · {vital.confidence}% confidence
                    </span>
                  </div>
                  <b>
                    {vital.display ||
                      `${vital.value}${vital.unit ? ` ${vital.unit}` : ""}`}
                  </b>
                </Link>
              ))}
              {related.length === 0 && (
                <p className="muted small-text">No linked demo signals yet.</p>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="eyebrow">Next useful steps</div>
            <h2>Keep the workflow moving</h2>
            <div className="action-list">
              <Link to="/exercise">
                <span>
                  <Dumbbell
                    size={15}
                    style={{ display: "inline", verticalAlign: "-3px" }}
                  />{" "}
                  Review exercise plan
                </span>
                <ChevronRight size={15} />
              </Link>
              <Link to="/checkin">
                <span>
                  <MessageCircle
                    size={15}
                    style={{ display: "inline", verticalAlign: "-3px" }}
                  />{" "}
                  Add a daily check-in
                </span>
                <ChevronRight size={15} />
              </Link>
              <Link to="/alerts">
                <span>
                  <Icon name="shield-alert" size={15} /> Review alerts
                </span>
                <ChevronRight size={15} />
              </Link>
            </div>
          </section>
        </aside>
      </div>
      <section className="panel" style={{ marginTop: 18, padding: 22 }}>
        <div className="eyebrow">Context note</div>
        <h2>Use this view as a conversation starter</h2>
        <p
          className="muted"
          style={{ marginTop: 8, maxWidth: "70ch", lineHeight: 1.5 }}
        >
          {system.description} The dashboard keeps baseline, confidence, and
          source time visible so a crew member can decide what to review next.
          Demo content is informational and does not replace clinical judgment.
        </p>
      </section>
    </section>
  );
}
