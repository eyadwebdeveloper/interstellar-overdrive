/**
 * Content for the training-room games.
 *
 * All health content is educational and kept deliberately careful:
 * real figures are quoted from public space-life-science findings,
 * game mechanics are labelled illustrative where simplified.
 */

export interface GameMeta {
  id: string;
  route: string;
  title: string;
  short: string;
  teaches: string;
  minutes: number;
  icon: "salad" | "bone" | "moon" | "brain";
}

export const GAMES: GameMeta[] = [
  {
    id: "fuel",
    route: "/games/fuel",
    title: "Fuel the crew",
    short: "Match each ration to the system that needs it.",
    teaches: "Space nutrition — what each nutrient actually protects.",
    minutes: 3,
    icon: "salad",
  },
  {
    id: "load",
    route: "/games/load",
    title: "Load bearing",
    short: "Plan twelve weeks of countermeasures on a tight budget.",
    teaches: "Why unloading erodes bone and muscle — and what holds them.",
    minutes: 5,
    icon: "bone",
  },
  {
    id: "clock",
    route: "/games/clock",
    title: "Keep the clock",
    short: "Build one day that protects your body clock.",
    teaches: "Light, caffeine, meals and anchors in orbit.",
    minutes: 3,
    icon: "moon",
  },
  {
    id: "facts",
    route: "/games/facts",
    title: "Fact from fiction",
    short: "Twelve claims about the body in space — judge them.",
    teaches: "Microgravity physiology, separated from the myths.",
    minutes: 3,
    icon: "brain",
  },
];

/* ────────────────────────────────────────────────────────────
   FUEL THE CREW — nutrition matching
   ──────────────────────────────────────────────────────────── */

export interface FuelPair {
  id: string;
  ration: string;
  rationNote: string;
  need: string;
  system: string;
  explain: string;
}

export const FUEL_PAIRS: FuelPair[] = [
  {
    id: "calcium",
    ration: "Calcium + vitamin D",
    rationNote: "Fortified dairy, leafy greens",
    need: "The skeleton unloads in weightlessness; bone mineral quietly drifts down.",
    system: "Skeletal",
    explain:
      "Bone constantly remodels in response to mechanical loading. Calcium and vitamin D supply the raw material — resistance exercise supplies the loading signal. Both halves matter.",
  },
  {
    id: "iron",
    ration: "Iron",
    rationNote: "Carefully dosed supplements",
    need: "Red-cell mass shifts as the body adapts to changed fluids — and again after landing.",
    system: "Blood",
    explain:
      "Iron sits at the centre of haemoglobin. Crews track iron stores during flight because both low and high levels carry risks in altered fluid balance.",
  },
  {
    id: "electrolytes",
    ration: "Sodium & potassium",
    rationNote: "Tuned rations, drinks",
    need: "Fluid and electrolyte balance through the headward fluid shift.",
    system: "Fluids",
    explain:
      "Electrolytes help the body manage where water goes. Flight diets are tuned carefully — historically lower in sodium — to work with the shift, not against it.",
  },
  {
    id: "protein",
    ration: "Protein",
    rationNote: "Meats, legumes, shakes",
    need: "Muscle maintenance between training sessions.",
    system: "Muscle",
    explain:
      "Amino acids repair and preserve muscle between sessions — and total energy intake matters as much as protein itself. Under-eating undermines the whole plan.",
  },
  {
    id: "omega3",
    ration: "Omega-3 fatty acids",
    rationNote: "Fish, fortified rations",
    need: "Inflammation and immune balance across a long mission.",
    system: "Immune",
    explain:
      "Long-chain fatty acids are studied for immune and inflammation support during months in orbit — one reason fish and fortified foods appear in menu planning.",
  },
  {
    id: "antioxidants",
    ration: "Antioxidants · vit C & E",
    rationNote: "Fruit and vegetable rations",
    need: "Oxidative stress from radiation exposure.",
    system: "Cells",
    explain:
      "Radiation and hard training both raise reactive oxygen species. Fruit and vegetable rations supply antioxidant nutrients being studied as countermeasure support.",
  },
];

/* ────────────────────────────────────────────────────────────
   LOAD BEARING — bone & muscle countermeasure planner
   Rates are illustrative for play; the summary quotes real rates.
   ──────────────────────────────────────────────────────────── */

export interface LoadEffects {
  bone: number;
  muscle: number;
  fitness: number;
  fatigue: number;
}

export interface LoadEvent {
  week: number;
  title: string;
  note: string;
}

export const LOAD_CONFIG = {
  weeks: 12,
  budget: 10,
  startFatigue: 10,
  decay: { bone: 2.0, muscle: 1.6, fitness: 1.0 },
  effects: {
    resistance: { bone: 0.4, muscle: 0.25, fitness: 0.02, fatigue: 4.2 },
    cardio: { bone: 0.05, muscle: 0.15, fitness: 0.3, fatigue: 2.8 },
    recovery: { bone: 0.02, muscle: 0.05, fitness: 0.1, fatigue: -6.5 },
  } as Record<"resistance" | "cardio" | "recovery", LoadEffects>,
  passiveFatigueRelief: 3.5,
  overtrainingAt: 70,
  exhaustedAt: 90,
  labels: {
    bone: "Bone integrity",
    muscle: "Muscle mass",
    fitness: "Heart & vessel fitness",
    fatigue: "Fatigue",
  },
};

export const LOAD_EVENTS: LoadEvent[] = [
  {
    week: 3,
    title: "Cargo offload week",
    note: "Heavy transfers — only 6 units of crew time this week.",
  },
  {
    week: 5,
    title: "Doubled EVA day",
    note: "Two spacewalks in one day. Sleep is squeezed: +12 fatigue whatever you choose.",
  },
  {
    week: 7,
    title: "Solar particle event",
    note: "A radiation storm is passing. Crew shelters in quarters; the treadmill is powered down — cardio limited to 2 units.",
  },
  {
    week: 10,
    title: "Schedule slip",
    note: "Ops overran. Two units of personal time are gone this week.",
  },
];

export const LOAD_INSIGHTS = {
  resistance:
    "Axial loading is the strongest bone signal you have. Cycling helps the heart far more than it helps the hips.",
  noResistance:
    "Nothing this week told the skeleton to stay dense. Unloaded bone drifts, even on a perfect diet.",
  fatigueUp:
    "Fatigue is climbing. An overtrained crew gets less from every session — recovery is a countermeasure, not a luxury.",
  recovery:
    "Downtime is doing quiet work: hormones, tissue repair and attention all rebuild in the rest between sessions.",
  balanced:
    "Crews on the station train around two hours a day — the mix, kept honest over weeks, is what holds the body.",
};

export const LOAD_REALITY =
  "Real rates for context: without countermeasures, bone mineral in weight-bearing sites declines on the order of 1–1.5% per month, and crews on the space station train around two hours a day to hold bone, muscle and fitness. This round compresses and exaggerates the rates so twelve weeks can be played in minutes.";

/* ────────────────────────────────────────────────────────────
   KEEP THE CLOCK — circadian scheduler
   ──────────────────────────────────────────────────────────── */

export interface ClockOption {
  label: string;
  points: number;
  why: string;
  chipAt?: string;
}

export interface ClockStep {
  id: string;
  at: string;
  topic: string;
  prompt: string;
  options: ClockOption[];
}

export const CLOCK_STEPS: ClockStep[] = [
  {
    id: "wake-light",
    at: "06:30",
    topic: "Morning light",
    prompt: "Wake-up call. The day starts now — what light greets you?",
    options: [
      {
        label: "Blue-enriched bright light within half an hour of waking",
        points: 16,
        why: "Morning bright light is the strongest anchor signal: it sets the pace of the whole circadian day.",
      },
      {
        label: "Usual cabin lights, get around to it by midday",
        points: 6,
        why: "Late light still helps a little, but the strongest part of the signal has already been missed.",
      },
      {
        label: "Keep the lights low all morning to ease into the day",
        points: -8,
        why: "Dim mornings let the internal clock drift — exactly what a fixed schedule is trying to prevent.",
      },
    ],
  },
  {
    id: "caffeine",
    at: "07:10",
    topic: "First caffeine",
    prompt: "The coffee machine is warm. How does caffeine fit the day?",
    options: [
      {
        label: "Coffee with breakfast, nothing after 13:00",
        points: 14,
        chipAt: "07:10",
        why: "Caffeine takes roughly five hours for half of it to clear. Morning cups are long gone by sleep time.",
      },
      {
        label: "One more cup at 16:00 to finish the day sharp",
        points: 3,
        chipAt: "16:00",
        why: "An afternoon top-up is common and modest — but a quarter of it is still circulating at bedtime.",
      },
      {
        label: "Espresso at 21:00 to push through the night shift",
        points: -14,
        chipAt: "21:00",
        why: "Evening caffeine pushes sleep pressure down exactly when it should be rising. Half of it is still active near midnight.",
      },
    ],
  },
  {
    id: "training",
    at: "Morning",
    topic: "Training slot",
    prompt: "Today's exercise block needs a home in the schedule.",
    options: [
      {
        label: "Resistance block in the morning",
        points: 10,
        chipAt: "10:00",
        why: "Morning training lands on a rising body clock and helps consolidate the day's rhythm.",
      },
      {
        label: "Late-afternoon cardio",
        points: 8,
        chipAt: "16:30",
        why: "Afternoon sessions suit most bodies well — performance is high and sleep is still hours away.",
      },
      {
        label: "Hard session ending half an hour before sleep",
        points: -10,
        chipAt: "22:00",
        why: "Late hard training leaves core temperature and adrenaline high — the body arrives at bedtime still 'on'.",
      },
    ],
  },
  {
    id: "meals",
    at: "Midday",
    topic: "Meals",
    prompt: "Ops are busy. How do meals happen?",
    options: [
      {
        label: "Meals at fixed times, every day",
        points: 9,
        chipAt: "12:30",
        why: "Meal times feed the peripheral clocks in organs throughout the body. Regular meals are a rhythm anchor of their own.",
      },
      {
        label: "Grazing at odd hours whenever ops allow",
        points: -5,
        chipAt: "15:40",
        why: "Scattered meals desynchronise the metabolic clocks from the one in the brain.",
      },
    ],
  },
  {
    id: "ops-drift",
    at: "20:40",
    topic: "Schedule pressure",
    prompt:
      "A late EVA is running three hours past plan. The task list is not done. Choose:",
    options: [
      {
        label: "Hand off the last task — protect the sleep window",
        points: 8,
        chipAt: "22:30",
        why: "Keeping a fixed wake-up protects the anchor. One short night is survivable; a drifting schedule compounds.",
      },
      {
        label: "Push through everything, sleep four hours",
        points: -12,
        chipAt: "02:00",
        why: "A short, late night is the classic first domino: tomorrow's vigilance drops and caffeine use rises.",
      },
    ],
  },
  {
    id: "evening-light",
    at: "21:00",
    topic: "Evening light",
    prompt: "Wind-down begins. What are the lights doing?",
    options: [
      {
        label: "Dim, amber-tinted lights for the last two hours",
        points: 14,
        why: "Dim warm light lets melatonin rise on time. This is the cheapest sleep aid on the station.",
      },
      {
        label: "Full bright overheads until lights-out",
        points: -12,
        why: "Bright blue-leaning light in the evening suppresses melatonin and pushes the clock later, night after night.",
      },
    ],
  },
  {
    id: "sleep-window",
    at: "22:30",
    topic: "Sleep window",
    prompt: "Where does sleep live this month?",
    options: [
      {
        label: "The same 8-hour slot every day, dark and cool",
        points: 16,
        why: "A fixed sleep window is the anchor itself — everything else in this game protects this one choice.",
      },
      {
        label: "Catch sleep whenever ops allow",
        points: -8,
        why: "Drifting sleep turns into permanent jet lag. In orbit, with no sunrise cue worth the name, only the schedule holds.",
      },
    ],
  },
];

export const CLOCK_FACT =
  "The station sees sixteen sunrises a day — the sky is no schedule at all. The body clock runs slightly long and takes its cues almost entirely from light, caffeine, meals and the timing you keep.";

export const CLOCK_MAX = CLOCK_STEPS.reduce(
  (sum, step) =>
    sum + Math.max(...step.options.map((option) => option.points)),
  0,
);

/* ────────────────────────────────────────────────────────────
   FACT FROM FICTION — myth-or-fact round
   ──────────────────────────────────────────────────────────── */

export interface FactCard {
  id: string;
  topic: string;
  claim: string;
  verdict: "fact" | "myth";
  why: string;
}

export const FACT_DECK: FactCard[] = [
  {
    id: "height",
    topic: "Spine",
    claim:
      "In microgravity the spine unloads, so astronauts can stand a few centimetres taller on orbit.",
    verdict: "fact",
    why: "Without gravity compressing it, the spinal column stretches — the gain is temporary and returns after landing.",
  },
  {
    id: "bone-cause",
    topic: "Bone",
    claim: "Bone loss in space is caused mainly by changes in the astronauts' diet.",
    verdict: "myth",
    why: "The dominant driver is mechanical unloading — bone remodels to the loads it feels. Nutrition supports the response, but exercise provides the signal.",
  },
  {
    id: "fluid-face",
    topic: "Fluids",
    claim:
      "Fluid shifts toward the head in orbit, so faces often look fuller and legs thinner.",
    verdict: "fact",
    why: "Without gravity pulling blood and water downward, fluids redistribute headward — the classic 'puffy face, bird legs' of early flight.",
  },
  {
    id: "once-week",
    topic: "Bone",
    claim:
      "Exercising once a week is enough to fully prevent bone loss on a Mars mission.",
    verdict: "myth",
    why: "Daily loading over years matters. Countermeasures slow — and manage — bone loss; there is no known once-a-week guarantee.",
  },
  {
    id: "caffeine",
    topic: "Sleep",
    claim: "About five hours after a coffee, roughly half the caffeine is still in the body.",
    verdict: "fact",
    why: "That five-ish-hour half-life is why a late cup is still working against bedtime — and why flight schedules ration it.",
  },
  {
    id: "blue-night",
    topic: "Light",
    claim: "Bright blue-enriched light just before bed helps astronauts fall asleep faster.",
    verdict: "myth",
    why: "It is the reverse. Evening blue light suppresses melatonin and delays the clock; blue light is the morning tool, dim amber the evening one.",
  },
  {
    id: "sans",
    topic: "Vision",
    claim:
      "Vision can change during long missions — a syndrome linked in part to fluid shifts around the eye and brain.",
    verdict: "fact",
    why: "Spaceflight-associated neuro-ocular syndrome (SANS) is one of NASA's key research areas for long-duration flight.",
  },
  {
    id: "vitamin-d",
    topic: "Nutrition",
    claim: "Astronauts get their vitamin D mainly from sunlight through the spacecraft windows.",
    verdict: "myth",
    why: "Windows filter the UVB needed to make vitamin D in skin, so crews rely on supplements and fortified food.",
  },
  {
    id: "stand-up",
    topic: "Return",
    claim:
      "Back on Earth, some crew members feel light-headed when standing up after landing.",
    verdict: "fact",
    why: "Orthostatic intolerance: the body has adapted to a gravity-free fluid layout, and blood pools downward again on return. Countermeasures and reconditioning help.",
  },
  {
    id: "postural",
    topic: "Muscle",
    claim: "The muscles hit hardest by weightlessness are the postural ones that fight gravity all day.",
    verdict: "fact",
    why: "Calf, back and quadriceps muscles do the most anti-gravity work on Earth — and atrophy fastest without deliberate loading in orbit.",
  },
  {
    id: "radiation",
    topic: "Radiation",
    claim: "Inside the spacecraft, radiation exposure is effectively zero.",
    verdict: "myth",
    why: "Hull shielding reduces but does not stop space radiation, and solar storms can spike dose. Crews track exposure and follow ALARA — as low as reasonably achievable.",
  },
  {
    id: "clock-gravity",
    topic: "Rhythm",
    claim: "The body clock runs the same in orbit as on Earth because it ignores gravity anyway.",
    verdict: "myth",
    why: "The clock is set by light and timing, and orbit breaks both: sixteen sunrises a day and shifting ops schedules demand deliberate anchors — light, meals, fixed sleep.",
  },
];
