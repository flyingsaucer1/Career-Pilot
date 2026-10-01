import { z } from 'zod';
const passwordByteLimit = (value: string) => Buffer.byteLength(value, 'utf8') <= 72;

export const registerSchema = z.object({
  acceptTerms: z.boolean().optional(),
  acceptAIDataUse: z.boolean().optional(),
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .refine(passwordByteLimit, 'Password must be at most 72 UTF-8 bytes')
    .refine((value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value),
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').refine(passwordByteLimit, 'Password must be at most 72 UTF-8 bytes'),
});

export const refreshSchema = z.object({});

const strongPassword = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .refine(passwordByteLimit, 'Password must be at most 72 UTF-8 bytes')
  .refine((value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value),
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Please provide a valid email address').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }).min(32, 'Reset link is invalid'),
  password: strongPassword,
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters').trim(),
  email: z.string().email('Please provide a valid email address').toLowerCase().trim(),
  currentPassword: z.string().refine(passwordByteLimit, 'Password must be at most 72 UTF-8 bytes').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required').refine(passwordByteLimit, 'Password must be at most 72 UTF-8 bytes'),
  newPassword: strongPassword,
});

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
});

export const deleteAccountSchema = z.object({
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').refine(passwordByteLimit, 'Password must be at most 72 UTF-8 bytes'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
