export declare const XP_PER_CORRECT = 10;
export declare const XP_STAR_BONUS: Record<1 | 2 | 3, number>;
export declare function calculateStars(score: number, maxScore: number): 1 | 2 | 3;
export declare function calculateXp(score: number, stars: 1 | 2 | 3): number;
