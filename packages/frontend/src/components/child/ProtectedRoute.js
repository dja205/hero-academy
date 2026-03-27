import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { BottomNav } from './BottomNav';
export function ProtectedRoute({ children }) {
    const { token, role, clearAuth } = useAuthStore();
    useIdleTimer(() => {
        clearAuth();
    });
    if (!token || role !== 'child') {
        return _jsx(Navigate, { to: "/child/login", replace: true });
    }
    return (_jsxs("div", { className: "min-h-screen pb-20", children: [children, _jsx(BottomNav, {})] }));
}
