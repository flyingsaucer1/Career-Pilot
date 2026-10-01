const assert = require('node:assert/strict');
const { test } = require('node:test');
const { once } = require('node:events');
const { readFile } = require('node:fs/promises');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');

test('commercial security regressions in an isolated database', { timeout: 180000 }, async (t) => {
  const db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  Object.assign(process.env, { NODE_ENV: 'test', MONGODB_URI: db.getUri('security_regression'), AI_PROVIDER: 'ollama', OLLAMA_MODEL: 'mock',
    JWT_ACCESS_SECRET: 'isolated-security-access-secret', JWT_REFRESH_SECRET: 'isolated-security-refresh-secret', CLOUDINARY_CLOUD_NAME: 'mock', CLOUDINARY_API_KEY: 'mock', CLOUDINARY_API_SECRET: 'mock', PASSWORD_RESET_COOLDOWN_SECONDS: '60' });
  await mongoose.connect(process.env.MONGODB_URI);
  const app = require('../dist/app').default;
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await db.stop(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const post = (path, body) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const { User } = require('../dist/models/User.model');
  const { Resume } = require('../dist/models/Resume.model');
  const { ATSResult } = require('../dist/models/ATSResult.model');
  const { PendingFileDeletion } = require('../dist/models/PendingFileDeletion.model');
  const { resumeService } = require('../dist/services/resume.service');
  const { atsService } = require('../dist/services/ats.service');
  const { authService } = require('../dist/services/auth.service');
  const storage = require('../dist/services/cloudinary.service');
  t.mock.method(storage, 'deleteFile', async () => {});
  const owner = await User.create({ name: 'Synthetic owner', email: 'owner@example.test', password: 'SyntheticPass123!' });
  const provider = require('../dist/providers/ai').getAIProvider();
  for (const deletingAccount of [false, true]) {
    const user = deletingAccount ? await User.create({ name: 'Delete test', email: 'deleted@example.test', password: 'SyntheticPass123!' }) : owner;
    const resume = await Resume.create({ userId: user._id, fileName: 'synthetic.pdf', originalName: 'synthetic.pdf', fileSize: 100, fileType: 'pdf', cloudinaryPublicId: 'mock-only', cloudinaryUrl: 'https://example.test/mock', cloudinaryDeliveryType: 'authenticated', extractedText: 'React engineer. Skills: React. Education: BSc. Experience: Built React sites.' });
    let enter, finish;
    const entered = new Promise(resolve => enter = resolve), delayed = new Promise(resolve => finish = resolve);
    provider.calculateATS = async () => { enter(); await delayed; return { atsScore: 80, matchPercentage: 80, keywordMatchPercentage: 80, matchingKeywords: ['React'], missingKeywords: [], matchingSkills: ['React'], missingSkills: [], importantRequirements: [], strengths: [], weaknesses: [], improvementSuggestions: [], keywordDensity: [], sectionMatching: { summary: true, skills: true, experience: true, education: true }, aiSummary: 'Synthetic test' }; };
    const pending = atsService.calculateATS(user.id, resume.id, 'Frontend developer with React experience building accessible websites is required.');
    const rejected = assert.rejects(pending, error => error.statusCode === 409);
    await entered;
    if (deletingAccount) await authService.deleteAccount(user.id, 'SyntheticPass123!'); else await resumeService.deleteResume(user.id, resume.id);
    finish(); await rejected;
    assert.equal(await ATSResult.countDocuments({ resumeId: resume._id }), 0, 'late generation must not recreate deleted data');
  }
  const { MongoRateLimitStore } = require('../dist/services/rateLimit.service');
  const first = new MongoRateLimitStore('regression'), second = new MongoRateLimitStore('regression');
  first.init({ windowMs: 60000 }); second.init({ windowMs: 60000 });
  assert.equal((await first.increment('shared')).totalHits, 1); assert.equal((await second.increment('shared')).totalHits, 2);
  const { readResumeFile } = require('../dist/services/resumeFile.service');
  const pdf = await readFile('test/fixtures/synthetic-resume.pdf');
  t.mock.method(storage, 'uploadBuffer', async (_buffer, folder, name) => ({ public_id: `${folder}/${name}`, secure_url: 'https://example.test/private' }));
  const createMock = t.mock.method(Resume, 'create', async () => { throw new Error('Synthetic DB failure'); });
  storage.deleteFile = async () => { throw new Error('Synthetic storage failure'); };
  await assert.rejects(resumeService.uploadResume(owner.id, { buffer: pdf, mimetype: 'application/pdf', originalname: 'synthetic.pdf' }));
  createMock.mock.restore();
  const queued = await PendingFileDeletion.findOne({ userId: owner._id });
  assert.ok(queued, 'rollback failure has a durable cleanup record'); assert.equal(queued.attempts, 1);
  const cooldownStatuses = [];
  for (let i = 0; i < 6; i++) { const response = await post('/auth/forgot-password', { email: owner.email }); cooldownStatuses.push(response.status); await response.text(); }
  assert.deepEqual(cooldownStatuses, [200, 200, 200, 200, 200, 429]);
  assert.equal(require('../dist/services/email.service').testEmailOutbox.length, 1, 'per-account cooldown prevents email spam');
  const registrations = [];
  for (let i = 0; i < 11; i++) { const response = await post('/auth/register', { name: 'Synthetic signup', email: `registration${i}@example.test`, password: 'SyntheticPass123!', acceptTerms: true }); registrations.push(response.status); await response.text(); }
  assert.equal(registrations.filter(status => status === 201).length, 10); assert.equal(registrations.at(-1), 429);
  assert.equal((await post('/auth/login', { email: owner.email, password: 'A1a'.repeat(24) + 'suffix' })).status, 422);
  assert.ok((await readResumeFile(pdf, 'application/pdf')).extractedText);
});
