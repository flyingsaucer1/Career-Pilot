import { AsyncLocalStorage } from 'node:async_hooks';
export const aiRequestContext = new AsyncLocalStorage<{ signal: AbortSignal }>();
export function providerSignal(timeoutMs: number): AbortSignal {
  const outer = aiRequestContext.getStore()?.signal;
  return outer ? AbortSignal.any([outer, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs);
}
export function assertRequestActive() {
  if (aiRequestContext.getStore()?.signal.aborted) throw Object.assign(new Error('This request timed out or was cancelled. Please try again.'), { statusCode: 503, isOperational: true, fallbackEligible: false });
}
