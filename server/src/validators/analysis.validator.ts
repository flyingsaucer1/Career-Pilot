import { z } from 'zod';

// ─────────────────────────────────────────────────────────────
// Route parameter validation
// ─────────────────────────────────────────────────────────────

export const analyzeResumeParamSchema = z.object({
  resumeId: z
    .string({ required_error: 'resumeId is required' })
    .regex(/^[a-f\d]{24}$/i, 'resumeId must be a valid MongoDB ObjectId'),
});

export type AnalyzeResumeParam = z.infer<typeof analyzeResumeParamSchema>;
