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
import { MODEL_MAP, type ModelId } from "../../lib/anatomy/types";
import { Badge, Icon } from "../ui";

/**
 * Container for the human anatomy atlas. The scene is lazy-loaded so the
 * main bundle stays light. Tap a structure to select its workspace system
 * (when onSelectSystem is provided); the systems index beside it always
 * works too.
 */

const AtlasBodyScene = lazy(() => import("./AtlasBodyScene"));

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

function ViewerUnavailable({ systems }: { systems: BodySystem[] }) {
  return (
    <div className="model-viewport-status">
      <div className="model-empty">
        <div className="metric-icon">
          <Icon name="activity" size={19} />
        </div>
        <Badge tone="neutral">Quiet fallback</Badge>
        <h3>3D view unavailable here</h3>
        <p>
          This browser could not start the anatomy atlas. The systems index
          below still leads everywhere.
        </p>
        <div className="model-system-links">
          {systems.map((system) => (
            <Link key={system.id} to={`/system/${system.id}`}>
              {system.name}
            </Link>
          ))}
        </div>
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
}: {
  systems?: BodySystem[];
  model?: ModelId;
  activeSystemId?: string;
  onSelectSystem?: (id: string) => void;
  className?: string;
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
              />
            </Suspense>
          </ModelErrorBoundary>
        </div>
      )}
      {failed && <ViewerUnavailable systems={systems} />}
      <div className="model-asset-note">
        Drag to orbit · scroll to zoom · tap a structure
        {active ? ` — ${active.name}` : ""} · {def.credit}
      </div>
    </div>
  );
}
