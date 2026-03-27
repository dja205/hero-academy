/**
 * ISS-050: API Service for Parent Portal
 * Typed methods for parent child-management operations.
 */

import { apiClient } from './client';

interface ChildProfile {
  id: string;
  name: string;
  heroName: string;
  avatarConfig: { costume: number; mask: number };
  xp: number;
  rank: string;
  createdAt: string;
}

interface CreateChildData {
  name: string;
  heroName: string;
  avatarConfig: { costume: 1 | 2 | 3; mask: 1 | 2 };
  pin: string;
}

interface UpdateChildData {
  name?: string;
  heroName?: string;
  avatarConfig?: { costume: 1 | 2 | 3; mask: 1 | 2 };
}

export const parentApi = {
  getChildren(): Promise<{ children: ChildProfile[] }> {
    return apiClient.get('/children');
  },

  getChildDetail(childId: string): Promise<{ child: ChildProfile }> {
    return apiClient.get(`/children/${encodeURIComponent(childId)}`);
  },

  addChild(data: CreateChildData): Promise<{ child: ChildProfile }> {
    return apiClient.post('/children', data);
  },

  updateChild(id: string, data: UpdateChildData): Promise<{ child: ChildProfile }> {
    return apiClient.put(`/children/${encodeURIComponent(id)}`, data);
  },

  resetPin(childId: string, newPin: string): Promise<{ message: string }> {
    return apiClient.put(`/children/${encodeURIComponent(childId)}/pin`, { pin: newPin });
  },

  deleteChild(childId: string): Promise<{ message: string }> {
    return apiClient.delete(`/children/${encodeURIComponent(childId)}`);
  },
};
