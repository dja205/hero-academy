import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';

interface Assessment {
  id: string;
  title: string;
  difficulty: string;
}

interface TopicItem {
  id: string;
  name: string;
  districtName: string;
  colour: string;
  order: number;
  progress?: { completed: number; total: number; stars: { one: number; two: number; three: number } };
}

const DIFFICULTY_LABEL: Record<string, { label: string; colour: string }> = {
  easy: { label: 'Easy', colour: 'text-hero-green' },
  medium: { label: 'Medium', colour: 'text-hero-amber' },
  hard: { label: 'Hard', colour: 'text-hero-red' },
};

export function DistrictPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [topic, setTopic] = useState<TopicItem | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;
    let cancelled = false;

    Promise.all([
      childApi.getTopics(),
      childApi.getAssessments(topicId),
    ]).then(([topicsData, assessData]) => {
      if (cancelled) return;
      const found = topicsData.topics.find((t) => t.id === topicId) ?? null;
      setTopic(found);
      setAssessments(assessData.assessments);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [topicId]);

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

  if (!topic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-400 text-lg">District not found</p>
        <button type="button" onClick={() => navigate('/child/map')} className="btn-hero">
          Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-city-dark px-4 pt-6 pb-24">
      <motion.div
        initial={prefersReduced ? {} : { y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate('/child/map')}
            className="w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center
                       text-xl text-white active:scale-90 transition-transform min-w-[56px] min-h-[56px]"
            aria-label="Back to city map"
          >
            ←
          </button>
          <div>
            <h1
              className="text-2xl font-hero tracking-wide"
              style={{ color: topic.colour }}
            >
              {topic.districtName}
            </h1>
            <p className="text-slate-400 text-sm">{topic.name}</p>
          </div>
        </div>

        {/* Mission list */}
        <div className="grid gap-3">
          {assessments.map((mission, index) => {
            // First mission always unlocked, subsequent require prior mission completed
            const isLocked = index > 0 && !(topic.progress && topic.progress.completed > index - 1);
            const diff = DIFFICULTY_LABEL[mission.difficulty] ?? DIFFICULTY_LABEL.medium;

            // Simple star calc: if completed missions > index, show stars based on progress
            const missionCompleted = topic.progress ? topic.progress.completed > index : false;
            const starCount = missionCompleted
              ? Math.min(3, Math.max(1, 3 - index))
              : 0;

            return (
              <motion.button
                key={mission.id}
                type="button"
                disabled={isLocked}
                onClick={() => navigate(`/child/mission/${mission.id}`)}
                className={`card-hero text-left flex items-center gap-4 min-h-[72px] transition-all
                  ${isLocked
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-hero-amber/50 active:scale-[0.98]'
                  }`}
                initial={prefersReduced ? {} : { x: -15, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileTap={isLocked ? {} : { scale: 0.97 }}
              >
                {/* Mission number / lock */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
                  style={{
                    backgroundColor: isLocked ? undefined : topic.colour + '33',
                    color: isLocked ? undefined : topic.colour,
                  }}
                >
                  {isLocked ? '🔒' : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate">
                      {mission.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-bold ${diff.colour}`}>
                      {diff.label}
                    </span>
                    {starCount > 0 && (
                      <span className="text-xs text-hero-amber">
                        {'⭐'.repeat(starCount)}
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-xs text-slate-500">Complete previous mission</span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {assessments.length === 0 && (
          <p className="text-slate-400 text-center mt-8">
            No missions available yet. Check back soon!
          </p>
        )}
      </motion.div>
    </div>
  );
}
