import { Star } from "lucide-react";

export function Stars({
  value,
  max = 3,
}: {
  value: number;
  max?: number;
}) {
  return (
    <span
      className="star-row"
      role="img"
      aria-label={`${value} of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => (
        <Star
          key={index}
          size={17}
          fill={index < value ? "currentColor" : "none"}
          className={index < value ? "" : "star-off"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function starsFromThresholds(
  score: number,
  t3: number,
  t2: number,
  t1: number,
) {
  if (score >= t3) return 3;
  if (score >= t2) return 2;
  if (score >= t1) return 1;
  return 0;
}
