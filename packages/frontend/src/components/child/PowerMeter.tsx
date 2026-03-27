import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PowerMeterProps {
  /** Duration in seconds for the meter to fill completely */
  durationSeconds?: number;
  /** Whether the meter is actively running */
  active: boolean;
}

export function PowerMeter({ durationSeconds = 60, active }: PowerMeterProps) {
  const [progress, setProgress] = useState(0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!active) return;

    const startTime = Date.now();
    let raf: number;

    const tick = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min(elapsed / durationSeconds, 1);
      setProgress(pct);
      if (pct < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationSeconds]);

  const fillPct = Math.round(progress * 100);

  return (
    <div
      className="w-full max-w-xs mx-auto"
      role="progressbar"
      aria-valuenow={fillPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Power meter"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-hero-amber">⚡ POWER</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden border border-slate-600">
        <motion.div
          className="h-full rounded-full"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, #f59e0b, #ef4444)`,
          }}
          animate={!prefersReduced && fillPct > 80 ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>
    </div>
  );
}
