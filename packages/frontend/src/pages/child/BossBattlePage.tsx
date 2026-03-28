/**
 * ISS-BB-008 / ISS-BB-009 / ISS-BB-010: Boss Battle Page
 *
 * Full-screen immersive boss battle experience.
 * State machine: intro → loading → active → feedback → victory | defeat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BossInfo {
  id: string;
  name: string;
  emoji: string;
  hp: number;
  description: string;
  questionCount: number;
}

interface BossQuestion {
  id: string;
  text: string;
  options: string[];
  difficulty: string;
  correct_index: number;
}

type BattlePhase = 'intro' | 'loading' | 'active' | 'feedback' | 'victory' | 'defeat';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const ENCOURAGEMENT = [
  'Keep going — the dragon is getting nervous!',
  'So close! One more battle and the zone is yours.',
  'Every hero gets knocked down. Champions get back up!',
];

function damageDifficulty(difficulty: string): number {
  switch (difficulty) {
    case 'hard': return 3;
    case 'medium': return 2;
    default: return 1;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HPBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, (current / max) * 100);
  return (
    <div className="w-full">
      <div
        className="h-4 bg-slate-700 rounded-full overflow-hidden relative"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label="Dragon HP"
      >
        <motion.div
          className="h-full bg-red-500 rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <p className="text-center text-sm text-slate-400 mt-1">{current}/{max} HP</p>
    </div>
  );
}

function LivesRow({ lives }: { lives: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`${lives} lives remaining`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="text-2xl"
          animate={i < lives ? { scale: 1 } : { scale: 0.7, opacity: 0.4 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {i < lives ? '❤️' : '🖤'}
        </motion.span>
      ))}
      <span className="text-sm text-slate-400 ml-1">{lives} {lives === 1 ? 'life' : 'lives'} left</span>
    </div>
  );
}

function ConfettiLayer() {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 20 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const size = 6 + Math.random() * 8;
        const colors = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'];
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${left}%`,
              top: -20,
              width: size,
              height: size,
              backgroundColor: color,
            }}
            initial={{ y: -20, rotate: 0, opacity: 1 }}
            animate={{
              y: window.innerHeight + 20,
              rotate: 360 + Math.random() * 360,
              opacity: 0,
            }}
            transition={{
              duration: 2 + Math.random(),
              delay,
              ease: 'easeIn',
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function BossBattlePage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  // Boss state
  const [boss, setBoss] = useState<BossInfo | null>(null);
  const [phase, setPhase] = useState<BattlePhase>('loading');
  const [error, setError] = useState<string | null>(null);

  // Battle state
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [attemptToken, setAttemptToken] = useState('');
  const [bossId, setBossId] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [bossHp, setBossHp] = useState(10);
  const [lives, setLives] = useState(3);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [lastDamage, setLastDamage] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Result state
  const [result, setResult] = useState<{
    xpEarned: number;
    newTotalXp: number;
    newRank: string | null;
    newAchievements: string[];
    bossHpFinal: number;
    score: number;
    maxScore: number;
  } | null>(null);

  // Animated XP counter
  const [displayXp, setDisplayXp] = useState(0);

  // Load boss status
  useEffect(() => {
    if (!subjectId) return;
    childApi.getBossStatus(subjectId)
      .then((data) => {
        setBoss(data.boss);
        setBossHp(data.boss.hp);
        setPhase('intro');
      })
      .catch(() => setError('Could not load boss data'));
  }, [subjectId]);

  // Start battle
  const startBattle = useCallback(async () => {
    if (!subjectId) return;
    setPhase('loading');
    try {
      const data = await childApi.getBossQuestions(subjectId);
      setQuestions(data.questions);
      setAttemptToken(data.attemptToken);
      setBossId(data.bossId);
      setCurrentQ(0);
      setAnswers([]);
      setBossHp(boss?.hp ?? 10);
      setLives(3);
      setSelectedOption(null);
      setShowFeedback(false);
      setShowNext(false);
      startTimeRef.current = Date.now();
      setPhase('active');
    } catch {
      setError('Could not load boss questions. Make sure all districts are complete!');
      setPhase('intro');
    }
  }, [subjectId, boss]);

  // Submit attempt to server
  const submitAttempt = useCallback(async (
    finalAnswers: number[],
    finalOutcome: string,
    finalLives: number,
    finalHp: number,
  ) => {
    if (!subjectId) return;
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      const res = await childApi.submitBossAttempt(subjectId, {
        attemptToken,
        bossId,
        answers: finalAnswers,
        outcome: finalOutcome,
        livesRemaining: finalLives,
        bossHpFinal: finalHp,
        durationSeconds,
      });
      setResult({
        xpEarned: res.xpEarned,
        newTotalXp: res.newTotalXp,
        newRank: res.newRank,
        newAchievements: res.newAchievements,
        bossHpFinal: res.bossHpFinal,
        score: res.score,
        maxScore: res.maxScore,
      });
    } catch {
      // Still show outcome even if submit fails
      setResult({
        xpEarned: 0,
        newTotalXp: 0,
        newRank: null,
        newAchievements: [],
        bossHpFinal: finalHp,
        score: 0,
        maxScore: questions.length,
      });
    }
  }, [subjectId, attemptToken, bossId, questions.length]);

  // Handle answer selection
  const handleAnswer = useCallback((optionIndex: number) => {
    if (showFeedback || phase !== 'active') return;
    const question = questions[currentQ];
    if (!question) return;

    setSelectedOption(optionIndex);
    setShowFeedback(true);

    const isCorrect = optionIndex === question.correct_index;
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (isCorrect) {
      const damage = damageDifficulty(question.difficulty);
      const newHp = Math.max(0, bossHp - damage);
      setBossHp(newHp);
      setLastDamage(damage);
      setShaking(true);
      setTimeout(() => setShaking(false), 450);

      // Check victory
      if (newHp <= 0) {
        setTimeout(() => {
          setPhase('victory');
          submitAttempt(newAnswers, 'victory', lives, newHp);
        }, 1000);
        return;
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setLastDamage(0);
      setRedFlash(true);
      setTimeout(() => setRedFlash(false), 400);

      // Check defeat
      if (newLives <= 0) {
        setTimeout(() => {
          setPhase('defeat');
          submitAttempt(newAnswers, 'defeat', 0, bossHp);
        }, 1000);
        return;
      }
    }

    setTimeout(() => setShowNext(true), 800);
  }, [showFeedback, phase, questions, currentQ, answers, bossHp, lives, submitAttempt]);

  // Advance to next question
  const handleNext = useCallback(() => {
    setCurrentQ((q) => q + 1);
    setSelectedOption(null);
    setShowFeedback(false);
    setShowNext(false);
    setLastDamage(0);
  }, []);

  // Animated XP counter for victory
  useEffect(() => {
    if (phase !== 'victory' || !result || prefersReduced) {
      if (result) setDisplayXp(result.xpEarned);
      return;
    }
    const target = result.xpEarned;
    if (target === 0) { setDisplayXp(0); return; }
    const duration = 1500;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayXp(Math.round(target * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    const timeout = setTimeout(() => { raf = requestAnimationFrame(tick); }, 600);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [phase, result, prefersReduced]);

  // Back with confirmation
  const handleBack = useCallback(() => {
    if (phase === 'active') {
      if (window.confirm('Leave the battle? Your progress won\'t be saved.')) {
        navigate('/child/map');
      }
    } else {
      navigate('/child/map');
    }
  }, [phase, navigate]);

  // -------------------------------------------------------------------------
  // Render: Error
  // -------------------------------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-city-dark flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-400 text-lg text-center">{error}</p>
        <button type="button" onClick={() => navigate('/child/map')} className="btn-hero min-h-[56px]">
          Back to Map
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Loading
  // -------------------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-city-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-hero-amber border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Intro
  // -------------------------------------------------------------------------
  if (phase === 'intro' && boss) {
    return (
      <div className="min-h-screen bg-city-dark flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          className="max-w-sm w-full"
          initial={prefersReduced ? {} : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Close */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => navigate('/child/map')}
              className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-slate-700 flex items-center justify-center text-white"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Boss emoji */}
          <motion.div
            className="text-center mb-4"
            animate={prefersReduced ? {} : { y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-7xl">{boss.emoji}</span>
          </motion.div>

          {/* Boss name */}
          <h1 className="text-center text-3xl font-hero text-hero-amber tracking-wide mb-1">
            {boss.name.toUpperCase()}
          </h1>
          <p className="text-center text-sm text-slate-400 mb-6">Ruler of Mathropolis</p>

          {/* Stats preview */}
          <div className="card-hero mb-4">
            <HPBar current={boss.hp} max={boss.hp} />
            <div className="mt-3">
              <LivesRow lives={3} />
            </div>
          </div>

          {/* Instructions */}
          <p className="text-center text-slate-300 text-sm leading-relaxed mb-8 px-2">
            Can you defeat the {boss.name}? Answer {boss.questionCount} questions.
            Drain its HP. Guard your 3 lives. Conquer the zone!
          </p>

          {/* CTA */}
          <button
            type="button"
            onClick={startBattle}
            className="w-full min-h-[56px] rounded-xl font-bold text-lg text-white
                       bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400
                       active:scale-[0.97] transition-transform"
          >
            ⚔️ FIGHT THE DRAGON
          </button>
          <button
            type="button"
            onClick={() => navigate('/child/map')}
            className="w-full mt-3 min-h-[44px] rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            Return to Map
          </button>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Victory
  // -------------------------------------------------------------------------
  if (phase === 'victory') {
    return (
      <div className="min-h-screen bg-city-dark flex flex-col items-center justify-center px-4 py-8 relative">
        <ConfettiLayer />
        <motion.div
          className="max-w-sm w-full text-center"
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-6xl block mb-4">🎉</span>
          <motion.h1
            className="text-4xl font-hero text-hero-amber mb-2"
            initial={prefersReduced ? {} : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            aria-live="assertive"
          >
            ZONE CONQUERED!
          </motion.h1>
          <p className="text-white text-lg mb-6">
            You defeated {boss?.name ?? 'the Boss'}!
          </p>

          <span className="text-5xl block mb-4 opacity-40 grayscale">{boss?.emoji}</span>

          <motion.p
            className="text-3xl font-bold text-hero-amber mb-4"
            initial={prefersReduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            +{displayXp} XP
          </motion.p>

          {result?.newAchievements && result.newAchievements.length > 0 && (
            <motion.div
              className="flex flex-wrap justify-center gap-2 mb-6"
              initial={prefersReduced ? {} : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2.2 }}
            >
              {result.newAchievements.map((ach) => (
                <span key={ach} className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 text-sm font-bold">
                  🏆 {ach === 'boss_slayer' ? 'Dragon Slayer' : ach === 'zone_conquered_mathropolis' ? 'Zone Conquered' : ach}
                </span>
              ))}
            </motion.div>
          )}

          <button
            type="button"
            onClick={() => navigate('/child/map')}
            className="w-full min-h-[56px] rounded-xl font-bold text-lg text-white
                       bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500
                       active:scale-[0.97] transition-transform mt-4"
          >
            RETURN TO MAP
          </button>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Defeat
  // -------------------------------------------------------------------------
  if (phase === 'defeat') {
    const dmgDealt = (boss?.hp ?? 10) - bossHp;
    const maxHp = boss?.hp ?? 10;
    const encouragement = ENCOURAGEMENT[Math.floor(Math.random() * ENCOURAGEMENT.length)];

    return (
      <div className="min-h-screen bg-city-dark flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          className="max-w-sm w-full text-center"
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span
            className="text-6xl block mb-4"
            animate={prefersReduced ? {} : { scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: 2 }}
          >
            {boss?.emoji}
          </motion.span>

          <h1
            className="text-3xl font-hero text-red-400 mb-1"
            aria-live="assertive"
          >
            THE DRAGON WINS...
          </h1>
          <p className="text-xl font-hero text-red-300 mb-4">THIS TIME!</p>

          <p className="text-slate-300 text-sm mb-6 italic">"{encouragement}"</p>

          {/* Damage dealt bar */}
          <div className="card-hero mb-6">
            <p className="text-sm text-slate-400 mb-2">Damage dealt:</p>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(dmgDealt / maxHp) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
            <p className="text-center text-sm text-slate-300 mt-1">{dmgDealt}/{maxHp} HP</p>
          </div>

          <button
            type="button"
            onClick={startBattle}
            className="w-full min-h-[56px] rounded-xl font-bold text-lg text-white
                       bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400
                       active:scale-[0.97] transition-transform"
          >
            🔄 TRY AGAIN
          </button>
          <button
            type="button"
            onClick={() => navigate('/child/map')}
            className="w-full mt-3 min-h-[44px] rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            Return to Map
          </button>
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Active battle
  // -------------------------------------------------------------------------
  const question = questions[currentQ];
  if (!question || phase !== 'active') return null;

  return (
    <div className="min-h-screen bg-city-dark px-4 pt-4 pb-8 relative">
      {/* Red flash overlay */}
      <AnimatePresence>
        {redFlash && (
          <motion.div
            className="fixed inset-0 bg-red-500/30 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-slate-700 hover:bg-slate-600
                       flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Go back"
          >
            ←
          </button>
          <span className="text-sm font-bold text-hero-amber uppercase tracking-wider">
            Boss Battle
          </span>
          <span className="text-sm text-slate-400" aria-label={`Question ${currentQ + 1} of ${questions.length}`}>
            {currentQ + 1}/{questions.length}
          </span>
        </div>

        {/* Boss zone */}
        <motion.div
          className="card-hero mb-4"
          animate={shaking && !prefersReduced ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.45 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{boss?.emoji}</span>
            <div className="flex-1">
              <h2 className="text-base font-bold text-hero-amber">{boss?.name}</h2>
            </div>
          </div>
          <HPBar current={bossHp} max={boss?.hp ?? 10} />
          <div className="mt-2">
            <LivesRow lives={lives} />
          </div>

          {/* Damage feedback */}
          <AnimatePresence>
            {showFeedback && lastDamage > 0 && (
              <motion.div
                className="absolute top-2 right-4 text-2xl font-bold text-green-400"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -30 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                -{lastDamage} HP
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={prefersReduced ? {} : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={prefersReduced ? {} : { y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-hero mb-4">
              <p className="text-lg font-bold leading-relaxed" style={{ minHeight: '3rem' }}>
                {question.text}
              </p>
            </div>

            {/* Answer grid */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((option, i) => {
                let optionStyle = 'bg-slate-800 border-slate-700 hover:border-slate-500';
                const isCorrect = i === question.correct_index;
                const isSelected = i === selectedOption;

                if (showFeedback) {
                  if (isSelected && isCorrect) {
                    optionStyle = 'bg-green-600/30 border-green-500';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'bg-red-600/30 border-red-500';
                  } else if (isCorrect) {
                    optionStyle = 'bg-green-600/20 border-green-500/50';
                  } else {
                    optionStyle = 'bg-slate-800 border-slate-700 opacity-40';
                  }
                }

                return (
                  <motion.button
                    key={i}
                    type="button"
                    disabled={showFeedback}
                    onClick={() => handleAnswer(i)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left
                               min-h-[56px] transition-all active:scale-[0.98]
                               disabled:cursor-default ${optionStyle}`}
                    whileTap={showFeedback ? {} : { scale: 0.97 }}
                  >
                    <span className="font-bold text-hero-amber text-sm mb-1">
                      {OPTION_LABELS[i]}
                      {showFeedback && isSelected && isCorrect && ' ✓'}
                      {showFeedback && isSelected && !isCorrect && ' ✗'}
                      {showFeedback && !isSelected && isCorrect && ' ✓'}
                    </span>
                    <span className="text-sm leading-snug">{option}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* ARIA live feedback */}
            <div className="sr-only" aria-live="polite">
              {showFeedback && selectedOption !== null && (
                selectedOption === question.correct_index
                  ? `Correct! ${damageDifficulty(question.difficulty)} damage dealt`
                  : `Wrong! ${lives} lives remaining`
              )}
            </div>

            {/* Next button */}
            <AnimatePresence>
              {showNext && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex justify-center"
                >
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-hero text-lg px-10 min-h-[56px]"
                  >
                    Next →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
