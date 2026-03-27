import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { childApi } from '../../api/child';
import { HeroAvatar } from '../../components/child/HeroAvatar';
import { apiClient } from '../../api/client';
import { RANKS, ACHIEVEMENTS as SHARED_ACHIEVEMENTS } from '@hero-academy/shared';
function getRankProgress(rank, totalXp) {
    const currentRank = RANKS.find((r) => r.name === rank) || RANKS[0];
    const rankIdx = RANKS.indexOf(currentRank);
    const nextRank = rankIdx < RANKS.length - 1 ? RANKS[rankIdx + 1] : null;
    const rankFloor = currentRank.minXp;
    const rankCeiling = nextRank ? nextRank.minXp : rankFloor + 1000;
    const rankRange = rankCeiling - rankFloor;
    const progressInRank = Math.min(totalXp - rankFloor, rankRange);
    const pct = rankRange > 0 ? Math.round((progressInRank / rankRange) * 100) : 100;
    return { pct, ceiling: nextRank ? nextRank.minXp : rankCeiling, colour: currentRank.colour };
}
export function ProfilePage() {
    const navigate = useNavigate();
    const prefersReduced = useReducedMotion();
    const { userId, clearAuth } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!userId)
            return;
        let cancelled = false;
        Promise.all([
            apiClient.get('/children/me'),
            childApi.getStats(userId),
        ]).then(([profileData, statsData]) => {
            if (cancelled)
                return;
            setProfile(profileData.child);
            setStats(statsData);
            setLoading(false);
        }).catch(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => { cancelled = true; };
    }, [userId]);
    const handleLogout = () => {
        clearAuth();
        navigate('/child/login', { replace: true });
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(motion.div, { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: 'linear' }, className: "w-12 h-12 border-4 border-hero-amber border-t-transparent rounded-full" }) }));
    }
    if (!profile || !stats) {
        return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-4 px-4", children: [_jsx("p", { className: "text-slate-400 text-lg", children: "Profile not found" }), _jsx("button", { type: "button", onClick: () => navigate('/child/map'), className: "btn-hero", children: "Back to Map" })] }));
    }
    const { pct: rankPct, ceiling: nextRankXp } = getRankProgress(stats.rank, stats.totalXp);
    return (_jsx("div", { className: "min-h-screen bg-city-dark px-4 pt-6 pb-24", children: _jsxs(motion.div, { initial: prefersReduced ? {} : { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.4 }, className: "max-w-sm mx-auto flex flex-col items-center gap-6", children: [_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx("div", { className: "relative", children: _jsx(motion.div, { className: "rounded-full bg-slate-800 border-4 border-hero-amber p-4 shadow-lg shadow-hero-amber/20", animate: prefersReduced ? {} : { boxShadow: ['0 0 20px rgba(245,158,11,0.3)', '0 0 40px rgba(245,158,11,0.6)', '0 0 20px rgba(245,158,11,0.3)'] }, transition: { duration: 2, repeat: Infinity }, children: _jsx(HeroAvatar, { costume: profile.avatarConfig.costume, mask: profile.avatarConfig.mask, size: 120 }) }) }), _jsx("h1", { className: "text-3xl font-hero text-hero-amber tracking-wide", children: profile.heroName }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("span", { className: "px-3 py-1 bg-hero-purple/20 text-hero-purple rounded-full text-sm font-bold", children: stats.rank }) })] }), _jsxs("div", { className: "card-hero w-full", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-bold text-slate-300", children: "XP Progress" }), _jsxs("span", { className: "text-xs text-slate-400", children: [stats.totalXp, " / ", nextRankXp, " XP"] })] }), _jsx("div", { className: "h-3 bg-slate-700 rounded-full overflow-hidden", children: _jsx(motion.div, { className: "h-full rounded-full bg-hero-purple", initial: { width: 0 }, animate: { width: `${rankPct}%` }, transition: { duration: 1, ease: 'easeOut' } }) })] }), _jsx("div", { className: "grid grid-cols-2 gap-3 w-full", children: [
                        { label: 'Missions', value: stats.totalMissions, icon: '🎯' },
                        { label: 'Avg Score', value: `${Math.round(stats.avgScore)}%`, icon: '📊' },
                        { label: 'Streak', value: `${stats.currentStreak} days`, icon: '🔥' },
                        { label: 'Days Played', value: stats.daysPlayed, icon: '📅' },
                    ].map(({ label, value, icon }) => (_jsxs("div", { className: "card-hero text-center", children: [_jsx("span", { className: "text-2xl", "aria-hidden": "true", children: icon }), _jsx("p", { className: "text-xl font-hero text-white mt-1", children: value }), _jsx("p", { className: "text-xs text-slate-400", children: label })] }, label))) }), _jsxs("div", { className: "grid gap-3 w-full", children: [stats.strongestDistrict && (_jsxs("div", { className: "card-hero flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", "aria-hidden": "true", children: "\uD83D\uDCAA" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs text-slate-400", children: "Strongest District" }), _jsx("p", { className: "font-bold text-hero-green", children: stats.strongestDistrict })] })] })), stats.weakestDistrict && (_jsxs("div", { className: "card-hero flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", "aria-hidden": "true", children: "\uD83D\uDCDA" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-xs text-slate-400", children: "Needs Practice" }), _jsx("p", { className: "font-bold text-hero-amber", children: stats.weakestDistrict })] }), _jsx("button", { type: "button", onClick: () => navigate('/child/map'), className: "px-3 py-2 bg-hero-amber/20 text-hero-amber rounded-lg text-xs font-bold\n                           hover:bg-hero-amber/30 active:scale-95 transition-all min-h-[44px]", children: "Train Here" })] }))] }), _jsxs("div", { className: "w-full", children: [_jsx("h2", { className: "text-xl font-hero text-white mb-3", children: "Achievements" }), _jsx("div", { className: "grid grid-cols-4 gap-3", children: SHARED_ACHIEVEMENTS.map((achievement) => (_jsxs("div", { className: "flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all bg-slate-800 opacity-50 grayscale", title: achievement.name, children: [_jsx("span", { className: "text-2xl", children: achievement.icon }), _jsx("span", { className: "text-[10px] text-slate-400 leading-tight", children: achievement.name })] }, achievement.type))) })] }), _jsx("button", { type: "button", onClick: handleLogout, className: "w-full py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800\n                     transition-colors text-sm font-bold min-h-[56px]", children: "\uD83C\uDFE0 Switch Hero" })] }) }));
}
