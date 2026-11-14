/**
 * Skill decay modeling using the Ebbinghaus forgetting curve.
 * R = e^(-t/S) where t = time since last review, S = stability
 */

export function calculateRetention(
  daysSinceReview: number,
  stability: number // Higher = slower decay
): number {
  return Math.exp(-daysSinceReview / Math.max(stability, 0.1));
}

export function getRetentionColor(retention: number): string {
  if (retention >= 0.8) return 'var(--sc-green)';
  if (retention >= 0.6) return 'var(--sc-amber)';
  if (retention >= 0.4) return 'var(--sc-amber-dim)';
  return 'var(--sc-red)';
}

export function getRetentionLabel(retention: number): string {
  if (retention >= 0.8) return 'Strong';
  if (retention >= 0.6) return 'Good';
  if (retention >= 0.4) return 'Fading';
  if (retention >= 0.2) return 'Weak';
  return 'Critical';
}

export function getDaysUntilThreshold(
  currentRetention: number,
  stability: number,
  threshold: number = 0.5
): number {
  if (currentRetention <= threshold) return 0;
  // Solve: threshold = e^(-t/S) => t = -S * ln(threshold)
  const totalDaysToThreshold = -stability * Math.log(threshold);
  const daysAlreadyPassed = -stability * Math.log(currentRetention);
  return Math.max(0, Math.round(totalDaysToThreshold - daysAlreadyPassed));
}
