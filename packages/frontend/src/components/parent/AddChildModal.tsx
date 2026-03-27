import { useState } from 'react';
import { HeroAvatar } from '../child/HeroAvatar';

interface AddChildModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    heroName: string;
    avatarConfig: { costume: 1 | 2 | 3; mask: 1 | 2 };
    pin: string;
  }) => Promise<void>;
  childCount: number;
  maxChildren?: number;
}

export function AddChildModal({
  open,
  onClose,
  onSubmit,
  childCount,
  maxChildren = 4,
}: AddChildModalProps) {
  const [name, setName] = useState('');
  const [heroName, setHeroName] = useState('');
  const [costume, setCostume] = useState<1 | 2 | 3>(1);
  const [mask, setMask] = useState<1 | 2>(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const atLimit = childCount >= maxChildren;

  const resetForm = () => {
    setName('');
    setHeroName('');
    setCostume(1);
    setMask(1);
    setPin('');
    setConfirmPin('');
    setError('');
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required';
    if (!heroName.trim()) return 'Hero name is required';
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return 'PIN must be exactly 4 digits';
    if (pin !== confirmPin) return 'PINs do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        heroName: heroName.trim(),
        avatarConfig: { costume, mask },
        pin,
      });
      resetForm();
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to add child';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Hero</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {atLimit ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              You've reached the maximum of {maxChildren} heroes on the free plan.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="child-name" className="block text-sm font-medium text-gray-700 mb-1">
                Child's Name
              </label>
              <input
                id="child-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="e.g. Alex"
                required
              />
            </div>

            <div>
              <label htmlFor="hero-name" className="block text-sm font-medium text-gray-700 mb-1">Hero Name</label>
              <input
                id="hero-name"
                type="text"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="e.g. Captain Calc"
                required
              />
            </div>

            {/* Avatar picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Avatar
              </label>
              <div className="flex gap-3 justify-center">
                {([1, 2, 3] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCostume(c)}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      costume === c
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <HeroAvatar costume={c} mask={mask} size={48} />
                  </button>
                ))}
              </div>
              <div className="flex gap-3 justify-center mt-2">
                {([1, 2] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMask(m)}
                    className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                      mask === m
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Mask {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="child-pin" className="block text-sm font-medium text-gray-700 mb-1">
                PIN (4 digits)
              </label>
              <input
                id="child-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="••••"
                required
              />
            </div>

            <div>
              <label htmlFor="child-confirm-pin" className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
              <input
                id="child-confirm-pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="••••"
                required
              />
              {confirmPin && pin !== confirmPin && (
                <p className="mt-1 text-sm text-red-600">PINs do not match</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Hero'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
