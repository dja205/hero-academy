"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANKS = void 0;
exports.getRankForXp = getRankForXp;
exports.RANKS = [
    { name: 'Recruit', minXp: 0, maxXp: 99, colour: '#6b7280' },
    { name: 'Sidekick', minXp: 100, maxXp: 499, colour: '#3b82f6' },
    { name: 'Hero', minXp: 500, maxXp: 1499, colour: '#f59e0b' },
    { name: 'Superhero', minXp: 1500, maxXp: null, colour: '#ef4444' },
];
function getRankForXp(xp) {
    for (let i = exports.RANKS.length - 1; i >= 0; i--) {
        if (xp >= exports.RANKS[i].minXp)
            return exports.RANKS[i];
    }
    return exports.RANKS[0];
}
