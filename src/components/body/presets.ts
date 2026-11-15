import type { Framing, ViewId } from "./anatomyEngine";
import type { SystemId } from "../../lib/anatomy/types";

/** Glass skin, skeleton and organs, without the muscle layer hiding them. */
export const INSIDE_LAYERS: SystemId[] = [
  "skeletal", "cardiac", "arterial", "venous", "nervous", "brain",
  "respiratory", "digestive", "urinary", "lymphatic", "integumentary",
];

/** Head to hips: a close start where organs and the AI callouts are readable. */
export const CLOSE_FRAMING: Framing = { height: 1.46, targetY: 1.09 };

export type ZoomId = "upper" | "full" | "torso" | "head" | "legs";

export const ZOOMS: { id: ZoomId; label: string; framing: Framing }[] = [
  { id: "upper", label: "Upper body", framing: { height: 1.46, targetY: 1.09 } },
  { id: "torso", label: "Torso", framing: { height: 0.78, targetY: 1.22 } },
  { id: "head", label: "Head", framing: { height: 0.5, targetY: 1.66 } },
  { id: "legs", label: "Legs", framing: { height: 1.0, targetY: 0.55 } },
  { id: "full", label: "Full body", framing: { height: 1.95, targetY: 0.92 } },
];

export const VIEWS: { id: ViewId; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "three-quarter", label: "3/4" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
];
