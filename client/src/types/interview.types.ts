export type InterviewQuestionType = 'technical' | 'behavioral' | 'resume';
export type InterviewDifficulty = 'easy' | 'medium' | 'hard';

export interface InterviewFeedback {
  score: number;
  rubric: { relevance: number; specificity: number; structure: number; evidence: number; communication: number };
  strengths: string[];
  improvements: string[];
  exampleAnswer: string;
  followUpQuestion: string;
}

export interface InterviewQuestion {
  _id: string;
  type: InterviewQuestionType;
  difficulty: InterviewDifficulty;
  question: string;
  intent: string;
  followUpPrompts: string[];
  answerGuidance: string;
  answer: string;
  feedback: InterviewFeedback | null;
  answeredAt: string | null;
}

export interface InterviewSession {
  _id: string;
  jobApplicationId: string | null;
  resumeId: string | null;
  resumeVersionId: string | null;
  resumeVersionNumber: number | null;
  company: string;
  targetRole: string;
  jobDescription: string;
  status: 'active' | 'completed';
  questions: InterviewQuestion[];
  providerName: string;
  providerVersion: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
