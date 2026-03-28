import { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute as ChildProtectedRoute } from './components/child/ProtectedRoute';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { DebugBanner } from './components/shared/DebugBanner';
import { LoginPage as ChildLoginPage } from './pages/child/LoginPage';
import { CityMapPage } from './pages/child/CityMapPage';
import { DistrictPage } from './pages/child/DistrictPage';
import { MissionPage } from './pages/child/MissionPage';
import { MissionCompletePage } from './pages/child/MissionCompletePage';
import { BossBattlePage } from './pages/child/BossBattlePage';
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


/* ------------------------------------------------------------------ */
/*  P3-01: React Error Boundary                                       */
/* ------------------------------------------------------------------ */
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-600 text-center max-w-md">
            An unexpected error occurred. Please refresh the page to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/*  P1-06: Silent re-auth on app mount                                */
/* ------------------------------------------------------------------ */
function AuthBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (token) {
      setReady(true);
      return;
    }
    // Use fetch directly (not apiClient) to avoid the 401 interceptor
    // firing a second refresh attempt on cold start
    fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('no session');
        return res.json();
      })
      .then((body) => {
        if (!body.success || !body.data?.accessToken) return;
        const b64 = body.data.accessToken.split('.')[1]
          .replace(/-/g, '+').replace(/_/g, '/');
        const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=');
        const payload = JSON.parse(atob(padded));
        setAuth(body.data.accessToken, payload.role, payload.sub, payload.parentId);
      })
      .catch(() => {
        // No refresh cookie = not logged in, that's fine
      })
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-hero-yellow border-t-transparent rounded-full" />
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <DebugBanner />
      <AuthBootstrap>
        <Routes>
      {/* Child Portal */}
      <Route path="/child/login" element={<ChildLoginPage />} />
      <Route path="/child/map" element={<ChildProtectedRoute><CityMapPage /></ChildProtectedRoute>} />
      <Route path="/child/district/:topicId" element={<ChildProtectedRoute><DistrictPage /></ChildProtectedRoute>} />
      <Route path="/child/mission/:assessmentId" element={<ChildProtectedRoute><MissionPage /></ChildProtectedRoute>} />
      <Route path="/child/mission/:assessmentId/complete" element={<ChildProtectedRoute><MissionCompletePage /></ChildProtectedRoute>} />
      <Route path="/child/boss/:subjectId" element={<ChildProtectedRoute><BossBattlePage /></ChildProtectedRoute>} />
      <Route path="/child/profile" element={<ChildProtectedRoute><ProfilePage /></ChildProtectedRoute>} />
      <Route path="/child" element={<Navigate to="/child/login" replace />} />

      {/* Parent Portal */}
      <Route path="/parent/register" element={<ParentRegisterPage />} />
      <Route path="/parent/login" element={<ParentLoginPage />} />
      <Route path="/parent/dashboard" element={<ProtectedRoute role="parent"><ParentDashboardPage /></ProtectedRoute>} />
      <Route path="/parent/child/:childId" element={<ProtectedRoute role="parent"><ChildDetailPage /></ProtectedRoute>} />
      <Route path="/parent" element={<Navigate to="/parent/login" replace />} />

      {/* Admin Portal */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/console" element={<ProtectedRoute role="admin"><ConsolePage /></ProtectedRoute>}>
        <Route index element={<OverviewPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="assessments" element={<AssessmentsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

      <Route path="/" element={<Navigate to="/parent/login" replace />} />
        </Routes>
      </AuthBootstrap>
    </ErrorBoundary>
  );
}
