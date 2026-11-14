export interface CrewActivity {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'question' | 'challenge' | 'milestone';
}

export const DAILY_QUESTIONS: string[] = [
  "If you could bring one item from Earth that isn't on the manifest, what would it be?",
  "What's a skill you've always wanted to learn? Could you start here?",
  "Describe your favorite place on Earth using only sounds.",
  "What's the most beautiful thing you've seen through the viewport?",
  "If you could send a 30-second message to anyone on Earth right now, who would it be and what would you say?",
  "What's one thing about space that surprised you the most?",
  "What meal from home do you miss the most?",
  "If the crew were to write a book about this mission, what would the title be?",
  "What's the funniest thing that's happened on this mission so far?",
  "What's one habit you've developed in space that you'll keep on Earth?",
  "If you could name a newly discovered star, what would you call it?",
  "What's the hardest part about living in microgravity that no one warned you about?",
  "What would you show a visitor if they could come aboard for one hour?",
  "What's something you've learned about yourself during this mission?",
  "If Earth could hear one thing from us as a crew, what should we say?",
  "What do you think future crews will do differently?",
  "What's the most peaceful moment you've had in space?",
  "Describe what Earth looks like right now to someone who's never seen it from here.",
  "What tradition should we establish for this crew?",
  "What will you do first when you step onto solid ground again?",
  "If we could grow any plant from home in the greenhouse, what would you choose?",
  "What's a song that feels different when you listen to it up here?",
  "What small comfort from daily life on Earth do you think about most?",
  "If you could livestream one hour of our day to Earth, which hour would you pick?",
  "What will you remember most about this crew?",
  "What would make our habitat feel more like home?",
  "If we had a crew pet, what species would survive best? What would we name it?",
  "What experiment or observation has genuinely surprised you?",
  "If you could redesign one part of this spacecraft, what would it be?",
  "What's a question you wish someone on Earth would ask you?",
];

export const CREW_MILESTONES = [
  { day: 30, title: 'First Month', description: 'One month into the mission — adaptation complete.' },
  { day: 100, title: 'Century Mark', description: '100 sols together. A third of the outbound journey.' },
  { day: 180, title: 'Halfway Point', description: "We've passed the point of no return. Onward to Mars." },
  { day: 247, title: 'Maximum Distance', description: 'Furthest from Earth we will ever be on this trajectory.' },
  { day: 300, title: 'Approach Phase', description: 'Mars grows in the viewport. Arrival preparations begin.' },
  { day: 365, title: 'One Year', description: 'A full year in space. Only the second crew to achieve this on a Mars transit.' },
  { day: 500, title: 'Surface Ops Complete', description: '500 sols. Mars surface operations winding down.' },
  { day: 600, title: 'Homeward Bound', description: 'Return trajectory locked. Earth is getting bigger.' },
  { day: 687, title: 'Mission Complete', description: 'We made it. Welcome home.' },
];

export function getDailyQuestion(missionDay: number): string {
  return DAILY_QUESTIONS[missionDay % DAILY_QUESTIONS.length];
}

export function getRecentMilestones(missionDay: number) {
  const past = CREW_MILESTONES.filter(m => m.day <= missionDay);
  const next = CREW_MILESTONES.find(m => m.day > missionDay);
  return { past, next };
}
