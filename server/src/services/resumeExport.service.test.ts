import assert from 'node:assert/strict';
import test from 'node:test';
import { createResumeDocx, createResumePdf } from './resumeExport.service';
import { readResumeFile } from './resumeFile.service';

test('PDF export preserves accented names and text through pagination', async () => {
  const content = 'Jose\u0301 Łukasz\nEXPERIENCE\n' + 'Built accessible React applications.\n'.repeat(90) + 'Final project retained.';
  const bytes = await createResumePdf(content);
  const parsed = await readResumeFile(bytes, 'application/pdf');
  assert.match(parsed.extractedText, /José Łukasz/u);
  assert.match(parsed.extractedText, /Final project retained\./);
});

test('PDF export rejects unsupported glyphs rather than silently corrupting text', async () => {
  await assert.rejects(createResumePdf('Example Name\n你好'), /Export Word to preserve them/);
});

test('Word export preserves multilingual resume text', async () => {
  const content = 'José Łukasz\nनमस्ते 你好\nEXPERIENCE\nBuilt React applications.';
  const bytes = await createResumeDocx(content);
  const parsed = await readResumeFile(bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.match(parsed.extractedText, /नमस्ते 你好/u);
  assert.match(parsed.extractedText, /Built React applications\./);
});
