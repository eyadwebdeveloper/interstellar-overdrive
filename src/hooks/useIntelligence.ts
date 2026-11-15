import { useMemo } from "react";
import { analyse, type Intelligence } from "../ai/engine";
import { buildContext, type CopilotContext } from "../ai/copilot";
import { getSimulatedVitals } from "../data/vitalsData";
import { useAlerts } from "./useAura";
import { useAuraStore } from "../stores/auraStore";
import { useAppStore } from "../stores/appStore";
import { useCrewStore } from "../stores/crewStore";
import { isOpenOfficial } from "../utils/alerts";

/** The on-device analysis for the active crew member. Cheap, so memoised per render pass. */
export function useIntelligence(): Intelligence {
  return useMemo(() => analyse(getSimulatedVitals()), []);
}

/** Everything the copilot is allowed to know, assembled from stores. */
export function useCopilotContext(): CopilotContext {
  const intel = useIntelligence();
  const member = useCrewStore((s) => s.getActiveMember());
  const day = useCrewStore((s) => s.getMissionDay());
  const store = useAppStore();
  const source = useAuraStore((s) => s.source);
  const risk = useAuraStore((s) => s.snapshot?.tier2.risk ?? null);
  const alerts = useAlerts();
  const open = alerts.filter((a) => isOpenOfficial(a, member.id, store, Date.now())).length;
  const latest = store.checkins.find((c) => c.crewId === member.id);
  return useMemo(
    () =>
      buildContext({
        crewName: member.name,
        role: member.role,
        missionDay: day,
        openOfficialAlerts: open,
        recentCheckin: latest
          ? { mood: latest.mood, energy: latest.energy, stress: latest.stress, sleepMinutes: latest.sleepMinutes }
          : null,
        backend: source,
        riskBand: risk?.band,
        intel,
      }),
    [member.name, member.role, day, open, latest, source, risk?.band, intel],
  );
}
