import { HeroAvatar } from '../child/HeroAvatar';

interface ChildCardChild {
  id: string;
  name: string;
  heroName: string;
  avatarConfig: { costume: number; mask: number };
  xp: number;
  rank: string;
  createdAt: string;
  currentStreak?: number;
  lastActiveAt?: string;
}

interface ChildCardProps {
  child: ChildCardChild;
  onEdit: (id: string) => void;
  onResetPin: (id: string) => void;
  onDelete: (id: string) => void;
  onPlay: (id: string) => void;
  onViewProgress: (id: string) => void;
}

export function ChildCard({ child, onEdit, onResetPin, onDelete, onPlay, onViewProgress }: ChildCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <HeroAvatar costume={child.avatarConfig.costume} mask={child.avatarConfig.mask} size={64} />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{child.heroName}</h3>
          <p className="text-sm text-gray-500">{child.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              {child.rank}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              {child.xp} XP
            </span>
            {child.currentStreak != null && child.currentStreak > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                🔥 {child.currentStreak} day streak
              </span>
            )}
          </div>
          {child.lastActiveAt && (
            <p className="mt-1 text-xs text-gray-400">
              Last active: {new Date(child.lastActiveAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onPlay(child.id)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          ▶ Play as Hero
        </button>
        <button
          onClick={() => onViewProgress(child.id)}
          className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          Progress
        </button>
        <button
          onClick={() => onEdit(child.id)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onResetPin(child.id)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Reset PIN
        </button>
        <button
          onClick={() => onDelete(child.id)}
          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
