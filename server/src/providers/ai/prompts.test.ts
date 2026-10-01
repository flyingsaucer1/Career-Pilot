import assert from 'node:assert/strict';
import test from 'node:test';
import { buildATSPrompt } from './prompts/ats.prompt';
import { buildResumeAnalysisPrompt } from './prompts/resumeAnalysis.prompt';
import { buildResumeOptimizerPrompt } from './prompts/resumeOptimizer.prompt';
import { buildInterviewFeedbackPrompt, buildInterviewQuestionsPrompt } from './prompts/interview.prompt';
import { OllamaProvider } from './ollama.provider';

test('AI prompts reject oversized documents rather than silently truncating', () => {
  assert.throws(() => buildResumeAnalysisPrompt('x'.repeat(8001)), { statusCode: 422 });
  assert.throws(() => buildATSPrompt('x'.repeat(8001), 'job'), /8,000-character limit/);
  assert.throws(() => buildATSPrompt('resume', 'x'.repeat(5001)), /5,000-character limit/);
  assert.throws(() => buildResumeOptimizerPrompt('x'.repeat(8001), 'job'), /8,000-character limit/);
  assert.throws(() => buildResumeOptimizerPrompt('resume', 'x'.repeat(5001)), /5,000-character limit/);
  assert.throws(() => buildInterviewQuestionsPrompt('resume', 'Role', 'x'.repeat(5001)), /5,000-character limit/);
  assert.throws(() => buildInterviewFeedbackPrompt('resume', 'Role', {
    type: 'behavioral', difficulty: 'medium', question: 'Tell me about a challenge.', intent: 'Assess judgment.',
    followUpPrompts: ['What changed?'], answerGuidance: 'Use verified facts.',
  }, 'x'.repeat(5001)), /5,000-character limit/);
});

test('boundary-sized document content is retained in full', () => {
  const resume = 'x'.repeat(7991) + 'END_MARK!';
  const job = 'y'.repeat(4991) + 'JOB_END!!';
  assert.ok(buildATSPrompt(resume, job).includes(resume));
  assert.ok(buildATSPrompt(resume, job).includes(job));
  assert.ok(buildResumeAnalysisPrompt('z'.repeat(8000)).includes('z'.repeat(8000)));
  assert.ok(buildResumeOptimizerPrompt('z'.repeat(8000), 'y'.repeat(5000)).includes('y'.repeat(5000)));
  assert.ok(buildInterviewQuestionsPrompt('z'.repeat(8000), 'Engineer', 'y'.repeat(5000)).includes('y'.repeat(5000)));
});

test('oversized resume analysis never calls or retries the model', async () => {
  let calls = 0;
  const provider = new OllamaProvider('http://localhost:11434', 'test', (async () => { calls++; throw new Error('Unexpected network call'); }) as typeof fetch);
  await assert.rejects(provider.analyzeResume('x'.repeat(8001)), { statusCode: 422 });
  assert.equal(calls, 0);
});
