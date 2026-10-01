import dotenv from 'dotenv';
import { GroqProvider } from '../providers/ai/groq.provider';
import { OllamaProvider } from '../providers/ai/ollama.provider';
import { buildResumeDraft } from '../services/resumeDraft.service';

dotenv.config();

// Synthetic-only comparison. No stored resume or user document is read.
const resume = `Avery Sample
B.Sc. Computer Science, 2024
Junior Developer, Northstar Apps, June 2024–Present
- Built a React and TypeScript dashboard used by 40 staff.
- Reduced page load time 18% by using code splitting.
Project: Support tracker
- Built a support tracker API with Node.js, Express, and MongoDB.
Skills: React, TypeScript, Node.js, Express, MongoDB.`;

const job = `Frontend developer needed to build accessible React and TypeScript interfaces, improve web performance, and work with REST APIs. Experience deploying applications with AWS and Docker is preferred. Python familiarity is a plus.`;

const choice = process.argv[process.argv.indexOf('--provider') + 1];
const provider = choice === 'ollama'
  ? new OllamaProvider(
    process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    process.env.OLLAMA_MODEL || 'qwen3.5:4b',
    fetch,
    Number(process.env.OLLAMA_TIMEOUT_MS || 120000)
  )
  : choice === 'groq'
    ? new GroqProvider(
      process.env.GROQ_API_KEY || '',
      process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      fetch,
      Number(process.env.GROQ_TIMEOUT_MS || 90000)
    )
    : null;

if (!provider) throw new Error('Use --provider ollama or --provider groq.');

const run = async (): Promise<void> => {
  const started = performance.now();
  const result = await provider.optimizeResume(resume, job);
  const latencyMs = Math.round(performance.now() - started);
  const changes = [
    ...result.experienceChanges,
    ...result.projectChanges,
    ...result.skillChanges,
    ...result.bulletPointChanges,
  ];
  const draft = buildResumeDraft(resume, result);
  const unsupported = ['AWS', 'Docker', 'Python'];
  console.log(JSON.stringify({
    provider: provider.providerName,
    model: provider.providerVersion,
    latencyMs,
    suggestedEdits: changes.length,
    verbatimSourceEdits: changes.filter((item) => resume.includes(item.original.trim())).length,
    draftChanged: draft !== resume,
    unsupportedTermsInDraft: unsupported.filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(draft)),
    unsupportedTermsInOptimizedSummary: unsupported.filter((term) => new RegExp(`\\b${term}\\b`, 'i').test(result.optimizedSummary)),
    optimizedSummary: result.optimizedSummary,
    sampleEdits: changes.slice(0, 3).map((item) => ({ original: item.original, optimized: item.optimized })),
    warnings: result.warnings,
  }, null, 2));
};

void run().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Writing evaluation failed.');
  process.exitCode = 1;
});
