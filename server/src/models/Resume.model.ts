import mongoose, { Document, Schema, Model } from 'mongoose';

export type ResumeFileType = 'pdf' | 'docx';

export interface IResume extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  fileName: string;          // sanitised display name
  originalName: string;      // raw name from upload
  fileSize: number;          // bytes
  fileType: ResumeFileType;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  cloudinaryDeliveryType: 'upload' | 'authenticated';
  extractedText: string;
  lastVersionNumber: number;
  writeFence: number;
  createdAt: Date;
  updatedAt: Date;
}

interface IResumeModel extends Model<IResume> {}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'fileName is required'],
      trim: true,
      maxlength: [255, 'fileName cannot exceed 255 characters'],
    },
    originalName: {
      type: String,
      required: [true, 'originalName is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'fileSize is required'],
      min: [1, 'fileSize must be positive'],
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: [true, 'fileType is required'],
    },
    cloudinaryPublicId: {
      type: String,
      required: [true, 'cloudinaryPublicId is required'],
    },
    cloudinaryUrl: {
      type: String,
      required: [true, 'cloudinaryUrl is required'],
    },
    // Existing records default to public delivery until explicitly migrated.
    cloudinaryDeliveryType: {
      type: String,
      enum: ['upload', 'authenticated'],
      default: 'upload',
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    // Monotonic draft sequence. Deleted version numbers are never reused.
    lastVersionNumber: { type: Number, default: 0, min: 0 },
    writeFence: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
  }
);

export const Resume = mongoose.model<IResume, IResumeModel>('Resume', resumeSchema);
