import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';
const DIFFICULTY_LABEL = {
    easy: { label: 'Easy', colour: 'text-hero-green' },
    medium: { label: 'Medium', colour: 'text-hero-amber' },
    hard: { label: 'Hard', colour: 'text-hero-red' },
};
export function DistrictPage() {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const prefersReduced = useReducedMotion();
    const [topic, setTopic] = useState(null);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!topicId)
            return;
        let cancelled = false;
        Promise.all([
            childApi.getTopics(),
            childApi.getAssessments(topicId),
        ]).then(([topicsData, assessData]) => {
            if (cancelled)
                return;
            const found = topicsData.topics.find((t) => t.id === topicId) ?? null;
            setTopic(found);
            setAssessments(assessData.assessments);
            setLoading(false);
        }).catch(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => { cancelled = true; };
    }, [topicId]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(motion.div, { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: 'linear' }, className: "w-12 h-12 border-4 border-hero-amber border-t-transparent rounded-full" }) }));
    }
    if (!topic) {
        return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-4 px-4", children: [_jsx("p", { className: "text-slate-400 text-lg", children: "District not found" }), _jsx("button", { type: "button", onClick: () => navigate('/child/map'), className: "btn-hero", children: "Back to Map" })] }));
    }
    return (_jsx("div", { className: "min-h-screen bg-city-dark px-4 pt-6 pb-24", children: _jsxs(motion.div, { initial: prefersReduced ? {} : { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.4 }, children: [_jsxs("div", { className: "flex items-center gap-3 mb-6", children: [_jsx("button", { type: "button", onClick: () => navigate('/child/map'), className: "w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center\n                       text-xl text-white active:scale-90 transition-transform min-w-[56px] min-h-[56px]", "aria-label": "Back to city map", children: "\u2190" }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-hero tracking-wide", style: { color: topic.colour }, children: topic.districtName }), _jsx("p", { className: "text-slate-400 text-sm", children: topic.name })] })] }), _jsx("div", { className: "grid gap-3", children: assessments.map((mission, index) => {
                        // First mission always unlocked, subsequent require prior mission completed
                        const isLocked = index > 0 && !(topic.progress && topic.progress.completed > index - 1);
                        const diff = DIFFICULTY_LABEL[mission.difficulty] ?? DIFFICULTY_LABEL.medium;
                        // Simple star calc: if completed missions > index, show stars based on progress
                        const missionCompleted = topic.progress ? topic.progress.completed > index : false;
                        const starCount = missionCompleted
                            ? Math.min(3, Math.max(1, 3 - index))
                            : 0;
                        return (_jsxs(motion.button, { type: "button", disabled: isLocked, onClick: () => navigate(`/child/mission/${mission.id}`, { state: { topicId } }), className: `card-hero text-left flex items-center gap-4 min-h-[72px] transition-all
                  ${isLocked
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:border-hero-amber/50 active:scale-[0.98]'}`, initial: prefersReduced ? {} : { x: -15, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { delay: index * 0.1 }, whileTap: isLocked ? {} : { scale: 0.97 }, children: [_jsx("div", { className: "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0", style: {
                                        backgroundColor: isLocked ? undefined : topic.colour + '33',
                                        color: isLocked ? undefined : topic.colour,
                                    }, children: isLocked ? '🔒' : index + 1 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx("h3", { className: "text-base font-bold text-white truncate", children: mission.title }) }), _jsxs("div", { className: "flex items-center gap-3 mt-1", children: [_jsx("span", { className: `text-xs font-bold ${diff.colour}`, children: diff.label }), starCount > 0 && (_jsx("span", { className: "text-xs text-hero-amber", children: '⭐'.repeat(starCount) })), isLocked && (_jsx("span", { className: "text-xs text-slate-500", children: "Complete previous mission" }))] })] })] }, mission.id));
                    }) }), assessments.length === 0 && (_jsx("p", { className: "text-slate-400 text-center mt-8", children: "No missions available yet. Check back soon!" }))] }) }));
}
