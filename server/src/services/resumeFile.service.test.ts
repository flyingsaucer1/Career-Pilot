import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { readResumeFile, MAX_RESUME_FILE_BYTES } from './resumeFile.service';

test('extracts the synthetic PDF without generated page labels', async () => {
  const fixture = await readFile('test/fixtures/synthetic-resume.pdf');
  const result = await readResumeFile(fixture, 'application/pdf');
  assert.equal(result.fileType, 'pdf');
  assert.match(result.extractedText, /Alex Example/);
  assert.match(result.extractedText, /TypeScript/);
  assert.doesNotMatch(result.extractedText, /-- 1 of 1 --/);
});

test('blank PDFs are rejected even when the parser produces page labels', async () => {
  const fixture = await readFile('test/fixtures/blank-resume.pdf');
  await assert.rejects(readResumeFile(fixture, 'application/pdf'), /No readable text.*OCR/);
});

test('rejects empty, corrupt, unsupported and oversized files before storage', async () => {
  await assert.rejects(readResumeFile(Buffer.alloc(0), 'application/pdf'), /file is empty/);
  await assert.rejects(readResumeFile(Buffer.from('not a PDF'), 'application/pdf'), /could not be read/);
  await assert.rejects(readResumeFile(Buffer.from('not a DOCX'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), /could not be read/);
  await assert.rejects(readResumeFile(Buffer.from('hello'), 'text/plain'), /Only PDF and DOCX/);
  await assert.rejects(readResumeFile(Buffer.alloc(MAX_RESUME_FILE_BYTES + 1), 'application/pdf'), { statusCode: 413 });
});
