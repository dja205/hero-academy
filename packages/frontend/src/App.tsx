import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/child/ProtectedRoute';
import { LoginPage } from './pages/child/LoginPage';
import { CityMapPage } from './pages/child/CityMapPage';
import { DistrictPage } from './pages/child/DistrictPage';
import { MissionPage } from './pages/child/MissionPage';
import { MissionCompletePage } from './pages/child/MissionCompletePage';
import { ProfilePage } from './pages/child/ProfilePage';

const ParentPortal = () => (
  <div className="min-h-screen bg-city-dark flex items-center justify-center">
    <h1 className="text-4xl font-hero text-hero-blue">Hero Academy — Parent Portal</h1>
  </div>
);

const AdminPortal = () => (
  <div className="min-h-screen bg-city-dark flex items-center justify-center">
    <h1 className="text-4xl font-hero text-hero-purple">Hero Academy — Admin Portal</h1>
  </div>
);

export default function App() {
  return (
    <Routes>
      {/* Child Portal */}
      <Route path="/child/login" element={<LoginPage />} />
      <Route path="/child/map" element={<ProtectedRoute><CityMapPage /></ProtectedRoute>} />
      <Route path="/child/district/:topicId" element={<ProtectedRoute><DistrictPage /></ProtectedRoute>} />
      <Route path="/child/mission/:assessmentId" element={<ProtectedRoute><MissionPage /></ProtectedRoute>} />
      <Route path="/child/mission/:assessmentId/complete" element={<ProtectedRoute><MissionCompletePage /></ProtectedRoute>} />
      <Route path="/child/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/child" element={<Navigate to="/child/login" replace />} />

      {/* Parent & Admin Portals (placeholder) */}
      <Route path="/parent/*" element={<ParentPortal />} />
      <Route path="/admin/*" element={<AdminPortal />} />
      <Route path="/" element={<Navigate to="/parent" replace />} />
    </Routes>
  );
}
