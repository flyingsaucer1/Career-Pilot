import { Request, Response, NextFunction } from 'express';
import { resumeOptimizerService } from '../services/resumeOptimizer.service';
import { sendSuccess, sendError } from '../utils/response.utils';
import { createResumeDocx, createResumePdf } from '../services/resumeExport.service';

// ─────────────────────────────────────────────────────────────
// POST /api/resume-optimizer/:resumeId
// Body: { jobDescription: string, atsResultId?: string, analysisId?: string }
// ─────────────────────────────────────────────────────────────
export const optimizeResume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;
    const { jobDescription, atsResultId, analysisId } = req.body as {
      jobDescription?: string;
      atsResultId?: string;
      analysisId?: string;
    };

    if (!jobDescription || typeof jobDescription !== 'string') {
      sendError(res, 'jobDescription is required in the request body.', 400);
      return;
    }

    const result = await resumeOptimizerService.optimizeResume(userId, resumeId, jobDescription, {
      atsResultId,
      analysisId,
    });

    sendSuccess(res, result, 'Resume optimized successfully', 200);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/resume-optimizer/:resumeId
// Returns version history
// ─────────────────────────────────────────────────────────────
export const getVersions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;

    const versions = await resumeOptimizerService.getVersions(userId, resumeId);

    sendSuccess(res, { versions }, 'Version history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/resume-optimizer/:resumeId/:versionNumber
// Returns a specific version
// ─────────────────────────────────────────────────────────────
export const getVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId, versionNumber } = req.params;

    const versionNum = parseInt(versionNumber, 10);
    if (isNaN(versionNum)) {
      sendError(res, 'Invalid version number.', 400);
      return;
    }

    const version = await resumeOptimizerService.getVersion(userId, resumeId, versionNum);

    if (!version) {
      sendError(res, 'Version not found.', 404);
      return;
    }

    sendSuccess(res, { version }, 'Version retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateVersionContent = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const version = await resumeOptimizerService.updateVersionContent(
      req.user!.id,
      req.params.resumeId,
      Number(req.params.versionNumber),
      req.body.content,
      req.body.expectedUpdatedAt
    );
    sendSuccess(res, { version }, 'Resume draft saved');
  } catch (error) {
    next(error);
  }
};

export const exportVersion = async (
  req: Request, res: Response, next: NextFunction
): Promise<void> => {
  try {
    const version = await resumeOptimizerService.getVersion(
      req.user!.id, req.params.resumeId, Number(req.params.versionNumber)
    );
    if (!version) {
      sendError(res, 'Version not found.', 404);
      return;
    }
    if (version.contentFormat !== 'resume') {
      sendError(res, 'Save this older version as a resume draft before exporting.', 409);
      return;
    }
    const format = req.params.format;
    const content = version.optimizedContent;
    const bytes = format === 'pdf' ? await createResumePdf(content) : await createResumeDocx(content);
    res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="careerpilot-resume-v${version.versionNumber}.${format}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(bytes);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/resume-optimizer/:resumeId/:versionNumber/ats-comparison
// Scores the original and saved draft against the same job description.
// ─────────────────────────────────────────────────────────────
export const compareATSScores = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId, versionNumber } = req.params;
    const { jobDescription } = req.body as { jobDescription?: string };
    const version = await resumeOptimizerService.compareATSScores(userId, resumeId, Number(versionNumber), jobDescription);
    sendSuccess(res, { version }, 'ATS scores compared successfully');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/resume-optimizer/:resumeId/:versionNumber
// Deletes a specific version (not version 1)
// ─────────────────────────────────────────────────────────────
export const deleteVersion = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId, versionNumber } = req.params;

    const versionNum = parseInt(versionNumber, 10);
    if (isNaN(versionNum)) {
      sendError(res, 'Invalid version number.', 400);
      return;
    }

    await resumeOptimizerService.deleteVersion(userId, resumeId, versionNum);

    sendSuccess(res, null, 'Version deleted successfully');
  } catch (error) {
    next(error);
  }
};
