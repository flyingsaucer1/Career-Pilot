import mongoose, { Document, Schema, Model } from 'mongoose';

// ─────────────────────────────────────────────────────────────
// Sub-document schemas
// ─────────────────────────────────────────────────────────────

const ATSRequirementSchema = new Schema(
  {
    requirement: { type: String, required: true },
    met: { type: Boolean, required: true },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const ATSImprovementSuggestionSchema = new Schema(
  {
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    category: { type: String, required: true },
    suggestion: { type: String, required: true },
  },
  { _id: false }
);

const ATSKeywordDensitySchema = new Schema(
  {
    keyword: { type: String, required: true },
    count: { type: Number, required: true, min: 0 },
    recommended: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ATSSectionMatchingSchema = new Schema(
  {
    summary: { type: Boolean, default: false },
    skills: { type: Boolean, default: false },
    experience: { type: Boolean, default: false },
    education: { type: Boolean, default: false },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main interface
// ─────────────────────────────────────────────────────────────

export interface IATSResult extends Document {
  _id: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // The job description used for this ATS check
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

  // Job requirements analysis
  importantRequirements: Array<{
    requirement: string;
    met: boolean;
    notes: string;
  }>;

  // Resume assessment
  strengths: string[];
  weaknesses: string[];

  // Suggestions
  improvementSuggestions: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    suggestion: string;
  }>;

  // Keyword density
  keywordDensity: Array<{
    keyword: string;
    count: number;
    recommended: number;
  }>;

  // Section alignment
  sectionMatching: {
    summary: boolean;
    skills: boolean;
    experience: boolean;
    education: boolean;
  };

  // AI narrative summary
  aiSummary: string;

  // Explainable hybrid score metadata
  scoringMethod: 'hybrid-v1' | 'hybrid-v2' | 'hybrid-v3';
  scoringBreakdown: {
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

  // Provider metadata
  provider: string;
  providerVersion: string;
  analyzedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface IATSResultModel extends Model<IATSResult> {}

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const atsResultSchema = new Schema<IATSResult>(
  {
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'resumeId is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    jobDescription: {
      type: String,
      required: [true, 'jobDescription is required'],
      maxlength: [10000, 'Job description too long'],
    },
    atsScore: { type: Number, required: true, min: 0, max: 100 },
    matchPercentage: { type: Number, required: true, min: 0, max: 100 },
    keywordMatchPercentage: { type: Number, required: true, min: 0, max: 100 },
    matchingKeywords: [{ type: String }],
    missingKeywords: [{ type: String }],
    matchingSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    importantRequirements: [ATSRequirementSchema],
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    improvementSuggestions: [ATSImprovementSuggestionSchema],
    keywordDensity: [ATSKeywordDensitySchema],
    sectionMatching: { type: ATSSectionMatchingSchema, required: true },
    aiSummary: { type: String, required: true },
    scoringMethod: { type: String, enum: ['hybrid-v1', 'hybrid-v2', 'hybrid-v3'], required: true },
    scoringBreakdown: {
      skillCoverage: { type: Number, required: true, min: 0, max: 100 },
      keywordCoverage: { type: Number, required: true, min: 0, max: 100 },
      requirementCoverage: { type: Number, required: true, min: 0, max: 100 },
      sectionCoverage: { type: Number, required: true, min: 0, max: 100 },
      weights: {
        skills: { type: Number, required: true, min: 0, max: 1 },
        keywords: { type: Number, required: true, min: 0, max: 1 },
        requirements: { type: Number, required: true, min: 0, max: 1 },
        sections: { type: Number, required: true, min: 0, max: 1 },
      },
    },
    provider: { type: String, required: true, default: 'Google Gemini' },
    providerVersion: { type: String, required: true },
    analyzedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────
atsResultSchema.index({ resumeId: 1, userId: 1 });
atsResultSchema.index({ createdAt: -1 });

export const ATSResult = mongoose.model<IATSResult, IATSResultModel>('ATSResult', atsResultSchema);
