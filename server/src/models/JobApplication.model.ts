import mongoose, { Document, Model, Schema } from 'mongoose';

export const APPLICATION_STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
export type ApplicationEventKind = 'created' | 'status_changed' | 'archived' | 'restored';

export interface IApplicationEvent {
  kind: ApplicationEventKind;
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  occurredAt: Date;
}

export interface IJobApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  company: string;
  role: string;
  url: string;
  description: string;
  status: ApplicationStatus;
  applicationDate: Date | null;
  followUpDate: Date | null;
  notes: string;
  resumeId: mongoose.Types.ObjectId | null;
  resumeVersionId: mongoose.Types.ObjectId | null;
  resumeVersionNumber: number | null;
  archivedAt: Date | null;
  events: IApplicationEvent[];
  createdAt: Date;
  updatedAt: Date;
}

interface IJobApplicationModel extends Model<IJobApplication> {}

const applicationEventSchema = new Schema<IApplicationEvent>({
  kind: { type: String, enum: ['created', 'status_changed', 'archived', 'restored'], required: true },
  fromStatus: { type: String, enum: APPLICATION_STATUSES },
  toStatus: { type: String, enum: APPLICATION_STATUSES },
  occurredAt: { type: Date, required: true, default: () => new Date() },
}, { _id: false });

const jobApplicationSchema = new Schema<IJobApplication>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, required: true, trim: true, maxlength: 120 },
  url: { type: String, trim: true, default: '', maxlength: 2048 },
  description: { type: String, required: true, minlength: 50, maxlength: 5000 },
  status: { type: String, enum: APPLICATION_STATUSES, required: true, default: 'saved' },
  applicationDate: { type: Date, default: null },
  followUpDate: { type: Date, default: null },
  notes: { type: String, trim: true, default: '', maxlength: 5000 },
  resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', default: null },
  resumeVersionId: { type: Schema.Types.ObjectId, ref: 'ResumeVersion', default: null },
  resumeVersionNumber: { type: Number, min: 1, default: null },
  archivedAt: { type: Date, default: null },
  events: { type: [applicationEventSchema], default: [] },
}, { timestamps: true });

jobApplicationSchema.index({ userId: 1, archivedAt: 1, status: 1, updatedAt: -1 });
jobApplicationSchema.index({ userId: 1, company: 1, role: 1 });

export const JobApplication = mongoose.model<IJobApplication, IJobApplicationModel>(
  'JobApplication',
  jobApplicationSchema
);
