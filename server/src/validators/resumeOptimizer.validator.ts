import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Route parameter validation
// ─────────────────────────────────────────────────────────────

export const optimizeResumeParamSchema = z.object({
  resumeId: z
    .string({ required_error: 'resumeId is required' })
    .regex(/^[a-f\d]{24}$/i, 'resumeId must be a valid MongoDB ObjectId'),
});

export const getVersionParamSchema = z.object({
  resumeId: z
    .string({ required_error: 'resumeId is required' })
    .regex(/^[a-f\d]{24}$/i, 'resumeId must be a valid MongoDB ObjectId'),
  versionNumber: z
    .string({ required_error: 'versionNumber is required' })
    .regex(/^\d+$/, 'versionNumber must be a positive integer'),
});

export const deleteVersionParamSchema = z.object({
  resumeId: z
    .string({ required_error: 'resumeId is required' })
    .regex(/^[a-f\d]{24}$/i, 'resumeId must be a valid MongoDB ObjectId'),
  versionNumber: z
    .string({ required_error: 'versionNumber is required' })
    .regex(/^\d+$/, 'versionNumber must be a positive integer'),
});

// ─────────────────────────────────────────────────────────────
// Request body validation
// ─────────────────────────────────────────────────────────────

export const optimizeResumeBodySchema = z.object({
  jobDescription: z
    .string({ required_error: 'jobDescription is required' })
    .min(50, 'Job description must be at least 50 characters')
    .max(5000, 'Job description cannot exceed 5,000 characters'),
  atsResultId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'atsResultId must be a valid MongoDB ObjectId')
    .optional(),
  analysisId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'analysisId must be a valid MongoDB ObjectId')
    .optional(),
});

export const compareATSBodySchema = z.object({
  // Needed only for versions created before their target job was stored.
  jobDescription: z.string().trim().min(50).max(5000).optional(),
});

export const updateVersionContentBodySchema = z.object({
  content: z.string().trim().min(1, 'Resume content cannot be empty').max(30000, 'Resume content cannot exceed 30,000 characters'),
  expectedUpdatedAt: z.string().datetime(),
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type OptimizeResumeParam = z.infer<typeof optimizeResumeParamSchema>;
export type GetVersionParam = z.infer<typeof getVersionParamSchema>;
export type DeleteVersionParam = z.infer<typeof deleteVersionParamSchema>;
export type OptimizeResumeBody = z.infer<typeof optimizeResumeBodySchema>;
export type CompareATSBody = z.infer<typeof compareATSBodySchema>;
