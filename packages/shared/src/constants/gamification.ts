export const XP_PER_CORRECT = 10;
export const XP_STAR_BONUS: Record<1 | 2 | 3, number> = {
  1: 0,
  2: 5,
  3: 20,
};

export function calculateStars(score: number, maxScore: number): 1 | 2 | 3 {
  const pct = score / maxScore;
  if (pct >= 0.9) return 3;
  if (pct >= 0.6) return 2;
  return 1;
}

export function calculateXp(score: number, stars: 1 | 2 | 3): number {
  return score * XP_PER_CORRECT + XP_STAR_BONUS[stars];
}
