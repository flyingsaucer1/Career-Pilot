// ─────────────────────────────────────────────────────────────
// Analysis TypeScript types (mirrors backend schema)
// ─────────────────────────────────────────────────────────────

export interface SectionCompleteness {
  summary: boolean;
  education: boolean;
  experience: boolean;
  projects: boolean;
  skills: boolean;
  certifications: boolean;
  achievements: boolean;
}

export interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  description: string;
}

export interface GrammarIssue {
  text: string;
  suggestion: string;
}

export interface ResumeLength {
  wordCount: number;
  pageEstimate: number;
  verdict: 'too_short' | 'ideal' | 'too_long';
}

export interface Analysis {
  _id: string;
  resumeId: string;
  userId: string;
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
  sectionCompleteness: SectionCompleteness;
  resumeLength: ResumeLength;
  grammarIssues: GrammarIssue[];
  suggestions: Suggestion[];
  provider: string;
  providerVersion: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisResponse {
  analysis: Analysis | null;
}
