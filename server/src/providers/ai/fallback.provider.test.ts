import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  ATSResult,
  IAIProvider,
  ResumeAnalysisResult,
} from './ai.interface';
import { FallbackAIProvider, getAIProviderMetadata } from './fallback.provider';

const analysisResult = { score: 80 } as ResumeAnalysisResult;
const atsResult = { atsScore: 75 } as ATSResult;

const unavailable = (message = 'temporarily unavailable'): Error => Object.assign(new Error(message), {
  statusCode: 503,
  isOperational: true,
  fallbackEligible: true,
});

const provider = (
  name: string,
  analyze: () => Promise<ResumeAnalysisResult>,
  calculateATS: () => Promise<ATSResult> = async () => atsResult
): IAIProvider => ({
  providerName: name,
  providerVersion: `${name}-model`,
  analyzeResume: analyze,
  calculateATS,
  optimizeResume: async () => { throw new Error('not used'); },
  generateCoverLetter: async () => { throw new Error('not used'); },
  generateInterviewQuestions: async () => { throw new Error('not used'); },
  evaluateInterviewAnswer: async () => { throw new Error('not used'); },
  skillGapAnalysis: async () => { throw new Error('not used'); },
});

test('falls back on availability failures and records the provider that succeeded', async () => {
  let primaryCalls = 0;
  const primary = provider('Gemini', async () => {
    primaryCalls++;
    throw unavailable('rate limit');
  });
  const secondary = provider('Groq', async () => analysisResult);
  const fallback = new FallbackAIProvider([primary, secondary], 60_000);

  const result = await fallback.analyzeResume('resume');
  assert.equal(result.score, 80);
  assert.deepEqual(getAIProviderMetadata(result, fallback), {
    providerName: 'Groq',
    providerVersion: 'Groq-model',
  });

  await fallback.analyzeResume('another resume');
  assert.equal(primaryCalls, 1, 'the cooling-down provider is skipped');
});

test('does not hide authentication, request, or validation failures', async () => {
  let secondaryCalls = 0;
  const validationError = Object.assign(new Error('response failed validation'), {
    statusCode: 503,
    isOperational: true,
    fallbackEligible: false,
  });
  const fallback = new FallbackAIProvider([
    provider('Gemini', async () => { throw validationError; }),
    provider('Groq', async () => { secondaryCalls++; return analysisResult; }),
  ]);

  await assert.rejects(fallback.analyzeResume('resume'), /failed validation/);
  assert.equal(secondaryCalls, 0);
});

test('restarts a multi-call workflow on one fallback provider', async () => {
  let primaryCalls = 0;
  let secondaryCalls = 0;
  const primary = provider('Gemini', async () => analysisResult, async () => {
    primaryCalls++;
    if (primaryCalls === 2) throw unavailable();
    return atsResult;
  });
  const secondary = provider('Groq', async () => analysisResult, async () => {
    secondaryCalls++;
    return atsResult;
  });
  const fallback = new FallbackAIProvider([primary, secondary]);

  const execution = await fallback.executeWithProvider('ATS comparison', async (active) => ({
    before: await active.calculateATS('before', 'job'),
    after: await active.calculateATS('after', 'job'),
  }));

  assert.equal(primaryCalls, 2);
  assert.equal(secondaryCalls, 2);
  assert.equal(execution.metadata.providerName, 'Groq');
});

