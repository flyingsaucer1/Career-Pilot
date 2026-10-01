// ─────────────────────────────────────────────────────────────
// ATS TypeScript types (mirrors ATSResult.model.ts schema)
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

export interface ATSReport {
  _id: string;
  resumeId: string;
  userId: string;
  jobDescription: string;

  // Core scores
  atsScore: number;
  matchPercentage: number;
  keywordMatchPercentage: number;

  // Keywords
  matchingKeywords: string[];
  missingKeywords: string[];

  // Skills
  matchingSkills: string[];
  missingSkills: string[];

  // Requirements
  importantRequirements: ATSRequirement[];

  // Assessment
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: ATSImprovementSuggestion[];
  keywordDensity: ATSKeywordDensity[];
  sectionMatching: ATSSectionMatching;
  aiSummary: string;

  // Explainable hybrid scoring metadata
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

  // Metadata
  provider: string;
  providerVersion: string;
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ATSResponse {
  atsResult: ATSReport | null;
}
