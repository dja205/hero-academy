import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { adminApi } from '../../api/admin';
export function OverviewPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const load = async () => {
            try {
                // Try dedicated stats endpoint first
                const data = await apiClient.get('/admin/stats');
                setStats(data);
            }
            catch {
                // Fallback: build stats from individual endpoints
                try {
                    const [users, questions, assessments] = await Promise.all([
                        adminApi.getUsers({ page: 1, limit: 1 }),
                        adminApi.getQuestions({ page: 1, limit: 1 }),
                        adminApi.getAssessments({ page: 1, limit: 1 }),
                    ]);
                    setStats({
                        totalParents: users.total,
                        freePlanCount: users.total,
                        activeSubscriptionCount: 0,
                        totalChildren: 0,
                        totalQuestions: questions.total,
                        totalAssessments: assessments.total,
                    });
                }
                catch {
                    /* handled */
                }
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    if (loading) {
        return _jsx("p", { className: "text-gray-500 py-8 text-center", children: "Loading..." });
    }
    if (!stats) {
        return _jsx("p", { className: "text-gray-500 py-8 text-center", children: "Failed to load stats" });
    }
    const cards = [
        { label: 'Total Parents', value: stats.totalParents, icon: '👨‍👩‍👧' },
        { label: 'Free Plan', value: stats.freePlanCount, icon: '🆓' },
        { label: 'Active Subscriptions', value: stats.activeSubscriptionCount, icon: '💳' },
        { label: 'Total Questions', value: stats.totalQuestions, icon: '❓' },
        { label: 'Total Assessments', value: stats.totalAssessments, icon: '📝' },
    ];
    return (_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900 mb-6", children: "Overview" }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-3 gap-4", children: cards.map((card) => (_jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-5", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: card.icon }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-500", children: card.label }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: card.value })] })] }) }, card.label))) }), _jsxs("div", { className: "mt-8 bg-white rounded-lg border border-gray-200 p-5", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Subscription Summary" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["All users are currently on the ", _jsx("strong", { children: "Free Plan" }), ". Paid subscriptions are not yet available in MVP."] })] })] }));
}
