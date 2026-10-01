import { Request, Response, NextFunction } from 'express';
import { atsService } from '../services/ats.service';
import { sendSuccess, sendError } from '../utils/response.utils';

// ─────────────────────────────────────────────────────────────
// POST /api/ats/:resumeId
// Body: { jobDescription: string }
// Query: ?force=true to bypass cache
// ─────────────────────────────────────────────────────────────
export const calculateATS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;
    const force = req.query.force === 'true';
    const { jobDescription } = req.body as { jobDescription?: string };

    if (!jobDescription || typeof jobDescription !== 'string') {
      sendError(res, 'jobDescription is required in the request body.', 400);
      return;
    }

    const atsResult = await atsService.calculateATS(userId, resumeId, jobDescription, force);

    sendSuccess(
      res,
      { atsResult },
      force ? 'ATS re-analysis completed' : 'ATS analysis completed',
      200
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/ats/:resumeId
// ─────────────────────────────────────────────────────────────
export const getATS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;

    const atsResult = await atsService.getATS(userId, resumeId);

    if (!atsResult) {
      sendSuccess(res, { atsResult: null }, 'No ATS report found for this resume', 200);
      return;
    }

    sendSuccess(res, { atsResult }, 'ATS report retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/ats/:resumeId
// ─────────────────────────────────────────────────────────────
export const deleteATS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;

    await atsService.deleteATS(userId, resumeId);
    sendSuccess(res, null, 'ATS report deleted successfully');
  } catch (error) {
    next(error);
  }
};
