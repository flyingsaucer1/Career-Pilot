import { Request, Response, NextFunction } from 'express';
import { analysisService } from '../services/analysis.service';
import { sendSuccess } from '../utils/response.utils';

// POST /api/analysis/:resumeId
// Query param: ?force=true to bypass cache
export const analyzeResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;
    const force = req.query.force === 'true';

    const analysis = await analysisService.analyzeResume(userId, resumeId, force);
    sendSuccess(res, { analysis }, force ? 'Resume re-analyzed successfully' : 'Resume analyzed successfully', 200);
  } catch (error) {
    next(error);
  }
};

// GET /api/analysis/:resumeId
export const getAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;

    const analysis = await analysisService.getAnalysis(userId, resumeId);

    if (!analysis) {
      sendSuccess(res, { analysis: null }, 'No analysis found for this resume', 200);
      return;
    }

    sendSuccess(res, { analysis }, 'Analysis retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/analysis/:resumeId
export const deleteAnalysis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { resumeId } = req.params;

    await analysisService.deleteAnalysis(userId, resumeId);
    sendSuccess(res, null, 'Analysis deleted successfully');
  } catch (error) {
    next(error);
  }
};
