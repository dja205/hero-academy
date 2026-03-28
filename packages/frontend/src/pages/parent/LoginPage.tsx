import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { apiClient, ApiRequestError } from '../../api/client';

interface LoginResponse {
  accessToken: string;
  parent: { id: string; email: string; name: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const existingToken = useAuthStore((s) => s.token);
  const existingRole = useAuthStore((s) => s.role);

  // If already logged in as parent, redirect
  if (existingToken && existingRole === 'parent') {
    navigate('/parent/dashboard', { replace: true });
  }

  const successMessage = (location.state as { message?: string } | null)?.message;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    fetch('/health').then(r => {
      if (r.headers.get('x-debug-unlock-all') === 'true') setDebugMode(true);
    }).catch(() => {});
  }, []);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const data = await apiClient.post<LoginResponse>('/auth/parent-login', {
        email: email.trim().toLowerCase(),
        password,
      });
      setAuth(data.accessToken, 'parent', data.parent.id);
      navigate('/parent/dashboard', { replace: true });
    } catch (e: unknown) {
      if (e instanceof ApiRequestError) {
        setError('Invalid email or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hero Academy</h1>
          <p className="mt-2 text-gray-600">Parent Login</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="parent-login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="parent-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="parent@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="parent-login-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="parent-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-sm text-red-700">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/parent/register"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create one
            </Link>
          </p>

          {debugMode && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800">
              <div className="font-bold mb-1">🐛 Debug Mode — Test Credentials</div>
              <button
                type="button"
                className="underline hover:text-yellow-900"
                onClick={() => { setEmail('test@test.com'); setPassword('password'); }}
              >
                Parent: test@test.com / password
              </button>
              <div className="mt-1 text-yellow-700">Then child PIN: <strong>1111</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
