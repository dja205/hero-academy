import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parentApi } from '../../api/parent';
import { apiClient } from '../../api/client';
import { HeroAvatar } from '../../components/child/HeroAvatar';
import { ProgressChart } from '../../components/parent/ProgressChart';
export function ChildDetailPage() {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(null);
    const [stats, setStats] = useState(null);
    const [recentAttempts, setRecentAttempts] = useState([]);
    const [topicProgress, setTopicProgress] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!childId)
            return;
        const load = async () => {
            try {
                const [childData, statsData, attemptsData] = await Promise.all([
                    parentApi.getChildDetail(childId),
                    apiClient.get(`/children/${encodeURIComponent(childId)}/stats`),
                    apiClient.get(`/children/${encodeURIComponent(childId)}/attempts?page=1&limit=5`),
                ]);
                setChild(childData.child);
                setStats(statsData);
                setRecentAttempts(attemptsData.attempts);
                // Load topic progress (avg score per district)
                apiClient
                    .get(`/children/${encodeURIComponent(childId)}/topic-progress`)
                    .then((d) => setTopicProgress(d.progress))
                    .catch(() => { });
                // Load achievements
                apiClient
                    .get(`/children/${encodeURIComponent(childId)}/achievements`)
                    .then((d) => setAchievements(d.achievements))
                    .catch(() => { });
            }
            catch {
                // errors handled by apiClient
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, [childId]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("p", { className: "text-gray-500", children: "Loading\u2026" }) }));
    }
    if (!child || !stats) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("p", { className: "text-gray-500", children: "Hero not found." }) }));
    }
    const weakArea = stats.weakestDistrict;
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-4 flex items-center gap-4", children: [_jsx("button", { onClick: () => navigate('/parent/dashboard'), className: "text-gray-400 hover:text-gray-600", children: "\u2190 Back" }), _jsx(HeroAvatar, { costume: child.avatarConfig.costume, mask: child.avatarConfig.mask, size: 48 }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: child.heroName }), _jsxs("p", { className: "text-sm text-gray-500", children: [child.name, " \u00B7 ", child.rank, " \u00B7 ", child.xp, " XP"] })] })] }) }), _jsxs("main", { className: "max-w-5xl mx-auto px-4 py-8 space-y-8", children: [_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
                            { label: 'Total Missions', value: stats.totalMissions },
                            { label: 'Avg Score', value: `${Math.round(stats.avgScore)}%` },
                            { label: 'Current Streak', value: `${stats.currentStreak} days` },
                            { label: 'Days Played', value: stats.daysPlayed },
                        ].map((s) => (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-4", children: [_jsx("p", { className: "text-sm text-gray-500", children: s.label }), _jsx("p", { className: "text-2xl font-bold text-gray-900 mt-1", children: s.value })] }, s.label))) }), _jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Score by District" }), _jsx(ProgressChart, { title: "", data: topicProgress.map((tp) => ({
                                    label: tp.topicName,
                                    value: tp.avgScore,
                                    maxValue: 100,
                                })) })] }), weakArea && (_jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-amber-800 font-medium", children: [weakArea, " needs some hero training! \uD83D\uDCAA"] }), _jsx("p", { className: "text-amber-700 text-sm", children: "A few more missions there and your hero will level up." })] }), _jsx(Link, { to: `/child/map`, className: "shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors", children: "Train Here" })] })), _jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Recent Missions" }), recentAttempts.length === 0 ? (_jsx("p", { className: "text-gray-500 text-sm", children: "No missions completed yet." })) : (_jsx("div", { className: "space-y-3", children: recentAttempts.map((a) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-gray-100 last:border-0", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: a.assessmentTitle }), _jsxs("p", { className: "text-xs text-gray-500", children: [a.districtName, " \u00B7 ", new Date(a.completedAt).toLocaleDateString()] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900", children: [a.score, "/", a.maxScore] }), _jsxs("span", { className: "text-amber-500", children: ['★'.repeat(a.stars), '☆'.repeat(3 - a.stars)] })] })] }, a.id))) }))] }), achievements.length > 0 && (_jsxs("div", { className: "bg-white rounded-lg border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Achievement Badges" }), _jsx("div", { className: "flex flex-wrap gap-3", children: achievements.map((badge) => (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg", title: `Earned ${new Date(badge.earnedAt).toLocaleDateString()}`, children: [_jsx("span", { className: "text-xl", children: badge.icon || '🏅' }), _jsx("span", { className: "text-sm font-medium text-indigo-800", children: badge.name })] }, badge.id))) })] }))] })] }));
}
