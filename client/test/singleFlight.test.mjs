import assert from 'node:assert/strict';
import test from 'node:test';
import { createSingleFlight } from '../src/utils/singleFlight.ts';

test('coalesces simultaneous refresh work and allows a later refresh', async () => {
  const flight = createSingleFlight();
  let calls = 0;
  const refresh = () => flight.run(async () => {
    calls += 1;
    await Promise.resolve();
    return `token-${calls}`;
  });

  assert.deepEqual(await Promise.all([refresh(), refresh(), refresh()]), ['token-1', 'token-1', 'token-1']);
  assert.equal(calls, 1);
  assert.equal(await refresh(), 'token-2');
  assert.equal(calls, 2);
});
