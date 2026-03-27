import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { parentApi } from '../../api/parent';
import { apiClient } from '../../api/client';
import { ChildCard } from '../../components/parent/ChildCard';
import { AddChildModal } from '../../components/parent/AddChildModal';

interface ChildProfile {
  id: string;
  name: string;
  heroName: string;
  avatarConfig: { costume: number; mask: number };
  xp: number;
  rank: string;
  createdAt: string;
  currentStreak?: number;
  lastActiveAt?: string;
}

interface ParentProfile {
  plan?: string;
  subscriptionStatus?: string;
  subscription_plan?: string;
  subscription_status?: string;
}

const MAX_CHILDREN = 4;

export function DashboardPage() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [plan, setPlan] = useState('Free Plan');
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [editForm, setEditForm] = useState({ name: '', heroName: '' });
  const [resetPinChild, setResetPinChild] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const loadChildren = useCallback(async () => {
    try {
      const data = await parentApi.getChildren();
      setChildren(data.children);
    } catch {
      // 401 handled by apiClient
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChildren();
    // Load parent profile for subscription info
    apiClient
      .get<{ parent: ParentProfile }>('/parent/profile')
      .then((resp) => {
        const p = resp.parent;
        if (p?.subscription_plan) setPlan(p.subscription_plan);
        else if (p?.subscription_status) setPlan(p.subscription_status);
      })
      .catch(() => {});
  }, [loadChildren]);

  const handleAddChild = async (data: {
    name: string;
    heroName: string;
    avatarConfig: { costume: 1 | 2 | 3; mask: 1 | 2 };
    pin: string;
  }) => {
    await parentApi.addChild(data);
    await loadChildren();
  };

  const handleEdit = (childId: string) => {
    const child = children.find((c) => c.id === childId);
    if (child) {
      setEditingChild(child);
      setEditForm({ name: child.name, heroName: child.heroName });
      setActionError('');
    }
  };

  const submitEdit = async () => {
    if (!editingChild) return;
    setActionError('');
    try {
      await parentApi.updateChild(editingChild.id, {
        name: editForm.name.trim(),
        heroName: editForm.heroName.trim(),
      });
      setEditingChild(null);
      await loadChildren();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to update');
    }
  };

  const handleResetPin = (childId: string) => {
    setResetPinChild(childId);
    setNewPin('');
    setConfirmNewPin('');
    setActionError('');
  };

  const submitResetPin = async () => {
    if (!resetPinChild) return;
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
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to reset PIN');
    }
  };

  const handleDelete = (childId: string) => {
    setDeleteConfirm(childId);
    setActionError('');
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setActionError('');
    try {
      await parentApi.deleteChild(deleteConfirm);
      setDeleteConfirm(null);
      await loadChildren();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handlePlay = (childId: string) => {
    navigate(`/child/login?childId=${childId}`);
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/parent/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hero Academy</h1>
            <p className="text-sm text-gray-500">Parent Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {plan}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Children section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Heroes</h2>
            <p className="text-sm text-gray-500">
              {children.length} of {MAX_CHILDREN} heroes
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={children.length >= MAX_CHILDREN}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            + Add Child
          </button>
        </div>

        {children.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl mb-4">🦸</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No heroes yet!</h3>
            <p className="text-gray-600 mb-6">
              Add your first child to begin their learning adventure.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Add Your First Hero
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                onEdit={handleEdit}
                onResetPin={handleResetPin}
                onDelete={handleDelete}
                onPlay={handlePlay}
                onViewProgress={(id) => navigate(`/parent/child/${id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Child Modal */}
      <AddChildModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddChild}
        childCount={children.length}
        maxChildren={MAX_CHILDREN}
      />

      {/* Edit Modal */}
      {editingChild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditingChild(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Hero</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hero Name</label>
                <input
                  type="text"
                  value={editForm.heroName}
                  onChange={(e) => setEditForm((f) => ({ ...f, heroName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              {actionError && (
                <p className="text-sm text-red-600">{actionError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={submitEdit}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingChild(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetPinChild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setResetPinChild(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reset PIN</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New PIN (4 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="••••"
                />
              </div>
              {actionError && (
                <p className="text-sm text-red-600">{actionError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={submitResetPin}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Reset
                </button>
                <button
                  onClick={() => setResetPinChild(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete Hero?</h2>
            <p className="text-gray-600 text-sm mb-4">
              This will remove the hero and all their progress. This action cannot be undone.
            </p>
            {actionError && (
              <p className="text-sm text-red-600 mb-3">{actionError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
