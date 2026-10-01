import dotenv from 'dotenv';
import { z } from 'zod';
import { isIP } from 'node:net';

// Explicit process settings (including the local runner) take precedence.
dotenv.config();

const bool = z.enum(['true', 'false']).default('false').transform((value) => value === 'true');
const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  // Optional process-only DNS override; leave empty to use the system resolver.
  DNS_SERVERS: z.string().default('').refine(
    (value) => value === '' || value.split(',').every((server) => isIP(server.trim()) !== 0),
    'DNS_SERVERS must be a comma-separated list of DNS server IP addresses'
  ),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
  SUPPORT_EMAIL: z.string().default(''),
  SERVICE_OPERATOR: z.string().default(''),
  AI_DATA_POLICY_ACKNOWLEDGED: bool,
  GEMINI_BILLING_VERIFIED: bool,
  CRON_SECRET: z.string().default(''),
  MAX_RESUMES_PER_USER: z.coerce.number().int().min(1).max(100).default(20),
  UPLOAD_REQUEST_LIMIT: z.coerce.number().int().min(1).max(100).default(10),
  AI_DAILY_LIMIT: z.coerce.number().int().min(1).max(1000).default(30),
  AI_MAX_CONCURRENT: z.coerce.number().int().min(1).max(50).default(4),
  AI_OPERATION_TIMEOUT_MS: z.coerce.number().int().min(1000).max(240000).default(180000),
  EMAIL_PROVIDER: z.enum(['console', 'resend']).default('console'),
  EMAIL_FROM: z.string().default('CareerPilot <onboarding@resend.dev>'),
  RESEND_API_KEY: z.string().optional(),
  PASSWORD_RESET_EXPIRES_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
  PASSWORD_RESET_COOLDOWN_SECONDS: z.coerce.number().int().min(0).max(3600).default(60),
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  // AI providers
  AI_PROVIDER: z.enum(['fallback', 'gemini', 'ollama', 'groq']).default('gemini'),
  AI_FALLBACK_COOLDOWN_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600000).default(45000),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  GROQ_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600000).default(90000),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().optional(),
  OLLAMA_TIMEOUT_MS: z.coerce.number().int().min(1000).max(600000).default(120000),
}).superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return;
  const problem = (path: string, message: string) => context.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  try {
    const url = new URL(value.CLIENT_URL);
    if (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname) || url.origin !== value.CLIENT_URL) problem('CLIENT_URL', 'Set the exact HTTPS production origin without a trailing slash or path.');
  } catch { problem('CLIENT_URL', 'Set a valid HTTPS production origin.'); }
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    if (value[key].length < 32 || /your_|change_this|test|example/i.test(value[key])) problem(key, 'Use an independently generated production secret of at least 32 characters.');
  }
  if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) problem('JWT_REFRESH_SECRET', 'Access and refresh secrets must differ.');
  if (value.EMAIL_PROVIDER !== 'resend' || !value.RESEND_API_KEY || /onboarding@resend.dev/.test(value.EMAIL_FROM)) problem('EMAIL_PROVIDER', 'Production requires email delivery credentials and a verified sender.');
  if (!z.string().email().safeParse(value.SUPPORT_EMAIL).success) problem('SUPPORT_EMAIL', 'Set a real public support email.');
  if (!value.SERVICE_OPERATOR.trim()) problem('SERVICE_OPERATOR', 'Set the business/person operating this service.');
  if (!value.AI_DATA_POLICY_ACKNOWLEDGED) problem('AI_DATA_POLICY_ACKNOWLEDGED', 'Review AI processor privacy/retention terms before enabling production.');
  if (value.AI_PROVIDER === 'gemini' && (!value.GEMINI_API_KEY || !value.GEMINI_BILLING_VERIFIED)) problem('GEMINI_BILLING_VERIFIED', 'Personal resumes must not be sent to unpaid Gemini. Verify an active billing account first.');
  if (value.AI_PROVIDER === 'fallback' && !(value.GROQ_API_KEY || (value.GEMINI_API_KEY && value.GEMINI_BILLING_VERIFIED) || value.OLLAMA_MODEL)) problem('AI_PROVIDER', 'Configure at least one approved production AI service.');
  if (value.AI_PROVIDER === 'groq' && !value.GROQ_API_KEY) problem('GROQ_API_KEY', 'Configure the selected AI service.');
  if (value.PASSWORD_RESET_COOLDOWN_SECONDS < 30) problem('PASSWORD_RESET_COOLDOWN_SECONDS', 'Production requires a reset-email cooldown of at least 30 seconds.');
  if (process.env.VERCEL && value.CRON_SECRET.length < 32) problem('CRON_SECRET', 'Vercel requires a cleanup cron secret of at least 32 characters.');
  if (process.env.VERCEL && (value.AI_PROVIDER === 'ollama' || (value.AI_PROVIDER === 'fallback' && value.OLLAMA_MODEL))) problem('OLLAMA_MODEL', 'Disable local Ollama for Vercel; localhost is the function host, not your laptop.');
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
