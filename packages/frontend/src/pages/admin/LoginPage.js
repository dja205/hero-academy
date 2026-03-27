import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { apiClient, ApiRequestError } from '../../api/client';
export function LoginPage() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            const data = await apiClient.post('/auth/admin-login', {
                email: email.trim().toLowerCase(),
                password,
            });
            setAuth(data.accessToken, 'admin', data.admin.id);
            navigate('/admin/console', { replace: true });
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
    return (_jsx("div", { className: "min-h-screen bg-gray-100 flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-sm w-full", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Hero Academy" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Admin Console" })] }), _jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6", children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "admin-login-email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { id: "admin-login-email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "admin@heroacademy.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "admin-login-password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsx("input", { id: "admin-login-password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), error && (_jsx("div", { className: "p-3 rounded-lg bg-red-50 text-sm text-red-700", children: error })), _jsx("button", { type: "submit", disabled: submitting || !email || !password, className: "w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: submitting ? 'Signing In…' : 'Sign In' })] }) })] }) }));
}
