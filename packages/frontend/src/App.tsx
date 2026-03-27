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

export default function App() {
  return (
    <Routes>
      {/* Child Portal */}
      <Route path="/child/login" element={<ChildLoginPage />} />
      <Route path="/child/map" element={<ChildProtectedRoute><CityMapPage /></ChildProtectedRoute>} />
      <Route path="/child/district/:topicId" element={<ChildProtectedRoute><DistrictPage /></ChildProtectedRoute>} />
      <Route path="/child/mission/:assessmentId" element={<ChildProtectedRoute><MissionPage /></ChildProtectedRoute>} />
      <Route path="/child/mission/:assessmentId/complete" element={<ChildProtectedRoute><MissionCompletePage /></ChildProtectedRoute>} />
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
  );
}
