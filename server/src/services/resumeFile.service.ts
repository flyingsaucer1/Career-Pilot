import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import type { ResumeFileType } from '../models/Resume.model';
import { validateDocxArchive } from './docxSafety.service';

export const MAX_RESUME_FILE_MB = process.env.NODE_ENV === 'production' ? 4 : 5;
export const MAX_RESUME_FILE_BYTES = MAX_RESUME_FILE_MB * 1024 * 1024;
export const RESUME_MIME_TYPES: Record<string, ResumeFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const fileError = (message: string, statusCode = 422): Error =>
  Object.assign(new Error(message), { statusCode, isOperational: true });

/** Reject unusable documents before paying for storage or saving metadata. */
export async function readResumeFile(buffer: Buffer, mimeType: string): Promise<{
  fileType: ResumeFileType;
  extractedText: string;
}> {
  const fileType = Object.prototype.hasOwnProperty.call(RESUME_MIME_TYPES, mimeType) ? RESUME_MIME_TYPES[mimeType] : undefined;
  if (!fileType) throw fileError('Only PDF and DOCX files are allowed.', 400);
  if (!buffer.length) throw fileError('The file is empty. Choose a text-based PDF or DOCX resume.');
  if (buffer.length > MAX_RESUME_FILE_BYTES) throw fileError(`File size must be ${MAX_RESUME_FILE_MB} MB or less.`, 413);

  let text: string;
  try {
    if (fileType === 'pdf') {
      if (!buffer.subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw new Error('Invalid PDF header');
      const parser = new PDFParse({ data: buffer });
      try {
        if ((await parser.getInfo()).total > 20) throw fileError('Resumes must be 20 pages or fewer. Upload a shorter document.');
        const result = await parser.getText();
        // The aggregate text contains generated page labels even for blank scans.
        text = result.pages.map((page) => page.text).join('\n');
      } finally {
        await parser.destroy();
      }
    } else {
      await validateDocxArchive(buffer);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }
  } catch (error) {
    if ((error as { isOperational?: boolean }).isOperational) throw error;
    throw fileError('The document could not be read. It may be corrupt or password-protected. Export a new text-based PDF or DOCX and try again.');
  }

  const extractedText = text.trim();
  if (extractedText.length > 100_000) throw fileError('This document contains too much text. Upload a shorter resume.');
  if (!/[\p{L}\p{N}]/u.test(extractedText)) {
    throw fileError('No readable text was found. Scanned/image-only resumes need OCR first; upload a text-based PDF or DOCX instead.');
  }
  return { fileType, extractedText };
}
