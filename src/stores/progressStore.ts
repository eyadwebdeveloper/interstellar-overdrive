import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SkillRecord {
  skillId: string;
  crewMemberId: string;
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  lastReviewed: string; // ISO date
  nextReview: string; // ISO date
  correctStreak: number;
}

export interface QuizAttempt {
  moduleId: string;
  crewMemberId: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
}

export interface MindGymScore {
  gameType: string;
  crewMemberId: string;
  score: number;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  crewMemberId: string;
  text: string;
  missionDay: number;
  timestamp: string;
}

interface ProgressState {
  skillRecords: SkillRecord[];
  quizAttempts: QuizAttempt[];
  mindGymScores: MindGymScore[];
  journalEntries: JournalEntry[];
  completedModules: Record<string, string[]>; // crewId -> moduleIds

  // Skill tracking
  updateSkillAfterReview: (skillId: string, crewMemberId: string, quality: number) => void;
  getSkillRetention: (skillId: string, crewMemberId: string) => number;
  getOverallReadiness: (crewMemberId: string) => number;
  getDueSkills: (crewMemberId: string) => SkillRecord[];

  // Quiz tracking
  addQuizAttempt: (attempt: Omit<QuizAttempt, 'timestamp'>) => void;

  // Mind gym
  addMindGymScore: (score: Omit<MindGymScore, 'timestamp'>) => void;
  getBestScore: (gameType: string, crewMemberId: string) => number;

  // Journal
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;

  // Modules
  markModuleComplete: (crewMemberId: string, moduleId: string) => void;
  isModuleComplete: (crewMemberId: string, moduleId: string) => boolean;
}

// SM-2 algorithm implementation
function calculateSM2(
  quality: number, // 0-5
  easeFactor: number,
  interval: number,
  repetitions: number
): { easeFactor: number; interval: number; repetitions: number } {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEF = Math.max(1.3, newEF);

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    newReps = 0;
    newInterval = 1;
  } else {
    newReps = repetitions + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  return { easeFactor: newEF, interval: newInterval, repetitions: newReps };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      skillRecords: [],
      quizAttempts: [],
      mindGymScores: [],
      journalEntries: [],
      completedModules: {},

      updateSkillAfterReview: (skillId, crewMemberId, quality) => {
        set((state) => {
          const existing = state.skillRecords.find(
            (r) => r.skillId === skillId && r.crewMemberId === crewMemberId
          );

          const current = existing || {
            skillId,
            crewMemberId,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            lastReviewed: new Date().toISOString(),
            nextReview: new Date().toISOString(),
            correctStreak: 0,
          };

          const result = calculateSM2(quality, current.easeFactor, current.interval, current.repetitions);
          const now = new Date();
          const nextReview = new Date(now);
          nextReview.setDate(nextReview.getDate() + result.interval);

          const updated: SkillRecord = {
            ...current,
            easeFactor: result.easeFactor,
            interval: result.interval,
            repetitions: result.repetitions,
            lastReviewed: now.toISOString(),
            nextReview: nextReview.toISOString(),
            correctStreak: quality >= 3 ? current.correctStreak + 1 : 0,
          };

          return {
            skillRecords: [
              ...state.skillRecords.filter(
                (r) => !(r.skillId === skillId && r.crewMemberId === crewMemberId)
              ),
              updated,
            ],
          };
        });
      },

      getSkillRetention: (skillId, crewMemberId) => {
        const record = get().skillRecords.find(
          (r) => r.skillId === skillId && r.crewMemberId === crewMemberId
        );
        if (!record) return 0;

        const now = new Date();
        const lastReview = new Date(record.lastReviewed);
        const daysSince = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);

        // Ebbinghaus forgetting curve approximation
        const retention = Math.exp(-daysSince / (record.interval * record.easeFactor || 1));
        return Math.max(0, Math.min(1, retention));
      },

      getOverallReadiness: (crewMemberId) => {
        const records = get().skillRecords.filter((r) => r.crewMemberId === crewMemberId);
        if (records.length === 0) return 0;

        const retentions = records.map((r) => get().getSkillRetention(r.skillId, r.crewMemberId));
        return retentions.reduce((sum, r) => sum + r, 0) / retentions.length;
      },

      getDueSkills: (crewMemberId) => {
        const now = new Date();
        return get().skillRecords.filter(
          (r) => r.crewMemberId === crewMemberId && new Date(r.nextReview) <= now
        );
      },

      addQuizAttempt: (attempt) => {
        set((state) => ({
          quizAttempts: [...state.quizAttempts, { ...attempt, timestamp: new Date().toISOString() }],
        }));
      },

      addMindGymScore: (score) => {
        set((state) => ({
          mindGymScores: [...state.mindGymScores, { ...score, timestamp: new Date().toISOString() }],
        }));
      },

      getBestScore: (gameType, crewMemberId) => {
        const scores = get().mindGymScores.filter(
          (s) => s.gameType === gameType && s.crewMemberId === crewMemberId
        );
        return scores.length > 0 ? Math.max(...scores.map((s) => s.score)) : 0;
      },

      addJournalEntry: (entry) => {
        set((state) => ({
          journalEntries: [
            ...state.journalEntries,
            { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
          ],
        }));
      },

      markModuleComplete: (crewMemberId, moduleId) => {
        set((state) => {
          const existing = state.completedModules[crewMemberId] || [];
          if (existing.includes(moduleId)) return state;
          return {
            completedModules: {
              ...state.completedModules,
              [crewMemberId]: [...existing, moduleId],
            },
          };
        });
      },

      isModuleComplete: (crewMemberId, moduleId) => {
        return (get().completedModules[crewMemberId] || []).includes(moduleId);
      },
    }),
    { name: 'second-chair-progress' }
  )
);
