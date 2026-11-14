import type { Alert } from "../data/vitalsData";
import { scopedKey } from "../stores/appStore";
interface AlertState {
  acknowledged: Record<string, boolean>;
  dismissed: Record<string, boolean>;
  snoozed: Record<string, number>;
}
export function isOpenOfficial(
  alert: Alert,
  crewId: string,
  state: AlertState,
  now: number,
) {
  const key = scopedKey(alert.id, crewId);
  return (
    alert.kind === "rule" &&
    !alert.acknowledged &&
    !state.acknowledged[key] &&
    !state.dismissed[key] &&
    !(state.snoozed[key] > now)
  );
}
