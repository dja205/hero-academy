import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { StarReveal } from '../../components/child/StarReveal';
import { RANKS } from '@hero-academy/shared';

interface CompletionState {
  score: number;
  maxScore: number;
  stars: 1 | 2 | 3;
  xpEarned: number;
  newTotalXp: number;
  newRank: string;
  newAchievements: string[];
  assessmentId: string;
  topicId?: string;
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
  return { pct, ceiling: nextRank ? nextRank.minXp : rankCeiling };
}

export function MissionCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReduced = useReducedMotion();

  const state = location.state as CompletionState | null;

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-400 text-lg">No mission data</p>
        <button type="button" onClick={() => navigate('/child/map')} className="btn-hero">
          Back to Map
        </button>
      </div>
    );
  }

  const { score, maxScore, stars, xpEarned, newTotalXp, newRank, newAchievements } = state;
  const { pct: rankPct } = getRankProgress(newRank, newTotalXp);

  return (
    <div className="min-h-screen bg-city-dark px-4 pt-8 pb-24 flex flex-col items-center">
      <motion.div
        initial={prefersReduced ? {} : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        {/* Title */}
        <h1 className="text-3xl font-hero text-hero-amber tracking-wide text-center">
          Mission Complete!
        </h1>

        {/* Score reveal */}
        <motion.div
          initial={prefersReduced ? {} : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <p className="text-6xl font-hero text-white">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="text-slate-500">/{maxScore}</span>
          </p>
        </motion.div>

        {/* Stars */}
        <StarReveal stars={stars} />

        {/* XP ticker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="card-hero w-full text-center"
        >
          <p className="text-sm text-slate-400 mb-1">XP Earned</p>
          <p className="text-3xl font-hero text-hero-amber">+{xpEarned} XP</p>
        </motion.div>

        {/* Rank progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="card-hero w-full"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-hero-purple">{newRank}</span>
            <span className="text-xs text-slate-400">{newTotalXp} XP</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-hero-purple"
              initial={{ width: 0 }}
              animate={{ width: `${rankPct}%` }}
              transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* New achievements */}
        {newAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2 }}
            className="card-hero w-full text-center"
          >
            <p className="text-sm font-bold text-hero-amber mb-2">🏆 Achievement Unlocked!</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {newAchievements.map((achievement) => (
                <span
                  key={achievement}
                  className="px-3 py-1 bg-hero-amber/20 text-hero-amber rounded-full text-sm font-bold"
                >
                  {achievement}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="flex flex-col gap-3 w-full mt-2"
        >
          <button
            type="button"
            onClick={() => navigate(`/child/mission/${state.assessmentId}`, { replace: true, state: { topicId: state.topicId } })}
            className="btn-hero text-base min-h-[56px] w-full"
          >
            🔄 Train Again
          </button>
          <button
            type="button"
            onClick={() => navigate('/child/map', { replace: true })}
            className="px-6 py-3 rounded-xl font-bold text-white bg-hero-blue hover:bg-blue-600
                       active:scale-95 transition-all duration-150 shadow-lg min-h-[56px] w-full"
          >
            🗺️ Back to Map
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
