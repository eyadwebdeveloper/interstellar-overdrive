import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getBodySystems } from "../data/vitalsData";
import { MODELS, MODEL_MAP, type ModelId } from "../lib/anatomy/types";
import { Badge, PageHeader } from "../components/ui";
import ModelViewport from "../components/body/ModelViewport";
import { systemCallouts } from "../components/body/callouts";
import { INSIDE_LAYERS, VIEWS, ZOOMS, type ZoomId } from "../components/body/presets";
import type { ViewId } from "../components/body/anatomyEngine";
import { useIntelligence } from "../hooks/useIntelligence";
import { AiBadge } from "../components/ai/parts";
import "../styles/health.css";

/** Per-model orientation notes shown under the switcher. */
const MODEL_NOTES: Record<ModelId, string> = {
  male: "Reference anatomy for orientation. Every structure is individually labelled and tappable.",
  female:
    "The female reference atlas. Bones the source does not model are borrowed from the male reference and fitted to shared landmarks; leg muscles come from a second donor. Both are labelled as such in the viewer.",
  muscles:
    "Hip, thigh, and calf muscles from the Visible Human Female, fitted to this body's leg bones. A second woman's anatomy, shown for the muscle groups that matter most in flight.",
};

export default function BodyLab() {
  const systems = getBodySystems();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [model, setModel] = useState<ModelId>("male");
  const [view, setView] = useState<ViewId>("three-quarter");
  const [zoom, setZoom] = useState<ZoomId>("upper");
  const [inside, setInside] = useState(true);
  const [showAi, setShowAi] = useState(true);
  const intel = useIntelligence();
  const callouts = useMemo(() => systemCallouts(intel), [intel]);
  const def = MODEL_MAP[model];
  const framing = ZOOMS.find((z) => z.id === zoom)!.framing;
  // The leg-muscle model has its own framing and layers.
  const wholeBody = model !== "muscles";

  function switchModel(next: ModelId) {
    setModel(next);
    setActiveId(null); // emphasis is per-model; drop it when switching
  }

  return (
    <section className="health-page page body-lab-page">
      <PageHeader
        eyebrow="AURA / body"
        title="Body view"
        description="The human anatomy atlas, with the four systems that matter most far from Earth. Tap a structure — or the index beside it — and the matching system comes forward."
        actions={
          <Badge tone="info" dot>
            Human atlas
          </Badge>
        }
      />
      <div className="body-layout">
        <div className="body-stage">
          <div className="model-switch" role="group" aria-label="Anatomy model">
            {MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={m.id === model}
                onClick={() => switchModel(m.id)}
              >
                <span>{m.label}</span>
                <small>{m.tag}</small>
              </button>
            ))}
          </div>
          {wholeBody && (
            <div className="body-toolbar" role="toolbar" aria-label="View controls">
              <div className="body-toolbar-group" role="group" aria-label="Viewing angle">
                <span>Angle</span>
                {VIEWS.map((v) => (
                  <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}>
                    {v.label}
                  </button>
                ))}
              </div>
              <div className="body-toolbar-group" role="group" aria-label="Zoom">
                <span>Zoom</span>
                {ZOOMS.map((z) => (
                  <button key={z.id} type="button" aria-pressed={zoom === z.id} onClick={() => setZoom(z.id)}>
                    {z.label}
                  </button>
                ))}
              </div>
              <div className="body-toolbar-group" role="group" aria-label="Layers">
                <span>Layers</span>
                <button type="button" aria-pressed={inside} onClick={() => setInside(true)}>
                  See inside
                </button>
                <button type="button" aria-pressed={!inside} onClick={() => setInside(false)}>
                  With muscle
                </button>
              </div>
              <div className="body-toolbar-group" role="group" aria-label="AI overlay">
                <button type="button" className="ai-toggle" aria-pressed={showAi} onClick={() => setShowAi((v) => !v)}>
                  <AiBadge>AI findings</AiBadge> {showAi ? "On" : "Off"}
                </button>
              </div>
            </div>
          )}
          <ModelViewport
            systems={systems}
            model={model}
            activeSystemId={activeId ?? undefined}
            onSelectSystem={setActiveId}
            view={view}
            framing={wholeBody ? framing : undefined}
            layers={wholeBody && inside ? INSIDE_LAYERS : undefined}
            callouts={wholeBody && showAi ? callouts : undefined}
          />
        </div>
        <aside className="panel body-context">
          <div className="eyebrow">Systems index</div>
          <h2>Choose a system</h2>
          <p>
            Hover or focus an entry to bring it forward on the atlas. Tap a
            structure or a row to open the system detail.
          </p>
          <ul className="body-context-list">
            {systems.map((system) => (
              <li
                key={system.id}
                className={system.id === activeId ? "active" : ""}
                onMouseEnter={() => setActiveId(system.id)}
              >
                <Link
                  to={`/system/${system.id}`}
                  onFocus={() => setActiveId(system.id)}
                >
                  <span>{system.name}</span>
                  <strong>
                    {system.statusLabel}{" "}
                    <ChevronRight
                      size={14}
                      style={{ display: "inline", verticalAlign: "-2px" }}
                    />
                  </strong>
                </Link>
              </li>
            ))}
          </ul>
          <div className="model-credit">
            <div className="model-credit-name">
              {def.label} · {def.dataset}
            </div>
            <p>{MODEL_NOTES[model]}</p>
            <p className="model-credit-license">{def.credit}</p>
          </div>
          <div className="demo-disclaimer">
            Reference anatomy, shown for orientation. Plan scores and labels
            are demo data, not a clinical reading.
          </div>
        </aside>
      </div>
    </section>
  );
}
