import type { StatusLevel } from "../../data/vitalsData";
import { formatSignal, type Intelligence } from "../../ai/engine";

export interface Callout {
  title: string;
  text: string;
  level: StatusLevel;
}

const SYSTEMS = ["cardiovascular", "skeletal", "nervous", "immune"] as const;

export function systemCallouts(intel: Intelligence): Record<string, Callout> {
  const out: Record<string, Callout> = {};
  for (const sys of SYSTEMS) {
    const f = intel.systemFindings[sys];
    if (!f) continue;
    const mine = intel.signals.filter((s) => s.system === sys).sort((a, b) => b.drift - a.drift)[0];
    out[sys] = {
      title: f.label,
      level: f.level,
      text: mine
        ? mine.direction === "steady"
          ? `${mine.label} steady`
          : `${mine.label} ${formatSignal(mine.current, mine.unit)} · baseline ${formatSignal(mine.baseline, mine.unit)}`
        : "Steady",
    };
  }
  return out;
}

