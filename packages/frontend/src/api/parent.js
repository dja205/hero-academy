/**
 * ISS-050: API Service for Parent Portal
 * Typed methods for parent child-management operations.
 */
import { apiClient } from './client';
export const parentApi = {
    getChildren() {
        return apiClient.get('/children');
    },
    getChildDetail(childId) {
        return apiClient.get(`/children/${encodeURIComponent(childId)}`);
    },
    addChild(data) {
        return apiClient.post('/children', data);
    },
    updateChild(id, data) {
        return apiClient.put(`/children/${encodeURIComponent(id)}`, data);
    },
    resetPin(childId, newPin) {
        return apiClient.put(`/children/${encodeURIComponent(childId)}/pin`, { pin: newPin });
    },
    deleteChild(childId) {
        return apiClient.delete(`/children/${encodeURIComponent(childId)}`);
    },
};
