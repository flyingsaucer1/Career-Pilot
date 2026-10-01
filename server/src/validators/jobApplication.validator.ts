import { z } from 'zod';
import { APPLICATION_STATUSES } from '../models/JobApplication.model';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const optionalDate = z.union([
  z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid date'),
  z.null(),
]).optional();
const optionalUrl = z.string().trim().max(2048).refine((value) => {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}, 'Use a valid http or https URL').optional();

const jobApplicationFields = z.object({
  company: z.string().trim().min(1, 'Company is required').max(120),
  role: z.string().trim().min(1, 'Role is required').max(120),
  url: optionalUrl,
  description: z.string().trim().min(50, 'Job description must be at least 50 characters').max(5000),
  status: z.enum(APPLICATION_STATUSES).default('saved'),
  applicationDate: optionalDate,
  followUpDate: optionalDate,
  notes: z.string().trim().max(5000).optional(),
  resumeId: objectId.nullable().optional(),
  resumeVersionNumber: z.number().int().min(1).nullable().optional(),
});

export const createJobApplicationSchema = jobApplicationFields.refine((value) => value.resumeVersionNumber == null || value.resumeId != null, {
  message: 'A resume is required when linking a resume version',
  path: ['resumeId'],
});

export const updateJobApplicationSchema = jobApplicationFields.partial().extend({
  archived: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update');

export const jobApplicationParamSchema = z.object({ id: objectId });

export const listJobApplicationsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  archived: z.enum(['true', 'false']).optional(),
});

export type CreateJobApplicationInput = z.infer<typeof createJobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof updateJobApplicationSchema>;
