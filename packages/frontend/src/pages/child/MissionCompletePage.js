import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { StarReveal } from '../../components/child/StarReveal';
import { RANKS } from '@hero-academy/shared';
function getRankProgress(rank, totalXp) {
    const currentRank = RANKS.find((r) => r.name === rank) || RANKS[0];
    const rankIdx = RANKS.indexOf(currentRank);
    const nextRank = rankIdx < RANKS.length - 1 ? RANKS[rankIdx + 1] : null;
    const rankFloor = currentRank.minXp;
    const rankCeiling = nextRank ? nextRank.minXp : rankFloor + 1000;
    const rankRange = rankCeiling - rankFloor;
    const progressInRank = Math.min(totalXp - rankFloor, rankRange);
    const pct = rankRange > 0 ? Math.round((progressInRank / rankRange) * 100) : 100;
    return { pct, ceiling: nextRank ? nextRank.minXp : rankCeiling };
}
export function MissionCompletePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const prefersReduced = useReducedMotion();
    const state = location.state;
    if (!state) {
        return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-4 px-4", children: [_jsx("p", { className: "text-slate-400 text-lg", children: "No mission data" }), _jsx("button", { type: "button", onClick: () => navigate('/child/map'), className: "btn-hero", children: "Back to Map" })] }));
    }
    const { score, maxScore, stars, xpEarned, newTotalXp, newRank, newAchievements } = state;
    const { pct: rankPct } = getRankProgress(newRank, newTotalXp);
    return (_jsx("div", { className: "min-h-screen bg-city-dark px-4 pt-8 pb-24 flex flex-col items-center", children: _jsxs(motion.div, { initial: prefersReduced ? {} : { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.5, type: 'spring' }, className: "w-full max-w-sm flex flex-col items-center gap-6", children: [_jsx("h1", { className: "text-3xl font-hero text-hero-amber tracking-wide text-center", children: "Mission Complete!" }), _jsx(motion.div, { initial: prefersReduced ? {} : { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.3, type: 'spring', stiffness: 200 }, className: "text-center", children: _jsxs("p", { className: "text-6xl font-hero text-white", children: [_jsx(motion.span, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, children: score }), _jsxs("span", { className: "text-slate-500", children: ["/", maxScore] })] }) }), _jsx(StarReveal, { stars: stars }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 1.2 }, className: "card-hero w-full text-center", children: [_jsx("p", { className: "text-sm text-slate-400 mb-1", children: "XP Earned" }), _jsxs("p", { className: "text-3xl font-hero text-hero-amber", children: ["+", xpEarned, " XP"] })] }), _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 1.5 }, className: "card-hero w-full", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-bold text-hero-purple", children: newRank }), _jsxs("span", { className: "text-xs text-slate-400", children: [newTotalXp, " XP"] })] }), _jsx("div", { className: "h-3 bg-slate-700 rounded-full overflow-hidden", children: _jsx(motion.div, { className: "h-full rounded-full bg-hero-purple", initial: { width: 0 }, animate: { width: `${rankPct}%` }, transition: { delay: 1.8, duration: 0.8, ease: 'easeOut' } }) })] }), newAchievements.length > 0 && (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 2.2 }, className: "card-hero w-full text-center", children: [_jsx("p", { className: "text-sm font-bold text-hero-amber mb-2", children: "\uD83C\uDFC6 Achievement Unlocked!" }), _jsx("div", { className: "flex flex-wrap gap-2 justify-center", children: newAchievements.map((achievement) => (_jsx("span", { className: "px-3 py-1 bg-hero-amber/20 text-hero-amber rounded-full text-sm font-bold", children: achievement }, achievement))) })] })), _jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 2.5 }, className: "flex flex-col gap-3 w-full mt-2", children: [_jsx("button", { type: "button", onClick: () => navigate(`/child/mission/${state.assessmentId}`, { replace: true, state: { topicId: state.topicId } }), className: "btn-hero text-base min-h-[56px] w-full", children: "\uD83D\uDD04 Train Again" }), _jsx("button", { type: "button", onClick: () => navigate('/child/map', { replace: true }), className: "px-6 py-3 rounded-xl font-bold text-white bg-hero-blue hover:bg-blue-600\n                       active:scale-95 transition-all duration-150 shadow-lg min-h-[56px] w-full", children: "\uD83D\uDDFA\uFE0F Back to Map" })] })] }) }));
}
