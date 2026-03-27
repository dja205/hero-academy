import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/child/map', label: 'City Map', icon: '🗺️' },
  { path: '/child/profile', label: 'Hero Profile', icon: '🦸' },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-city-darker/95 backdrop-blur border-t border-slate-700 z-50"
      aria-label="Main navigation"
    >
      <div className="flex justify-around max-w-md mx-auto">
        {NAV_ITEMS.map(({ path, label, icon }) => {
          const active = location.pathname.startsWith(path);
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 py-3 px-6 min-h-[56px] min-w-[56px] transition-colors
                ${active ? 'text-hero-amber' : 'text-slate-400 hover:text-slate-200'}`}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              <span className="text-xl" aria-hidden="true">{icon}</span>
              <span className="text-xs font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
