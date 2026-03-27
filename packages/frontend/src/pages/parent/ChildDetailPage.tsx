import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parentApi } from '../../api/parent';
import { apiClient } from '../../api/client';
import { HeroAvatar } from '../../components/child/HeroAvatar';
import { ProgressChart } from '../../components/parent/ProgressChart';

interface ChildProfile {
  id: string;
  name: string;
  heroName: string;
  avatarConfig: { costume: number; mask: number };
  xp: number;
  rank: string;
}

interface ChildStats {
  totalMissions: number;
  avgScore: number;
  currentStreak: number;
  bestStreak: number;
  daysPlayed: number;
  strongestDistrict: string | null;
  weakestDistrict: string | null;
  totalXp: number;
  rank: string;
}

interface AttemptItem {
  id: string;
  assessmentTitle: string;
  districtName: string;
  score: number;
  maxScore: number;
  stars: number;
  completedAt: string;
}

interface TopicProgress {
  topicId: string;
  topicName: string;
  avgScore: number;
}

interface AchievementBadge {
  id: string;
  name: string;
  icon: string;
  earnedAt: string;
}

export function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<AttemptItem[]>([]);
  const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;

    const load = async () => {
      try {
        const [childData, statsData, attemptsData] = await Promise.all([
          parentApi.getChildDetail(childId),
          apiClient.get<ChildStats>(`/children/${encodeURIComponent(childId)}/stats`),
          apiClient.get<{ attempts: AttemptItem[] }>(
            `/children/${encodeURIComponent(childId)}/attempts?page=1&limit=5`,
          ),
        ]);
        setChild(childData.child);
        setStats(statsData);
        setRecentAttempts(attemptsData.attempts);

        // Load topic progress (avg score per district)
        apiClient
          .get<{ progress: TopicProgress[] }>(
            `/children/${encodeURIComponent(childId)}/topic-progress`,
          )
          .then((d) => setTopicProgress(d.progress))
          .catch(() => {});

        // Load achievements
        apiClient
          .get<{ achievements: AchievementBadge[] }>(
            `/children/${encodeURIComponent(childId)}/achievements`,
          )
          .then((d) => setAchievements(d.achievements))
          .catch(() => {});
      } catch {
        // errors handled by apiClient
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [childId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!child || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Hero not found.</p>
      </div>
    );
  }

  const weakArea = stats.weakestDistrict;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/parent/dashboard')}
            className="text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
          <HeroAvatar costume={child.avatarConfig.costume} mask={child.avatarConfig.mask} size={48} />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{child.heroName}</h1>
            <p className="text-sm text-gray-500">
              {child.name} · {child.rank} · {child.xp} XP
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Missions', value: stats.totalMissions },
            { label: 'Avg Score', value: `${Math.round(stats.avgScore)}%` },
            { label: 'Current Streak', value: `${stats.currentStreak} days` },
            { label: 'Days Played', value: stats.daysPlayed },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Score by district */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score by District</h2>
          <ProgressChart
            title=""
            data={topicProgress.map((tp) => ({
              label: tp.topicName,
              value: tp.avgScore,
              maxValue: 100,
            }))}
          />
        </div>

        {/* Weak area nudge */}
        {weakArea && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-amber-800 font-medium">
                {weakArea} needs some hero training! 💪
              </p>
              <p className="text-amber-700 text-sm">
                A few more missions there and your hero will level up.
              </p>
            </div>
            <Link
              to={`/child/map`}
              className="shrink-0 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
            >
              Train Here
            </Link>
          </div>
        )}

        {/* Recent activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Missions</h2>
          {recentAttempts.length === 0 ? (
            <p className="text-gray-500 text-sm">No missions completed yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAttempts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.assessmentTitle}</p>
                    <p className="text-xs text-gray-500">
                      {a.districtName} · {new Date(a.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {a.score}/{a.maxScore}
                    </span>
                    <span className="text-amber-500">
                      {'★'.repeat(a.stars)}
                      {'☆'.repeat(3 - a.stars)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievement badges */}
        {achievements.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievement Badges</h2>
            <div className="flex flex-wrap gap-3">
              {achievements.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg"
                  title={`Earned ${new Date(badge.earnedAt).toLocaleDateString()}`}
                >
                  <span className="text-xl">{badge.icon || '🏅'}</span>
                  <span className="text-sm font-medium text-indigo-800">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
