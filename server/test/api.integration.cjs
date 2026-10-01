const assert = require('node:assert/strict');
const { test } = require('node:test');
const { once } = require('node:events');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { readFile } = require('node:fs/promises');

test('account lifecycle, ownership, ATS caching, and auth limits over HTTP', { timeout: 240000 }, async (t) => {
  // Always isolated from the configured Atlas database, real storage, and real AI.
  Object.assign(process.env, {
    NODE_ENV: 'test', AI_PROVIDER: 'ollama', OLLAMA_MODEL: 'integration-test',
    PASSWORD_RESET_COOLDOWN_SECONDS: '0', UPLOAD_REQUEST_LIMIT: '100', AI_DAILY_LIMIT: '100',
    JWT_ACCESS_SECRET: 'isolated-integration-access-secret',
    JWT_REFRESH_SECRET: 'isolated-integration-refresh-secret',
    CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'test', CLOUDINARY_API_SECRET: 'test',
  });
  const database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  let server;
  t.after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await database.stop();
  });
  process.env.MONGODB_URI = database.getUri('careerpilot_integration');
  await mongoose.connect(process.env.MONGODB_URI);
  const app = require('../dist/app').default;
  const storage = require('../dist/services/cloudinary.service');
  let storageUploads = 0;
  const deletedAssets = [];
  const uploadMock = t.mock.method(storage, 'uploadBuffer', async (_buffer, folder, publicId) => {
    assert.match(publicId, /\.pdf$/, 'raw storage IDs retain the original file format');
    storageUploads++;
    return { public_id: `${folder}/test-${storageUploads}`, secure_url: 'https://example.test/test.pdf' };
  });
  const deleteMock = t.mock.method(storage, 'deleteFile', async (publicId, deliveryType) => {
    deletedAssets.push({ publicId, deliveryType });
  });
  const downloadedAssets = [];
  t.mock.method(storage, 'downloadFile', async (publicId, format, deliveryType) => {
    downloadedAssets.push({ publicId, format, deliveryType });
    return readFile('test/fixtures/synthetic-resume.pdf');
  });
  const provider = require('../dist/providers/ai').getAIProvider();
  let providerCalls = 0;
  const providerInputs = [];
  provider.calculateATS = async (resumeText, jobDescription) => {
    providerCalls++;
    providerInputs.push({ resumeText, jobDescription });
    return {
      atsScore: 80, matchPercentage: 80, keywordMatchPercentage: 80,
      matchingKeywords: ['React'], missingKeywords: ['Python'], matchingSkills: ['React'], missingSkills: ['Python'],
      importantRequirements: [], strengths: [], weaknesses: [], improvementSuggestions: [], keywordDensity: [],
      sectionMatching: { summary: true, skills: true, experience: true, education: true }, aiSummary: 'Test evaluation',
    };
  };
  let failInterviewGenerationOnce = false;
  provider.generateInterviewQuestions = async (_resumeText, targetRole, _jobDescription) => {
    if (failInterviewGenerationOnce) {
      failInterviewGenerationOnce = false;
      throw Object.assign(new Error('Synthetic provider failure'), { statusCode: 503, isOperational: true });
    }
    const types = ['technical', 'behavioral', 'resume', 'technical', 'behavioral', 'resume', 'technical', 'behavioral'];
    return { questions: types.map((type, index) => ({
      type, difficulty: index < 2 ? 'easy' : index < 6 ? 'medium' : 'hard',
      question: `${targetRole} practice question number ${index + 1}?`,
      intent: 'Test relevant and specific communication.',
      followUpPrompts: ['What was your specific contribution?'],
      answerGuidance: 'Use a clear structure and only verified examples.',
    })) };
  };
  provider.evaluateInterviewAnswer = async () => ({
    score: 82,
    rubric: { relevance: 90, specificity: 80, structure: 85, evidence: 75, communication: 80 },
    strengths: ['Directly addresses the question.'],
    improvements: ['Add one verified result.'],
    exampleAnswer: 'A stronger answer would preserve the same facts and add [your verified result].',
    followUpQuestion: 'How did you measure the outcome?',
  });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  let token;
  async function request(route, options = {}, accessToken = token) {
    const response = await fetch(`${baseUrl}${route}`, {
      ...options,
      headers: { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers },
    });
    return { response, body: await response.json() };
  }

  const registration = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Test User', email: 'first@example.test', password: 'TestPass123!' }) });
  assert.equal(registration.response.status, 201);
  assert.equal(registration.body.data.user.password, undefined);
  token = registration.body.data.accessToken;
  const originalToken = token;
  let cookie = registration.response.headers.get('set-cookie').split(';')[0];
  const refreshed = await request('/auth/refresh', { method: 'POST', headers: { Cookie: cookie } }, null);
  assert.equal(refreshed.response.status, 200);
  assert.ok(refreshed.body.data.accessToken);
  const simultaneousRefreshes = await Promise.all([
    request('/auth/refresh', { method: 'POST', headers: { Cookie: cookie } }, null),
    request('/auth/refresh', { method: 'POST', headers: { Cookie: cookie } }, null),
  ]);
  assert.deepEqual(simultaneousRefreshes.map(({ response }) => response.status), [200, 200]);

  const profile = await request('/auth/profile', {
    method: 'PATCH', body: JSON.stringify({ name: 'Updated Test User', email: 'updated@example.test', currentPassword: 'TestPass123!' }),
  });
  assert.equal(profile.response.status, 200);
  assert.equal(profile.body.data.user.name, 'Updated Test User');
  assert.equal(profile.body.data.user.email, 'updated@example.test');
  const preferences = await request('/auth/preferences', { method: 'PATCH', body: JSON.stringify({ theme: 'dark' }) });
  assert.equal(preferences.response.status, 200);
  assert.equal(preferences.body.data.user.preferences.theme, 'dark');

  const changedPassword = await request('/auth/change-password', {
    method: 'POST', body: JSON.stringify({ currentPassword: 'TestPass123!', newPassword: 'ChangedPass123!' }),
  });
  assert.equal(changedPassword.response.status, 200);
  token = changedPassword.body.data.accessToken;
  cookie = changedPassword.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/auth/me', {}, originalToken)).response.status, 401, 'password change expires older access tokens');

  const { testEmailOutbox } = require('../dist/services/email.service');
  const outboxBeforeUnknown = testEmailOutbox.length;
  assert.equal((await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: 'unknown@example.test' }) }, null)).response.status, 200);
  assert.equal(testEmailOutbox.length, outboxBeforeUnknown, 'unknown emails receive the same response without producing mail');
  assert.equal((await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: 'updated@example.test' }) }, null)).response.status, 200);
  const expiredMail = testEmailOutbox.at(-1);
  const expiredToken = new URL(expiredMail.resetUrl).searchParams.get('token');
  const { PasswordResetToken } = require('../dist/models/PasswordResetToken.model');
  await PasswordResetToken.updateMany({ userId: registration.body.data.user._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: expiredToken, password: 'ResetPass123!' }) }, null)).response.status, 400);

  assert.equal((await request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: 'updated@example.test' }) }, null)).response.status, 200);
  const resetMail = testEmailOutbox.at(-1);
  const resetToken = new URL(resetMail.resetUrl).searchParams.get('token');
  assert.equal((await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, password: 'ResetPass123!' }) }, null)).response.status, 200);
  assert.equal((await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, password: 'AnotherPass123!' }) }, null)).response.status, 400, 'reset token can be used only once');
  assert.equal((await request('/auth/refresh', { method: 'POST', headers: { Cookie: cookie } }, null)).response.status, 401, 'password reset expires prior refresh tokens');
  const resetLogin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'updated@example.test', password: 'ResetPass123!' }) }, null);
  assert.equal(resetLogin.response.status, 200);
  token = resetLogin.body.data.accessToken;
  cookie = resetLogin.response.headers.get('set-cookie').split(';')[0];
  const jwt = require('jsonwebtoken');
  const tokenPayload = jwt.decode(token);
  const expiredAccessToken = jwt.sign(
    { id: tokenPayload.id, email: tokenPayload.email, sessionVersion: tokenPayload.sessionVersion },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: -1 }
  );
  assert.equal((await request('/auth/me', {}, expiredAccessToken)).response.status, 401, 'expired access tokens are rejected');
  const second = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Other User', email: 'second@example.test', password: 'TestPass123!' }) }, null);
  assert.equal(second.response.status, 201);
  const otherToken = second.body.data.accessToken;
  const { Resume } = require('../dist/models/Resume.model');
  const pdf = await readFile('test/fixtures/synthetic-resume.pdf');
  const blank = await readFile('test/fixtures/blank-resume.pdf');
  async function upload(bytes, mime = 'application/pdf', field = 'resume', accessToken = token) {
    const form = new FormData();
    form.append(field, new Blob([bytes], { type: mime }), 'synthetic-resume.pdf');
    return request('/resumes/upload', { method: 'POST', body: form }, accessToken);
  }
  assert.equal((await upload(pdf, 'application/pdf', 'resume', null)).response.status, 401);
  assert.equal((await upload(Buffer.from('bad PDF'))).response.status, 422);
  assert.equal((await upload(blank)).response.status, 422);
  assert.equal((await upload(Buffer.alloc(0))).response.status, 422);
  assert.equal((await upload(pdf, 'text/plain')).response.status, 400);
  assert.equal((await upload(pdf, 'application/pdf', 'wrongField')).response.status, 400);
  assert.equal((await upload(Buffer.alloc(5 * 1024 * 1024 + 1))).response.status, 413);
  assert.equal(storageUploads, 0, 'invalid files must never reach Cloudinary');
  assert.equal(await Resume.countDocuments(), 0);
  assert.equal((await request('/resumes/not-an-id')).response.status, 422);

  uploadMock.mock.mockImplementationOnce(async () => { throw new Error('storage unavailable'); });
  assert.equal((await upload(pdf)).response.status, 503);
  const createMock = t.mock.method(Resume, 'create', async () => { throw new Error('database unavailable'); });
  assert.equal((await upload(pdf)).response.status, 500);
  createMock.mock.restore();
  assert.equal(deletedAssets.length, 1, 'failed metadata persistence removes only its newly uploaded asset');
  assert.equal(deletedAssets[0].deliveryType, 'authenticated');
  const uploaded = await upload(pdf);
  assert.equal(uploaded.response.status, 201);
  const resume = uploaded.body.data.resume;
  assert.match(resume.extractedText, /Alex Example/);
  assert.equal(resume.fileSize, pdf.length);
  assert.equal(resume.cloudinaryUrl, undefined, 'storage URLs are not returned to the browser');
  assert.equal(resume.cloudinaryPublicId, undefined);
  const resumeId = resume._id;
  assert.equal((await Resume.findById(resumeId)).cloudinaryDeliveryType, 'authenticated');
  assert.equal((await request(`/resumes/${resumeId}`, {}, otherToken)).response.status, 404);
  assert.equal((await request('/resumes', {}, null)).response.status, 401);
  const listedResumes = (await request('/resumes')).body.data.resumes;
  assert.equal(listedResumes.length, 1);
  assert.equal(listedResumes[0].cloudinaryUrl, undefined);
  const filePath = `/resumes/${resumeId}/file`;
  const fileRequest = (accessToken) => fetch(`${baseUrl}${filePath}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  assert.equal((await fileRequest(null)).status, 401);
  assert.equal((await fileRequest(otherToken)).status, 404);
  const originalFile = await fileRequest(token);
  assert.equal(originalFile.status, 200);
  assert.equal(originalFile.headers.get('content-type'), 'application/pdf');
  assert.equal(originalFile.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(Buffer.from(await originalFile.arrayBuffer()), pdf);
  assert.deepEqual(downloadedAssets.map(({ format, deliveryType }) => ({ format, deliveryType })), [
    { format: 'pdf', deliveryType: 'authenticated' },
  ]);

  provider.optimizeResume = async () => ({
    summary: 'An improvement report that must not enter the resume.',
    optimizedSummary: 'Suggested summary for human review.',
    experienceChanges: [{ original: 'Alex Example', optimized: 'Alex Updated', reason: 'Synthetic test change' }], projectChanges: [], skillChanges: [], bulletPointChanges: [],
    keywordRecommendations: ['Unverified keyword'], overallChanges: [], warnings: [],
  });
  const optimizerPath = `/resume-optimizer/${resumeId}`;
  const draftCreated = await request(optimizerPath, {
    method: 'POST', body: JSON.stringify({ jobDescription: 'We need a frontend developer with React and TypeScript experience building accessible applications.' }),
  });
  assert.equal(draftCreated.response.status, 200);
  const firstVersion = draftCreated.body.data.version;
  assert.equal(firstVersion.contentFormat, 'resume');
  assert.match(firstVersion.optimizedContent, /Alex Example/);
  assert.doesNotMatch(firstVersion.optimizedContent, /Alex Updated/, 'AI suggestions need explicit user acceptance');
  assert.doesNotMatch(firstVersion.optimizedContent, /Unverified keyword|An improvement report/);
  assert.equal((await request(`${optimizerPath}/${firstVersion.versionNumber}`, {}, otherToken)).response.status, 404);
  const savePath = `${optimizerPath}/${firstVersion.versionNumber}/content`;
  assert.equal((await request(savePath, { method: 'PATCH', body: JSON.stringify({ content: 'Changed', expectedUpdatedAt: firstVersion.updatedAt }) }, otherToken)).response.status, 404);
  const saved = await request(savePath, {
    method: 'PATCH', body: JSON.stringify({ content: 'Alex Example\nFrontend engineer\nReact experience', expectedUpdatedAt: firstVersion.updatedAt }),
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.body.data.version.source, 'manual');
  assert.equal(saved.body.data.version.optimizedContent, 'Alex Example\nFrontend engineer\nReact experience');
  assert.equal((await request(savePath, {
    method: 'PATCH', body: JSON.stringify({ content: 'Stale change', expectedUpdatedAt: firstVersion.updatedAt }),
  })).response.status, 409);
  for (const format of ['pdf', 'docx']) {
    const file = await fetch(`${baseUrl}${optimizerPath}/${firstVersion.versionNumber}/export/${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(file.status, 200);
    const bytes = Buffer.from(await file.arrayBuffer());
    assert.ok(bytes.length > 1000);
    assert.equal(bytes.subarray(0, 4).toString(), format === 'pdf' ? '%PDF' : 'PK\x03\x04');
    const { readResumeFile } = require('../dist/services/resumeFile.service');
    const extracted = await readResumeFile(
      bytes,
      format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    assert.match(extracted.extractedText, /Frontend engineer/);
    assert.doesNotMatch(extracted.extractedText, /Unverified keyword/);
    assert.match(file.headers.get('content-disposition'), new RegExp(`\\.${format}`));
    assert.equal((await fetch(`${baseUrl}${optimizerPath}/${firstVersion.versionNumber}/export/${format}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    })).status, 404);
  }

  const jobA = 'We need a frontend developer with React and TypeScript experience building accessible applications.';
  const jobB = 'We need a backend developer with Python and SQL experience developing reliable REST services.';
  const first = await request(`/ats/${resumeId}`, { method: 'POST', body: JSON.stringify({ jobDescription: jobA }) });
  assert.equal(first.response.status, 200);
  assert.equal(providerCalls, 1);
  await request(`/ats/${resumeId}`, { method: 'POST', body: JSON.stringify({ jobDescription: jobA }) });
  assert.equal(providerCalls, 1, 'same job should use cache');
  const changed = await request(`/ats/${resumeId}`, { method: 'POST', body: JSON.stringify({ jobDescription: jobB }) });
  assert.equal(changed.response.status, 200);
  assert.equal(providerCalls, 2, 'different job must generate a new evaluation');
  assert.equal(changed.body.data.atsResult.jobDescription, jobB);
  const comparePath = `${optimizerPath}/${firstVersion.versionNumber}/ats-comparison`;
  assert.equal((await request(comparePath, { method: 'POST', body: '{}' }, otherToken)).response.status, 404);
  const comparison = await request(comparePath, { method: 'POST', body: '{}' });
  assert.equal(comparison.response.status, 200);
  assert.equal(providerCalls, 4, 'comparison scores the original and edited draft when no matching baseline exists');
  assert.equal(providerInputs[2].resumeText, resume.extractedText);
  assert.equal(providerInputs[3].resumeText, saved.body.data.version.optimizedContent);
  assert.equal(providerInputs[2].jobDescription, jobA);
  assert.equal(providerInputs[3].jobDescription, jobA);
  const scoredVersion = comparison.body.data.version;
  assert.equal(scoredVersion.targetJobDescription, jobA, 'comparison keeps the optimization target, not a later ATS job');
  assert.ok(Number.isInteger(scoredVersion.atsScoreBefore));
  assert.ok(Number.isInteger(scoredVersion.atsScoreAfter));
  assert.ok(scoredVersion.atsScoreBefore >= 0 && scoredVersion.atsScoreBefore <= 100);
  assert.ok(scoredVersion.atsScoreAfter >= 0 && scoredVersion.atsScoreAfter <= 100);
  assert.equal((await request(`${optimizerPath}/${firstVersion.versionNumber}/ats-score`, {
    method: 'PATCH', body: JSON.stringify({ atsScoreAfter: 100 }),
  })).response.status, 404, 'clients cannot assign arbitrary ATS scores');
  const revised = await request(savePath, {
    method: 'PATCH', body: JSON.stringify({ content: 'Alex Example\nFrontend engineer\nReact experience\nUpdated wording', expectedUpdatedAt: scoredVersion.updatedAt }),
  });
  assert.equal(revised.response.status, 200);
  assert.equal(revised.body.data.version.atsScoreAfter, null, 'editing invalidates the after score');
  const { ResumeVersion } = require('../dist/models/ResumeVersion.model');
  await ResumeVersion.updateOne({ _id: firstVersion._id }, { $unset: { targetJobDescription: 1 } });
  assert.equal((await request(comparePath, { method: 'POST', body: '{}' })).response.status, 400,
    'legacy versions must not silently use a mutable ATS job description');
  assert.equal((await request(comparePath, {
    method: 'POST', body: JSON.stringify({ jobDescription: jobA }),
  })).response.status, 200);
  const secondDraft = await request(optimizerPath, {
    method: 'POST', body: JSON.stringify({ jobDescription: jobA }),
  });
  assert.equal(secondDraft.response.status, 200);
  assert.equal(secondDraft.body.data.version.versionNumber, 2);
  assert.equal((await request(`${optimizerPath}/2`, { method: 'DELETE' })).response.status, 200);
  const thirdDraft = await request(optimizerPath, {
    method: 'POST', body: JSON.stringify({ jobDescription: jobA }),
  });
  assert.equal(thirdDraft.response.status, 200);
  assert.equal(thirdDraft.body.data.version.versionNumber, 3, 'deleted draft numbers must not be reused');

  const followUpDate = new Date(Date.now() + 3 * 86400000).toISOString();
  const applicationCreated = await request('/applications', {
    method: 'POST',
    body: JSON.stringify({
      company: 'Acme Labs', role: 'Frontend Engineer', url: 'https://example.test/jobs/frontend',
      description: jobA, status: 'saved', followUpDate, notes: 'Referred by a former teammate.',
      resumeId, resumeVersionNumber: firstVersion.versionNumber,
    }),
  });
  assert.equal(applicationCreated.response.status, 201);
  const application = applicationCreated.body.data.application;
  const applicationPath = `/applications/${application._id}`;
  assert.equal(application.resumeVersionNumber, firstVersion.versionNumber);
  assert.equal(application.events[0].kind, 'created');
  assert.equal((await request(applicationPath, {}, otherToken)).response.status, 404);
  assert.equal((await request(applicationPath, {
    method: 'PATCH', body: JSON.stringify({ status: 'applied' }),
  }, otherToken)).response.status, 404);
  assert.equal((await request(applicationPath, { method: 'DELETE' }, otherToken)).response.status, 404);
  assert.equal((await request('/applications', {
    method: 'POST', body: JSON.stringify({ company: 'Wrong Owner', role: 'Engineer', description: jobA, status: 'saved', resumeId }),
  }, otherToken)).response.status, 404, 'users cannot link another user\'s resume');

  const searchList = await request('/applications?search=Acme&status=saved');
  assert.equal(searchList.response.status, 200);
  assert.equal(searchList.body.data.applications.length, 1);
  assert.equal((await request('/applications?search=NoMatch')).body.data.applications.length, 0);
  const laterApplication = await request('/applications', {
    method: 'POST', body: JSON.stringify({
      company: 'Future Systems', role: 'UI Engineer', description: jobA, status: 'applied',
      followUpDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    }),
  });
  assert.equal(laterApplication.response.status, 201);
  const interviewed = await request(applicationPath, {
    method: 'PATCH', body: JSON.stringify({ status: 'interview', applicationDate: new Date().toISOString() }),
  });
  assert.equal(interviewed.response.status, 200);
  assert.deepEqual(interviewed.body.data.application.events.slice(-1)[0], {
    kind: 'status_changed', fromStatus: 'saved', toStatus: 'interview',
    occurredAt: interviewed.body.data.application.events.at(-1).occurredAt,
  });
  const analytics = await request('/applications/analytics');
  assert.equal(analytics.response.status, 200);
  assert.equal(analytics.body.data.analytics.total, 2);
  assert.equal(analytics.body.data.analytics.byStatus.applied, 1);
  assert.equal(analytics.body.data.analytics.byStatus.interview, 1);
  assert.equal(analytics.body.data.analytics.interviews, 1);
  assert.equal(analytics.body.data.analytics.upcomingFollowUps.length, 1);
  assert.ok(analytics.body.data.analytics.scoreHistory.length >= 1);
  assert.equal(analytics.body.data.analytics.recentActivity[0].applicationId, application._id);

  const archived = await request(applicationPath, { method: 'PATCH', body: JSON.stringify({ archived: true }) });
  assert.equal(archived.response.status, 200);
  assert.equal(archived.body.data.application.events.at(-1).kind, 'archived');
  assert.equal((await request('/applications')).body.data.applications.length, 1);
  assert.equal((await request('/applications?archived=true')).body.data.applications.length, 1);
  const restored = await request(applicationPath, { method: 'PATCH', body: JSON.stringify({ archived: false }) });
  assert.equal(restored.response.status, 200);
  assert.equal(restored.body.data.application.events.at(-1).kind, 'restored');
  const repinned = await request(applicationPath, {
    method: 'PATCH', body: JSON.stringify({ resumeVersionNumber: thirdDraft.body.data.version.versionNumber }),
  });
  assert.equal(repinned.response.status, 200);
  assert.equal(repinned.body.data.application.resumeVersionNumber, 3);

  const { InterviewSession } = require('../dist/models/InterviewSession.model');
  failInterviewGenerationOnce = true;
  assert.equal((await request('/interviews', {
    method: 'POST', body: JSON.stringify({ applicationId: application._id }),
  })).response.status, 503);
  assert.equal(await InterviewSession.countDocuments(), 0, 'failed generation does not create a partial session');
  const originalInterviewGenerator = provider.generateInterviewQuestions;
  let releaseSlowGeneration;
  let markGenerationStarted;
  const slowGenerationStarted = new Promise((resolve) => { markGenerationStarted = resolve; });
  const slowGenerationRelease = new Promise((resolve) => { releaseSlowGeneration = resolve; });
  provider.generateInterviewQuestions = async (...args) => {
    markGenerationStarted();
    await slowGenerationRelease;
    return originalInterviewGenerator(...args);
  };
  const slowInterviewRequest = request('/interviews', {
    method: 'POST', body: JSON.stringify({ applicationId: application._id }),
  });
  await slowGenerationStarted;
  assert.equal((await request('/interviews', {
    method: 'POST', body: JSON.stringify({ applicationId: application._id }),
  })).response.status, 409, 'a slow generation cannot be duplicated for the same application');
  releaseSlowGeneration();
  const interviewCreated = await slowInterviewRequest;
  provider.generateInterviewQuestions = originalInterviewGenerator;
  assert.equal(interviewCreated.response.status, 201);
  const interview = interviewCreated.body.data.session;
  const interviewPath = `/interviews/${interview._id}`;
  assert.equal(interview.targetRole, 'Frontend Engineer');
  assert.equal(interview.jobDescription, jobA);
  assert.equal(interview.resumeTextSnapshot, undefined, 'resume snapshots are never returned by the API');
  assert.equal(interview.resumeVersionNumber, 3);
  assert.equal(interview.questions.length, 8);
  assert.deepEqual(new Set(interview.questions.map((question) => question.type)), new Set(['technical', 'behavioral', 'resume']));
  assert.equal((await request(interviewPath, {}, otherToken)).response.status, 404);
  assert.equal((await request(`${interviewPath}/questions/${interview.questions[0]._id}/answer`, {
    method: 'POST', body: JSON.stringify({ answer: 'This is a sufficiently detailed practice answer with a verified example.' }),
  }, otherToken)).response.status, 404);
  assert.equal((await request(`${interviewPath}/questions/${interview.questions[0]._id}/answer`, {
    method: 'POST', body: JSON.stringify({ answer: 'Too short' }),
  })).response.status, 422);
  const answeredInterview = await request(`${interviewPath}/questions/${interview.questions[0]._id}/answer`, {
    method: 'POST', body: JSON.stringify({ answer: 'I used React to build an accessible interface and verified it with keyboard testing.' }),
  });
  assert.equal(answeredInterview.response.status, 200);
  assert.equal(answeredInterview.body.data.session.questions[0].feedback.score, 82);
  assert.equal(answeredInterview.body.data.session.questions[0].answer.includes('keyboard testing'), true);
  assert.equal(answeredInterview.body.data.session.questions[0].feedback.exampleAnswer.includes('keyboard testing'), true);
  assert.equal(answeredInterview.body.data.session.questions[0].feedback.exampleAnswer.includes('stronger answer would'), false,
    'provider-written examples are replaced by the grounded template');
  const completedInterview = await request(interviewPath, { method: 'PATCH', body: JSON.stringify({ status: 'completed' }) });
  assert.equal(completedInterview.response.status, 200);
  assert.equal(completedInterview.body.data.session.status, 'completed');
  assert.equal((await request('/interviews')).body.data.sessions.length, 1, 'saved sessions are restored through history');
  assert.equal((await request(interviewPath)).body.data.session.questions[0].feedback.score, 82);
  assert.equal((await request(interviewPath, { method: 'DELETE' }, otherToken)).response.status, 404);

  assert.equal((await request(`${optimizerPath}/3`, { method: 'DELETE' })).response.status, 200);
  const afterVersionDelete = await request(applicationPath);
  assert.equal(afterVersionDelete.body.data.application.resumeId, resumeId, 'deleting a version preserves the resume link');
  assert.equal(afterVersionDelete.body.data.application.resumeVersionNumber, null, 'deleted versions are unpinned from applications');
  const interviewAfterVersionDelete = await request(interviewPath);
  assert.equal(interviewAfterVersionDelete.body.data.session.resumeId, resumeId);
  assert.equal(interviewAfterVersionDelete.body.data.session.resumeVersionNumber, null);

  assert.equal((await request(`/ats/${resumeId}`, {}, otherToken)).response.status, 404);
  assert.equal((await request(`/resumes/${resumeId}`, { method: 'DELETE' }, otherToken)).response.status, 404);
  assert.equal(deletedAssets.length, 1, 'another user cannot delete the stored file');

  deleteMock.mock.mockImplementationOnce(async () => { throw new Error('temporary storage failure'); });
  const deleted = await request(`/resumes/${resumeId}`, { method: 'DELETE' });
  assert.equal(deleted.response.status, 202);
  assert.equal(deleted.body.data.storageCleanupPending, true);
  assert.equal(await Resume.countDocuments({ _id: resumeId }), 0);
  assert.equal(await ResumeVersion.countDocuments({ resumeId }), 0);
  const unlinkedApplication = await request(applicationPath);
  assert.equal(unlinkedApplication.response.status, 200, 'deleting a resume keeps the application history');
  assert.equal(unlinkedApplication.body.data.application.resumeId, null);
  assert.equal(unlinkedApplication.body.data.application.resumeVersionId, null);
  assert.equal(unlinkedApplication.body.data.application.resumeVersionNumber, null);
  const interviewAfterResumeDelete = await request(interviewPath);
  assert.equal(interviewAfterResumeDelete.body.data.session.resumeId, null);
  assert.equal(interviewAfterResumeDelete.body.data.session.questions[0].feedback.score, 82, 'session snapshots survive source deletion');
  const { ATSResult } = require('../dist/models/ATSResult.model');
  assert.equal(await ATSResult.countDocuments({ resumeId }), 0);
  const { PendingFileDeletion } = require('../dist/models/PendingFileDeletion.model');
  assert.equal(await PendingFileDeletion.countDocuments({ resumeId }), 1);
  const { retryPendingFileDeletions } = require('../dist/services/resume.service');
  await retryPendingFileDeletions();
  assert.equal(await PendingFileDeletion.countDocuments({ resumeId }), 0);
  assert.equal(deletedAssets.length, 2, 'pending file cleanup succeeds on retry');
  assert.equal(deletedAssets[1].deliveryType, 'authenticated');

  const secondUpload = await upload(pdf, 'application/pdf', 'resume', otherToken);
  assert.equal(secondUpload.response.status, 201);
  const secondResumeId = secondUpload.body.data.resume._id;
  const secondApplication = await request('/applications', {
    method: 'POST', body: JSON.stringify({
      company: 'Cleanup Corp', role: 'QA Engineer', description: jobB, status: 'applied', resumeId: secondResumeId,
    }),
  }, otherToken);
  assert.equal(secondApplication.response.status, 201);
  const secondInterview = await request('/interviews', {
    method: 'POST', body: JSON.stringify({ applicationId: secondApplication.body.data.application._id }),
  }, otherToken);
  assert.equal(secondInterview.response.status, 201);
  const { JobApplication } = require('../dist/models/JobApplication.model');
  assert.equal((await request('/auth/account', {
    method: 'DELETE', body: JSON.stringify({ password: 'incorrect' }),
  }, otherToken)).response.status, 401);
  const accountDeleted = await request('/auth/account', {
    method: 'DELETE', body: JSON.stringify({ password: 'TestPass123!' }),
  }, otherToken);
  assert.equal(accountDeleted.response.status, 200);
  assert.equal(accountDeleted.body.data.storageCleanupPending, false);
  assert.equal(await Resume.countDocuments({ _id: secondResumeId }), 0);
  assert.equal(await JobApplication.countDocuments({ userId: second.body.data.user._id }), 0);
  assert.equal(await InterviewSession.countDocuments({ userId: second.body.data.user._id }), 0);
  const { User } = require('../dist/models/User.model');
  assert.equal(await User.countDocuments({ email: 'second@example.test' }), 0);
  assert.equal((await request('/auth/me', {}, otherToken)).response.status, 401, 'deleted account cannot reuse its access token');
  assert.equal(deletedAssets.length, 3, 'account deletion also deletes stored resume files');
  assert.equal(deletedAssets[2].deliveryType, 'authenticated');

  assert.equal((await request(applicationPath, { method: 'DELETE' })).response.status, 200);
  assert.equal((await request(applicationPath)).response.status, 404);
  assert.equal((await request(interviewPath)).body.data.session.jobApplicationId, null, 'job deletion preserves standalone practice history');

  const loginStatuses = [];
  for (let index = 0; index < 11; index++) {
    const failed = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'updated@example.test', password: 'wrongpassword' }) }, null);
    loginStatuses.push(failed.response.status);
    if (failed.response.status === 429) break;
  }
  assert.ok(loginStatuses.some((status) => status === 401), 'invalid credentials are rejected before the limiter engages');
  assert.equal(loginStatuses.at(-1), 429);
  assert.equal((await request('/auth/me')).response.status, 200);
  assert.equal((await request('/auth/refresh', { method: 'POST', headers: { Cookie: cookie } }, null)).response.status, 200);
  assert.equal((await request('/auth/logout', { method: 'POST', headers: { Cookie: cookie } }, null)).response.status, 200);
  assert.equal((await request('/auth/me')).response.status, 401, 'logout invalidates the active token server-side');
});
