import {
  Component,
  lazy,
  Suspense,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { getBodySystems, type BodySystem } from "../../data/vitalsData";
import { MODEL_MAP, type ModelId, type SystemId } from "../../lib/anatomy/types";
import type { Framing, ViewId } from "./anatomyEngine";
import type { Callout } from "./callouts";
import { Badge } from "../ui";
import { useIntelligence } from "../../hooks/useIntelligence";

/**
 * Container for the human anatomy atlas. The scene is lazy-loaded so the
 * main bundle stays light. Tap a structure to select its workspace system
 * (when onSelectSystem is provided); the systems index beside it always
 * works too.
 */

const AtlasBodyScene = lazy(() => import("./AtlasBodyScene"));
const BodyTwin = lazy(() => import("./BodyTwin"));

class ModelErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function ViewerFallback() {
  return (
    <div className="model-viewport-status">
      <div className="model-empty">
        <Badge tone="neutral">Preparing viewer</Badge>
        <p>Opening the anatomy atlas…</p>
      </div>
    </div>
  );
}

function ViewerUnavailable({
  systems,
  onSelectSystem,
  activeSystemId,
}: {
  systems: BodySystem[];
  onSelectSystem?: (id: string) => void;
  activeSystemId?: string;
}) {
  // The detailed atlas could not start (models not installed on this host, or no
  // WebGL2 / DecompressionStream). Show AURA's built-in body twin so there is
  // always a working 3D view, with the AI findings on it.
  const intel = useIntelligence();
  return (
    <div className="model-viewport-twin">
      <Suspense fallback={<ViewerFallback />}>
        <BodyTwin intel={intel} zoom activeSystemId={activeSystemId ?? null} onSelectSystem={onSelectSystem} />
      </Suspense>
      <div className="model-twin-note">
        <Badge tone="neutral">Body twin</Badge>
        <span>The detailed atlas isn’t available here, so this is AURA’s built-in 3D body.</span>
        <span className="model-system-links">
          {systems.map((system) => (
            <Link key={system.id} to={`/system/${system.id}`}>
              {system.name}
            </Link>
          ))}
        </span>
      </div>
    </div>
  );
}

export default function ModelViewport({
  systems = getBodySystems(),
  model,
  activeSystemId,
  onSelectSystem,
  className = "",
  view,
  framing,
  layers,
  callouts,
}: {
  systems?: BodySystem[];
  model?: ModelId;
  activeSystemId?: string;
  onSelectSystem?: (id: string) => void;
  className?: string;
  view?: ViewId;
  framing?: Framing;
  layers?: SystemId[];
  callouts?: Record<string, Callout>;
}) {
  const [failed, setFailed] = useState(false);
  const active = systems.find((system) => system.id === activeSystemId);
  const def = MODEL_MAP[model ?? "male"];
  return (
    <div
      className={`model-viewport ${className}`}
      role="img"
      aria-label={
        active
          ? `Human anatomy atlas, ${active.name} highlighted`
          : `Human anatomy atlas — ${def.label}`
      }
    >
      {!failed && (
        <div className="model-viewport-stage">
          <ModelErrorBoundary onError={() => setFailed(true)}>
            <Suspense fallback={<ViewerFallback />}>
              <AtlasBodyScene
                systems={systems}
                model={model}
                activeSystemId={activeSystemId ?? null}
                onSelectSystem={onSelectSystem}
                onError={() => setFailed(true)}
                view={view}
                framing={framing}
                layers={layers}
                callouts={callouts}
              />
            </Suspense>
          </ModelErrorBoundary>
        </div>
      )}
      {failed && <ViewerUnavailable systems={systems} onSelectSystem={onSelectSystem} activeSystemId={activeSystemId} />}
      <div className="model-asset-note">
        Drag to orbit · scroll to zoom · hover for names · tap a structure
        {active ? ` — ${active.name}` : ""} · {def.credit}
      </div>
    </div>
  );
}
