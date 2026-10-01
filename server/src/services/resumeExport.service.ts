import PDFDocument from 'pdfkit';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { resolve } from 'node:path';

const fontkit = require('fontkit') as { openSync: (path: string) => { hasGlyphForCodePoint: (codePoint: number) => boolean } };
const regularFont = resolve(__dirname, '../../assets/fonts/NotoSans-Regular.ttf');
const boldFont = resolve(__dirname, '../../assets/fonts/NotoSans-Bold.ttf');
let fontCoverage: ReturnType<typeof fontkit.openSync> | undefined;

const pdfText = (content: string): string => {
  const normalized = content.normalize('NFC');
  fontCoverage ??= fontkit.openSync(regularFont);
  for (const character of normalized) {
    if (/\s/u.test(character)) continue;
    if (!fontCoverage.hasGlyphForCodePoint(character.codePointAt(0)!)) {
      throw Object.assign(new Error('This PDF font does not support some characters in your draft. Export Word to preserve them.'), {
        statusCode: 422, isOperational: true,
      });
    }
  }
  return normalized;
};

const linesOf = (content: string): string[] => content.replace(/\r\n/g, '\n').split('\n');
const isHeading = (line: string): boolean =>
  /^(summary|profile|experience|professional experience|work experience|education|skills|technical skills|projects|certifications|achievements)$/i.test(line.trim()) ||
  (line.trim().length > 3 && line.trim().length < 55 && /^[A-Z\s&/-]+$/.test(line.trim()));

export const createResumePdf = (content: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const supportedContent = pdfText(content);
    const pdf = new PDFDocument({ size: 'A4', margin: 52, info: { Title: 'CareerPilot resume' } });
    pdf.registerFont('ResumeRegular', regularFont);
    pdf.registerFont('ResumeBold', boldFont);
    const chunks: Buffer[] = [];
    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('error', reject);
    pdf.on('end', () => resolve(Buffer.concat(chunks)));

    let firstText = true;
    for (const raw of linesOf(supportedContent)) {
      const line = raw.trim();
      if (!line) {
        pdf.moveDown(0.3);
        continue;
      }
      if (firstText) {
        pdf.font('ResumeBold').fontSize(17).fillColor('#152f3a').text(line, { lineGap: 2 });
        pdf.moveDown(0.45);
        firstText = false;
      } else if (isHeading(line)) {
        if (pdf.y > pdf.page.height - pdf.page.margins.bottom - 45) pdf.addPage();
        pdf.moveDown(0.2);
        pdf.font('ResumeBold').fontSize(10).fillColor('#087e74').text(line.toUpperCase(), { lineGap: 2 });
        pdf.moveDown(0.15);
      } else {
        pdf.font('ResumeRegular').fontSize(10).fillColor('#243743').text(line, { lineGap: 3 });
      }
    }
    pdf.end();
  });

export const createResumeDocx = async (content: string): Promise<Buffer> => {
  let firstText = true;
  const children = linesOf(content).map((raw) => {
    const line = raw.trim();
    if (!line) return new Paragraph({ text: '', spacing: { after: 90 } });
    if (firstText) {
      firstText = false;
      return new Paragraph({
        children: [new TextRun({ text: line, bold: true, size: 32, color: '152F3A' })],
        spacing: { after: 190 },
      });
    }
    if (isHeading(line)) {
      return new Paragraph({
        text: line.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        keepNext: true,
        spacing: { before: 230, after: 90 },
      });
    }
    return new Paragraph({
      children: [new TextRun({ text: line, size: 21, color: '243743' })],
      spacing: { after: 95 },
    });
  });
  const document = new Document({
    styles: {
      default: { document: { run: { font: 'Aptos', size: 21, color: '243743' } } },
      paragraphStyles: [{
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { font: 'Aptos', bold: true, size: 20, color: '000000' },
        paragraph: { keepNext: true, spacing: { before: 230, after: 90 } },
      }],
    },
    sections: [{
      properties: { page: { margin: { top: 800, right: 850, bottom: 800, left: 850 } } },
      children,
    }],
  });
  return Buffer.from(await Packer.toBuffer(document));
};
