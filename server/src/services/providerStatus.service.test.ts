import assert from 'node:assert/strict';
import test from 'node:test';
import { checkOllamaStatus } from './providerStatus.service';

test('availability requires the configured model, not just a running server', async () => {
  const fakeFetch = (async () => new Response(JSON.stringify({ models: [{ name: 'other:latest' }] }))) as typeof fetch;
  const result = await checkOllamaStatus('http://localhost:11434', 'wanted', fakeFetch);
  assert.equal(result.ready, false);
  assert.match(result.message, /Download wanted/);
});

test('availability recognizes an implicit latest tag', async () => {
  const fakeFetch = (async () => new Response(JSON.stringify({ models: [{ name: 'wanted:latest' }] }))) as typeof fetch;
  assert.equal((await checkOllamaStatus('http://localhost:11434', 'wanted', fakeFetch)).ready, true);
});

test('an offline service returns a useful status without throwing', async () => {
  const fakeFetch = (async () => { throw new TypeError('offline'); }) as typeof fetch;
  const result = await checkOllamaStatus('http://localhost:11434', 'wanted', fakeFetch);
  assert.equal(result.ready, false);
  assert.match(result.message, /Start Ollama/);
});
