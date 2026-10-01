import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createJobApplicationSchema, updateJobApplicationSchema,
  jobApplicationParamSchema, listJobApplicationsQuerySchema,
} from '../validators/jobApplication.validator';
import {
  createJobApplication, listJobApplications, getJobApplication,
  updateJobApplication, deleteJobApplication, getJobAnalytics,
} from '../controllers/jobApplication.controller';

const router = Router();
router.use(authenticate);
router.get('/analytics', getJobAnalytics);
router.get('/', validate(listJobApplicationsQuerySchema, 'query'), listJobApplications);
router.post('/', validate(createJobApplicationSchema), createJobApplication);
router.get('/:id', validate(jobApplicationParamSchema, 'params'), getJobApplication);
router.patch('/:id', validate(jobApplicationParamSchema, 'params'), validate(updateJobApplicationSchema), updateJobApplication);
router.delete('/:id', validate(jobApplicationParamSchema, 'params'), deleteJobApplication);

export default router;
