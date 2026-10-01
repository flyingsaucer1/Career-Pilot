import mongoose, { Document, Schema, Model } from 'mongoose';

// ─────────────────────────────────────────────────────────────
// Sub-document schemas
// ─────────────────────────────────────────────────────────────

const ChangeItemSchema = new Schema(
  {
    original: { type: String, required: true },
    optimized: { type: String, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const OptimizationChangesSchema = new Schema(
  {
    summary: { type: String },
    optimizedSummary: { type: String },
    experienceChanges: [ChangeItemSchema],
    projectChanges: [ChangeItemSchema],
    skillChanges: [ChangeItemSchema],
    bulletPointChanges: [ChangeItemSchema],
    keywordRecommendations: [{ type: String }],
    overallChanges: [{ type: String }],
    warnings: [{ type: String }],
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────
// Main interface
// ─────────────────────────────────────────────────────────────

export type ResumeVersionSource = 'original' | 'optimized' | 'manual';

export interface IResumeVersion extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  versionNumber: number;
  versionName: string;
  jobDescriptionId: mongoose.Types.ObjectId | null;
  targetJobDescription?: string;
  source: ResumeVersionSource;
  optimizedContent: string;
  contentFormat?: 'resume';
  changes: {
    summary: string;
    optimizedSummary: string;
    experienceChanges: Array<{ original: string; optimized: string; reason: string }>;
    projectChanges: Array<{ original: string; optimized: string; reason: string }>;
    skillChanges: Array<{ original: string; optimized: string; reason: string }>;
    bulletPointChanges: Array<{ original: string; optimized: string; reason: string }>;
    keywordRecommendations: string[];
    overallChanges: string[];
    warnings: string[];
  };
  atsScoreBefore: number | null;
  atsScoreAfter: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface IResumeVersionModel extends Model<IResumeVersion> {}

// ─────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────

const resumeVersionSchema = new Schema<IResumeVersion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: [true, 'resumeId is required'],
      index: true,
    },
    versionNumber: {
      type: Number,
      required: [true, 'versionNumber is required'],
      min: [1, 'versionNumber must be at least 1'],
    },
    versionName: {
      type: String,
      required: [true, 'versionName is required'],
      trim: true,
      maxlength: [100, 'versionName cannot exceed 100 characters'],
    },
    jobDescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'ATSResult',
      default: null,
      index: true,
    },
    // Preserve the exact target used for this version. ATSResult is upserted per
    // resume, so its job description can change after a later ATS analysis.
    targetJobDescription: { type: String, maxlength: 10000 },
    source: {
      type: String,
      enum: ['original', 'optimized', 'manual'],
      required: [true, 'source is required'],
      default: 'original',
    },
    optimizedContent: {
      type: String,
      required: [true, 'optimizedContent is required'],
    },
    contentFormat: { type: String, enum: ['resume'] },
    changes: { type: OptimizationChangesSchema, required: true },
    atsScoreBefore: {
      type: Number,
      default: null,
      min: [0, 'atsScoreBefore cannot be negative'],
      max: [100, 'atsScoreBefore cannot exceed 100'],
    },
    atsScoreAfter: {
      type: Number,
      default: null,
      min: [0, 'atsScoreAfter cannot be negative'],
      max: [100, 'atsScoreAfter cannot exceed 100'],
    },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────

// Compound index for version history per resume
resumeVersionSchema.index({ resumeId: 1, versionNumber: 1 }, { unique: true });

// Query by user and resume
resumeVersionSchema.index({ userId: 1, resumeId: 1, createdAt: -1 });

export const ResumeVersion = mongoose.model<IResumeVersion, IResumeVersionModel>('ResumeVersion', resumeVersionSchema);
