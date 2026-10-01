import assert from 'node:assert/strict';
import test from 'node:test';
import { buildGroundedExampleAnswer } from './interviewGrounding.service';

test('grounded interview examples preserve the submitted answer without provider inventions', () => {
  const answer = 'I changed the route bundle and measured an 18% improvement.';
  const example = buildGroundedExampleAnswer(answer);
  assert.ok(example.includes(answer));
  assert.match(example, /\[Briefly describe the verified context\.\]/);
  assert.match(example, /\[Add a verified outcome/);
  assert.doesNotMatch(example, /Lighthouse|dynamic imports|concurrent requests|race conditions/i);
});
