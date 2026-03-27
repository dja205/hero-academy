import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
const NAV_ITEMS = [
    { path: '/admin/console', label: 'Overview', icon: '📊', end: true },
    { path: '/admin/console/questions', label: 'Questions', icon: '❓', end: false },
    { path: '/admin/console/assessments', label: 'Assessments', icon: '📝', end: false },
    { path: '/admin/console/users', label: 'Users', icon: '👤', end: false },
];
export function AdminLayout() {
    const navigate = useNavigate();
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const handleLogout = () => {
        clearAuth();
        navigate('/admin/login');
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex", children: [_jsxs("aside", { className: "w-56 bg-white border-r border-gray-200 flex flex-col shrink-0", children: [_jsxs("div", { className: "p-4 border-b border-gray-200", children: [_jsx("h1", { className: "text-lg font-bold text-gray-900", children: "Hero Academy" }), _jsx("p", { className: "text-xs text-gray-500", children: "Admin Console" })] }), _jsx("nav", { className: "flex-1 py-4", children: NAV_ITEMS.map((item) => (_jsxs(NavLink, { to: item.path, end: item.end, className: ({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${isActive
                                ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`, children: [_jsx("span", { children: item.icon }), _jsx("span", { children: item.label })] }, item.path))) }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsx("button", { onClick: handleLogout, className: "w-full text-sm text-gray-600 hover:text-gray-900 text-left", children: "\u2190 Sign Out" }) })] }), _jsx("main", { className: "flex-1 p-6 overflow-auto", children: _jsx(Outlet, {}) })] }));
}
