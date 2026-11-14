export interface CognitiveChallenge {
  id: string;
  type: 'pattern' | 'memory' | 'math' | 'word';
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface PatternData {
  sequence: number[];
  answer: number;
  options: number[];
}

export interface MathData {
  expression: string;
  answer: number;
  options: number[];
}

export const MIND_GYM_GAMES: CognitiveChallenge[] = [
  {
    id: 'pattern-recognition',
    type: 'pattern',
    title: 'Pattern Recognition',
    description: 'Find the next number in the sequence. Trains spatial and logical reasoning.',
    icon: '🔢',
    color: 'var(--sc-blue)',
  },
  {
    id: 'memory-sequence',
    type: 'memory',
    title: 'Memory Matrix',
    description: 'Remember the highlighted cells and recreate the pattern. Trains working memory.',
    icon: '🧠',
    color: 'var(--sc-purple)',
  },
  {
    id: 'quick-math',
    type: 'math',
    title: 'Quick Math',
    description: 'Mental arithmetic under time pressure. Trains numerical fluency.',
    icon: '⚡',
    color: 'var(--sc-amber)',
  },
  {
    id: 'word-association',
    type: 'word',
    title: 'Word Association',
    description: 'Find the common thread between words. Trains linguistic and creative thinking.',
    icon: '💬',
    color: 'var(--sc-teal)',
  },
];

export const PATTERN_LEVELS: PatternData[] = [
  { sequence: [2, 4, 6, 8], answer: 10, options: [10, 12, 9, 11] },
  { sequence: [1, 1, 2, 3, 5], answer: 8, options: [7, 8, 6, 13] },
  { sequence: [3, 6, 12, 24], answer: 48, options: [36, 48, 30, 96] },
  { sequence: [1, 4, 9, 16, 25], answer: 36, options: [30, 34, 36, 49] },
  { sequence: [2, 6, 12, 20, 30], answer: 42, options: [38, 40, 42, 56] },
  { sequence: [1, 3, 7, 15, 31], answer: 63, options: [47, 62, 63, 64] },
  { sequence: [0, 1, 1, 2, 3, 5, 8, 13], answer: 21, options: [18, 19, 20, 21] },
  { sequence: [2, 3, 5, 7, 11, 13], answer: 17, options: [15, 16, 17, 19] },
];

export function generateMathProblem(difficulty: number): MathData {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * Math.min(ops.length, Math.max(1, difficulty)))];
  let a: number, b: number, answer: number;
  const range = 10 + difficulty * 15;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * range) + 1;
      b = Math.floor(Math.random() * range) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * range) + 20;
      b = Math.floor(Math.random() * Math.min(a, range)) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * (5 + difficulty * 3)) + 2;
      b = Math.floor(Math.random() * (5 + difficulty * 2)) + 2;
      answer = a * b;
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const opt = answer + (offset === 0 ? 1 : offset);
    if (!options.includes(opt) && opt > 0) options.push(opt);
  }
  return { expression: `${a} ${op} ${b}`, answer, options: options.sort(() => Math.random() - 0.5) };
}
