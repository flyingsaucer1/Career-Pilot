import mongoose, { Schema } from 'mongoose';

export interface IPendingFileDeletion extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  resumeId: mongoose.Types.ObjectId;
  publicId: string;
  deliveryType: 'upload' | 'authenticated';
  attempts: number;
  lastAttemptAt?: Date;
  notBefore: Date;
}

const pendingFileDeletionSchema = new Schema<IPendingFileDeletion>({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  resumeId: { type: Schema.Types.ObjectId, required: true, unique: true },
  publicId: { type: String, required: true },
  deliveryType: { type: String, enum: ['upload', 'authenticated'], default: 'upload', required: true },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
  notBefore: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

export const PendingFileDeletion = mongoose.model<IPendingFileDeletion>('PendingFileDeletion', pendingFileDeletionSchema);
