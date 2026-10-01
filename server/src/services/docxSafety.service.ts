import { fromBuffer } from 'yauzl';
/** Validate archive expansion before Mammoth materializes XML in memory. */
export function validateDocxArchive(buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error || !zip) { reject(new Error('Invalid DOCX archive')); return; }
      let entries = 0, declared = 0, actual = 0;
      let documentFound = false, finished = false;
      const fail = (reason: Error) => { if (finished) return; finished = true; clearTimeout(timer); zip.close(); reject(reason); };
      const timer = setTimeout(() => fail(new Error('DOCX validation timed out')), 5000);
      timer.unref();
      zip.on('error', fail);
      zip.on('end', () => { if (finished) return; finished = true; clearTimeout(timer); zip.close(); if (documentFound) resolve(); else reject(new Error('Missing DOCX document')); });
      zip.on('entry', (entry) => {
        entries++;
        declared += entry.uncompressedSize;
        if (entries > 300 || declared > 10 * 1024 * 1024 || entry.uncompressedSize > 4 * 1024 * 1024 || entry.generalPurposeBitFlag & 1) { fail(new Error('DOCX archive exceeds safe expansion limits')); return; }
        if (entry.fileName === 'word/document.xml') documentFound = true;
        if (entry.fileName.endsWith('/')) { zip.readEntry(); return; }
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) { fail(streamError ?? new Error('Unreadable DOCX entry')); return; }
          stream.on('error', fail);
          stream.on('data', (chunk: Buffer) => { actual += chunk.length; if (actual > 10 * 1024 * 1024) { stream.destroy(); fail(new Error('DOCX expands beyond the safe limit')); } });
          stream.on('end', () => { if (!finished) zip.readEntry(); });
        });
      });
      zip.readEntry();
    });
  });
}
