import { Request, Response, NextFunction } from 'express';
import { resumeService } from '../services/resume.service';
import { sendSuccess, sendError } from '../utils/response.utils';
import type { IResume } from '../models/Resume.model';

const publicResume = (resume: IResume) => {
  const { cloudinaryPublicId: _publicId, cloudinaryUrl: _url, cloudinaryDeliveryType: _deliveryType, ...safe } = resume.toObject();
  return safe;
};

// ─────────────────────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────────────────────
export const uploadResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    if (!req.file) {
      sendError(res, 'No file provided. Please attach a PDF or DOCX file.', 400);
      return;
    }

    const resume = await resumeService.uploadResume(req.user.id, req.file);
    sendSuccess(res, { resume: publicResume(resume) }, 'Resume uploaded successfully', 201);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// List
// ─────────────────────────────────────────────────────────────
export const getResumes = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    const resumes = await resumeService.getResumes(req.user.id);
    sendSuccess(res, { resumes: resumes.map(publicResume) }, 'Resumes fetched successfully');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Get by ID
// ─────────────────────────────────────────────────────────────
export const getResumeById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    const resume = await resumeService.getResumeById(req.user.id, req.params.id);
    sendSuccess(res, { resume: publicResume(resume) }, 'Resume fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const downloadOriginalResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = await resumeService.downloadOriginal(req.user!.id, req.params.id);
    if (process.env.VERCEL && file.bytes.length > 4 * 1024 * 1024) {
      throw Object.assign(new Error('This older original exceeds the hosting download limit. Download a saved PDF/DOCX version or contact support for your original.'), { statusCode: 413, isOperational: true });
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.attachment(file.fileName);
    res.type(file.fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(file.bytes);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────
export const deleteResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    const result = await resumeService.deleteResume(req.user.id, req.params.id);
    sendSuccess(
      res,
      result,
      result.storageCleanupPending
        ? 'Resume and reports deleted. File storage cleanup is pending and will retry automatically.'
        : 'Resume and related reports deleted successfully',
      result.storageCleanupPending ? 202 : 200
    );
  } catch (error) {
    next(error);
  }
};
