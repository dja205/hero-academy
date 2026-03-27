import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    token: null,
    role: null,
    userId: null,
    parentId: null,
    setAuth: (token, role, userId, parentId) => set({ token, role, userId, parentId: parentId ?? null }),
    clearAuth: () => set({ token: null, role: null, userId: null, parentId: null }),
}));
