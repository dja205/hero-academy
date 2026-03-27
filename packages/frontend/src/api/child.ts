/**
 * ISS-049: API Service for Child Portal
 * Typed methods for child-facing operations.
 */

import { apiClient } from './client';

interface TopicItem {
  id: string;
  name: string;
  districtName: string;
  colour: string;
  order: number;
  subjectId: string;
  subjectName: string;
  zoneName: string;
  unlocked?: boolean;
  progress?: { completed: number; total: number; stars: { one: number; two: number; three: number } };
}

interface AssessmentWithQuestions {
  id: string;
  title: string;
  difficulty: string;
  questions: Array<{ id: string; text: string; options: string[] }>;
}

interface AttemptSubmission {
  assessmentId: string;
  answers: number[];
  durationSeconds: number;
  attemptId?: string;
}

interface AttemptResult {
  attemptId: string;
  score: number;
  maxScore: number;
  stars: 1 | 2 | 3;
  xpEarned: number;
  newTotalXp: number;
  newRank: string | null;
  currentRank: string;
  currentStreak: number;
  bestStreak: number;
  newAchievements: string[];
}

interface ChildStatsResponse {
  totalMissions: number;
  avgScore: number;
  currentStreak: number;
  bestStreak: number;
  daysPlayed: number;
  strongestDistrict: string | null;
  weakestDistrict: string | null;
  totalXp: number;
  rank: string;
}

interface AttemptListItem {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  districtName: string;
  score: number;
  maxScore: number;
  stars: number;
  xpEarned: number;
  durationSeconds: number;
  completedAt: string;
}

interface AttemptDetail extends AttemptListItem {
  topicId: string;
  answers: number[];
}

export const childApi = {
  getTopics(): Promise<{ topics: TopicItem[] }> {
    return apiClient.get('/topics');
  },

  getAssessments(topicId: string): Promise<{ assessments: AssessmentWithQuestions[] }> {
    return apiClient.get(`/assessments?topicId=${encodeURIComponent(topicId)}`);
  },

  submitAttempt(data: AttemptSubmission): Promise<AttemptResult> {
    return apiClient.post('/attempts', data);
  },

  getStats(childId: string): Promise<ChildStatsResponse> {
    return apiClient.get(`/children/${encodeURIComponent(childId)}/stats`);
  },

  getProfile(childId: string): Promise<ChildStatsResponse> {
    return apiClient.get(`/children/${encodeURIComponent(childId)}/stats`);
  },

  getAttemptHistory(
    childId: string,
    page = 1,
    limit = 20,
  ): Promise<{ attempts: AttemptListItem[]; total: number; page: number; limit: number }> {
    return apiClient.get(
      `/children/${encodeURIComponent(childId)}/attempts?page=${page}&limit=${limit}`,
    );
  },

  getAttemptDetail(attemptId: string): Promise<{ attempt: AttemptDetail }> {
    return apiClient.get(`/attempts/${encodeURIComponent(attemptId)}`);
  },
};
