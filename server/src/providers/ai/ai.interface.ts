// ─────────────────────────────────────────────────────────────
// AI Provider Interface
//
// This interface is designed for extensibility across Phase 3+ features.
// Phase 3: analyzeResume() is fully implemented.
// Phase 4+: remaining methods will be implemented as features are built.
// ─────────────────────────────────────────────────────────────

export interface ResumeAnalysisResult {
  score: number;
  grammarScore: number;
  readabilityScore: number;
  formattingScore: number;
  technicalSkills: string[];
  softSkills: string[];
  missingSkills: string[];
  weakBullets: string[];
  strongBullets: string[];
  actionVerbs: string[];
  passiveVoiceInstances: string[];
  repeatedWords: string[];
  sectionCompleteness: {
    summary: boolean;
    education: boolean;
    experience: boolean;
    projects: boolean;
    skills: boolean;
    certifications: boolean;
    achievements: boolean;
  };
  suggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
  }>;
  resumeLength: {
    wordCount: number;
    pageEstimate: number;
    verdict: 'too_short' | 'ideal' | 'too_long';
  };
  grammarIssues: Array<{
    text: string;
    suggestion: string;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Phase 4: ATS Result
// ─────────────────────────────────────────────────────────────
export interface ATSRequirement {
  requirement: string;
  met: boolean;
  notes: string;
}

export interface ATSImprovementSuggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  suggestion: string;
}

export interface ATSKeywordDensity {
  keyword: string;
  count: number;
  recommended: number;
}

export interface ATSSectionMatching {
  summary: boolean;
  skills: boolean;
  experience: boolean;
  education: boolean;
}

export interface ATSResult {
  atsScore: number;
  matchPercentage: number;
  keywordMatchPercentage: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  matchingSkills: string[];
  missingSkills: string[];
  importantRequirements: ATSRequirement[];
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: ATSImprovementSuggestion[];
  keywordDensity: ATSKeywordDensity[];
  sectionMatching: ATSSectionMatching;
  aiSummary: string;
  // Added by the deterministic scoring layer after the provider response.
  scoringMethod?: 'hybrid-v1' | 'hybrid-v2' | 'hybrid-v3';
  scoringBreakdown?: {
    skillCoverage: number;
    keywordCoverage: number;
    requirementCoverage: number;
    sectionCoverage: number;
    weights: {
      skills: number;
      keywords: number;
      requirements: number;
      sections: number;
    };
  };
}

// ─────────────────────────────────────────────────────────────
// Phase 5: Resume Optimization Result Types
// ─────────────────────────────────────────────────────────────
export interface ChangeItem {
  original: string;
  optimized: string;
  reason: string;
}

export interface ResumeOptimizationResult {
  summary: string;
  optimizedSummary: string;
  experienceChanges: ChangeItem[];
  projectChanges: ChangeItem[];
  skillChanges: ChangeItem[];
  bulletPointChanges: ChangeItem[];
  keywordRecommendations: string[];
  overallChanges: string[];
  warnings: string[];
}

export type InterviewQuestionType = 'technical' | 'behavioral' | 'resume';
export type InterviewDifficulty = 'easy' | 'medium' | 'hard';

export interface InterviewQuestion {
  type: InterviewQuestionType;
  difficulty: InterviewDifficulty;
  question: string;
  intent: string;
  followUpPrompts: string[];
  answerGuidance: string;
}

export interface InterviewQuestionsResult {
  questions: InterviewQuestion[];
}

export interface InterviewAnswerFeedbackResult {
  score: number;
  rubric: {
    relevance: number;
    specificity: number;
    structure: number;
    evidence: number;
    communication: number;
  };
  strengths: string[];
  improvements: string[];
  exampleAnswer: string;
  followUpQuestion: string;
}

// Placeholder types for future phases
export type CoverLetterResult = Record<string, unknown>;
export type SkillGapResult = Record<string, unknown>;

export interface IAIProvider {
  readonly providerName: string;
  readonly providerVersion: string;

  // Phase 3
  analyzeResume(text: string): Promise<ResumeAnalysisResult>;

  // Phase 4
  calculateATS(resumeText: string, jobDescription: string): Promise<ATSResult>;

  // Phase 5
  optimizeResume(
    resumeText: string,
    jobDescription: string,
    analysis?: ResumeAnalysisResult,
    atsResult?: ATSResult
  ): Promise<ResumeOptimizationResult>;

  // Future phases
  generateCoverLetter(resumeText: string, jobDescription: string): Promise<CoverLetterResult>;
  generateInterviewQuestions(
    resumeText: string,
    targetRole: string,
    jobDescription: string
  ): Promise<InterviewQuestionsResult>;
  evaluateInterviewAnswer(
    resumeText: string,
    targetRole: string,
    question: InterviewQuestion,
    answer: string
  ): Promise<InterviewAnswerFeedbackResult>;
  skillGapAnalysis(resumeText: string, targetRole: string): Promise<SkillGapResult>;
}

export class NotImplementedError extends Error {
  constructor(method: string, phase?: string) {
    super(
      phase
        ? `${method}() is not yet implemented. It will be available in ${phase}.`
        : `${method}() is not yet implemented.`
    );
    this.name = 'NotImplementedError';
  }
}
