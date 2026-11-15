import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import type { Intelligence } from "../../ai/engine";
import type { ViewId, Framing } from "./anatomyEngine";
import { systemCallouts } from "./callouts";
import { INSIDE_LAYERS } from "./presets";

/** Close, but head and thighs stay in frame on the portrait hero stage. */
const HERO_FRAMING = { height: 1.62, targetY: 1.03 };

const AtlasBodyScene = lazy(() => import("./AtlasBodyScene"));
const BodyTwin = lazy(() => import("./BodyTwin"));

class Boundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The Human-Atlas body, framed close, on the dark observatory stage, with the AI's
 * findings pinned to the anatomy. Used on Overview and the Intelligence page.
 * If the atlas files can't open (not installed on the host, or no WebGL2), the
 * built-in body twin takes over so there is always a 3D view.
 */
export default function AtlasStage({
  intel,
  heartRate,
  activeSystemId = null,
  onSelectSystem,
  framing,
  view = "three-quarter",
  className = "",
}: {
  intel: Intelligence;
  heartRate?: number;
  activeSystemId?: string | null;
  onSelectSystem?: (id: string) => void;
  framing?: Framing;
  view?: ViewId;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const callouts = useMemo(() => systemCallouts(intel), [intel]);
  return (
    <div className={`atlas-stage ${className}`}>
      {failed ? (
        <Suspense fallback={null}>
          <BodyTwin intel={intel} heartRate={heartRate} zoom activeSystemId={activeSystemId} onSelectSystem={onSelectSystem} />
        </Suspense>
      ) : (
        <Boundary onError={() => setFailed(true)}>
          <Suspense fallback={<div className="atlas-stage-loading">Opening the anatomy atlas…</div>}>
            <AtlasBodyScene
              model="male"
              view={view}
              framing={framing ?? HERO_FRAMING}
              callouts={callouts}
              activeSystemId={activeSystemId}
              onSelectSystem={onSelectSystem}
              onError={() => setFailed(true)}
              layers={INSIDE_LAYERS}
            />
          </Suspense>
        </Boundary>
      )}
    </div>
  );
}
