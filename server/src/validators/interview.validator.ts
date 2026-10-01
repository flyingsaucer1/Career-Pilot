import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

export const createInterviewSessionSchema = z.object({ applicationId: objectId });
export const interviewSessionParamSchema = z.object({ id: objectId });
export const interviewQuestionParamSchema = z.object({ id: objectId, questionId: objectId });
export const answerInterviewQuestionSchema = z.object({
  answer: z.string().trim().min(20, 'Answer must be at least 20 characters').max(5000),
});
export const updateInterviewSessionSchema = z.object({ status: z.enum(['active', 'completed']) });

export type CreateInterviewSessionInput = z.infer<typeof createInterviewSessionSchema>;
