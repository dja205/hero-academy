import type { RankTier } from '../types/gamification';

export const RANKS: RankTier[] = [
  { name: 'Recruit',   minXp: 0,    maxXp: 99,   colour: '#6b7280' },
  { name: 'Sidekick',  minXp: 100,  maxXp: 499,  colour: '#3b82f6' },
  { name: 'Hero',      minXp: 500,  maxXp: 1499, colour: '#f59e0b' },
  { name: 'Superhero', minXp: 1500, maxXp: null, colour: '#ef4444' },
];

export function getRankForXp(xp: number): RankTier {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXp) return RANKS[i];
  }
  return RANKS[0];
}
