import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient, ApiRequestError } from '../../api/client';
export function RegisterPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Real-time field-level validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordValid = password.length >= 8;
    const passwordsMatch = password === confirmPassword;
    const formValid = name.trim().length > 0 &&
        emailValid &&
        passwordValid &&
        confirmPassword.length > 0 &&
        passwordsMatch;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formValid)
            return;
        setSubmitting(true);
        setError('');
        try {
            await apiClient.post('/auth/register', {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password,
            });
            navigate('/parent/login', {
                state: { message: 'Registration successful! Check your email to verify your account.' },
            });
        }
        catch (e) {
            if (e instanceof ApiRequestError && e.code === 'DUPLICATE_EMAIL') {
                setError('An account with this email already exists. Please log in instead.');
            }
            else if (e instanceof Error) {
                setError(e.message);
            }
            else {
                setError('Registration failed. Please try again.');
            }
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center px-4", children: _jsxs("div", { className: "max-w-md w-full", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Hero Academy" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Create your parent account" })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "register-name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name" }), _jsx("input", { id: "register-name", type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "Your name", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "register-email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { id: "register-email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${email && !emailValid ? 'border-red-300' : 'border-gray-300'}`, placeholder: "parent@example.com", required: true }), email && !emailValid && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: "Please enter a valid email address" }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "register-password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "register-password", type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), className: `w-full px-3 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${password && !passwordValid ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Min. 8 characters", required: true }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700", children: showPassword ? 'Hide' : 'Show' })] }), password && !passwordValid && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: "Password must be at least 8 characters" }))] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "register-confirm-password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm Password" }), _jsx("input", { id: "register-confirm-password", type: showPassword ? 'text' : 'password', value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-300'}`, placeholder: "Repeat password", required: true }), confirmPassword && !passwordsMatch && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: "Passwords do not match" }))] }), error && (_jsx("div", { className: "p-3 rounded-lg bg-red-50 text-sm text-red-700", children: error })), _jsx("button", { type: "submit", disabled: !formValid || submitting, className: "w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: submitting ? 'Creating Account…' : 'Create Account' })] }), _jsxs("p", { className: "mt-4 text-center text-sm text-gray-600", children: ["Already have an account?", ' ', _jsx(Link, { to: "/parent/login", className: "text-indigo-600 hover:text-indigo-700 font-medium", children: "Log in" })] })] })] }) }));
}
