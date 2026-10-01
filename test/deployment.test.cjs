const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const production = {
  ...process.env, DOTENV_CONFIG_QUIET: 'true', NODE_ENV: 'production', VERCEL: '1',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/synthetic_not_connected',
  JWT_ACCESS_SECRET: 'a'.repeat(40), JWT_REFRESH_SECRET: 'b'.repeat(40),
  CLIENT_URL: 'https://careerpilot.example.org', CLOUDINARY_CLOUD_NAME: 'synthetic',
  CLOUDINARY_API_KEY: 'synthetic', CLOUDINARY_API_SECRET: 'synthetic',
  EMAIL_PROVIDER: 'resend', EMAIL_FROM: 'CareerPilot <support@example.org>', RESEND_API_KEY: 'synthetic',
  SUPPORT_EMAIL: 'support@example.org', SERVICE_OPERATOR: 'Synthetic operator',
  AI_DATA_POLICY_ACKNOWLEDGED: 'true', AI_PROVIDER: 'groq', GROQ_API_KEY: 'synthetic',
  GEMINI_API_KEY: '', GEMINI_BILLING_VERIFIED: 'false', OLLAMA_MODEL: '',
  CRON_SECRET: 'c'.repeat(40), PASSWORD_RESET_COOLDOWN_SECONDS: '60',
};
function config(overrides = {}) {
  return spawnSync(process.execPath, ['-e', "require('./server/dist/config/env')"], {
    cwd: path.resolve(__dirname, '..'), env: { ...production, ...overrides }, encoding: 'utf8',
  });
}
test('production configuration accepts hosted setup and fails closed on unsafe settings', () => {
  assert.equal(config().status, 0);
  for (const overrides of [
    { CLIENT_URL: 'http://localhost:5173' }, { JWT_REFRESH_SECRET: production.JWT_ACCESS_SECRET },
    { EMAIL_PROVIDER: 'console' }, { SUPPORT_EMAIL: '' }, { SERVICE_OPERATOR: '' },
    { AI_DATA_POLICY_ACKNOWLEDGED: 'false' }, { CRON_SECRET: '' },
    { AI_PROVIDER: 'gemini', GEMINI_API_KEY: 'synthetic', GEMINI_BILLING_VERIFIED: 'false' },
    { AI_PROVIDER: 'fallback', OLLAMA_MODEL: 'local-only' },
  ]) assert.equal(config(overrides).status, 1, JSON.stringify(overrides));
});
test('Vercel adapter restores API paths and queries without exposing rewrite parameters', async (t) => {
  const appPath = require.resolve('../server/dist/app');
  const dbPath = require.resolve('../server/dist/config/db');
  const savedApp = require.cache[appPath], savedDb = require.cache[dbPath];
  let received, fail = false;
  require.cache[appPath] = { id: appPath, filename: appPath, loaded: true, exports: { default: (req) => { received = req; } } };
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { connectDatabase: async () => { if (fail) throw new Error('synthetic private error'); } } };
  t.after(() => { delete require.cache[require.resolve('../api/index')]; if (savedApp) require.cache[appPath] = savedApp; else delete require.cache[appPath]; if (savedDb) require.cache[dbPath] = savedDb; else delete require.cache[dbPath]; });
  const handler = require('../api/index');
  await handler({ url: '/api/index?__route=ats%2Fsynthetic&version=2', query: { __route: 'ats/synthetic', version: '2' } }, {});
  assert.equal(received.url, '/api/ats/synthetic?version=2');
  assert.equal(received.query.__route, undefined);
  fail = true;
  const res = { setHeader() {}, end(value) { this.body = value; } };
  await handler({ url: '/api/ready' }, res);
  assert.equal(res.statusCode, 503);
  assert.ok(!res.body.includes('private error'));
});
