import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate } from 'react-router-dom';
const NAV_ITEMS = [
    { path: '/child/map', label: 'City Map', icon: '🗺️' },
    { path: '/child/profile', label: 'Hero Profile', icon: '🦸' },
];
export function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    return (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 bg-city-darker/95 backdrop-blur border-t border-slate-700 z-50", "aria-label": "Main navigation", children: _jsx("div", { className: "flex justify-around max-w-md mx-auto", children: NAV_ITEMS.map(({ path, label, icon }) => {
                const active = location.pathname.startsWith(path);
                return (_jsxs("button", { type: "button", onClick: () => navigate(path), className: `flex flex-col items-center gap-1 py-3 px-6 min-h-[56px] min-w-[56px] transition-colors
                ${active ? 'text-hero-amber' : 'text-slate-400 hover:text-slate-200'}`, "aria-current": active ? 'page' : undefined, "aria-label": label, children: [_jsx("span", { className: "text-xl", "aria-hidden": "true", children: icon }), _jsx("span", { className: "text-xs font-bold", children: label })] }, path));
            }) }) }));
}
