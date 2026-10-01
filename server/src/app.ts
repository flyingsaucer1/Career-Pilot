import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import mongoose from 'mongoose';
import { authenticate } from './middlewares/auth.middleware';
import { checkOllamaStatus } from './services/providerStatus.service';
import { productionRateStore } from './services/rateLimit.service';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { retryPendingFileDeletions } from './services/resume.service';
import { AI_CONSENT_VERSION } from './middlewares/aiBudget.middleware';

const app: Application = express();
app.set('trust proxy', env.TRUST_PROXY_HOPS);
app.disable('x-powered-by');
app.use((_req, res, next) => { res.locals.requestId = randomUUID(); res.setHeader('X-Request-ID', res.locals.requestId); next(); });
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'CareerPilot API is running' }));
app.get('/api/ready', (_req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ success: mongoose.connection.readyState === 1 }));
app.get('/api/internal/cleanup', async (req, res, next) => {
  const supplied = Buffer.from(req.headers.authorization ?? '');
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  if (!env.CRON_SECRET || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) { res.status(401).json({ success: false }); return; }
  try { await retryPendingFileDeletions(); res.json({ success: true }); } catch (error) { next(error); }
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const cookieRoute = ['/api/auth/refresh', '/api/auth/logout'].includes(req.path);
  if (env.NODE_ENV === 'production' && ((origin && origin !== env.CLIENT_URL) || (cookieRoute && !origin))) {
    res.status(403).json({ success: false, message: 'This request origin is not allowed.' }); return;
  }
  next();
});

// ────────────────────────────────────────────────
// Security Middleware
// ────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: env.NODE_ENV === 'development' ? true : env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limiter
const globalLimiter = rateLimit({
  store: productionRateStore('global'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Isolated integration suites intentionally exercise more than 100 requests;
// endpoint-specific limiters remain active in test mode.
if (env.NODE_ENV === 'production') {
  app.use(globalLimiter);
}

// ────────────────────────────────────────────────
// Body Parsing
// ────────────────────────────────────────────────
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get('/api/public-config', (_req, res) => {
  const processors = ['MongoDB Atlas (workspace records)', 'Cloudinary (private uploaded files)'];
  const hosted = env.AI_PROVIDER === 'fallback';
  if ((hosted || env.AI_PROVIDER === 'gemini') && env.GEMINI_API_KEY && (env.NODE_ENV !== 'production' || env.GEMINI_BILLING_VERIFIED)) processors.push('Google Gemini (AI analysis)');
  if ((hosted || env.AI_PROVIDER === 'groq') && env.GROQ_API_KEY) processors.push('Groq (AI analysis)');
  if ((hosted || env.AI_PROVIDER === 'ollama') && env.OLLAMA_MODEL) processors.push('Ollama (AI on the server)');
  if (env.EMAIL_PROVIDER === 'resend') processors.push('Resend (account recovery email)');
  res.json({ success: true, data: { processors, supportEmail: env.SUPPORT_EMAIL || null, operator: env.SERVICE_OPERATOR || null, consentVersion: AI_CONSENT_VERSION, dailyAIRequestLimit: env.AI_DAILY_LIMIT, maxResumes: env.MAX_RESUMES_PER_USER, maxUploadMB: env.NODE_ENV === 'production' ? 4 : 5 } });
});

// ────────────────────────────────────────────────
// Logging
// ────────────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ────────────────────────────────────────────────
// Health Check
// ────────────────────────────────────────────────

// ────────────────────────────────────────────────
// API Routes
// ────────────────────────────────────────────────
app.get('/api/status', authenticate, async (_req, res) => {
  const ai = env.AI_PROVIDER === 'fallback'
    ? await (async () => {
      const local = env.OLLAMA_MODEL
        ? await checkOllamaStatus(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL)
        : null;
      const providers = [
        { provider: 'Gemini', ready: Boolean(env.GEMINI_API_KEY) && (env.NODE_ENV !== 'production' || env.GEMINI_BILLING_VERIFIED) },
        { provider: 'Groq', model: env.GROQ_MODEL, ready: Boolean(env.GROQ_API_KEY) },
        ...(local ? [local] : []),
      ];
      return {
        provider: 'Automatic fallback',
        model: 'Gemini -> Groq -> Ollama',
        ready: providers.some((provider) => provider.ready),
        providers,
        message: 'Uses the first configured provider that is not rate-limited or temporarily unavailable.',
      };
    })()
    : env.AI_PROVIDER === 'ollama'
    ? await checkOllamaStatus(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL)
    : env.AI_PROVIDER === 'groq'
      ? { provider: 'Groq', model: env.GROQ_MODEL, ready: Boolean(env.GROQ_API_KEY), message: 'Hosted AI configuration; connectivity is checked when generating.' }
      : { provider: 'Gemini', model: null, ready: Boolean(env.GEMINI_API_KEY), message: 'Hosted AI configuration; connectivity is checked when generating.' };
  res.json({ success: true, data: { databaseReady: mongoose.connection.readyState === 1, ai } });
});
app.use('/api', routes);

// ────────────────────────────────────────────────
// Error Handling
// ────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
