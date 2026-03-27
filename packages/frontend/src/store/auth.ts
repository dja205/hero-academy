import { create } from 'zustand';

type Role = 'parent' | 'child' | 'admin';

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: string | null;
  parentId: string | null;
  setAuth: (token: string, role: Role, userId: string, parentId?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  userId: null,
  parentId: null,
  setAuth: (token, role, userId, parentId = null) =>
    set({ token, role, userId, parentId }),
  clearAuth: () => set({ token: null, role: null, userId: null, parentId: null }),
}));
