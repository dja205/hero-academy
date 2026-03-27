export type Difficulty = 'easy' | 'medium' | 'hard';
export interface Question {
    id: string;
    topicId: string;
    text: string;
    options: [string, string, string, string];
    correctIndex: 0 | 1 | 2 | 3;
    explanation: string;
    difficulty: Difficulty;
    active: boolean;
}
export interface Assessment {
    id: string;
    topicId: string;
    title: string;
    difficulty: Difficulty;
    questionIds: string[];
    order: number;
    active: boolean;
}
export interface Attempt {
    id: string;
    childId: string;
    assessmentId: string;
    answers: number[];
    score: number;
    maxScore: number;
    stars: 1 | 2 | 3;
    xpEarned: number;
    durationSeconds: number;
    completedAt: string;
}
