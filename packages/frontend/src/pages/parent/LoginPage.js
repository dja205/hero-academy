import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { apiClient, ApiRequestError } from '../../api/client';
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
    const successMessage = location.state?.message;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [debugMode, setDebugMode] = useState(false);
    useEffect(() => {
        fetch('/health').then(r => {
            if (r.headers.get('x-debug-unlock-all') === 'true')
                setDebugMode(true);
        }).catch(() => { });
    }, []);
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const data = await apiClient.post('/auth/parent-login', {
                email: email.trim().toLowerCase(),
                password,
            });
            setAuth(data.accessToken, 'parent', data.parent.id);
            navigate('/parent/dashboard', { replace: true });
        }
        catch (e) {
            if (e instanceof ApiRequestError) {
                setError('Invalid email or password.');
            }
            else {
                setError('Login failed. Please try again.');
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-md w-full", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Hero Academy" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Parent Login" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [successMessage && (_jsx("div", { className: "mb-4 p-3 rounded-lg bg-green-50 text-sm text-green-700", children: successMessage })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "parent-login-email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { id: "parent-login-email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "parent@example.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "parent-login-password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsx("input", { id: "parent-login-password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), error && (_jsx("div", { className: "p-3 rounded-lg bg-red-50 text-sm text-red-700", children: error })), _jsx("button", { type: "submit", disabled: submitting || !email || !password, className: "w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: submitting ? 'Signing In…' : 'Sign In' })] }), _jsxs("p", { className: "mt-4 text-center text-sm text-gray-600", children: ["Don't have an account?", ' ', _jsx(Link, { to: "/parent/register", className: "text-indigo-600 hover:text-indigo-700 font-medium", children: "Create one" })] }), debugMode && (_jsxs("div", { className: "mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800", children: [_jsx("div", { className: "font-bold mb-1", children: "\uD83D\uDC1B Debug Mode \u2014 Test Credentials" }), _jsx("button", { type: "button", className: "underline hover:text-yellow-900", onClick: () => { setEmail('test@test.com'); setPassword('password'); }, children: "Parent: test@test.com / password" }), _jsxs("div", { className: "mt-1 text-yellow-700", children: ["Then child PIN: ", _jsx("strong", { children: "1111" })] })] }))] })] }) }));
}
