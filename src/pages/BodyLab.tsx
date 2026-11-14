import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getBodySystems } from "../data/vitalsData";
import { MODELS, MODEL_MAP, type ModelId } from "../lib/anatomy/types";
import { Badge, PageHeader } from "../components/ui";
import ModelViewport from "../components/body/ModelViewport";
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
  const def = MODEL_MAP[model];

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
          <ModelViewport
            systems={systems}
            model={model}
            activeSystemId={activeId ?? undefined}
            onSelectSystem={setActiveId}
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
