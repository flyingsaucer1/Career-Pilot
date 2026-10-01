import mongoose, { Document, Model, Schema } from 'mongoose';
import type { InterviewDifficulty, InterviewQuestionType } from '../providers/ai/ai.interface';

export type InterviewSessionStatus = 'active' | 'completed';

export interface IInterviewFeedback {
  score: number;
  rubric: { relevance: number; specificity: number; structure: number; evidence: number; communication: number };
  strengths: string[];
  improvements: string[];
  exampleAnswer: string;
  followUpQuestion: string;
}

export interface IInterviewQuestion {
  _id: mongoose.Types.ObjectId;
  type: InterviewQuestionType;
  difficulty: InterviewDifficulty;
  question: string;
  intent: string;
  followUpPrompts: string[];
  answerGuidance: string;
  answer: string;
  feedback: IInterviewFeedback | null;
  answeredAt: Date | null;
}

export interface IInterviewSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  jobApplicationId: mongoose.Types.ObjectId | null;
  resumeId: mongoose.Types.ObjectId | null;
  resumeVersionId: mongoose.Types.ObjectId | null;
  resumeVersionNumber: number | null;
  company: string;
  targetRole: string;
  jobDescription: string;
  resumeTextSnapshot: string;
  status: InterviewSessionStatus;
  questions: IInterviewQuestion[];
  providerName: string;
  providerVersion: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IInterviewFeedback>({
  score: { type: Number, required: true, min: 0, max: 100 },
  rubric: {
    relevance: { type: Number, required: true, min: 0, max: 100 },
    specificity: { type: Number, required: true, min: 0, max: 100 },
    structure: { type: Number, required: true, min: 0, max: 100 },
    evidence: { type: Number, required: true, min: 0, max: 100 },
    communication: { type: Number, required: true, min: 0, max: 100 },
  },
  strengths: [{ type: String, maxlength: 500 }],
  improvements: [{ type: String, maxlength: 500 }],
  exampleAnswer: { type: String, required: true, maxlength: 3000 },
  followUpQuestion: { type: String, required: true, maxlength: 500 },
}, { _id: false });

const questionSchema = new Schema<IInterviewQuestion>({
  type: { type: String, enum: ['technical', 'behavioral', 'resume'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  question: { type: String, required: true, maxlength: 500 },
  intent: { type: String, required: true, maxlength: 500 },
  followUpPrompts: [{ type: String, maxlength: 300 }],
  answerGuidance: { type: String, required: true, maxlength: 1000 },
  answer: { type: String, default: '', maxlength: 5000 },
  feedback: { type: feedbackSchema, default: null },
  answeredAt: { type: Date, default: null },
});

const interviewSessionSchema = new Schema<IInterviewSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jobApplicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', default: null },
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', default: null },
  resumeVersionId: { type: Schema.Types.ObjectId, ref: 'ResumeVersion', default: null },
  resumeVersionNumber: { type: Number, min: 1, default: null },
  company: { type: String, required: true, maxlength: 120 },
  targetRole: { type: String, required: true, maxlength: 120 },
  jobDescription: { type: String, required: true, maxlength: 5000 },
  resumeTextSnapshot: { type: String, required: true, maxlength: 20000, select: false },
  status: { type: String, enum: ['active', 'completed'], required: true, default: 'active' },
  questions: { type: [questionSchema], required: true },
  providerName: { type: String, required: true, maxlength: 100 },
  providerVersion: { type: String, required: true, maxlength: 200 },
  completedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform: (_document, returned: Record<string, unknown>) => {
      delete returned.resumeTextSnapshot;
      return returned;
    },
  },
});

interviewSessionSchema.index({ userId: 1, updatedAt: -1 });
interviewSessionSchema.index({ userId: 1, jobApplicationId: 1 });

export const InterviewSession = mongoose.model<IInterviewSession, Model<IInterviewSession>>('InterviewSession', interviewSessionSchema);
