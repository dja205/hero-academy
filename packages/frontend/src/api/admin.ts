/**
 * ISS-051: API Service for Admin Portal
 * CRUD wrappers for questions, assessments, users with pagination.
 */

import { apiClient } from './client';

interface PaginatedParams {
  page?: number;
  limit?: number;
}

interface QuestionItem {
  id: string;
  topicId: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: string;
  active: boolean;
}

interface AssessmentItem {
  id: string;
  topicId: string;
  title: string;
  difficulty: string;
  questionIds: string[];
  order: number;
  active: boolean;
}

interface CreateQuestionData {
  topicId: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CreateAssessmentData {
  topicId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionIds: string[];
}

interface UserListItem {
  id: string;
  email?: string;
  name: string;
  role: string;
  createdAt: string;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] !== undefined,
  );
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const adminApi = {
  // ── Questions ────────────────────────────────────────────────────
  getQuestions(
    params?: PaginatedParams & { topicId?: string; difficulty?: string },
  ): Promise<{ questions: QuestionItem[]; total: number; page: number; limit: number }> {
    return apiClient.get(
      `/admin/questions${qs({
        page: params?.page,
        limit: params?.limit,
        topicId: params?.topicId,
        difficulty: params?.difficulty,
      })}`,
    );
  },

  createQuestion(data: CreateQuestionData): Promise<{ question: QuestionItem }> {
    return apiClient.post('/admin/questions', data);
  },

  updateQuestion(
    id: string,
    data: Partial<CreateQuestionData>,
  ): Promise<{ question: QuestionItem }> {
    return apiClient.put(`/admin/questions/${encodeURIComponent(id)}`, data);
  },

  deleteQuestion(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/admin/questions/${encodeURIComponent(id)}`);
  },

  // ── Assessments ──────────────────────────────────────────────────
  getAssessments(
    params?: PaginatedParams & { topicId?: string },
  ): Promise<{ assessments: AssessmentItem[]; total: number; page: number; limit: number }> {
    return apiClient.get(
      `/admin/assessments${qs({
        page: params?.page,
        limit: params?.limit,
        topicId: params?.topicId,
      })}`,
    );
  },

  createAssessment(data: CreateAssessmentData): Promise<{ assessment: AssessmentItem }> {
    return apiClient.post('/admin/assessments', data);
  },

  updateAssessment(
    id: string,
    data: Partial<CreateAssessmentData & { order: number }>,
  ): Promise<{ assessment: AssessmentItem }> {
    return apiClient.put(`/admin/assessments/${encodeURIComponent(id)}`, data);
  },

  deleteAssessment(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/admin/assessments/${encodeURIComponent(id)}`);
  },

  // ── Users ────────────────────────────────────────────────────────
  getUsers(
    params?: PaginatedParams,
  ): Promise<{ users: UserListItem[]; total: number; page: number; limit: number }> {
    return apiClient.get(
      `/admin/users${qs({ page: params?.page, limit: params?.limit })}`,
    );
  },
};
