// Simulated vitals data for AURA AstroVitals.
// Every number here is demo data. Baselines are personal (own-normal), not population averages.

export type StatusLevel = "normal" | "watch" | "act" | "emergency";
export type HazardTag = "Gravity" | "Radiation" | "Isolation" | "Environment";

export interface VitalSign {
  id: string;
  label: string;
  value: number;
  /** Optional display string when the value is a pair, e.g. blood pressure "118/76". */
  display?: string;
  unit: string;
  icon: string;
  color: string;
  bgColor: string;
  normalRange: [number, number];
  /** Human-readable own baseline, shown in place of raw z-scores. */
  baseline: string;
  status: StatusLevel;
  statusLabel: string;
  delta?: number;
  trend?: "up" | "down" | "stable";
  spark: number[];
  hazard: HazardTag;
  confidence: number;
  updated: string;
}

export interface BodySystem {
  id: string;
  name: string;
  score: number; // 0-100 conditioning vs own plan
  status: StatusLevel;
  statusLabel: string;
  color: string;
  bgColor: string;
  icon: string;
  relatedMetrics: string[];
  description: string;
  hazards: HazardTag[];
}

export type AlertKind = "rule" | "advisory" | "reminder";

export interface Alert {
  id: string;
  kind: AlertKind;
  type: "critical" | "warning" | "advisory" | "info";
  level: StatusLevel;
  title: string;
  description: string;
  /** Transparent rule identifier for official alerts, e.g. "R2". */
  ruleId?: string;
  /** The values that triggered the rule and the configured threshold. */
  observed?: string;
  threshold?: string;
  action?: string;
  confidence?: number;
  system?: string;
  timestamp: string;
  source: string;
  acknowledged: boolean;
  category: string;
}

export interface CheckinData {
  mood: number; // 1-5
  sleep: {
    hours: number;
    minutes: number;
    quality: "light" | "moderate" | "heavy";
  };
  energy: number; // 1-5
  stress: number; // 1-5
  pain: { hasInjection: boolean; location?: string };
  notes: string;
  timestamp: string;
}

export interface ExerciseSession {
  id: string;
  type: string;
  name: string;
  duration: number; // minutes
  intensity: "low" | "moderate" | "high";
  completed: boolean;
  musclesWorked: string[];
  sets?: number;
  reps?: number;
  load?: string;
  rpe?: number;
}

export function getSimulatedVitals(): VitalSign[] {
  return [
    {
      id: "heart-rate",
      label: "Resting HR",
      value: 64,
      unit: "bpm",
      icon: "heart",
      color: "var(--sys-cardio)",
      bgColor: "var(--sys-cardio-bg)",
      normalRange: [55, 85],
      baseline: "58–68 bpm",
      status: "normal",
      statusLabel: "Usual range",
      delta: -2,
      trend: "down",
      spark: [67, 66, 65, 66, 64, 65, 63, 64, 66, 65, 63, 62, 64, 64],
      hazard: "Gravity",
      confidence: 97,
      updated: "2 min ago",
    },
    {
      id: "blood-pressure",
      label: "Blood pressure",
      value: 118,
      display: "118/76",
      unit: "mmHg",
      icon: "activity",
      color: "var(--aura-blue)",
      bgColor: "var(--aura-blue-bg)",
      normalRange: [90, 130],
      baseline: "112–126 / 70–80",
      status: "normal",
      statusLabel: "Usual range",
      spark: [
        116, 118, 117, 119, 118, 116, 117, 118, 119, 117, 118, 118, 117, 118,
      ],
      hazard: "Gravity",
      confidence: 96,
      updated: "2 min ago",
    },
    {
      id: "spo2",
      label: "SpO₂",
      value: 97,
      unit: "%",
      icon: "wind",
      color: "var(--aura-teal)",
      bgColor: "var(--aura-teal-bg)",
      normalRange: [95, 100],
      baseline: "96–99%",
      status: "normal",
      statusLabel: "Usual range",
      spark: [97, 97, 96, 98, 97, 97, 98, 97, 96, 97, 97, 98, 97, 97],
      hazard: "Environment",
      confidence: 98,
      updated: "2 min ago",
    },
    {
      id: "temperature",
      label: "Temperature",
      value: 36.6,
      unit: "°C",
      icon: "thermometer",
      color: "var(--aura-orange)",
      bgColor: "var(--aura-orange-bg)",
      normalRange: [36.1, 37.2],
      baseline: "36.3–36.9 °C",
      status: "normal",
      statusLabel: "Usual range",
      spark: [
        36.5, 36.6, 36.6, 36.5, 36.7, 36.6, 36.5, 36.6, 36.6, 36.7, 36.6, 36.5,
        36.6, 36.6,
      ],
      hazard: "Environment",
      confidence: 96,
      updated: "2 min ago",
    },
    {
      id: "weight",
      label: "Weight",
      value: 71.4,
      unit: "kg",
      icon: "scale",
      color: "var(--aura-text-secondary)",
      bgColor: "var(--aura-surface-2)",
      normalRange: [65, 80],
      baseline: "71.8–72.6 kg",
      status: "watch",
      statusLabel: "Drifting",
      delta: -0.6,
      trend: "down",
      spark: [
        72.4, 72.3, 72.2, 72.2, 72.1, 72.0, 72.0, 71.9, 71.8, 71.7, 71.6, 71.5,
        71.5, 71.4,
      ],
      hazard: "Gravity",
      confidence: 93,
      updated: "1 h ago",
    },
    {
      id: "sleep",
      label: "Sleep last night",
      value: 6 + 10 / 60,
      display: "6h 10m",
      unit: "",
      icon: "moon",
      color: "var(--aura-purple)",
      bgColor: "var(--aura-purple-bg)",
      normalRange: [7, 9],
      baseline: "7h 05m–8h 20m",
      status: "watch",
      statusLabel: "Below usual",
      delta: -0.9,
      trend: "down",
      spark: [
        7.4, 7.1, 6.8, 7.2, 6.9, 6.5, 6.8, 6.4, 6.2, 6.6, 6.1, 6.3, 6.0, 6.2,
      ],
      hazard: "Isolation",
      confidence: 92,
      updated: "07:10",
    },
    {
      id: "pvt",
      label: "PVT reaction",
      value: 268,
      unit: "ms",
      icon: "zap",
      color: "var(--aura-amber)",
      bgColor: "var(--aura-amber-bg)",
      normalRange: [200, 300],
      baseline: "224–256 ms",
      status: "watch",
      statusLabel: "Slightly slow",
      delta: 12,
      trend: "up",
      spark: [
        238, 242, 236, 244, 248, 246, 252, 249, 255, 258, 262, 259, 265, 268,
      ],
      hazard: "Isolation",
      confidence: 88,
      updated: "3 h ago",
    },
    {
      id: "hrv",
      label: "HRV",
      value: 48,
      unit: "ms",
      icon: "heart-pulse",
      color: "var(--aura-pink)",
      bgColor: "var(--aura-pink-bg)",
      normalRange: [30, 60],
      baseline: "52–64 ms",
      status: "watch",
      statusLabel: "Below usual",
      delta: -3,
      trend: "down",
      spark: [56, 55, 54, 55, 53, 52, 51, 52, 50, 49, 50, 48, 49, 48],
      hazard: "Gravity",
      confidence: 95,
      updated: "2 min ago",
    },
    {
      id: "vo2max",
      label: "VO₂ max",
      value: 41.8,
      unit: "ml/kg/min",
      icon: "flame",
      color: "var(--aura-green)",
      bgColor: "var(--aura-green-bg)",
      normalRange: [35, 50],
      baseline: "42.5–46.0",
      status: "watch",
      statusLabel: "Below usual",
      delta: -0.4,
      trend: "down",
      spark: [
        43.2, 43.0, 42.9, 42.8, 42.7, 42.6, 42.5, 42.4, 42.3, 42.2, 42.1, 42.0,
        41.9, 41.8,
      ],
      hazard: "Gravity",
      confidence: 90,
      updated: "Yesterday",
    },
    {
      id: "radiation",
      label: "Radiation dose",
      value: 0.83,
      unit: "mSv/day",
      icon: "shield-alert",
      color: "var(--aura-amber)",
      bgColor: "var(--aura-amber-bg)",
      normalRange: [0, 1.5],
      baseline: "0.4–0.9 mSv/day",
      status: "normal",
      statusLabel: "Usual range",
      delta: 0.1,
      trend: "up",
      spark: [
        0.6, 0.62, 0.65, 0.7, 0.68, 0.72, 0.75, 0.71, 0.78, 0.8, 0.79, 0.82,
        0.81, 0.83,
      ],
      hazard: "Radiation",
      confidence: 99,
      updated: "Now",
    },
  ];
}

export function getBodySystems(): BodySystem[] {
  return [
    {
      id: "cardiovascular",
      name: "Cardiovascular",
      score: 72,
      status: "watch",
      statusLabel: "Below plan",
      color: "var(--sys-cardio)",
      bgColor: "var(--sys-cardio-bg)",
      icon: "heart",
      relatedMetrics: ["heart-rate", "blood-pressure", "hrv"],
      description:
        "Keep your heart strong for life on Earth. Cardiovascular conditioning helps you readapt to gravity on return.",
      hazards: ["Gravity", "Radiation"],
    },
    {
      id: "skeletal",
      name: "Skeletal & Muscular",
      score: 78,
      status: "normal",
      statusLabel: "On plan",
      color: "var(--sys-skeletal)",
      bgColor: "var(--sys-skeletal-bg)",
      icon: "bone",
      relatedMetrics: ["weight"],
      description:
        "Strong bones and muscles help you move and stay independent in low gravity and beyond.",
      hazards: ["Gravity"],
    },
    {
      id: "nervous",
      name: "Neuro & Vision",
      score: 85,
      status: "normal",
      statusLabel: "On plan",
      color: "var(--sys-nervous)",
      bgColor: "var(--sys-nervous-bg)",
      icon: "brain",
      relatedMetrics: ["pvt"],
      description:
        "Monitor neurological and visual health to prevent spaceflight-associated neuro-ocular syndrome.",
      hazards: ["Isolation", "Gravity"],
    },
    {
      id: "immune",
      name: "Immune & Recovery",
      score: 80,
      status: "normal",
      statusLabel: "On plan",
      color: "var(--sys-immune)",
      bgColor: "var(--sys-immune-bg)",
      icon: "shield",
      relatedMetrics: ["temperature"],
      description:
        "Your immune system works differently in space. Track recovery and immune markers.",
      hazards: ["Environment", "Isolation"],
    },
  ];
}

export function getActiveAlerts(): Alert[] {
  return [
    {
      id: "alert-1",
      kind: "rule",
      type: "critical",
      level: "act",
      title: "Sustained tachycardia",
      description: "Heart rate stayed above the safety limit while resting.",
      ruleId: "R2",
      observed: "112 bpm for 16 min at rest",
      threshold: "> 100 bpm for 15 min",
      action: "Ask about symptoms and run a guided check.",
      system: "cardiovascular",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      source: "Cardiac monitor",
      acknowledged: false,
      category: "Official alerts · rules",
    },
    {
      id: "alert-3",
      kind: "rule",
      type: "warning",
      level: "act",
      title: "Vigilance lapse",
      description:
        "Reaction time and lapses were worse than your own range on two tests in a row.",
      ruleId: "R5",
      observed: "268 ms median · 2 lapses",
      threshold: "worse than own range on 2 tests",
      action: "Reduce workload, plan a break, and check the cabin.",
      system: "nervous",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      source: "Cognitive monitoring",
      acknowledged: true,
      category: "Official alerts · rules",
    },
    {
      id: "alert-2",
      kind: "advisory",
      type: "advisory",
      level: "watch",
      title: "Multi-signal drift",
      description:
        "HRV, sleep and reaction time have trended down together for three days.",
      confidence: 68,
      system: "cardiovascular",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      source: "Pattern analysis",
      acknowledged: false,
      category: "Advisory notices",
    },
    {
      id: "alert-4",
      kind: "advisory",
      type: "advisory",
      level: "watch",
      title: "Hazard interaction",
      description:
        "An EVA is scheduled within 12 h of sleep medication. Timing is worth a second look.",
      confidence: 62,
      system: "nervous",
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      source: "Scheduling",
      acknowledged: false,
      category: "Advisory notices",
    },
    {
      id: "alert-5",
      kind: "reminder",
      type: "info",
      level: "normal",
      title: "Bone density scan due",
      description:
        "The monthly DXA scan is scheduled for this week. 4 days remaining.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      source: "Scheduling",
      acknowledged: false,
      category: "Reminders",
    },
  ];
}

export interface TodayTask {
  id: string;
  title: string;
  icon: string;
  color: string;
  bg: string;
  done: boolean;
  time?: string;
  to: string;
}

export function getTodaysTasks(): TodayTask[] {
  return [
    {
      id: "exercise",
      title: "Exercise",
      icon: "dumbbell",
      color: "var(--aura-purple)",
      bg: "var(--aura-purple-bg)",
      done: false,
      time: "16:00",
      to: "/exercise",
    },
    {
      id: "vitals",
      title: "Vitals check",
      icon: "heart-pulse",
      color: "var(--sys-cardio)",
      bg: "var(--sys-cardio-bg)",
      done: true,
      to: "/dashboard",
    },
    {
      id: "vigilance",
      title: "Vigilance test",
      icon: "zap",
      color: "var(--aura-amber)",
      bg: "var(--aura-amber-bg)",
      done: false,
      time: "3 min",
      to: "/pvt",
    },
    {
      id: "checkin",
      title: "Daily check-in",
      icon: "clipboard-check",
      color: "var(--aura-blue)",
      bg: "var(--aura-blue-bg)",
      done: false,
      time: "1 min",
      to: "/checkin",
    },
    {
      id: "sleep-log",
      title: "Sleep log",
      icon: "moon",
      color: "var(--aura-teal)",
      bg: "var(--aura-teal-bg)",
      done: true,
      to: "/checkin",
    },
    {
      id: "bone-scan",
      title: "Bone scan",
      icon: "scan",
      color: "var(--sys-skeletal)",
      bg: "var(--sys-skeletal-bg)",
      done: false,
      time: "14:00",
      to: "/dashboard",
    },
  ];
}

export function getExerciseSessions(): ExerciseSession[] {
  return [
    {
      id: "ex-1",
      type: "resistance",
      name: "Resistance · Lower body",
      duration: 45,
      intensity: "high",
      completed: false,
      musclesWorked: ["Quadriceps", "Hamstrings", "Glutes", "Calves"],
      sets: 4,
      reps: 8,
      load: "70–80% 1RM",
      rpe: 7,
    },
    {
      id: "ex-2",
      type: "cardio",
      name: "Treadmill · Intervals",
      duration: 30,
      intensity: "moderate",
      completed: false,
      musclesWorked: ["Legs", "Core", "Cardiovascular"],
      sets: 6,
      reps: 3,
      load: "2 min hard / 1 min easy",
      rpe: 6,
    },
    {
      id: "ex-3",
      type: "flexibility",
      name: "Stretching & mobility",
      duration: 15,
      intensity: "low",
      completed: false,
      musclesWorked: ["Full body"],
      rpe: 2,
    },
  ];
}
