import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.middleware';
import { calculateATS, getATS, deleteATS } from '../controllers/ats.controller';
import { aiBudget } from '../middlewares/aiBudget.middleware';
import { productionRateStore } from '../services/rateLimit.service';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// ATS-specific rate limiter: AI calls are expensive
// ─────────────────────────────────────────────────────────────
const atsLimiter = rateLimit({
  store: productionRateStore('ats'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 ATS checks per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many ATS requests. Please wait 15 minutes before trying again.',
  },
});

const router = Router();

// All ATS routes require authentication
router.use(authenticate);
router.use('/:resumeId', validate(z.object({ resumeId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resume ID') }), 'params'));

// POST /api/ats/:resumeId  — run ATS analysis (body: { jobDescription })
router.post('/:resumeId', atsLimiter, aiBudget, calculateATS);

// GET /api/ats/:resumeId   — fetch cached ATS result
router.get('/:resumeId', getATS);

// DELETE /api/ats/:resumeId — delete ATS result
router.delete('/:resumeId', deleteATS);

export default router;
