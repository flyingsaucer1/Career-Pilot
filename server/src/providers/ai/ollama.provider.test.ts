import assert from 'node:assert/strict';
import test from 'node:test';
import { OllamaProvider } from './ollama.provider';

test('sends a non-streaming JSON request and validates the ATS response', async () => {
  let capturedUrl = '';
  let capturedBody: Record<string, unknown> = {};
  const atsPayload = {
    atsScore: 70,
    matchPercentage: 65,
    keywordMatchPercentage: 60,
    matchingKeywords: ['TypeScript'],
    missingKeywords: ['Docker'],
    matchingSkills: ['React'],
    missingSkills: ['AWS'],
    importantRequirements: [
      { requirement: 'React experience', met: true, notes: 'Listed in projects' },
    ],
    strengths: ['Frontend experience'],
    weaknesses: ['No cloud evidence'],
    improvementSuggestions: [
      { priority: 'high', category: 'Skills', suggestion: 'Show relevant cloud experience.' },
    ],
    keywordDensity: [{ keyword: 'TypeScript', count: 1, recommended: 2 }],
    sectionMatching: {
      summary: true,
      skills: true,
      experience: false,
      education: true,
    },
    aiSummary: 'A reasonable match with some gaps.',
  };

  const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
    capturedUrl = input.toString();
    capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(
      JSON.stringify({ message: { role: 'assistant', content: JSON.stringify(atsPayload) } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  const provider = new OllamaProvider('http://127.0.0.1:11434/', 'local-test-model', fakeFetch);
  const result = await provider.calculateATS('React and TypeScript resume', 'React role with Docker');

  assert.equal(capturedUrl, 'http://127.0.0.1:11434/api/chat');
  assert.equal(capturedBody.model, 'local-test-model');
  assert.equal(capturedBody.stream, false);
  const format = capturedBody.format as { type: string; required: string[]; properties: Record<string, unknown> };
  assert.equal(format.type, 'object');
  assert.ok(format.required.includes('atsScore'));
  assert.ok(format.properties.matchingSkills);
  assert.equal(capturedBody.think, false);
  assert.equal(result.atsScore, 70);
  assert.deepEqual(result.missingSkills, ['AWS']);
});

test('a missing model gives installation instructions without retrying', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    return new Response(JSON.stringify({ error: 'model not found' }), { status: 404 });
  }) as typeof fetch;
  const provider = new OllamaProvider('http://localhost:11434', 'missing-model', fakeFetch);
  await assert.rejects(() => provider.calculateATS('resume', 'job'), /ollama pull missing-model/);
  assert.equal(calls, 1);
});

test('an inference timeout is not reported as an offline service or retried', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    throw new DOMException('expired', 'TimeoutError');
  }) as typeof fetch;
  const provider = new OllamaProvider('http://localhost:11434', 'test', fakeFetch, 5000);
  await assert.rejects(() => provider.calculateATS('resume', 'job'), /timed out after 5 seconds/);
  assert.equal(calls, 1);
});

test('an unreachable service gives startup guidance without retrying', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    throw new TypeError('fetch failed');
  }) as typeof fetch;
  const provider = new OllamaProvider('http://localhost:11434', 'test', fakeFetch);
  await assert.rejects(() => provider.calculateATS('resume', 'job'), /Start Ollama/);
  assert.equal(calls, 1);
});

test('a timeout while reading the response body is not retried', async () => {
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    const response = new Response('{}');
    Object.defineProperty(response, 'json', { value: async () => { throw new DOMException('body timed out', 'AbortError'); } });
    return response;
  }) as typeof fetch;
  const provider = new OllamaProvider('http://localhost:11434', 'test', fakeFetch, 5000);
  await assert.rejects(provider.calculateATS('resume', 'job'), /timed out after 5 seconds/);
  assert.equal(calls, 1);
});

test('rejects a local response that does not satisfy the schema', async () => {
  const fakeFetch = (async () =>
    new Response(
      JSON.stringify({ message: { role: 'assistant', content: JSON.stringify({ atsScore: 70 }) } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )) as typeof fetch;

  const provider = new OllamaProvider('http://127.0.0.1:11434', 'local-test-model', fakeFetch);

  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    await assert.rejects(
      () => provider.calculateATS('resume', 'job description'),
      /failed after retry/i
    );
  } finally {
    console.warn = originalWarn;
  }
});
