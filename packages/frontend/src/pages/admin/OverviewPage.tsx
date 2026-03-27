import { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { adminApi } from '../../api/admin';

interface AdminStats {
  totalParents: number;
  freePlanCount: number;
  activeSubscriptionCount: number;
  totalChildren: number;
  totalQuestions: number;
  totalAssessments: number;
}

export function OverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Try dedicated stats endpoint first
        const data = await apiClient.get<AdminStats>('/admin/stats');
        setStats(data);
      } catch {
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
        } catch {
          /* handled */
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-gray-500 py-8 text-center">Loading...</p>;
  }

  if (!stats) {
    return <p className="text-gray-500 py-8 text-center">Failed to load stats</p>;
  }

  const cards = [
    { label: 'Total Parents', value: stats.totalParents, icon: '👨‍👩‍👧' },
    { label: 'Free Plan', value: stats.freePlanCount, icon: '🆓' },
    { label: 'Active Subscriptions', value: stats.activeSubscriptionCount, icon: '💳' },
    { label: 'Total Questions', value: stats.totalQuestions, icon: '❓' },
    { label: 'Total Assessments', value: stats.totalAssessments, icon: '📝' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Subscription Summary</h2>
        <p className="text-sm text-gray-600">
          All users are currently on the <strong>Free Plan</strong>. Paid subscriptions
          are not yet available in MVP.
        </p>
      </div>
    </div>
  );
}
