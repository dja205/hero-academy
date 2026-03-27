import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';

interface TopicItem {
  id: string;
  name: string;
  districtName: string;
  colour: string;
  order: number;
  subjectName: string;
  zoneName: string;
  unlocked?: boolean;
  progress?: { completed: number; total: number; stars: { one: number; two: number; three: number } };
}

/** Check if a district is unlocked based on server-provided flag */
function isDistrictUnlocked(topic: TopicItem): boolean {
  if (topic.unlocked !== undefined) return topic.unlocked;
  return topic.order === 1;
}

export function CityMapPage() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    childApi.getTopics().then((data) => {
      if (!cancelled) {
        setTopics(data.topics);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const mathDistricts = topics.filter((t) => t.zoneName === 'Mathropolis');
  const otherZones = ['Wordsworth', 'Logica', 'Sciencia'];

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

  return (
    <div className="min-h-screen bg-city-dark px-4 pt-6 pb-24">
      <motion.div
        initial={prefersReduced ? {} : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-hero text-hero-amber tracking-wide">
            Hero City
          </h1>
          <p className="text-slate-400 text-sm mt-1">Tap a zone to explore!</p>
        </div>

        {/* Mathropolis — Active Zone */}
        <motion.button
          type="button"
          onClick={() => setZoomed(zoomed === 'Mathropolis' ? null : 'Mathropolis')}
          className={`w-full card-hero mb-4 text-left transition-all
            ${zoomed === 'Mathropolis' ? 'ring-2 ring-hero-amber' : 'animate-glow-pulse'}`}
          whileTap={{ scale: 0.97 }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔢</span>
            <div>
              <h2 className="text-xl font-hero text-hero-amber">Mathropolis</h2>
              <p className="text-slate-400 text-sm">Master the numbers!</p>
            </div>
          </div>
        </motion.button>

        {/* Zoomed: Mathropolis districts */}
        <AnimatePresence>
          {zoomed === 'Mathropolis' && (
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden"
            >
              <div className="grid gap-3 mb-4">
                {mathDistricts
                  .sort((a, b) => a.order - b.order)
                  .map((district) => {
                    const unlocked = isDistrictUnlocked(district);
                    const completed = district.progress?.completed ?? 0;
                    const total = district.progress?.total ?? 3;
                    const totalStars =
                      (district.progress?.stars.one ?? 0) +
                      (district.progress?.stars.two ?? 0) * 2 +
                      (district.progress?.stars.three ?? 0) * 3;

                    return (
                      <motion.button
                        key={district.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => navigate(`/child/district/${district.id}`)}
                        className={`card-hero text-left flex items-center gap-4 transition-all
                          ${unlocked
                            ? 'hover:border-hero-amber/50 active:scale-[0.98]'
                            : 'opacity-50 cursor-not-allowed'
                          }`}
                        initial={prefersReduced ? {} : { x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: district.order * 0.08 }}
                        whileTap={unlocked ? { scale: 0.97 } : {}}
                      >
                        {/* District colour dot */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                          style={{ backgroundColor: district.colour + '33', color: district.colour }}
                        >
                          {unlocked ? district.order : '🔒'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white truncate">
                              {district.districtName}
                            </h3>
                            {!unlocked && (
                              <span className="text-xs text-slate-500">Locked</span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="mt-1.5 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${total > 0 ? (completed / total) * 100 : 0}%`,
                                backgroundColor: district.colour,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">
                              {completed}/{total} missions
                            </span>
                            <span className="text-xs text-hero-amber">
                              {'⭐'.repeat(Math.min(totalStars, 9))}{totalStars > 0 ? '' : '—'}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locked Zones */}
        <div className="grid gap-3 mt-4">
          {otherZones.map((zone) => (
            <div
              key={zone}
              className="card-hero flex items-center gap-3 opacity-40"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                🔒
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-400">{zone}</h3>
                <p className="text-xs text-slate-500">Coming Soon</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
