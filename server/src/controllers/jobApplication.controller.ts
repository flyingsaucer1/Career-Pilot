import { NextFunction, Request, Response } from 'express';
import { jobApplicationService } from '../services/jobApplication.service';
import { sendSuccess } from '../utils/response.utils';

export const createJobApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const application = await jobApplicationService.create(req.user!.id, req.body);
    sendSuccess(res, { application }, 'Application created successfully', 201);
  } catch (error) { next(error); }
};

export const listJobApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const applications = await jobApplicationService.list(req.user!.id, {
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      archived: req.query.archived === 'true',
    });
    sendSuccess(res, { applications }, 'Applications retrieved successfully');
  } catch (error) { next(error); }
};

export const getJobApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const application = await jobApplicationService.getById(req.user!.id, req.params.id);
    sendSuccess(res, { application }, 'Application retrieved successfully');
  } catch (error) { next(error); }
};

export const updateJobApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const application = await jobApplicationService.update(req.user!.id, req.params.id, req.body);
    sendSuccess(res, { application }, 'Application updated successfully');
  } catch (error) { next(error); }
};

export const deleteJobApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await jobApplicationService.delete(req.user!.id, req.params.id);
    sendSuccess(res, null, 'Application deleted successfully');
  } catch (error) { next(error); }
};

export const getJobAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const analytics = await jobApplicationService.analytics(req.user!.id);
    sendSuccess(res, { analytics }, 'Application analytics retrieved successfully');
  } catch (error) { next(error); }
};
