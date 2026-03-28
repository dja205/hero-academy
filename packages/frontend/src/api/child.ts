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

interface BossStatusResponse {
  boss: {
    id: string;
    name: string;
    emoji: string;
    hp: number;
    description: string;
    questionCount: number;
  };
  unlocked: boolean;
  lastAttempt: { outcome: string; completedAt: string } | null;
  alreadyConquered: boolean;
}

interface BossQuestion {
  id: string;
  text: string;
  options: string[];
  difficulty: string;
  correct_index: number;
}

interface BossQuestionsResponse {
  attemptToken: string;
  bossId: string;
  questions: BossQuestion[];
}

interface BossAttemptSubmission {
  attemptToken: string;
  bossId: string;
  answers: number[];
  outcome: string;
  livesRemaining: number;
  bossHpFinal: number;
  durationSeconds: number;
}

interface BossAttemptResult {
  outcome: string;
  score: number;
  maxScore: number;
  bossHpFinal: number;
  livesRemaining: number;
  xpEarned: number;
  newTotalXp: number;
  currentRank: string;
  newRank: string | null;
  currentStreak: number;
  bestStreak: number;
  newAchievements: string[];
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

  // Boss Battle API
  getBossStatus(subjectId: string): Promise<BossStatusResponse> {
    return apiClient.get(`/boss/${encodeURIComponent(subjectId)}/status`);
  },

  getBossQuestions(subjectId: string): Promise<BossQuestionsResponse> {
    return apiClient.get(`/boss/${encodeURIComponent(subjectId)}/questions`);
  },

  submitBossAttempt(subjectId: string, data: BossAttemptSubmission): Promise<BossAttemptResult> {
    return apiClient.post(`/boss/${encodeURIComponent(subjectId)}/attempt`, data);
  },
};
