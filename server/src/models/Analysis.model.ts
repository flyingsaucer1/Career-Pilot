import mongoose, { Document, Schema, Model } from 'mongoose';

// ─────────────────────────────────────────────────────────────
// Sub-document schemas
// ─────────────────────────────────────────────────────────────

const SuggestionSchema = new Schema(
  {
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const GrammarIssueSchema = new Schema(
  {
    text: { type: String, required: true },
    suggestion: { type: String, required: true },
  },
  { _id: false }
);

const SectionCompletenessSchema = new Schema(
  {
    summary: { type: Boolean, default: false },
    education: { type: Boolean, default: false },
    experience: { type: Boolean, default: false },
    projects: { type: Boolean, default: false },
    skills: { type: Boolean, default: false },
    certifications: { type: Boolean, default: false },
    achievements: { type: Boolean, default: false },
  },
  { _id: false }
);

const ResumeLengthSchema = new Schema(
  {
    wordCount: { type: Number, required: true },
    pageEstimate: { type: Number, required: true },
    verdict: { type: String, enum: ['too_short', 'ideal', 'too_long'], required: true },
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main interface
// ─────────────────────────────────────────────────────────────

export interface IAnalysis extends Document {
  _id: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Scores
  score: number;
  grammarScore: number;
  readabilityScore: number;
  formattingScore: number;

  // Skills
  technicalSkills: string[];
  softSkills: string[];
  missingSkills: string[];

  // Bullets & writing
  weakBullets: string[];
  strongBullets: string[];
  actionVerbs: string[];
  passiveVoiceInstances: string[];
  repeatedWords: string[];

  // Structure
  sectionCompleteness: {
    summary: boolean;
    education: boolean;
    experience: boolean;
    projects: boolean;
    skills: boolean;
    certifications: boolean;
    achievements: boolean;
  };
  resumeLength: {
    wordCount: number;
    pageEstimate: number;
    verdict: 'too_short' | 'ideal' | 'too_long';
  };

  // Grammar
  grammarIssues: Array<{ text: string; suggestion: string }>;

  // Suggestions
  suggestions: Array<{ priority: 'high' | 'medium' | 'low'; category: string; description: string }>;

  // Provider metadata (supports future provider switching)
  provider: string;
  providerVersion: string;
  analyzedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface IAnalysisModel extends Model<IAnalysis> {}

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const analysisSchema = new Schema<IAnalysis>(
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
    score: { type: Number, required: true, min: 0, max: 100 },
    grammarScore: { type: Number, required: true, min: 0, max: 100 },
    readabilityScore: { type: Number, required: true, min: 0, max: 100 },
    formattingScore: { type: Number, required: true, min: 0, max: 100 },
    technicalSkills: [{ type: String }],
    softSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    weakBullets: [{ type: String }],
    strongBullets: [{ type: String }],
    actionVerbs: [{ type: String }],
    passiveVoiceInstances: [{ type: String }],
    repeatedWords: [{ type: String }],
    sectionCompleteness: { type: SectionCompletenessSchema, required: true },
    resumeLength: { type: ResumeLengthSchema, required: true },
    grammarIssues: [GrammarIssueSchema],
    suggestions: [SuggestionSchema],
    // AI provider metadata
    provider: { type: String, required: true, default: 'Google Gemini' },
    providerVersion: { type: String, required: true, default: 'gemini-2.0-flash' },
    analyzedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

// Compound index: one analysis per resume (latest)
analysisSchema.index({ resumeId: 1, userId: 1 });

export const Analysis = mongoose.model<IAnalysis, IAnalysisModel>('Analysis', analysisSchema);
