import { useEffect, useRef, useState } from "react";
import type { BodySystem } from "../../data/vitalsData";
import {
  MODEL_MAP,
  SYSTEM_MAP,
  type ModelId,
  type SystemId,
} from "../../lib/anatomy/types";
import { useSettingsStore } from "../../stores/settingsStore";
import { AnatomyEngine, type HoverInfo } from "./anatomyEngine";

/**
 * The Human-Atlas anatomy models in the AURA viewport.
 *
 * Three interchangeable model sets ship in public/models:
 *   male    — BodyParts3D 4.0, The Database Center for Life Science (CC BY 4.0)
 *   female  — Human Reference Atlas v1.10, Browne & Schlehlein (CC BY 4.0)
 *   muscles — Visible Human Female leg muscles, Andreassen et al. 2023 (CC BY 4.0)
 *
 * The four workspace systems map onto atlas systems so the existing index,
 * dashboard, and system pages keep working.
 */

const AURA_SYSTEMS: Record<string, { atlas: SystemId[]; accent: string }> = {
  cardiovascular: {
    atlas: ["cardiac", "arterial", "venous"],
    accent: "#b4483f",
  },
  skeletal: {
    atlas: ["skeletal", "muscular"],
    accent: "#8a7340",
  },
  nervous: {
    atlas: ["nervous", "brain", "sensory"],
    accent: "#4d5d78",
  },
  immune: {
    atlas: ["lymphatic"],
    accent: "#2f6a52",
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
};

export default function AtlasBodyScene({
  activeSystemId = null,
  model = "male",
  onSelectSystem,
  onError,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AnatomyEngine | null>(null);
  const selectRef = useRef(onSelectSystem);
  const errorRef = useRef(onError);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(
    null,
  );

  selectRef.current = onSelectSystem;
  errorRef.current = onError;

  // Create the engine once. Later prop changes go through the effect below.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let engine: AnatomyEngine;
    try {
      engine = new AnatomyEngine(host, {
        onHover: (info) => setHover(info),
        onPick: (_id, system) => {
          if (!system) return;
          const aura = ATLAS_TO_AURA[system];
          if (aura) selectRef.current?.(aura);
        },
        onActivate: () => {},
        onProgress: (next) => setProgress(next),
        onError: () => errorRef.current?.(),
      });
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

  // Mount or switch the model, then apply the interaction state. Switching
  // between the female body and the leg-muscle set reuses the same manifest,
  // so those two share downloaded chunks; moving to a different manifest
  // evicts the previous atlas's buffers.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const def = MODEL_MAP[model];
    void engine.setAtlas(def.manifest, { frameAfterLoad: def.frameOnLoad });
    const spec = activeSystemId ? AURA_SYSTEMS[activeSystemId] : undefined;
    // Emphasis only makes sense for systems this model actually contains.
    const present = new Set<SystemId>([...def.visible, ...def.hidden]);
    engine.setAccent(spec?.accent ?? "#24554b");
    engine.setState({
      visible: def.visible,
      selected: [],
      emphasis: spec ? spec.atlas.filter((s) => present.has(s)) : [],
      isolate: false,
      explode: 0,
      view: "three-quarter",
      autoRotate: animationsEnabled && !spec,
      reset: 0,
      focus: 0,
    });
  }, [model, activeSystemId, animationsEnabled]);

  return (
    <div ref={hostRef} className="body-scene-host">
      {progress && (
        <div className="atlas-progress">
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
