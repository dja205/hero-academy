import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';
export function BossCard({ subjectId }) {
    const navigate = useNavigate();
    const prefersReduced = useReducedMotion();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        childApi
            .getBossStatus(subjectId)
            .then((data) => {
            if (!cancelled)
                setStatus(data);
        })
            .catch(() => {
            // Boss not available for this subject
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [subjectId]);
    if (loading || !status)
        return null;
    const { boss, unlocked, alreadyConquered } = status;
    // Conquered state
    if (alreadyConquered) {
        return (_jsx(motion.div, { initial: prefersReduced ? {} : { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3 }, className: "card-hero border-2 border-hero-amber/60 bg-hero-amber/10", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl", children: boss.emoji }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-base font-bold text-hero-amber truncate", children: boss.name }), _jsx("span", { className: "text-lg", children: "\u2705" })] }), _jsx("p", { className: "text-xs text-slate-400", children: "Zone Conquered!" })] }), _jsx("span", { className: "text-2xl", children: "\uD83C\uDFC6" })] }) }));
    }
    // Locked state
    if (!unlocked) {
        return (_jsx(motion.div, { initial: prefersReduced ? {} : { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3 }, className: "card-hero opacity-50", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl grayscale", children: boss.emoji }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "text-base font-bold text-slate-400 truncate", children: boss.name }), _jsx("span", { className: "text-lg", children: "\uD83D\uDD12" })] }), _jsx("p", { className: "text-xs text-slate-500", children: "Complete all districts to unlock" })] })] }) }));
    }
    // Unlocked state — tappable with pulsing amber glow
    return (_jsxs(motion.button, { type: "button", onClick: () => navigate(`/child/boss/${subjectId}`), initial: prefersReduced ? {} : { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3 }, whileTap: { scale: 0.97 }, className: "w-full card-hero text-left animate-glow-pulse border-2 border-hero-amber/40\n                 hover:border-hero-amber/70 active:scale-[0.98] transition-all", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-3xl", children: boss.emoji }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "text-base font-bold text-hero-amber truncate", children: boss.name }), _jsx("p", { className: "text-xs text-slate-400", children: boss.description })] }), _jsx("span", { className: "text-2xl", children: "\u2694\uFE0F" })] }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("div", { className: "flex-1 h-2 bg-slate-700 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-red-500", style: { width: '100%' } }) }), _jsxs("span", { className: "text-xs text-red-400 font-bold", children: [boss.hp, " HP"] })] })] }));
}
