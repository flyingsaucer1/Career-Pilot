import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  optimizeResumeParamSchema,
  getVersionParamSchema,
  deleteVersionParamSchema,
  optimizeResumeBodySchema,
  compareATSBodySchema,
  updateVersionContentBodySchema,
} from '../validators/resumeOptimizer.validator';
import {
  optimizeResume,
  getVersions,
  getVersion,
  compareATSScores,
  deleteVersion,
  updateVersionContent,
  exportVersion,
} from '../controllers/resumeOptimizer.controller';

import { env } from '../config/env';
import { aiBudget } from '../middlewares/aiBudget.middleware';
import { productionRateStore } from '../services/rateLimit.service';

// ─────────────────────────────────────────────────────────────
// Optimizer-specific rate limiter: AI calls are expensive
// ─────────────────────────────────────────────────────────────
const optimizerLimiter = rateLimit({
  store: productionRateStore('optimizer'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 optimization requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many optimization requests. Please wait 15 minutes before trying again.',
  },
});

const router = Router();

// All optimizer routes require authentication
router.use(authenticate);

// Apply rate limiter only in production

// POST /api/resume-optimizer/:resumeId — run optimization
router.post(
  '/:resumeId',
  validate(optimizeResumeParamSchema, 'params'),
  validate(optimizeResumeBodySchema, 'body'),
  ...(env.NODE_ENV === 'production' ? [optimizerLimiter] : []),
  aiBudget,
  optimizeResume
);

// GET /api/resume-optimizer/:resumeId — fetch version history
router.get(
  '/:resumeId',
  validate(optimizeResumeParamSchema, 'params'),
  getVersions
);

router.patch(
  '/:resumeId/:versionNumber/content',
  validate(getVersionParamSchema, 'params'),
  validate(updateVersionContentBodySchema, 'body'),
  updateVersionContent
);

router.get(
  '/:resumeId/:versionNumber/export/:format',
  validate(getVersionParamSchema.extend({ format: z.enum(['pdf', 'docx']) }), 'params'),
  exportVersion
);

// GET /api/resume-optimizer/:resumeId/:versionNumber — fetch specific version
router.get(
  '/:resumeId/:versionNumber',
  validate(getVersionParamSchema, 'params'),
  getVersion
);

// POST /api/resume-optimizer/:resumeId/:versionNumber/ats-comparison
router.post(
  '/:resumeId/:versionNumber/ats-comparison',
  validate(getVersionParamSchema, 'params'),
  validate(compareATSBodySchema, 'body'),
  ...(env.NODE_ENV === 'production' ? [optimizerLimiter] : []),
  aiBudget,
  compareATSScores
);

// DELETE /api/resume-optimizer/:resumeId/:versionNumber — delete a version
router.delete(
  '/:resumeId/:versionNumber',
  validate(deleteVersionParamSchema, 'params'),
  deleteVersion
);

export default router;
