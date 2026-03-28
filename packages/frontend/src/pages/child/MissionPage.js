import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';
import { PowerMeter } from '../../components/child/PowerMeter';
/** Generate a UUID that works in non-secure contexts (HTTP over IP). */
function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        try {
            return crypto.randomUUID();
        }
        catch {
            // Falls through to fallback
        }
    }
    // Fallback: use crypto.getRandomValues (available in all modern browsers)
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
export function MissionPage() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const prefersReduced = useReducedMotion();
    const location = useLocation();
    const { topicId } = location.state || {};
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [startTime] = useState(Date.now());
    useEffect(() => {
        if (!assessmentId || !topicId) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        childApi.getAssessments(topicId).then((data) => {
            if (cancelled)
                return;
            const found = data.assessments.find((a) => a.id === assessmentId);
            if (found)
                setAssessment(found);
            setLoading(false);
        }).catch(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => { cancelled = true; };
    }, [assessmentId, topicId]);
    const question = assessment?.questions[currentQ];
    const totalQuestions = assessment?.questions.length ?? 0;
    const handleAnswer = useCallback((optionIndex) => {
        if (showFeedback || !question)
            return;
        // Allow changing selection until Next is clicked — only update selectedOption
        setSelectedOption(optionIndex);
        setShowNext(true);
    }, [showFeedback, question]);
    const handleNext = useCallback(() => {
        // Lock in the selected answer and show feedback before advancing
        if (selectedOption === null)
            return;
        const lockedAnswers = [...answers, selectedOption];
        setAnswers(lockedAnswers);
        setShowFeedback(true);
        const nextQ = currentQ + 1;
        if (nextQ >= totalQuestions) {
            // Submit attempt with idempotency key
            const durationSeconds = Math.round((Date.now() - startTime) / 1000);
            const finalAnswers = lockedAnswers;
            const attemptId = generateUUID();
            childApi
                .submitAttempt({
                assessmentId: assessment.id,
                answers: finalAnswers,
                durationSeconds,
                attemptId,
            })
                .then((result) => {
                navigate(`/child/mission/${assessmentId}/complete`, {
                    state: {
                        score: result.score,
                        maxScore: result.maxScore,
                        stars: result.stars,
                        xpEarned: result.xpEarned,
                        newTotalXp: result.newTotalXp,
                        newRank: result.newRank ?? result.currentRank ?? 'Recruit',
                        newAchievements: result.newAchievements,
                        assessmentId,
                        topicId,
                    },
                });
            })
                .catch(() => {
                navigate(`/child/mission/${assessmentId}/complete`, {
                    state: {
                        score: 0,
                        maxScore: totalQuestions,
                        stars: 1,
                        xpEarned: 0,
                        newTotalXp: 0,
                        newRank: 'Recruit',
                        newAchievements: [],
                        assessmentId,
                        topicId,
                    },
                });
            });
            return;
        }
        // Brief delay so user sees feedback before next question
        setTimeout(() => {
            setCurrentQ(nextQ);
            setSelectedOption(null);
            setShowFeedback(false);
            setShowNext(false);
        }, 600);
    }, [currentQ, totalQuestions, answers, selectedOption, assessment, assessmentId, navigate, startTime]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(motion.div, { animate: { rotate: 360 }, transition: { duration: 1, repeat: Infinity, ease: 'linear' }, className: "w-12 h-12 border-4 border-hero-amber border-t-transparent rounded-full" }) }));
    }
    if (!assessment || !question) {
        return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-4 px-4", children: [_jsx("p", { className: "text-slate-400 text-lg", children: "Mission not found" }), _jsx("button", { type: "button", onClick: () => navigate('/child/map'), className: "btn-hero", children: "Back to Map" })] }));
    }
    return (_jsx("div", { className: "min-h-screen bg-city-dark px-4 pt-6 pb-24", children: _jsxs(motion.div, { initial: prefersReduced ? {} : { y: 15, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.3 }, className: "max-w-lg mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("button", { type: "button", onClick: () => navigate(-1), className: "w-10 h-10 min-w-[56px] min-h-[56px] rounded-full bg-slate-700 hover:bg-slate-600\n                       flex items-center justify-center text-white active:scale-90 transition-transform", "aria-label": "Go back", children: "\u2190" }), _jsxs("span", { className: "text-sm font-bold text-slate-400", children: ["Question ", currentQ + 1, " of ", totalQuestions] })] }), _jsx("div", { className: "mb-6", children: _jsx(PowerMeter, { active: !showFeedback, durationSeconds: 60 }) }), _jsx(AnimatePresence, { mode: "wait", children: _jsxs(motion.div, { initial: prefersReduced ? {} : { x: 30, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: prefersReduced ? {} : { x: -30, opacity: 0 }, transition: { duration: 0.25 }, children: [_jsx("div", { className: "card-hero mb-6", children: _jsx("p", { className: "text-lg font-bold leading-relaxed", children: question.text }) }), _jsx("div", { className: "grid gap-3", children: question.options.map((option, i) => {
                                    let optionStyle = 'bg-slate-800 border-slate-700 hover:border-slate-500';
                                    if (showFeedback && i === selectedOption) {
                                        optionStyle = 'bg-hero-blue/20 border-hero-blue';
                                    }
                                    else if (showFeedback) {
                                        optionStyle = 'bg-slate-800 border-slate-700';
                                    }
                                    return (_jsxs(motion.button, { type: "button", disabled: showFeedback, onClick: () => handleAnswer(i), className: `flex items-start gap-3 p-4 rounded-xl border-2 text-left
                               min-h-[56px] transition-all active:scale-[0.98]
                               disabled:cursor-default ${optionStyle}`, whileTap: showFeedback ? {} : { scale: 0.97 }, transition: { duration: 0.3 }, children: [_jsx("span", { className: "font-bold text-hero-amber shrink-0 w-7", children: OPTION_LABELS[i] }), _jsx("span", { className: "text-base leading-snug line-clamp-2", children: option })] }, i));
                                }) }), _jsx(AnimatePresence, { children: showNext && (_jsx(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "mt-6 flex justify-center", children: _jsx("button", { type: "button", onClick: handleNext, className: "btn-hero text-lg px-10 min-h-[56px]", children: currentQ + 1 >= totalQuestions ? 'Finish Mission!' : 'Next →' }) })) })] }, question.id) })] }) }));
}
