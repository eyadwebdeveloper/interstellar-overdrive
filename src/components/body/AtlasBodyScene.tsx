import { useEffect, useRef, useState } from "react";
import type { BodySystem } from "../../data/vitalsData";
import {
  MODEL_MAP,
  SYSTEM_MAP,
  type ModelId,
  type SystemId,
} from "../../lib/anatomy/types";
import { useSettingsStore } from "../../stores/settingsStore";
import {
  AnatomyEngine,
  type Framing,
  type HoverInfo,
  type ViewId,
} from "./anatomyEngine";
import type { Callout } from "./callouts";
import { CLOSE_FRAMING } from "./presets";

/**
 * The Human-Atlas anatomy models in the AURA viewport.
 *
 * Three interchangeable model sets ship in public/models:
 *   male    — BodyParts3D 4.0, The Database Center for Life Science (CC BY 4.0)
 *   female  — Human Reference Atlas v1.10, Browne & Schlehlein (CC BY 4.0)
 *   muscles — Visible Human Female leg muscles, Andreassen et al. 2023 (CC BY 4.0)
 *
 * The four workspace systems map onto atlas systems so the existing index,
 * dashboard, and system pages keep working. AI findings (callouts) are pinned
 * to the matching structures and follow the camera.
 */

export const AURA_SYSTEMS: Record<
  string,
  { atlas: SystemId[]; accent: string; anchor: SystemId[]; yFrac: number }
> = {
  cardiovascular: {
    atlas: ["cardiac", "arterial", "venous"],
    accent: "#e0705f",
    anchor: ["cardiac"],
    yFrac: 0.5,
  },
  skeletal: {
    atlas: ["skeletal", "muscular"],
    accent: "#d8c58f",
    anchor: ["skeletal"],
    yFrac: 0.3,
  },
  nervous: {
    atlas: ["nervous", "brain", "sensory"],
    accent: "#8fa4e8",
    anchor: ["brain"],
    yFrac: 0.5,
  },
  immune: {
    atlas: ["lymphatic"],
    accent: "#6fd3a6",
    anchor: ["lymphatic"],
    yFrac: 0.35,
  },
};

const ATLAS_TO_AURA: Record<string, string> = Object.fromEntries(
  Object.entries(AURA_SYSTEMS).flatMap(([id, spec]) =>
    spec.atlas.map((system) => [system, id]),
  ),
);

type Props = {
  systems?: BodySystem[];
  /** Which of the three atlas models to show. Defaults to the male body. */
  model?: ModelId;
  activeSystemId?: string | null;
  onSelectSystem?: (id: string) => void;
  onError?: () => void;
  view?: ViewId;
  /** How much of the body fills the view. Defaults to head-to-hips, a close start. */
  framing?: Framing;
  /** Override which atlas systems are drawn (otherwise the model's defaults). */
  layers?: SystemId[];
  /** AI findings pinned to the anatomy. */
  callouts?: Record<string, Callout>;
  /** Show the scan sweep, dust and turning ring. */
  ambient?: boolean;
};

export default function AtlasBodyScene({
  activeSystemId = null,
  model = "male",
  onSelectSystem,
  onError,
  view = "three-quarter",
  framing = CLOSE_FRAMING,
  layers,
  callouts,
  ambient = true,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AnatomyEngine | null>(null);
  const selectRef = useRef(onSelectSystem);
  const errorRef = useRef(onError);
  const labelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const calloutsRef = useRef(callouts);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [labelHover, setLabelHover] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    selectRef.current = onSelectSystem;
    errorRef.current = onError;
    calloutsRef.current = callouts;
  });

  // Create the engine once. Later prop changes go through the effects below.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let engine: AnatomyEngine;
    const place = () => {
      const e = engineRef.current;
      if (!e) return;
      for (const [id, spec] of Object.entries(AURA_SYSTEMS)) {
        const el = labelRefs.current[id];
        if (!el) continue;
        const p = calloutsRef.current?.[id] ? e.projectSystem(spec.anchor, spec.yFrac) : null;
        if (!p) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        el.style.opacity = p.behind ? "0.2" : "1";
      }
    };
    try {
      engine = new AnatomyEngine(
        host,
        {
          onHover: (info) => setHover(info),
          onPick: (_id, system) => {
            if (!system) return;
            const aura = ATLAS_TO_AURA[system];
            if (aura) selectRef.current?.(aura);
          },
          onActivate: () => {},
          onProgress: (next) => setProgress(next),
          onError: () => errorRef.current?.(),
          onRender: place,
        },
        { theme: "dark" },
      );
    } catch {
      onError?.();
      return;
    }
    engine.attachResizeObserver();
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const layersKey = layers?.join(",") ?? "";
  const focusId = activeSystemId ?? labelHover;

  // Mount or switch the model, then apply the interaction state.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const def = MODEL_MAP[model];
    void engine.setAtlas(def.manifest, { frameAfterLoad: def.frameOnLoad });
    const spec = focusId ? AURA_SYSTEMS[focusId] : undefined;
    // Emphasis only makes sense for systems this model actually contains.
    const present = new Set<SystemId>([...def.visible, ...def.hidden]);
    const visible = layers
      ? layers.filter((s) => present.has(s))
      : def.visible;
    engine.setAccent(spec?.accent ?? "#8fe3b4");
    engine.setAmbient(animationsEnabled && ambient);
    engine.setState({
      visible,
      selected: [],
      emphasis: spec ? spec.atlas.filter((s) => present.has(s)) : [],
      isolate: false,
      explode: 0,
      view,
      autoRotate: animationsEnabled && !spec,
      reset: 0,
      focus: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, focusId, animationsEnabled, ambient, view, layersKey]);

  // Camera distance and height.
  useEffect(() => {
    engineRef.current?.setFraming(framing, view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framing.height, framing.targetY, model, view]);

  return (
    <div ref={hostRef} className="body-scene-host">
      {callouts &&
        Object.entries(AURA_SYSTEMS).map(([id]) => {
          const c = callouts[id];
          if (!c) return null;
          return (
            <button
              key={id}
              ref={(el) => {
                labelRefs.current[id] = el;
              }}
              type="button"
              style={{ visibility: "hidden" }}
              className={`twin-label sys-${id} lvl-${c.level} ${id === "immune" ? "side-l" : "side-r"} ${focusId === id ? "is-on" : ""}`}
              onClick={() => selectRef.current?.(id)}
              onMouseEnter={() => setLabelHover(id)}
              onMouseLeave={() => setLabelHover(null)}
              onFocus={() => setLabelHover(id)}
              onBlur={() => setLabelHover(null)}
            >
              <i aria-hidden="true" />
              <span>
                <b>{c.title}</b>
                <em>{c.text}</em>
              </span>
            </button>
          );
        })}
      {progress && (
        <div className="atlas-progress atlas-progress-dark">
          <i aria-hidden="true" />
          Opening {MODEL_MAP[model].label.toLowerCase()} · {progress.loaded}/
          {progress.total}
        </div>
      )}
      {hover && (
        <div className="atlas-hover" style={{ left: hover.x, top: hover.y }}>
          {hover.name}
          <span>{SYSTEM_MAP[hover.system]?.name ?? hover.system}</span>
        </div>
      )}
    </div>
  );
}
