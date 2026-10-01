import mongoose, { Types } from 'mongoose';
import { Resume, IResume } from '../models/Resume.model';
import { Analysis } from '../models/Analysis.model';
import { ATSResult } from '../models/ATSResult.model';
import { ResumeVersion } from '../models/ResumeVersion.model';
import { PendingFileDeletion, IPendingFileDeletion } from '../models/PendingFileDeletion.model';
import { JobApplication } from '../models/JobApplication.model';
import { InterviewSession } from '../models/InterviewSession.model';
import { uploadBuffer, deleteFile, downloadFile } from './cloudinary.service';
import { readResumeFile } from './resumeFile.service';
import { randomUUID } from 'node:crypto';
import { withOwnedWrite } from './ownedWrite.service';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const makeOperationalError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode: number; isOperational: boolean };
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export class ResumeService {
  /**
   * Upload a resume file: validate → extract text → push to Cloudinary → save to DB.
   */
  async uploadResume(
    userId: string,
    file: Express.Multer.File
  ): Promise<IResume> {
    const { fileType, extractedText } = await readResumeFile(file.buffer, file.mimetype);
    const fileName = file.originalname.replace(/[^a-zA-Z0-9.\-_ ]/g, '_').trim();
    if (!fileName || fileName.length > 255) {
      throw makeOperationalError('Choose a file name between 1 and 255 characters.', 400);
    }

    // Upload to Cloudinary
    const folderPath = `careerpilot/resumes/${userId}`;
    const resumeId = new Types.ObjectId();
    const storageName = `resume-${randomUUID()}.${fileType}`;
    // Record compensation BEFORE creating an external asset. If the process
    // dies or MongoDB fails after upload, scheduled cleanup still knows it.
    const pending = await withOwnedWrite(userId, null, async (session) => {
      if (await Resume.countDocuments({ userId }).session(session) >= env.MAX_RESUMES_PER_USER) {
        throw makeOperationalError(`Your workspace supports up to ${env.MAX_RESUMES_PER_USER} resumes. Delete an unused resume first.`, 429);
      }
      const [task] = await PendingFileDeletion.create([{
        userId, resumeId, publicId: `${folderPath}/${storageName}`, deliveryType: 'authenticated',
        notBefore: new Date(Date.now() + 15 * 60 * 1000),
      }], { session });
      return task;
    });
    let uploadResult;
    try { uploadResult = await uploadBuffer(file.buffer, folderPath, storageName, file.mimetype); }
    catch {
      // The provider may still finish an ambiguous upload; keep the delayed task.
      throw makeOperationalError('File storage is temporarily unavailable. Please try uploading again.', 503);
    }
    pending.publicId = uploadResult.public_id;

    // Persist metadata
    try {
      return await withOwnedWrite(userId, null, async (session) => {
      if (await Resume.countDocuments({ userId }).session(session) >= env.MAX_RESUMES_PER_USER) {
        throw makeOperationalError('Your resume library is full. Delete an unused resume first.', 429);
      }
      const [created] = await Resume.create([{
        _id: resumeId,
        userId: new Types.ObjectId(userId),
        fileName,
        originalName: file.originalname,
        fileSize: file.buffer.length,
        fileType,
        cloudinaryPublicId: uploadResult.public_id,
        cloudinaryUrl: uploadResult.secure_url,
        cloudinaryDeliveryType: 'authenticated',
        extractedText,
      }], { session });
      await PendingFileDeletion.deleteOne({ _id: pending._id }, { session });
      return created;
      });
    } catch (error) {
      // Compensate only for the asset just created by this request.
      await attemptPendingFileDeletion(pending);
      throw error;
    }
  }

  /**
   * List all resumes for a user, sorted newest first.
   */
  async getResumes(userId: string): Promise<IResume[]> {
    return Resume.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  /**
   * Get a single resume by ID (must belong to the requesting user).
   */
  async getResumeById(userId: string, resumeId: string): Promise<IResume> {
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found.', 404);
    }
    return resume;
  }

  async downloadOriginal(userId: string, resumeId: string): Promise<{ fileName: string; fileType: IResume['fileType']; bytes: Buffer }> {
    const resume = await this.getResumeById(userId, resumeId);
    const bytes = await downloadFile(resume.cloudinaryPublicId, resume.fileType, resume.cloudinaryDeliveryType);
    return { fileName: resume.fileName, fileType: resume.fileType, bytes };
  }

  /**
   * Delete the resume and dependent records atomically, keeping a durable
   * cleanup task until its Cloudinary asset is confirmed deleted.
   */
  async deleteResume(userId: string, resumeId: string): Promise<{ storageCleanupPending: boolean }> {
    const resume = await this.getResumeById(userId, resumeId);
    const session = await mongoose.startSession();
    let pending: IPendingFileDeletion | null = null;
    try {
      await session.withTransaction(async () => {
        pending = await new PendingFileDeletion({
          userId: resume.userId,
          resumeId: resume._id,
          publicId: resume.cloudinaryPublicId,
          deliveryType: resume.cloudinaryDeliveryType,
        }).save({ session });
        const owner = { resumeId: resume._id, userId: resume.userId };
        await Analysis.deleteMany(owner, { session });
        await ATSResult.deleteMany(owner, { session });
        await ResumeVersion.deleteMany(owner, { session });
        await JobApplication.updateMany(
          { userId: resume.userId, resumeId: resume._id },
          { $set: { resumeId: null, resumeVersionId: null, resumeVersionNumber: null } },
          { session }
        );
        await InterviewSession.updateMany(
          { userId: resume.userId, resumeId: resume._id },
          { $set: { resumeId: null, resumeVersionId: null, resumeVersionNumber: null } },
          { session }
        );
        const result = await Resume.deleteOne({ _id: resume._id, userId: resume.userId }, { session });
        if (result.deletedCount !== 1) throw makeOperationalError('Resume changed during deletion. Please retry.', 409);
      });
    } catch {
      throw makeOperationalError('Could not safely delete this resume. Please try again.', 503);
    } finally {
      await session.endSession();
    }

    // Cloudinary cannot join a MongoDB transaction. A failed request leaves
    // only this durable cleanup task, not orphaned user-visible resume data.
    const cleanupSucceeded = await attemptPendingFileDeletion(pending!);
    return { storageCleanupPending: !cleanupSucceeded };
  }
}

export const resumeService = new ResumeService();

const attemptPendingFileDeletion = async (pending: IPendingFileDeletion): Promise<boolean> => {
  try {
    await deleteFile(pending.publicId, pending.deliveryType);
    await PendingFileDeletion.deleteOne({ _id: pending._id });
    return true;
  } catch {
    await PendingFileDeletion.updateOne(
      { _id: pending._id },
      { $inc: { attempts: 1 }, $set: { publicId: pending.publicId, lastAttemptAt: new Date(), notBefore: new Date() } }
    ).catch(() => undefined);
    return false;
  }
};

let cleanupRunning = false;
export const retryPendingFileDeletions = async (): Promise<void> => {
  if (cleanupRunning) return;
  cleanupRunning = true;
  try {
    const pending = await PendingFileDeletion.find({ $or: [{ notBefore: { $lte: new Date() } }, { notBefore: { $exists: false } }] }).sort({ createdAt: 1 }).limit(25);
    for (const item of pending) await attemptPendingFileDeletion(item);
  } finally {
    cleanupRunning = false;
  }
};
