import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import { MAX_RESUME_FILE_BYTES, RESUME_MIME_TYPES } from '../services/resumeFile.service';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { productionRateStore } from '../services/rateLimit.service';
import { env } from '../config/env';
import {
  uploadResume,
  getResumes,
  getResumeById,
  downloadOriginalResume,
  deleteResume,
} from '../controllers/resume.controller';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Multer — memory storage (buffer passed directly to Cloudinary)
// ─────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_FILE_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 64,
    headerPairs: 50,
  },
  fileFilter: (_req, file, cb) => {
    if (Object.prototype.hasOwnProperty.call(RESUME_MIME_TYPES, file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only PDF and DOCX files are allowed.'), { statusCode: 400, isOperational: true }));
    }
  },
});

// ─────────────────────────────────────────────────────────────
// Routes — all protected
// ─────────────────────────────────────────────────────────────

// POST /api/resumes/upload
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: env.UPLOAD_REQUEST_LIMIT, store: productionRateStore('upload'), standardHeaders: true, legacyHeaders: false });
router.post('/upload', authenticate, uploadLimiter, upload.single('resume'), uploadResume);

// GET /api/resumes
router.get('/', authenticate, getResumes);

// GET /api/resumes/:id
const resumeIdSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resume ID') });
router.get('/:id', authenticate, validate(resumeIdSchema, 'params'), getResumeById);
router.get('/:id/file', authenticate, validate(resumeIdSchema, 'params'), downloadOriginalResume);

// DELETE /api/resumes/:id
router.delete('/:id', authenticate, validate(resumeIdSchema, 'params'), deleteResume);

export default router;
