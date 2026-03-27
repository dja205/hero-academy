import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute as ChildProtectedRoute } from './components/child/ProtectedRoute';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { LoginPage as ChildLoginPage } from './pages/child/LoginPage';
import { CityMapPage } from './pages/child/CityMapPage';
import { DistrictPage } from './pages/child/DistrictPage';
import { MissionPage } from './pages/child/MissionPage';
import { MissionCompletePage } from './pages/child/MissionCompletePage';
import { ProfilePage } from './pages/child/ProfilePage';
import { RegisterPage as ParentRegisterPage } from './pages/parent/RegisterPage';
import { LoginPage as ParentLoginPage } from './pages/parent/LoginPage';
import { DashboardPage as ParentDashboardPage } from './pages/parent/DashboardPage';
import { ChildDetailPage } from './pages/parent/ChildDetailPage';
import { LoginPage as AdminLoginPage } from './pages/admin/LoginPage';
import { ConsolePage } from './pages/admin/ConsolePage';
import { OverviewPage } from './pages/admin/OverviewPage';
import { QuestionsPage } from './pages/admin/QuestionsPage';
import { AssessmentsPage } from './pages/admin/AssessmentsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { useAuthStore } from './store/auth';
import { apiClient } from './api/client';
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('Uncaught error:', error, info.componentStack);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-gray-50", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Something went wrong" }), _jsx("p", { className: "text-gray-600 text-center max-w-md", children: "An unexpected error occurred. Please refresh the page to try again." }), _jsx("button", { type: "button", onClick: () => window.location.reload(), className: "px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors", children: "Refresh Page" })] }));
        }
        return this.props.children;
    }
}
/* ------------------------------------------------------------------ */
/*  P1-06: Silent re-auth on app mount                                */
/* ------------------------------------------------------------------ */
function AuthBootstrap({ children }) {
    const [ready, setReady] = useState(false);
    const token = useAuthStore((s) => s.token);
    const setAuth = useAuthStore((s) => s.setAuth);
    useEffect(() => {
        if (token) {
            setReady(true);
            return;
        }
        apiClient
            .post('/auth/refresh')
            .then((data) => {
            const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
            setAuth(data.accessToken, payload.role, payload.sub, payload.parentId);
        })
            .catch(() => {
            // No refresh cookie = not logged in, that's fine
        })
            .finally(() => setReady(true));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    if (!ready) {
        return (_jsx("div", { className: "flex h-screen items-center justify-center", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-hero-yellow border-t-transparent rounded-full" }) }));
    }
    return _jsx(_Fragment, { children: children });
}
export default function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(AuthBootstrap, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/child/login", element: _jsx(ChildLoginPage, {}) }), _jsx(Route, { path: "/child/map", element: _jsx(ChildProtectedRoute, { children: _jsx(CityMapPage, {}) }) }), _jsx(Route, { path: "/child/district/:topicId", element: _jsx(ChildProtectedRoute, { children: _jsx(DistrictPage, {}) }) }), _jsx(Route, { path: "/child/mission/:assessmentId", element: _jsx(ChildProtectedRoute, { children: _jsx(MissionPage, {}) }) }), _jsx(Route, { path: "/child/mission/:assessmentId/complete", element: _jsx(ChildProtectedRoute, { children: _jsx(MissionCompletePage, {}) }) }), _jsx(Route, { path: "/child/profile", element: _jsx(ChildProtectedRoute, { children: _jsx(ProfilePage, {}) }) }), _jsx(Route, { path: "/child", element: _jsx(Navigate, { to: "/child/login", replace: true }) }), _jsx(Route, { path: "/parent/register", element: _jsx(ParentRegisterPage, {}) }), _jsx(Route, { path: "/parent/login", element: _jsx(ParentLoginPage, {}) }), _jsx(Route, { path: "/parent/dashboard", element: _jsx(ProtectedRoute, { role: "parent", children: _jsx(ParentDashboardPage, {}) }) }), _jsx(Route, { path: "/parent/child/:childId", element: _jsx(ProtectedRoute, { role: "parent", children: _jsx(ChildDetailPage, {}) }) }), _jsx(Route, { path: "/parent", element: _jsx(Navigate, { to: "/parent/login", replace: true }) }), _jsx(Route, { path: "/admin/login", element: _jsx(AdminLoginPage, {}) }), _jsxs(Route, { path: "/admin/console", element: _jsx(ProtectedRoute, { role: "admin", children: _jsx(ConsolePage, {}) }), children: [_jsx(Route, { index: true, element: _jsx(OverviewPage, {}) }), _jsx(Route, { path: "questions", element: _jsx(QuestionsPage, {}) }), _jsx(Route, { path: "assessments", element: _jsx(AssessmentsPage, {}) }), _jsx(Route, { path: "users", element: _jsx(UsersPage, {}) })] }), _jsx(Route, { path: "/admin", element: _jsx(Navigate, { to: "/admin/login", replace: true }) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/parent/login", replace: true }) })] }) }) }));
}
