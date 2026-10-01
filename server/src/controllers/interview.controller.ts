import { NextFunction, Request, Response } from 'express';
import { interviewService } from '../services/interview.service';
import { sendSuccess } from '../utils/response.utils';

export const createInterviewSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await interviewService.create(req.user!.id, req.body.applicationId);
    sendSuccess(res, { session }, 'Interview session created successfully', 201);
  } catch (error) { next(error); }
};

export const listInterviewSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, { sessions: await interviewService.list(req.user!.id) }, 'Interview sessions retrieved successfully'); }
  catch (error) { next(error); }
};

export const getInterviewSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { sendSuccess(res, { session: await interviewService.getById(req.user!.id, req.params.id) }, 'Interview session retrieved successfully'); }
  catch (error) { next(error); }
};

export const answerInterviewQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await interviewService.answer(req.user!.id, req.params.id, req.params.questionId, req.body.answer);
    sendSuccess(res, { session }, 'Interview feedback generated successfully');
  } catch (error) { next(error); }
};

export const updateInterviewSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await interviewService.setStatus(req.user!.id, req.params.id, req.body.status);
    sendSuccess(res, { session }, 'Interview session updated successfully');
  } catch (error) { next(error); }
};

export const deleteInterviewSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { await interviewService.delete(req.user!.id, req.params.id); sendSuccess(res, null, 'Interview session deleted successfully'); }
  catch (error) { next(error); }
};
