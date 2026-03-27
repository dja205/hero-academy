import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { HeroAvatar } from '../child/HeroAvatar';
export function AddChildModal({ open, onClose, onSubmit, childCount, maxChildren = 4, }) {
    const [name, setName] = useState('');
    const [heroName, setHeroName] = useState('');
    const [costume, setCostume] = useState(1);
    const [mask, setMask] = useState(1);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    if (!open)
        return null;
    const atLimit = childCount >= maxChildren;
    const resetForm = () => {
        setName('');
        setHeroName('');
        setCostume(1);
        setMask(1);
        setPin('');
        setConfirmPin('');
        setError('');
    };
    const validate = () => {
        if (!name.trim())
            return 'Name is required';
        if (!heroName.trim())
            return 'Hero name is required';
        if (pin.length !== 4 || !/^\d{4}$/.test(pin))
            return 'PIN must be exactly 4 digits';
        if (pin !== confirmPin)
            return 'PINs do not match';
        return null;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const err = validate();
        if (err) {
            setError(err);
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await onSubmit({
                name: name.trim(),
                heroName: heroName.trim(),
                avatarConfig: { costume, mask },
                pin,
            });
            resetForm();
            onClose();
        }
        catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to add child';
            setError(message);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: onClose, children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Add New Hero" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600 text-2xl leading-none", children: "\u00D7" })] }), atLimit ? (_jsx("div", { className: "text-center py-8", children: _jsxs("p", { className: "text-gray-600", children: ["You've reached the maximum of ", maxChildren, " heroes on the free plan."] }) })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "child-name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Child's Name" }), _jsx("input", { id: "child-name", type: "text", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "e.g. Alex", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "hero-name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Hero Name" }), _jsx("input", { id: "hero-name", type: "text", value: heroName, onChange: (e) => setHeroName(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "e.g. Captain Calc", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Choose Avatar" }), _jsx("div", { className: "flex gap-3 justify-center", children: [1, 2, 3].map((c) => (_jsx("button", { type: "button", onClick: () => setCostume(c), className: `p-2 rounded-lg border-2 transition-colors ${costume === c
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300'}`, children: _jsx(HeroAvatar, { costume: c, mask: mask, size: 48 }) }, c))) }), _jsx("div", { className: "flex gap-3 justify-center mt-2", children: [1, 2].map((m) => (_jsxs("button", { type: "button", onClick: () => setMask(m), className: `px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition-colors ${mask === m
                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'}`, children: ["Mask ", m] }, m))) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "child-pin", className: "block text-sm font-medium text-gray-700 mb-1", children: "PIN (4 digits)" }), _jsx("input", { id: "child-pin", type: "password", inputMode: "numeric", maxLength: 4, value: pin, onChange: (e) => setPin(e.target.value.replace(/\D/g, '')), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "\u2022\u2022\u2022\u2022", required: true })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "child-confirm-pin", className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm PIN" }), _jsx("input", { id: "child-confirm-pin", type: "password", inputMode: "numeric", maxLength: 4, value: confirmPin, onChange: (e) => setConfirmPin(e.target.value.replace(/\D/g, '')), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900", placeholder: "\u2022\u2022\u2022\u2022", required: true }), confirmPin && pin !== confirmPin && (_jsx("p", { className: "mt-1 text-sm text-red-600", children: "PINs do not match" }))] }), error && (_jsx("p", { className: "text-sm text-red-600 bg-red-50 p-2 rounded", children: error })), _jsx("button", { type: "submit", disabled: submitting, className: "w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors", children: submitting ? 'Adding...' : 'Add Hero' })] }))] }) }));
}
