import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';

interface BossCardProps {
  subjectId: string;
}

export function BossCard({ subjectId }: BossCardProps) {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [status, setStatus] = useState<{
    boss: { id: string; name: string; emoji: string; hp: number; description: string };
    unlocked: boolean;
    alreadyConquered: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    childApi
      .getBossStatus(subjectId)
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        // Boss not available for this subject
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  if (loading || !status) return null;

  const { boss, unlocked, alreadyConquered } = status;

  // Conquered state
  if (alreadyConquered) {
    return (
      <motion.div
        initial={prefersReduced ? {} : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card-hero border-2 border-hero-amber/60 bg-hero-amber/10"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{boss.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-hero-amber truncate">{boss.name}</h3>
              <span className="text-lg">✅</span>
            </div>
            <p className="text-xs text-slate-400">Zone Conquered!</p>
          </div>
          <span className="text-2xl">🏆</span>
        </div>
      </motion.div>
    );
  }

  // Locked state
  if (!unlocked) {
    return (
      <motion.div
        initial={prefersReduced ? {} : { y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="card-hero opacity-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl grayscale">{boss.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-400 truncate">{boss.name}</h3>
              <span className="text-lg">🔒</span>
            </div>
            <p className="text-xs text-slate-500">Complete all districts to unlock</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Unlocked state — tappable with pulsing amber glow
  return (
    <motion.button
      type="button"
      onClick={() => navigate(`/child/boss/${subjectId}`)}
      initial={prefersReduced ? {} : { y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      whileTap={{ scale: 0.97 }}
      className="w-full card-hero text-left animate-glow-pulse border-2 border-hero-amber/40
                 hover:border-hero-amber/70 active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{boss.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-hero-amber truncate">{boss.name}</h3>
          <p className="text-xs text-slate-400">{boss.description}</p>
        </div>
        <span className="text-2xl">⚔️</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-red-500" style={{ width: '100%' }} />
        </div>
        <span className="text-xs text-red-400 font-bold">{boss.hp} HP</span>
      </div>
    </motion.button>
  );
}
