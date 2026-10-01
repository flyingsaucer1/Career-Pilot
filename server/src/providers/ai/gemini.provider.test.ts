import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GeminiProvider } from './gemini.provider';
test('Gemini has an abort deadline and does not retry a timed-out request', async () => {
  const provider = new GeminiProvider('synthetic-not-a-real-key', 20);
  let calls = 0;
  (provider as any).client = { getGenerativeModel: () => ({ generateContent: (_prompt: string, options: { signal: AbortSignal }) => {
    calls++;
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  } }) };
  const keepAlive = setTimeout(() => undefined, 1000);
  try { await assert.rejects(provider.analyzeResume('Synthetic React engineer resume'), (error: any) => error.fallbackEligible === true && error.statusCode === 503); }
  finally { clearTimeout(keepAlive); }
  assert.equal(calls, 1);
});
