/**
 * ISS-049: API Service for Child Portal
 * Typed methods for child-facing operations.
 */
import { apiClient } from './client';
export const childApi = {
    getTopics() {
        return apiClient.get('/topics');
    },
    getAssessments(topicId) {
        return apiClient.get(`/assessments?topicId=${encodeURIComponent(topicId)}`);
    },
    submitAttempt(data) {
        return apiClient.post('/attempts', data);
    },
    getStats(childId) {
        return apiClient.get(`/children/${encodeURIComponent(childId)}/stats`);
    },
    getProfile(childId) {
        return apiClient.get(`/children/${encodeURIComponent(childId)}/stats`);
    },
    getAttemptHistory(childId, page = 1, limit = 20) {
        return apiClient.get(`/children/${encodeURIComponent(childId)}/attempts?page=${page}&limit=${limit}`);
    },
    getAttemptDetail(attemptId) {
        return apiClient.get(`/attempts/${encodeURIComponent(attemptId)}`);
    },
};
