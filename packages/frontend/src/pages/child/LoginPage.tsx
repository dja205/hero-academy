import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../api/client';
import { AvatarCarousel } from '../../components/child/AvatarCarousel';
import { PinPad } from '../../components/child/PinPad';

interface ChildProfile {
  id: string;
  name: string;
  heroName: string;
  avatarConfig: { costume: number; mask: number };
}

const MAX_ATTEMPTS = 5;

export function LoginPage() {
  const navigate = useNavigate();
  const { token, role, parentId, setAuth } = useAuthStore();
  const prefersReduced = useReducedMotion();

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [pinResetKey, setPinResetKey] = useState(0);

  // If already logged in as child, redirect to map
  useEffect(() => {
    if (token && role === 'child') {
      navigate('/child/map', { replace: true });
    }
  }, [token, role, navigate]);

  // Fetch children for the logged-in parent
  useEffect(() => {
    let cancelled = false;
    async function fetchChildren() {
      try {
        // Use the parent API endpoint to get children list
        const data = await apiClient.get<{ children: ChildProfile[] }>('/children');
        if (!cancelled) {
          setChildren(data.children);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setChildren([]);
          setLoading(false);
        }
      }
    }
    fetchChildren();
    return () => { cancelled = true; };
  }, [parentId]);

  const handlePinSubmit = useCallback(
    async (pin: string) => {
      if (lockedOut || !children[selectedIndex]) return;
      setError(null);

      try {
        const child = children[selectedIndex];
        const result = await apiClient.post<{ accessToken: string }>(
          '/auth/child-login',
          { childId: child.id, pin },
        );
        setAuth(result.accessToken, 'child', child.id, parentId ?? undefined);
        navigate('/child/map', { replace: true });
      } catch {
        const next = attempts + 1;
        setAttempts(next);
        setPinResetKey((k) => k + 1); // force PinPad to remount and clear entered digits
        if (next >= MAX_ATTEMPTS) {
          setLockedOut(true);
          setError('Too many tries! Ask your parent for help.');
        } else {
          setError('Try again!');
        }
      }
    },
    [children, selectedIndex, attempts, lockedOut, navigate, setAuth, parentId],
  );

  if (loading) {
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

  return (
    <div className="min-h-screen bg-city-dark flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={prefersReduced ? {} : { y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-hero text-hero-amber tracking-wide drop-shadow-lg">
            Hero Academy
          </h1>
          <p className="text-slate-400 mt-1 text-base">Choose your hero</p>
        </div>

        {/* Avatar carousel */}
        <AvatarCarousel
          children={children}
          selectedIndex={selectedIndex}
          onSelect={(i) => {
            setSelectedIndex(i);
            setError(null);
            setAttempts(0);
            setLockedOut(false);
          }}
        />

        {/* PIN pad */}
        {children.length > 0 && (
          <div className="w-full">
            <p className="text-center text-slate-300 mb-4 text-base font-bold">Enter your PIN</p>
            <PinPad
              key={pinResetKey}
              onSubmit={handlePinSubmit}
              error={error}
              disabled={lockedOut}
            />
          </div>
        )}

        {/* Home button */}
        <button
          type="button"
          onClick={() => navigate('/parent')}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← Back to Parent Portal
        </button>
      </motion.div>
    </div>
  );
}
