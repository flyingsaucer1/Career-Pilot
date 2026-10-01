import assert from 'node:assert/strict';
import test from 'node:test';
import { applyOneSuggestion } from '../src/utils/resumeSuggestions.ts';

const change = (original, optimized) => ({ original, optimized, reason: 'Review first' });

test('applies only one selected suggestion and leaves the rest of the resume untouched', () => {
  const source = 'Alex Example\nBuilt React apps.\nSkills: React, TypeScript.';
  assert.equal(
    applyOneSuggestion(source, change('Built React apps.', 'Developed React applications.')),
    'Alex Example\nDeveloped React applications.\nSkills: React, TypeScript.'
  );
});

test('does not apply ambiguous, missing, or partial-word matches', () => {
  assert.equal(applyOneSuggestion('Built apps.\nBuilt apps.', change('Built apps.', 'Developed apps.')), null);
  assert.equal(applyOneSuggestion('JavaScript developer', change('Java', 'Core Java')), null);
  assert.equal(applyOneSuggestion('Node.js developer', change('Node', 'Core Node')), null);
  assert.equal(applyOneSuggestion('React developer', change('AWS', 'AWS expert')), null);
});

test('preserves surrounding resume text for a multiline accepted edit', () => {
  const source = 'Alex\r\nPROJECTS\r\nBuilt a tracker.\r\nSKILLS\r\nReact';
  assert.equal(
    applyOneSuggestion(source, change('PROJECTS\nBuilt a tracker.', 'PROJECTS\nDeveloped a tracker.')),
    'Alex\nPROJECTS\nDeveloped a tracker.\nSKILLS\nReact'
  );
});
