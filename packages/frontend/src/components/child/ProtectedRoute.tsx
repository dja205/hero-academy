import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { BottomNav } from './BottomNav';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, role, clearAuth } = useAuthStore();

  useIdleTimer(() => {
    clearAuth();
  });

  if (!token || role !== 'child') {
    return <Navigate to="/child/login" replace />;
  }

  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
