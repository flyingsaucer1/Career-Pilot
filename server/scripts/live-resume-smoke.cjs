// Explicit opt-in: creates a unique synthetic test account/file in the configured
// Atlas and Cloudinary, runs real AI, and removes only that run's test records.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const { once } = require('node:events');

if (!process.argv.includes('--run')) {
  console.error('Opt in with --run. This test creates and cleans up synthetic records using your configured services.');
  process.exit(1);
}
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../dist/app').default;
const { connectDatabase } = require('../dist/config/db');
const { User } = require('../dist/models/User.model');
const { Resume } = require('../dist/models/Resume.model');
const { Analysis } = require('../dist/models/Analysis.model');
const { ATSResult } = require('../dist/models/ATSResult.model');
const { ResumeVersion } = require('../dist/models/ResumeVersion.model');
const { deleteFile } = require('../dist/services/cloudinary.service');
const email = `smoke-${randomUUID()}@example.test`;
const password = `Smoke-${randomUUID()}!`;
let userId;
let server;

async function main() {
  await connectDatabase();
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let token;
  async function request(route, options = {}) {
    const response = await fetch(`${base}${route}`, {
      ...options, signal: AbortSignal.timeout(650000),
      headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const body = await response.json();
    if (!response.ok) throw new Error(`${route}: HTTP ${response.status} ${body.message}`);
    return body.data;
  }
  const registered = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Synthetic Smoke Test', email, password }) });
  userId = registered.user._id;
  const loggedIn = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  token = loggedIn.accessToken;
  console.log('PASS: real account registration and login');
  const bytes = await readFile('test/fixtures/synthetic-resume.pdf');
  const form = new FormData();
  form.append('resume', new Blob([bytes], { type: 'application/pdf' }), 'synthetic-resume.pdf');
  const { resume } = await request('/resumes/upload', { method: 'POST', body: form });
  assert.match(resume.extractedText, /Alex Example/);
  console.log('PASS: real Cloudinary upload, PDF extraction, and Atlas save');
  const downloaded = await fetch(resume.cloudinaryUrl, { signal: AbortSignal.timeout(30000) });
  assert.equal(downloaded.status, 200, 'Cloudinary download must be accessible');
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
  console.log('PASS: downloaded PDF bytes match the upload');
  const started = performance.now();
  const { analysis } = await request(`/analysis/${resume._id}`, { method: 'POST', body: '{}' });
  assert.equal(analysis.resumeId, resume._id);
  assert.ok(Number.isFinite(analysis.score));
  const saved = await request(`/analysis/${resume._id}`);
  assert.equal(saved.analysis._id, analysis._id);
  console.log(`PASS: real AI analysis and saved retrieval (${Math.round((performance.now() - started) / 1000)} seconds)`);
}

async function cleanup() {
  if (userId) {
    // Verify the unique account identity before deleting any run-owned data.
    const owner = await User.findOne({ _id: userId, email });
    assert.ok(owner, 'Refusing cleanup without the exact synthetic account');
    const resumes = await Resume.find({ userId: owner._id });
    for (const resume of resumes) {
      assert.ok(resume.cloudinaryPublicId.startsWith(`careerpilot/resumes/${userId}/`));
      await deleteFile(resume.cloudinaryPublicId);
      const filter = { userId: owner._id, resumeId: resume._id };
      await Analysis.deleteMany(filter);
      await ATSResult.deleteMany(filter);
      await ResumeVersion.deleteMany(filter);
      await Resume.deleteOne({ _id: resume._id, userId: owner._id });
    }
    await User.deleteOne({ _id: owner._id, email });
    console.log('PASS: synthetic account, uploaded asset, and test records removed; existing user data untouched');
  }
}

main().catch((error) => {
  console.error('FAIL:', error instanceof Error ? error.message : 'Live smoke test failed');
  process.exitCode = 1;
}).finally(async () => {
  try { await cleanup(); }
  catch { console.error('FAIL: cleanup incomplete; inspect the unique smoke test account before retrying.'); process.exitCode = 1; }
  finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
});
