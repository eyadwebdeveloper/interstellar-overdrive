import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  avatar: string; // emoji or initials
  color: string;
  specialties: string[];
}

export const DEFAULT_CREW: CrewMember[] = [
  {
    id: "cmdr",
    name: "Commander Eyad Ashraf",
    role: "Mission Commander",
    avatar: "👩‍🚀",
    color: "#f0a030",
    specialties: ["Leadership", "EVA", "Emergency Medicine"],
  },
  {
    id: "med",
    name: "Dr. Mo'men Ashraf",
    role: "Flight Surgeon",
    avatar: "👨‍⚕️",
    color: "#3b82f6",
    specialties: ["Surgery", "Pharmacology", "Radiation Medicine"],
  },
  {
    id: "eng",
    name: "Engineer Mohamed Sameh",
    role: "Flight Engineer",
    avatar: "👩‍🔧",
    color: "#22c55e",
    specialties: ["Systems", "Life Support", "First Aid"],
  },
  {
    id: "sci",
    name: "Dr. Saif-Eldin Ali",
    role: "Science Officer",
    avatar: "🧑‍🔬",
    color: "#a78bfa",
    specialties: ["Biology", "Lab Procedures", "Wound Care"],
  },
];

interface CrewState {
  crew: CrewMember[];
  activeCrewId: string;
  missionStartDate: string;
  missionDurationDays: number;

  setActiveCrewId: (id: string) => void;
  getActiveMember: () => CrewMember;
  getMissionDay: () => number;
  getMissionProgress: () => number;
  getDistanceFromEarth: () => number;
}

export const useCrewStore = create<CrewState>()(
  persist(
    (set, get) => ({
      crew: DEFAULT_CREW,
      activeCrewId: "cmdr",
      missionStartDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 247);
        return d.toISOString();
      })(),
      missionDurationDays: 687,

      setActiveCrewId: (id) => set({ activeCrewId: id }),

      getActiveMember: () => {
        const state = get();
        return (
          state.crew.find((c) => c.id === state.activeCrewId) || state.crew[0]
        );
      },

      getMissionDay: () => {
        const state = get();
        const start = new Date(state.missionStartDate);
        const now = new Date();
        return Math.floor(
          (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        );
      },

      getMissionProgress: () => {
        const state = get();
        const day = get().getMissionDay();
        return Math.min(day / state.missionDurationDays, 1);
      },

      // Simulated distance from Earth in millions of km (Mars trajectory)
      getDistanceFromEarth: () => {
        const progress = get().getMissionProgress();
        // Simplified: increases to ~225M km at midpoint, then decreases slightly
        const maxDist = 225;
        return Math.sin(progress * Math.PI) * maxDist;
      },
    }),
    {
      name: "second-chair-crew",
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(typeof persistedState === "object" && persistedState !== null
          ? persistedState
          : {}),
        crew: DEFAULT_CREW,
      }),
    },
  ),
);
