"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XP_STAR_BONUS = exports.XP_PER_CORRECT = void 0;
exports.calculateStars = calculateStars;
exports.calculateXp = calculateXp;
exports.XP_PER_CORRECT = 10;
exports.XP_STAR_BONUS = {
    1: 0,
    2: 5,
    3: 20,
};
function calculateStars(score, maxScore) {
    const pct = score / maxScore;
    if (pct >= 0.9)
        return 3;
    if (pct >= 0.6)
        return 2;
    return 1;
}
function calculateXp(score, stars) {
    return score * exports.XP_PER_CORRECT + exports.XP_STAR_BONUS[stars];
}
