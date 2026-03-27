import { describe, it, expect } from 'vitest';
import { calculateStars, calculateXp } from '@hero-academy/shared';
import { getRankForXp } from '@hero-academy/shared';

describe('gamification (shared pure functions)', () => {
  // -----------------------------------------------------------------------
  // calculateStars
  // -----------------------------------------------------------------------

  describe('calculateStars', () => {
    it('returns 3 stars for 90%+ score', () => {
      expect(calculateStars(9, 10)).toBe(3);
      expect(calculateStars(10, 10)).toBe(3);
    });

    it('returns 2 stars for 60%-89% score', () => {
      expect(calculateStars(6, 10)).toBe(2);
      expect(calculateStars(8, 10)).toBe(2);
    });

    it('returns 1 star for below 60% score', () => {
      expect(calculateStars(5, 10)).toBe(1);
      expect(calculateStars(0, 10)).toBe(1);
    });

    it('handles edge cases at boundaries', () => {
      // 59% → 1 star
      expect(calculateStars(59, 100)).toBe(1);
      // 60% → 2 stars
      expect(calculateStars(60, 100)).toBe(2);
      // 89% → 2 stars
      expect(calculateStars(89, 100)).toBe(2);
      // 90% → 3 stars
      expect(calculateStars(90, 100)).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // calculateXp
  // -----------------------------------------------------------------------

  describe('calculateXp', () => {
    it('returns score * 10 + 0 bonus for 1 star', () => {
      expect(calculateXp(5, 1)).toBe(50); // 5*10 + 0
    });

    it('returns score * 10 + 5 bonus for 2 stars', () => {
      expect(calculateXp(7, 2)).toBe(75); // 7*10 + 5
    });

    it('returns score * 10 + 20 bonus for 3 stars', () => {
      expect(calculateXp(10, 3)).toBe(120); // 10*10 + 20
    });
  });

  // -----------------------------------------------------------------------
  // Rank tier thresholds
  // -----------------------------------------------------------------------

  describe('getRankForXp', () => {
    it('returns Recruit for 0 XP', () => {
      expect(getRankForXp(0).name).toBe('Recruit');
    });

    it('returns Recruit for 99 XP', () => {
      expect(getRankForXp(99).name).toBe('Recruit');
    });

    it('returns Sidekick for 100 XP', () => {
      expect(getRankForXp(100).name).toBe('Sidekick');
    });

    it('returns Sidekick for 499 XP', () => {
      expect(getRankForXp(499).name).toBe('Sidekick');
    });

    it('returns Hero for 500 XP', () => {
      expect(getRankForXp(500).name).toBe('Hero');
    });

    it('returns Hero for 1499 XP', () => {
      expect(getRankForXp(1499).name).toBe('Hero');
    });

    it('returns Superhero for 1500 XP', () => {
      expect(getRankForXp(1500).name).toBe('Superhero');
    });

    it('returns Superhero for very high XP', () => {
      expect(getRankForXp(99999).name).toBe('Superhero');
    });
  });
});
