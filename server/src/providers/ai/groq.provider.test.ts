import assert from 'node:assert/strict';
import test from 'node:test';
import { GroqProvider } from './groq.provider';

const atsPayload = {
  atsScore: 70,
  matchPercentage: 65,
  keywordMatchPercentage: 60,
  matchingKeywords: ['TypeScript'],
  missingKeywords: ['Docker'],
  matchingSkills: ['React'],
  missingSkills: ['AWS'],
  importantRequirements: [{ requirement: 'React experience', met: true, notes: 'Listed in projects' }],
  strengths: ['Frontend experience'],
  weaknesses: ['No cloud evidence'],
  improvementSuggestions: [{ priority: 'high', category: 'Skills', suggestion: 'Show relevant cloud experience.' }],
  keywordDensity: [{ keyword: 'TypeScript', count: 1, recommended: 2 }],
  sectionMatching: { summary: true, skills: true, experience: false, education: true },
  aiSummary: 'A reasonable match with some gaps.',
};

test('sends authenticated strict JSON request and validates ATS output', async () => {
  let capturedUrl = '';
  let capturedBody: Record<string, unknown> = {};
  let authorization = '';
  const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    capturedUrl = input.toString();
    capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    authorization = new Headers(init?.headers).get('Authorization') || '';
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(atsPayload) } }] }), { status: 200 });
  }) as typeof fetch;

  const provider = new GroqProvider('test-only-key', 'openai/gpt-oss-120b', fakeFetch);
  const result = await provider.calculateATS('React and TypeScript resume', 'React role with Docker');
  assert.equal(capturedUrl, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(authorization, 'Bearer test-only-key');
  assert.equal(capturedBody.model, 'openai/gpt-oss-120b');
  const format = capturedBody.response_format as { type: string; json_schema: { strict: boolean; schema: Record<string, unknown> } };
  assert.equal(format.type, 'json_schema');
  assert.equal(format.json_schema.strict, true);
  const checkObjects = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(checkObjects);
    if (!value || typeof value !== 'object') return;
    const item = value as Record<string, unknown>;
    if (item.type === 'object' && item.properties) {
      assert.equal(item.additionalProperties, false);
      assert.deepEqual(item.required, Object.keys(item.properties));
    }
    for (const nested of Object.values(item)) checkObjects(nested);
  };
  checkObjects(format.json_schema.schema);
  assert.equal(result.atsScore, 70);
  assert.deepEqual(result.missingSkills, ['AWS']);
});

test('authentication failure is safe and not retried', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    return new Response(JSON.stringify({ error: { message: 'private information' } }), { status: 401 });
  }) as typeof fetch;
  const provider = new GroqProvider('test-only-key', undefined, fakeFetch);
  await assert.rejects(provider.calculateATS('resume', 'job'), (error: Error) => {
    assert.match(error.message, /Replace GROQ_API_KEY/);
    assert.doesNotMatch(error.message, /private information|test-only-key/);
    return true;
  });
  assert.equal(calls, 1);
});

test('rate limit is not retried automatically', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    return new Response('{}', { status: 429 });
  }) as typeof fetch;
  const provider = new GroqProvider('test-only-key', undefined, fakeFetch);
  await assert.rejects(provider.calculateATS('resume', 'job'), /rate limit/);
  assert.equal(calls, 1);
});

test('400 JSON generation failure is retried once without leaking provider content', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    if (calls === 1) {
      return new Response(JSON.stringify({ error: {
        code: 'json_validate_failed',
        message: 'Generated JSON does not match the expected schema. private resume',
        failed_generation: 'private resume',
      } }), { status: 400 });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(atsPayload) } }] }), { status: 200 });
  }) as typeof fetch;
  const provider = new GroqProvider('test-only-key', undefined, fakeFetch);
  assert.equal((await provider.calculateATS('private resume', 'job')).atsScore, 70);
  assert.equal(calls, 2);
});

test('400 model and unknown errors have safe, accurate messages and no automatic retry', async () => {
  for (const [providerMessage, expected] of [
    ['The model `bad-model` does not exist. private resume', /model is unavailable/],
    ['Unexpected private resume content', /rejected this request \(HTTP 400\)/],
  ] as const) {
    let calls = 0;
    const fakeFetch = (async () => {
      calls++;
      return new Response(JSON.stringify({ error: { message: providerMessage } }), { status: 400 });
    }) as typeof fetch;
    const provider = new GroqProvider('test-only-key', undefined, fakeFetch);
    await assert.rejects(provider.calculateATS('private resume', 'job'), (error: Error) => {
      assert.match(error.message, expected);
      assert.doesNotMatch(error.message, /private resume|test-only-key|bad-model/);
      return true;
    });
    assert.equal(calls, 1);
  }
});

test('unreachable service does not leak the key or submitted text', async () => {
  const fakeFetch = (async () => { throw new TypeError('test-only-key private resume'); }) as typeof fetch;
  const provider = new GroqProvider('test-only-key', undefined, fakeFetch);
  await assert.rejects(provider.calculateATS('private resume', 'job'), (error: Error) => {
    assert.match(error.message, /Cannot reach Groq/);
    assert.doesNotMatch(error.message, /test-only-key|private resume/);
    return true;
  });
});
