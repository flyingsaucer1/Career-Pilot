const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { readFile } = require('node:fs/promises');
const { resolve } = require('node:path');

async function main() {
  const { uploadBuffer, downloadFile, deleteFile, promoteFileToAuthenticated } = require('../dist/services/cloudinary.service');
  const { v2: cloudinary } = require('cloudinary');
  const fixture = await readFile(resolve(__dirname, '../test/fixtures/synthetic-resume.pdf'));
  const publicId = `security-smoke-${randomUUID()}.pdf`;
  let uploaded;
  let legacy;
  let legacyType = 'upload';

  try {
    uploaded = await uploadBuffer(fixture, 'careerpilot/security-smoke', publicId, 'application/pdf');
    assert.equal(uploaded.type, 'authenticated');
    const publicResponse = await fetch(uploaded.secure_url, { signal: AbortSignal.timeout(30_000) });
    assert.notEqual(publicResponse.status, 200, 'unsigned delivery must be denied');
    await publicResponse.body?.cancel();

    const downloaded = await downloadFile(uploaded.public_id, 'pdf', 'authenticated');
    assert.deepEqual(downloaded, fixture, 'owner-gated download must preserve exact bytes');

    legacy = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: 'careerpilot/security-smoke',
        public_id: `legacy-${randomUUID()}.pdf`,
        resource_type: 'raw',
        type: 'upload',
      }, (error, result) => error || !result ? reject(error || new Error('No upload result')) : resolve(result));
      stream.end(fixture);
    });
    await promoteFileToAuthenticated(legacy.public_id);
    legacyType = 'authenticated';
    assert.deepEqual(await downloadFile(legacy.public_id, 'pdf', 'authenticated'), fixture);
    console.log('Private storage smoke passed: unsigned new upload denied, signed bytes matched, and legacy conversion worked.');
  } finally {
    if (uploaded?.public_id?.startsWith('careerpilot/security-smoke/')) {
      await deleteFile(uploaded.public_id, 'authenticated');
    }
    if (legacy?.public_id?.startsWith('careerpilot/security-smoke/')) {
      await deleteFile(legacy.public_id, legacyType);
    }
  }
}

main().catch((error) => {
  console.error('Private storage smoke failed:', {
    name: error.name,
    message: error.message || error.error?.message || 'No provider error message',
    code: error.code || error.cause?.code,
    httpCode: error.http_code,
  });
  process.exitCode = 1;
});
