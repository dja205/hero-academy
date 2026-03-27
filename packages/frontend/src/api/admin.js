/**
 * ISS-051: API Service for Admin Portal
 * CRUD wrappers for questions, assessments, users with pagination.
 */
import { apiClient } from './client';
function qs(params) {
    const entries = Object.entries(params).filter((entry) => entry[1] !== undefined);
    if (!entries.length)
        return '';
    return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}
export const adminApi = {
    // ── Questions ────────────────────────────────────────────────────
    getQuestions(params) {
        return apiClient.get(`/admin/questions${qs({
            page: params?.page,
            limit: params?.limit,
            topicId: params?.topicId,
            difficulty: params?.difficulty,
        })}`);
    },
    createQuestion(data) {
        return apiClient.post('/admin/questions', data);
    },
    updateQuestion(id, data) {
        return apiClient.put(`/admin/questions/${encodeURIComponent(id)}`, data);
    },
    deleteQuestion(id) {
        return apiClient.delete(`/admin/questions/${encodeURIComponent(id)}`);
    },
    // ── Assessments ──────────────────────────────────────────────────
    getAssessments(params) {
        return apiClient.get(`/admin/assessments${qs({
            page: params?.page,
            limit: params?.limit,
            topicId: params?.topicId,
        })}`);
    },
    createAssessment(data) {
        return apiClient.post('/admin/assessments', data);
    },
    updateAssessment(id, data) {
        return apiClient.put(`/admin/assessments/${encodeURIComponent(id)}`, data);
    },
    deleteAssessment(id) {
        return apiClient.delete(`/admin/assessments/${encodeURIComponent(id)}`);
    },
    // ── Users ────────────────────────────────────────────────────────
    getUsers(params) {
        return apiClient.get(`/admin/users${qs({ page: params?.page, limit: params?.limit })}`);
    },
};
