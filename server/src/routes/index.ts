import { Router } from 'express';
import authRoutes from './auth.routes';
import resumeRoutes from './resume.routes';
import analysisRoutes from './analysis.routes';
import atsRoutes from './ats.routes';
import resumeOptimizerRoutes from './resumeOptimizer.routes';
import jobApplicationRoutes from './jobApplication.routes';
import interviewRoutes from './interview.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/analysis', analysisRoutes);
router.use('/ats', atsRoutes);
router.use('/resume-optimizer', resumeOptimizerRoutes);
router.use('/applications', jobApplicationRoutes);
router.use('/interviews', interviewRoutes);

export default router;
