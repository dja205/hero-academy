import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { childApi } from '../../api/child';
import { HeroAvatar } from '../../components/child/HeroAvatar';
import { apiClient } from '../../api/client';
import { RANKS, ACHIEVEMENTS as SHARED_ACHIEVEMENTS } from '@hero-academy/shared';

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
  daysPlayed: number;
  strongestDistrict: string | null;
  weakestDistrict: string | null;
  totalXp: number;
  rank: string;
}

function getRankProgress(rank: string, totalXp: number) {
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

  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [stats, setStats] = useState<ChildStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    Promise.all([
      apiClient.get<{ child: ChildProfile }>('/children/me'),
      childApi.getStats(userId),
    ]).then(([profileData, statsData]) => {
      if (cancelled) return;
      setProfile(profileData.child);
      setStats(statsData);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [userId]);

  const handleLogout = () => {
    clearAuth();
    navigate('/child/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-hero-amber border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-400 text-lg">Profile not found</p>
        <button type="button" onClick={() => navigate('/child/map')} className="btn-hero">
          Back to Map
        </button>
      </div>
    );
  }

  const { pct: rankPct, ceiling: nextRankXp } = getRankProgress(stats.rank, stats.totalXp);

  return (
    <div className="min-h-screen bg-city-dark px-4 pt-6 pb-24">
      <motion.div
        initial={prefersReduced ? {} : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-sm mx-auto flex flex-col items-center gap-6"
      >
        {/* Avatar + Name */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <motion.div
              className="rounded-full bg-slate-800 border-4 border-hero-amber p-4 shadow-lg shadow-hero-amber/20"
              animate={prefersReduced ? {} : { boxShadow: ['0 0 20px rgba(245,158,11,0.3)', '0 0 40px rgba(245,158,11,0.6)', '0 0 20px rgba(245,158,11,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <HeroAvatar
                costume={profile.avatarConfig.costume}
                mask={profile.avatarConfig.mask}
                size={120}
              />
            </motion.div>
          </div>
          <h1 className="text-3xl font-hero text-hero-amber tracking-wide">
            {profile.heroName}
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-hero-purple/20 text-hero-purple rounded-full text-sm font-bold">
              {stats.rank}
            </span>
          </div>
        </div>

        {/* XP Progress */}
        <div className="card-hero w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-300">XP Progress</span>
            <span className="text-xs text-slate-400">{stats.totalXp} / {nextRankXp} XP</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-hero-purple"
              initial={{ width: 0 }}
              animate={{ width: `${rankPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {[
            { label: 'Missions', value: stats.totalMissions, icon: '🎯' },
            { label: 'Avg Score', value: `${Math.round(stats.avgScore)}%`, icon: '📊' },
            { label: 'Streak', value: `${stats.currentStreak} days`, icon: '🔥' },
            { label: 'Days Played', value: stats.daysPlayed, icon: '📅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card-hero text-center">
              <span className="text-2xl" aria-hidden="true">{icon}</span>
              <p className="text-xl font-hero text-white mt-1">{value}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Strongest / Weakest districts */}
        <div className="grid gap-3 w-full">
          {stats.strongestDistrict && (
            <div className="card-hero flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">💪</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Strongest District</p>
                <p className="font-bold text-hero-green">{stats.strongestDistrict}</p>
              </div>
            </div>
          )}
          {stats.weakestDistrict && (
            <div className="card-hero flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">📚</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400">Needs Practice</p>
                <p className="font-bold text-hero-amber">{stats.weakestDistrict}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/child/map')}
                className="px-3 py-2 bg-hero-amber/20 text-hero-amber rounded-lg text-xs font-bold
                           hover:bg-hero-amber/30 active:scale-95 transition-all min-h-[44px]"
              >
                Train Here
              </button>
            </div>
          )}
        </div>

        {/* Achievement grid */}
        <div className="w-full">
          <h2 className="text-xl font-hero text-white mb-3">Achievements</h2>
          <div className="grid grid-cols-4 gap-3">
            {SHARED_ACHIEVEMENTS.map((achievement) => (
              <div
                key={achievement.type}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all bg-slate-800 opacity-50 grayscale"
                title={achievement.name}
              >
                <span className="text-2xl">
                  {achievement.icon}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {achievement.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800
                     transition-colors text-sm font-bold min-h-[56px]"
        >
          🏠 Switch Hero
        </button>
      </motion.div>
    </div>
  );
}
