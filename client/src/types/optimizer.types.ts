// ─────────────────────────────────────────────────────────────
// Optimizer TypeScript types (mirrors backend schema)
// ─────────────────────────────────────────────────────────────

export interface ChangeItem {
  original: string;
  optimized: string;
  reason: string;
}

export interface ResumeOptimization {
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

export interface ResumeVersion {
  _id: string;
  userId: string;
  resumeId: string;
  versionNumber: number;
  versionName: string;
  jobDescriptionId: string | null;
  targetJobDescription?: string;
  source: 'original' | 'optimized' | 'manual';
  optimizedContent: string;
  contentFormat?: 'resume';
  changes: ResumeOptimization;
  atsScoreBefore: number | null;
  atsScoreAfter: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OptimizeResumeRequest {
  jobDescription: string;
  atsResultId?: string;
  analysisId?: string;
}

export interface OptimizeResumeResponse {
  optimization: ResumeOptimization;
  version: ResumeVersion;
}

export interface VersionsResponse {
  versions: ResumeVersion[];
}

export interface VersionResponse {
  version: ResumeVersion;
}

export interface CompareATSRequest {
  jobDescription?: string;
}

export interface SaveResumeDraftRequest {
  content: string;
  expectedUpdatedAt: string;
}
