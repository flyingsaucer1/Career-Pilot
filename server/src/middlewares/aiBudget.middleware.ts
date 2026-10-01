import { randomUUID, createHash } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { AIRequestLease } from '../models/AIRequestLease.model';
import { RequestCounter } from '../models/RequestCounter.model';
import { aiRequestContext, assertRequestActive } from '../services/aiRequestContext.service';
import { User } from '../models/User.model';
// Adding/changing processors invalidates earlier consent, without publishing model names.
export const AI_CONSENT_VERSION = '2026-09-26:' + createHash('sha256').update(JSON.stringify({
  provider: env.AI_PROVIDER,
  gemini: !!env.GEMINI_API_KEY && (env.NODE_ENV !== 'production' || env.GEMINI_BILLING_VERIFIED),
  groq: !!env.GROQ_API_KEY,
  ollama: !!env.OLLAMA_MODEL,
  email: env.EMAIL_PROVIDER,
})).digest('hex').slice(0, 16);
const failure = (message: string, statusCode: number) => Object.assign(new Error(message), { statusCode, isOperational: true });
async function acquire(id: string, token: string) {
  try {
    await AIRequestLease.findOneAndUpdate({ _id: id, expiresAt: { $lte: new Date() } }, { $set: { token, expiresAt: new Date(Date.now() + env.AI_OPERATION_TIMEOUT_MS + 60_000) } }, { upsert: true });
    return true;
  } catch (error) { if ((error as { code?: number }).code === 11000) return false; throw error; }
}
/** Shared admission, one active request per account, daily quota and hard deadline. */
export async function aiBudget(req: Request, res: Response, next: NextFunction) {
  const userId = req.user!.id;
  const token = randomUUID();
  const held: string[] = [];
  const release = async () => { if (held.length) await AIRequestLease.deleteMany({ _id: { $in: held }, token }); };
  try {
    if (env.NODE_ENV !== 'test') {
      const user = await User.findById(userId).select('aiConsentVersion');
      if (user?.aiConsentVersion !== AI_CONSENT_VERSION) throw failure('Review and accept AI data use before generating feedback.', 403);
    }
    if (!await acquire(`user:${userId}`, token)) throw failure('You already have an AI request running. Please wait for it to finish.', 409);
    held.push(`user:${userId}`);
    for (let slot = 0; slot < env.AI_MAX_CONCURRENT; slot++) {
      const id = `global:${slot}`;
      if (await acquire(id, token)) { held.push(id); break; }
    }
    if (held.length !== 2) throw failure('The assistant is busy. Please try again shortly.', 503);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    try {
      await RequestCounter.findOneAndUpdate({ _id: `ai:${day}:${userId}`, count: { $lt: env.AI_DAILY_LIMIT } }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 2)) } }, { upsert: true });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw failure('Your daily AI request allowance is used. Please try again tomorrow (UTC).', 429);
      throw error;
    }
    const controller = new AbortController();
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      clearTimeout(timer);
      controller.abort();
      void release().catch(() => console.error('[AI budget] Lease release failed; the lease will expire.'));
    };
    const timer = setTimeout(() => {
      controller.abort();
      if (!res.headersSent) res.status(503).json({ success: false, message: 'Analysis took too long. Please try again with a shorter document.' });
    }, env.AI_OPERATION_TIMEOUT_MS);
    timer.unref();
    res.once('finish', cleanup);
    res.once('close', cleanup);
    aiRequestContext.run({ signal: controller.signal }, () => { assertRequestActive(); next(); });
  } catch (error) { await release().catch(() => undefined); next(error); }
}
