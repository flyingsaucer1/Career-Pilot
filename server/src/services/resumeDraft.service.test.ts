import assert from 'node:assert/strict';
import test from 'node:test';
import type { ResumeOptimizationResult } from '../providers/ai/ai.interface';
import { buildResumeDraft } from './resumeDraft.service';

const changes: ResumeOptimizationResult = {
  summary: 'Feedback', optimizedSummary: 'Suggested summary',
  experienceChanges: [{ original: 'Built React apps.', optimized: 'Developed React applications.', reason: 'Clarity' }],
  projectChanges: [{ original: 'Invented company', optimized: 'Fabricated result', reason: 'Unsupported' }],
  skillChanges: [], bulletPointChanges: [], keywordRecommendations: ['AWS'],
  overallChanges: ['Advice'], warnings: ['Check accuracy'],
};

test('draft contains resume text and grounded edits, never the change report', () => {
  const draft = buildResumeDraft('Alex Example\nBuilt React apps.\nEducation: BSc.', changes);
  assert.equal(draft, 'Alex Example\nDeveloped React applications.\nEducation: BSc.');
  assert.doesNotMatch(draft, /Fabricated result|Suggested summary|Advice|AWS/);
});

const suggestions = (
  items: Array<[string, string]>
): ResumeOptimizationResult => ({
  ...changes,
  experienceChanges: items.map(([original, optimized]) => ({ original, optimized, reason: 'Clarity' })),
  projectChanges: [],
});

test('suggestions cannot target text introduced by another suggestion', () => {
  const result = buildResumeDraft('Alex\nBuilt APIs', suggestions([
    ['Built APIs', 'Built React APIs'],
    ['React', 'Fabricated experience'],
  ]));
  assert.equal(result, 'Alex\nBuilt React APIs');
});

test('partial words and related technology names are not valid source matches', () => {
  const source = 'Alex\nJavaScript, C++, C#, Node.js, .NET, ReactNative';
  const result = buildResumeDraft(source, suggestions([
    ['Java', 'Expert Java'],
    ['C', 'Expert C'],
    ['Node', 'Expert Node'],
    ['NET', 'Expert NET'],
    ['React', 'Expert React'],
  ]));
  assert.equal(result, source);
});

test('whole standalone matches remain eligible beside related names and punctuation', () => {
  const result = buildResumeDraft('Alex\nJavaScript and Java.\n(C++)', suggestions([
    ['Java', 'Core Java'],
    ['C++', 'Modern C++'],
  ]));
  assert.equal(result, 'Alex\nJavaScript and Core Java.\n(Modern C++)');
});

test('repeated source snippets are left for manual review', () => {
  const source = 'Alex\nCompany A: Built APIs\nCompany B: Built APIs';
  assert.equal(buildResumeDraft(source, suggestions([
    ['Built APIs', 'Built REST APIs'],
  ])), source);
});

test('overlapping and contradictory suggestions are skipped while independent edits apply', () => {
  const result = buildResumeDraft('Alex\nBuilt React apps.\nPython\nEducation: BSc.', suggestions([
    ['Built React apps.', 'Developed React applications.'],
    ['React apps', 'web applications'],
    ['Python', 'Python 3'],
    ['Python', 'Python programming'],
    ['Education: BSc.', 'Education: B.Sc.'],
  ]));
  assert.equal(result, 'Alex\nBuilt React apps.\nPython\nEducation: B.Sc.');
});

test('multiple edits preserve source positions and identical recommendations apply once', () => {
  const report = suggestions([
    ['Built APIs.', 'Designed and built REST APIs.'],
    ['Wrote tests.', 'Tested software.'],
  ]);
  report.bulletPointChanges = [report.experienceChanges[0]];
  const originalReport = JSON.stringify(report);
  assert.equal(
    buildResumeDraft('  Alex\r\nBuilt APIs.\r\nWrote tests.  ', report),
    'Alex\nDesigned and built REST APIs.\nTested software.'
  );
  assert.equal(JSON.stringify(report), originalReport);
});
