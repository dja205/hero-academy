import { motion, AnimatePresence } from 'framer-motion';
import { HeroAvatar } from './HeroAvatar';

interface Child {
  id: string;
  heroName: string;
  avatarConfig: { costume: number; mask: number };
}

interface AvatarCarouselProps {
  children: Child[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function AvatarCarousel({ children, selectedIndex, onSelect }: AvatarCarouselProps) {
  if (children.length === 0) {
    return (
      <p className="text-slate-400 text-center text-lg">
        No heroes found. Ask your parent to add you!
      </p>
    );
  }

  const selected = children[selectedIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Carousel row */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onSelect((selectedIndex - 1 + children.length) % children.length)}
          className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-2xl
                     flex items-center justify-center active:scale-90 transition-transform
                     disabled:opacity-30"
          disabled={children.length <= 1}
          aria-label="Previous hero"
        >
          ‹
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center"
          >
            <div className="rounded-full bg-slate-800 border-4 border-hero-amber p-3 shadow-lg shadow-hero-amber/20">
              <HeroAvatar
                costume={selected.avatarConfig.costume}
                mask={selected.avatarConfig.mask}
                size={100}
                animate
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => onSelect((selectedIndex + 1) % children.length)}
          className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-white text-2xl
                     flex items-center justify-center active:scale-90 transition-transform
                     disabled:opacity-30"
          disabled={children.length <= 1}
          aria-label="Next hero"
        >
          ›
        </button>
      </div>

      {/* Hero name */}
      <AnimatePresence mode="wait">
        <motion.p
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-2xl font-hero text-hero-amber tracking-wide"
        >
          {selected.heroName}
        </motion.p>
      </AnimatePresence>

      {/* Dot indicators */}
      {children.length > 1 && (
        <div className="flex gap-2">
          {children.map((child, i) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === selectedIndex ? 'bg-hero-amber' : 'bg-slate-600'
              }`}
              aria-label={`Select ${child.heroName}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
