import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CheckinRecord {
  id: string;
  crewId: string;
  at: string;
  mood: number;
  stress: number;
  energy: number;
  sleepMinutes: number;
  sleepQuality: string;
  workload: string;
  notes: string;
}
export interface SessionRecord {
  id: string;
  crewId: string;
  at: string;
  sessionId: string;
  name: string;
  seconds: number;
  completedSets: number;
  totalSets: number;
  rpe: number;
  completed?: boolean;
  equipment?: string;
}
export interface PvtRecord {
  id: string;
  crewId: string;
  at: string;
  mean: number;
  lapses: number;
  falseStarts: number;
  taps: number;
}
export interface GameRecord {
  id: string;
  crewId: string;
  at: string;
  gameId: string;
  score: number;
  maxScore: number;
  stars: number;
  summary?: string;
}
export interface MessageRecord {
  id: string;
  crewId: string;
  at: string;
  recipient: string;
  text: string;
}
interface AppState {
  acknowledged: Record<string, boolean>;
  dismissed: Record<string, boolean>;
  snoozed: Record<string, number>;
  checkins: CheckinRecord[];
  sessions: SessionRecord[];
  pvt: PvtRecord[];
  messages: MessageRecord[];
  gameResults: GameRecord[];
  acknowledge: (id: string, crewId: string) => void;
  dismiss: (id: string, crewId: string) => void;
  restore: (id: string, crewId: string) => void;
  snooze: (id: string, crewId: string, minutes: number) => void;
  saveCheckin: (data: Omit<CheckinRecord, "id" | "at">) => void;
  saveSession: (data: Omit<SessionRecord, "id" | "at">) => void;
  savePvt: (data: Omit<PvtRecord, "id" | "at">) => void;
  saveGameResult: (data: Omit<GameRecord, "id" | "at">) => void;
  saveMessage: (data: Omit<MessageRecord, "id" | "at">) => void;
}
export const scopedKey = (id: string, crewId: string) => `${crewId}:${id}`;
const stamp = () => ({ id: crypto.randomUUID(), at: new Date().toISOString() });
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      acknowledged: {},
      dismissed: {},
      snoozed: {},
      checkins: [],
      sessions: [],
      pvt: [],
      messages: [],
      gameResults: [],
      acknowledge: (id, crewId) =>
        set((s) => ({
          acknowledged: { ...s.acknowledged, [scopedKey(id, crewId)]: true },
        })),
      dismiss: (id, crewId) =>
        set((s) => ({
          dismissed: { ...s.dismissed, [scopedKey(id, crewId)]: true },
        })),
      restore: (id, crewId) =>
        set((s) => ({
          dismissed: { ...s.dismissed, [scopedKey(id, crewId)]: false },
          snoozed: { ...s.snoozed, [scopedKey(id, crewId)]: 0 },
        })),
      snooze: (id, crewId, minutes) =>
        set((s) => ({
          snoozed: {
            ...s.snoozed,
            [scopedKey(id, crewId)]: Date.now() + minutes * 60000,
          },
        })),
      saveCheckin: (data) =>
        set((s) => ({
          checkins: [{ ...data, ...stamp() }, ...s.checkins].slice(0, 100),
        })),
      saveSession: (data) =>
        set((s) => ({
          sessions: [{ ...data, ...stamp() }, ...s.sessions].slice(0, 100),
        })),
      savePvt: (data) =>
        set((s) => ({
          pvt: [{ ...data, ...stamp() }, ...s.pvt].slice(0, 100),
        })),
      saveGameResult: (data) =>
        set((s) => ({
          gameResults: [{ ...data, ...stamp() }, ...s.gameResults].slice(0, 200),
        })),
      saveMessage: (data) =>
        set((s) => ({
          messages: [{ ...data, ...stamp() }, ...s.messages].slice(0, 100),
        })),
    }),
    { name: "aura-workflows-v2" },
  ),
);
