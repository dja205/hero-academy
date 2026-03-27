import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useIdleTimer } from '../../hooks/useIdleTimer';
/**
 * Role-gated route guard for parent and admin portals.
 * Redirects to the appropriate login page if unauthenticated or wrong role.
 * Includes idle-timeout auto-logout (2 hours).
 */
export function ProtectedRoute({ children, role }) {
    const { token, role: userRole, clearAuth } = useAuthStore();
    useIdleTimer(() => clearAuth());
    if (!token || userRole !== role) {
        const loginPath = role === 'parent' ? '/parent/login' : '/admin/login';
        return _jsx(Navigate, { to: loginPath, replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
