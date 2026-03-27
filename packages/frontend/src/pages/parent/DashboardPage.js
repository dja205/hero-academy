import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { parentApi } from '../../api/parent';
import { apiClient } from '../../api/client';
import { ChildCard } from '../../components/parent/ChildCard';
import { AddChildModal } from '../../components/parent/AddChildModal';
const MAX_CHILDREN = 4;
export function DashboardPage() {
    const navigate = useNavigate();
    const clearAuth = useAuthStore((s) => s.clearAuth);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [plan, setPlan] = useState('Free Plan');
    const [editingChild, setEditingChild] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', heroName: '' });
    const [resetPinChild, setResetPinChild] = useState(null);
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionError, setActionError] = useState('');
    const loadChildren = useCallback(async () => {
        try {
            const data = await parentApi.getChildren();
            setChildren(data.children);
        }
        catch {
            // 401 handled by apiClient
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        loadChildren();
        // Load parent profile for subscription info
        apiClient
            .get('/parent/profile')
            .then((resp) => {
            const p = resp.parent;
            if (p?.subscription_plan)
                setPlan(p.subscription_plan);
            else if (p?.subscription_status)
                setPlan(p.subscription_status);
        })
            .catch(() => { });
    }, [loadChildren]);
    const handleAddChild = async (data) => {
        await parentApi.addChild(data);
        await loadChildren();
    };
    const handleEdit = (childId) => {
        const child = children.find((c) => c.id === childId);
        if (child) {
            setEditingChild(child);
            setEditForm({ name: child.name, heroName: child.heroName });
            setActionError('');
        }
    };
    const submitEdit = async () => {
        if (!editingChild)
            return;
        setActionError('');
        try {
            await parentApi.updateChild(editingChild.id, {
                name: editForm.name.trim(),
                heroName: editForm.heroName.trim(),
            });
            setEditingChild(null);
            await loadChildren();
        }
        catch (e) {
            setActionError(e instanceof Error ? e.message : 'Failed to update');
        }
    };
    const handleResetPin = (childId) => {
        setResetPinChild(childId);
        setNewPin('');
        setConfirmNewPin('');
        setActionError('');
    };
    const submitResetPin = async () => {
        if (!resetPinChild)
            return;
        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            setActionError('PIN must be 4 digits');
            return;
        }
        if (newPin !== confirmNewPin) {
            setActionError('PINs do not match');
            return;
        }
        setActionError('');
        try {
            await parentApi.resetPin(resetPinChild, newPin);
            setResetPinChild(null);
        }
        catch (e) {
            setActionError(e instanceof Error ? e.message : 'Failed to reset PIN');
        }
    };
    const handleDelete = (childId) => {
        setDeleteConfirm(childId);
        setActionError('');
    };
    const confirmDelete = async () => {
        if (!deleteConfirm)
            return;
        setActionError('');
        try {
            await parentApi.deleteChild(deleteConfirm);
            setDeleteConfirm(null);
            await loadChildren();
        }
        catch (e) {
            setActionError(e instanceof Error ? e.message : 'Failed to delete');
        }
    };
    const handlePlay = (childId) => {
        navigate(`/child/login?childId=${childId}`);
    };
    const handleLogout = () => {
        clearAuth();
        navigate('/parent/login');
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 flex items-center justify-center", children: _jsx("p", { className: "text-gray-500", children: "Loading\u2026" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("header", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-gray-900", children: "Hero Academy" }), _jsx("p", { className: "text-sm text-gray-500", children: "Parent Dashboard" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800", children: plan }), _jsx("button", { onClick: handleLogout, className: "text-sm text-gray-600 hover:text-gray-900", children: "Sign Out" })] })] }) }), _jsxs("main", { className: "max-w-5xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Your Heroes" }), _jsxs("p", { className: "text-sm text-gray-500", children: [children.length, " of ", MAX_CHILDREN, " heroes"] })] }), _jsx("button", { onClick: () => setShowAddModal(true), disabled: children.length >= MAX_CHILDREN, className: "px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: "+ Add Child" })] }), children.length === 0 ? (_jsxs("div", { className: "text-center py-16 bg-white rounded-xl border border-gray-200", children: [_jsx("p", { className: "text-4xl mb-4", children: "\uD83E\uDDB8" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No heroes yet!" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Add your first child to begin their learning adventure." }), _jsx("button", { onClick: () => setShowAddModal(true), className: "px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors", children: "+ Add Your First Hero" })] })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: children.map((child) => (_jsx(ChildCard, { child: child, onEdit: handleEdit, onResetPin: handleResetPin, onDelete: handleDelete, onPlay: handlePlay, onViewProgress: (id) => navigate(`/parent/child/${id}`) }, child.id))) }))] }), _jsx(AddChildModal, { open: showAddModal, onClose: () => setShowAddModal(false), onSubmit: handleAddChild, childCount: children.length, maxChildren: MAX_CHILDREN }), editingChild && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setEditingChild(null), children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Edit Hero" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Name" }), _jsx("input", { type: "text", value: editForm.name, onChange: (e) => setEditForm((f) => ({ ...f, name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Hero Name" }), _jsx("input", { type: "text", value: editForm.heroName, onChange: (e) => setEditForm((f) => ({ ...f, heroName: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" })] }), actionError && (_jsx("p", { className: "text-sm text-red-600", children: actionError })), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: submitEdit, className: "px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700", children: "Save" }), _jsx("button", { onClick: () => setEditingChild(null), className: "px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200", children: "Cancel" })] })] })] }) })), resetPinChild && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setResetPinChild(null), children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Reset PIN" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "New PIN (4 digits)" }), _jsx("input", { type: "password", inputMode: "numeric", maxLength: 4, value: newPin, onChange: (e) => setNewPin(e.target.value.replace(/\D/g, '')), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900", placeholder: "\u2022\u2022\u2022\u2022" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm PIN" }), _jsx("input", { type: "password", inputMode: "numeric", maxLength: 4, value: confirmNewPin, onChange: (e) => setConfirmNewPin(e.target.value.replace(/\D/g, '')), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900", placeholder: "\u2022\u2022\u2022\u2022" })] }), actionError && (_jsx("p", { className: "text-sm text-red-600", children: actionError })), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: submitResetPin, className: "px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700", children: "Reset" }), _jsx("button", { onClick: () => setResetPinChild(null), className: "px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200", children: "Cancel" })] })] })] }) })), deleteConfirm && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => setDeleteConfirm(null), children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Delete Hero?" }), _jsx("p", { className: "text-gray-600 text-sm mb-4", children: "This will remove the hero and all their progress. This action cannot be undone." }), actionError && (_jsx("p", { className: "text-sm text-red-600 mb-3", children: actionError })), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: confirmDelete, className: "px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700", children: "Delete" }), _jsx("button", { onClick: () => setDeleteConfirm(null), className: "px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200", children: "Cancel" })] })] }) }))] }));
}
