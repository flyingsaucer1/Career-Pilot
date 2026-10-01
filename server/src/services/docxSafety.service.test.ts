import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { validateDocxArchive } from './docxSafety.service';
test('rejects a compressed expansion bomb before resume extraction', async () => {
  const archive = new JSZip();
  archive.file('word/document.xml', 'x'.repeat(5 * 1024 * 1024));
  const bytes = await archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  assert.ok(bytes.length < 10000);
  await assert.rejects(validateDocxArchive(bytes), /safe expansion/);
});
test('requires a DOCX document entry rather than accepting an arbitrary zip', async () => {
  const archive = new JSZip(); archive.file('other.txt', 'hello');
  await assert.rejects(validateDocxArchive(await archive.generateAsync({ type: 'nodebuffer' })), /Missing DOCX/);
});
