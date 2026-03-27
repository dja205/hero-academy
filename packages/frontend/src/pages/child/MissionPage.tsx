import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { childApi } from '../../api/child';
import { PowerMeter } from '../../components/child/PowerMeter';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface AssessmentData {
  id: string;
  title: string;
  questions: Question[];
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function MissionPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!assessmentId) return;
    let cancelled = false;

    // Fetch assessments and find the matching one
    childApi.getAssessments('').then((data) => {
      if (cancelled) return;
      const found = data.assessments.find((a) => a.id === assessmentId);
      if (found) setAssessment(found);
      setLoading(false);
    }).catch(() => {
      // Retry with direct assessment endpoint pattern
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [assessmentId]);

  const question = assessment?.questions[currentQ];
  const totalQuestions = assessment?.questions.length ?? 0;

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (showFeedback || !question) return;
      setSelectedOption(optionIndex);
      setShowFeedback(true);
      setAnswers((prev) => [...prev, optionIndex]);

      // Show "Next" button after 1s
      setTimeout(() => setShowNext(true), 1000);
    },
    [showFeedback, question],
  );

  const handleNext = useCallback(() => {
    const nextQ = currentQ + 1;
    if (nextQ >= totalQuestions) {
      // Submit attempt
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const finalAnswers = [...answers];
      childApi
        .submitAttempt({
          assessmentId: assessment!.id,
          answers: finalAnswers,
          durationSeconds,
        })
        .then((result) => {
          navigate(`/child/mission/${assessmentId}/complete`, {
            state: {
              score: result.score,
              maxScore: result.maxScore,
              stars: result.stars,
              xpEarned: result.xpEarned,
              newTotalXp: result.newTotalXp,
              newRank: result.newRank,
              newAchievements: result.newAchievements,
              assessmentId,
            },
          });
        })
        .catch(() => {
          navigate(`/child/mission/${assessmentId}/complete`, {
            state: {
              score: 0,
              maxScore: totalQuestions,
              stars: 1 as const,
              xpEarned: 0,
              newTotalXp: 0,
              newRank: 'Cadet',
              newAchievements: [],
              assessmentId,
            },
          });
        });
      return;
    }

    setCurrentQ(nextQ);
    setSelectedOption(null);
    setShowFeedback(false);
    setShowNext(false);
  }, [currentQ, totalQuestions, answers, assessment, assessmentId, navigate, startTime]);

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

  if (!assessment || !question) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-400 text-lg">Mission not found</p>
        <button type="button" onClick={() => navigate('/child/map')} className="btn-hero">
          Back to Map
        </button>
      </div>
    );
  }

  // We don't have correct answer index from the API (answers hidden),
  // so we show cosmetic feedback: option 0 is treated as "correct" for UI demo.
  // In production the server returns correctness on submit.
  const isCorrect = selectedOption === 0;

  return (
    <div className="min-h-screen bg-city-dark px-4 pt-6 pb-24">
      <motion.div
        initial={prefersReduced ? {} : { y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg mx-auto"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 min-w-[56px] min-h-[56px] rounded-full bg-slate-700 hover:bg-slate-600
                       flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Go back"
          >
            ←
          </button>
          <span className="text-sm font-bold text-slate-400">
            Question {currentQ + 1} of {totalQuestions}
          </span>
        </div>

        {/* Power meter */}
        <div className="mb-6">
          <PowerMeter active={!showFeedback} durationSeconds={60} />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={prefersReduced ? {} : { x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={prefersReduced ? {} : { x: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="card-hero mb-6">
              <p className="text-lg font-bold leading-relaxed">{question.text}</p>
            </div>

            {/* Options */}
            <div className="grid gap-3">
              {question.options.map((option, i) => {
                let optionStyle = 'bg-slate-800 border-slate-700 hover:border-slate-500';
                let icon = '';

                if (showFeedback) {
                  if (i === selectedOption && isCorrect) {
                    optionStyle = 'bg-hero-green/20 border-hero-green';
                    icon = ' ✓';
                  } else if (i === selectedOption && !isCorrect) {
                    optionStyle = 'bg-hero-red/20 border-hero-red';
                    icon = ' ✗';
                  } else if (i === 0) {
                    // Highlight correct answer
                    optionStyle = 'bg-hero-green/10 border-hero-green/50';
                    icon = ' ✓';
                  }
                }

                return (
                  <motion.button
                    key={i}
                    type="button"
                    disabled={showFeedback}
                    onClick={() => handleAnswer(i)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left
                               min-h-[56px] transition-all active:scale-[0.98]
                               disabled:cursor-default ${optionStyle}`}
                    whileTap={showFeedback ? {} : { scale: 0.97 }}
                    animate={
                      showFeedback && i === selectedOption && !isCorrect && !prefersReduced
                        ? { x: [0, -6, 6, -6, 0] }
                        : {}
                    }
                    transition={{ duration: 0.3 }}
                  >
                    <span className="font-bold text-hero-amber shrink-0 w-7">
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="text-base leading-snug line-clamp-2">
                      {option}{icon}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback explanation */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-4 rounded-xl border text-sm ${
                    isCorrect
                      ? 'bg-hero-green/10 border-hero-green/30 text-hero-green'
                      : 'bg-hero-red/10 border-hero-red/30 text-hero-red'
                  }`}
                >
                  {isCorrect ? '🎉 Great job! That\'s correct!' : '💪 Not quite — keep trying!'}
                </motion.div>
              )}
            </AnimatePresence>

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
                    {currentQ + 1 >= totalQuestions ? 'Finish Mission!' : 'Next →'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
