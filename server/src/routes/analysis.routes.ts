import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { analyzeResumeParamSchema } from '../validators/analysis.validator';
import { analyzeResume, getAnalysis, deleteAnalysis } from '../controllers/analysis.controller';

import { env } from '../config/env';
import { aiBudget } from '../middlewares/aiBudget.middleware';
import { productionRateStore } from '../services/rateLimit.service';

const router = Router();

// Stricter rate limit for AI analysis (expensive operation)
const analysisLimiter = rateLimit({
  store: productionRateStore('analysis'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 analysis requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many analysis requests. Please wait 15 minutes before trying again.',
  },
});

// All routes protected by auth
router.use(authenticate);

// Rate limiter only applied outside development to prevent local testing lockouts

// POST /api/analysis/:resumeId         — run analysis (cached by default, ?force=true to re-run)
router.post('/:resumeId', validate(analyzeResumeParamSchema, 'params'), ...(env.NODE_ENV !== 'development' ? [analysisLimiter] : []), aiBudget, analyzeResume);

// GET  /api/analysis/:resumeId         — get existing analysis (null if not yet run)
router.get('/:resumeId', validate(analyzeResumeParamSchema, 'params'), getAnalysis);

// DELETE /api/analysis/:resumeId       — delete stored analysis
router.delete('/:resumeId', validate(analyzeResumeParamSchema, 'params'), deleteAnalysis);

export default router;
