import assert from 'node:assert/strict';
import test from 'node:test';
import type { ATSResult } from '../providers/ai/ai.interface';
import { applyHybridATSScoring } from './atsScoring.service';

const makeLLMResult = (): ATSResult => ({
  atsScore: 99,
  matchPercentage: 99,
  keywordMatchPercentage: 99,
  matchingKeywords: ['TypeScript', 'MongoDB'],
  missingKeywords: ['AWS', 'Docker'],
  matchingSkills: ['React', 'Node.js'],
  missingSkills: ['Kubernetes', 'C++'],
  importantRequirements: [
    { requirement: 'Build React applications', met: true, notes: 'Project experience' },
    { requirement: 'Deploy to AWS', met: false, notes: 'Not demonstrated' },
  ],
  strengths: ['Full-stack experience'],
  weaknesses: ['No deployment evidence'],
  improvementSuggestions: [],
  keywordDensity: [
    { keyword: 'TypeScript', count: 50, recommended: 2 },
    { keyword: 'AWS', count: 50, recommended: 1 },
  ],
  sectionMatching: {
    summary: true,
    skills: true,
    experience: false,
    education: true,
  },
  aiSummary: 'Potential fit.',
});

test('recomputes matches and score from resume evidence', () => {
  const resume = `
    Full-stack developer using React, Node.js and TypeScript.
    Built APIs with TypeScript and deployed MongoDB-backed applications.
  `;

  const result = applyHybridATSScoring(resume, makeLLMResult());

  assert.deepEqual(result.matchingKeywords, ['TypeScript', 'MongoDB']);
  assert.deepEqual(result.missingKeywords, ['AWS', 'Docker']);
  assert.deepEqual(result.matchingSkills, ['React', 'Node.js']);
  assert.deepEqual(result.missingSkills, ['Kubernetes', 'C++']);
  assert.equal(result.scoringBreakdown.keywordCoverage, 50);
  assert.equal(result.scoringBreakdown.skillCoverage, 50);
  assert.equal(result.scoringBreakdown.requirementCoverage, 50);
  assert.equal(result.scoringBreakdown.sectionCoverage, 75);
  assert.equal(result.atsScore, 53);
  assert.equal(result.matchPercentage, 50);
  assert.equal(result.keywordMatchPercentage, 50);
});

test('recomputes keyword density instead of trusting LLM counts', () => {
  const resume = 'TypeScript developer. Built a second TypeScript service.';
  const result = applyHybridATSScoring(resume, makeLLMResult());
  const typescript = result.keywordDensity.find((item) => item.keyword === 'TypeScript');
  const aws = result.keywordDensity.find((item) => item.keyword === 'AWS');

  assert.equal(typescript?.count, 2);
  assert.equal(typescript?.recommended, 2);
  assert.equal(aws?.count, 0);
});

test('does not confuse Java with JavaScript or C++ with plain C', () => {
  const llmResult = makeLLMResult();
  llmResult.matchingSkills = ['Java', 'C++'];
  llmResult.missingSkills = [];

  const result = applyHybridATSScoring('Built applications with JavaScript and C.', llmResult);

  assert.deepEqual(result.matchingSkills, []);
  assert.deepEqual(result.missingSkills, ['Java', 'C++']);
});

test('scores a qualified skill label by its technology without collapsing distinct products', () => {
  const llmResult = makeLLMResult();
  llmResult.matchingSkills = ['AWS deployment', 'React development', 'AWS Lambda'];
  llmResult.missingSkills = ['Docker experience', 'responsive web development'];

  const result = applyHybridATSScoring('Deployed React applications on AWS.', llmResult);

  assert.deepEqual(result.matchingSkills, ['AWS', 'React']);
  assert.deepEqual(result.missingSkills, ['AWS Lambda', 'Docker', 'responsive web development']);
  assert.equal(result.scoringBreakdown.skillCoverage, 40);
});

test('fills named JD skills omitted by the model and rejects model-only skills', () => {
  const llmResult = makeLLMResult();
  llmResult.matchingSkills = ['React development', 'Kubernetes'];
  llmResult.missingSkills = ['experience with Docker'];
  const result = applyHybridATSScoring(
    'Built a React dashboard in TypeScript.',
    llmResult,
    'Frontend role using React, TypeScript, Docker and AWS. No other tools required.'
  );

  assert.deepEqual(result.matchingSkills, ['React', 'TypeScript']);
  assert.deepEqual(result.missingSkills, ['Docker', 'AWS']);
  assert.equal(result.scoringBreakdown.skillCoverage, 50);
  assert.equal(result.scoringMethod, 'hybrid-v3');
});

test('keeps a compound JD skill separate without double-counting its prefix', () => {
  const llmResult = makeLLMResult();
  llmResult.matchingSkills = [];
  llmResult.missingSkills = [];
  const result = applyHybridATSScoring('Worked with AWS.', llmResult, 'Experience with AWS Lambda is required.');
  assert.deepEqual(result.matchingSkills, []);
  assert.deepEqual(result.missingSkills, ['AWS Lambda']);
});
