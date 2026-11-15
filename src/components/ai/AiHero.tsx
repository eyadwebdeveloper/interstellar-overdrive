import { lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Cpu } from "lucide-react";
import { SUGGESTED_PROMPTS } from "../../ai/copilot";
import { useIntelligence } from "../../hooks/useIntelligence";
import { useAuraSource } from "../../hooks/useAura";
import { useCopilotStore } from "../../stores/copilotStore";
import { getSimulatedVitals } from "../../data/vitalsData";
import { AiBadge, ReadinessRing } from "./parts";
import "../../styles/ai.css";

const AtlasStage = lazy(() => import("../body/AtlasStage"));

/**
 * The first thing people see on Overview: the AI's reading of today, with the
 * 3D body lit up by its findings. Puts both headline features on screen at once.
 */
export default function AiHero() {
  const intel = useIntelligence();
  const navigate = useNavigate();
  const openWith = useCopilotStore((s) => s.openWith);
  const { source } = useAuraSource();
  const [q, setQ] = useState("");
  const hr = getSimulatedVitals().find((v) => v.id === "heart-rate")?.value ?? 64;
  const top = intel.drivers.filter((d) => d.points < 0).slice(0, 3);
  const worst = Math.max(1, ...top.map((d) => -d.points));

  return (
    <section className="ai-hero" aria-labelledby="ai-hero-title">
      <div className="ai-hero-copy">
        <div className="ai-hero-eyebrow">
          <AiBadge>AURA Intelligence</AiBadge>
          <span>
            <Cpu size={12} aria-hidden="true" />
            Analysed on this device{source === "live" ? " + backend models" : ""}
          </span>
        </div>
        <h2 id="ai-hero-title">{intel.headline}</h2>
        <p className="ai-hero-summary">{intel.summary}</p>

        <div className="ai-hero-read">
          <ReadinessRing value={intel.readiness} label={intel.readinessLabel.toLowerCase()} size={116} />
          <div className="ai-hero-drivers">
            <strong>What’s moving your readiness</strong>
            {top.length === 0 && <span className="ai-dim">Nothing is pulling it down today.</span>}
            {top.map((d) => (
              <div key={d.id} className="ai-driver">
                <span>{d.label}</span>
                <div className="ai-driver-bar" aria-hidden="true">
                  <i style={{ width: `${(-d.points / worst) * 100}%` }} />
                </div>
                <b>{d.points}</b>
              </div>
            ))}
          </div>
        </div>

        <ul className="ai-hero-findings">
          {intel.patterns.slice(0, 2).map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => openWith(p.ask)}>
                <span>
                  <b>{p.title}</b>
                  <small>{Math.round(p.confidence * 100)}% support · tap to have AURA explain it</small>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        <form
          className="ai-ask"
          onSubmit={(e) => {
            e.preventDefault();
            openWith(q.trim() || "How am I doing today?");
            setQ("");
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask AURA: why is my reaction time slower?" aria-label="Ask AURA a question" maxLength={200} />
          <button type="submit" aria-label="Ask">
            <ArrowRight size={18} />
          </button>
        </form>
        <div className="ai-chips">
          {SUGGESTED_PROMPTS.slice(1, 4).map((p) => (
            <button type="button" key={p} onClick={() => openWith(p)}>
              {p}
            </button>
          ))}
          <Link to="/intelligence">See how it works</Link>
        </div>
      </div>

      <div className="ai-hero-stage">
        <Suspense fallback={<div className="atlas-stage-loading">Opening the anatomy atlas…</div>}>
          <AtlasStage intel={intel} heartRate={hr} onSelectSystem={(id) => navigate(`/system/${id}`)} />
        </Suspense>
        <div className="ai-stage-caption">
          <span>
            <i /> Human-Atlas anatomy · drag to orbit · tap a label to open the system
          </span>
          <Link to="/body">
            Open full anatomy atlas <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}
