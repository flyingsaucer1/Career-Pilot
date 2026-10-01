// Synthetic visual QA for the application's PDF and Word resume exporters.
const { mkdir, writeFile } = require('node:fs/promises');
const { join, resolve } = require('node:path');
const { createResumePdf, createResumeDocx } = require('../dist/services/resumeExport.service');

const content = `José Łukasz
Frontend Developer | jose@example.test | Bengaluru, India

SUMMARY
Frontend developer with experience building React and TypeScript interfaces and Node.js APIs. Improved page-load time by 18% through code splitting.

EXPERIENCE
Frontend Developer | Northstar Apps | 2023-Present
- Built a React dashboard used by 40 staff across two teams.
- Reduced page-load time by 18% through code splitting.
- Worked with designers to improve navigation and keyboard access.

PROJECTS
Support Tracker | React, TypeScript, Node.js, MongoDB
- Built a support-tracking API and responsive interface.
- Wrote automated tests for common request flows.

EDUCATION
B.Sc. Computer Science | 2023

SKILLS
React, TypeScript, JavaScript, Node.js, MongoDB, Git`;

async function main() {
  const output = resolve(__dirname, '../tmp/export-qa');
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'synthetic-resume.pdf'), await createResumePdf(content));
  await writeFile(join(output, 'synthetic-resume.docx'), await createResumeDocx(content));
  console.log('Synthetic exports created in server/tmp/export-qa.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
