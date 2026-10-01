import dotenv from 'dotenv';
import type { IAIProvider } from '../providers/ai/ai.interface';
import { GeminiProvider } from '../providers/ai/gemini.provider';
import { OllamaProvider } from '../providers/ai/ollama.provider';
import { GroqProvider } from '../providers/ai/groq.provider';
import { applyHybridATSScoring } from '../services/atsScoring.service';
import { atsEvaluationCases } from './atsEvaluation.cases';

dotenv.config();

type ProviderChoice = 'gemini' | 'ollama' | 'groq' | 'both' | 'all';

const normalize = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();

const includesTerm = (terms: string[], expected: string): boolean => {
  const target = normalize(expected);
  return terms.some((term) => normalize(term) === target);
};

const readProviderChoice = (): ProviderChoice => {
  const index = process.argv.indexOf('--provider');
  const value = index >= 0 ? process.argv[index + 1] : 'both';
  if (value === 'gemini' || value === 'ollama' || value === 'groq' || value === 'both' || value === 'all') return value;
  throw new Error('--provider must be gemini, ollama, groq, both, or all.');
};

const readCases = () => {
  const index = process.argv.indexOf('--case');
  if (index < 0) return atsEvaluationCases;
  const id = process.argv[index + 1];
  const selected = atsEvaluationCases.filter((item) => item.id === id);
  if (selected.length === 0) {
    throw new Error(`Unknown --case value. Choose: ${atsEvaluationCases.map((item) => item.id).join(', ')}.`);
  }
  return selected;
};

const configuredProviders = (choice: ProviderChoice): IAIProvider[] => {
  const providers: IAIProvider[] = [];

  if (choice === 'gemini' || choice === 'both' || choice === 'all') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) providers.push(new GeminiProvider(apiKey));
    else console.warn('[eval] Skipping Gemini: GEMINI_API_KEY is not configured.');
  }

  if (choice === 'ollama' || choice === 'both' || choice === 'all') {
    const model = process.env.OLLAMA_MODEL;
    const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) {
      throw new Error('OLLAMA_TIMEOUT_MS must be between 1000 and 600000.');
    }
    if (model) {
      providers.push(
        new OllamaProvider(process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434', model, fetch, timeoutMs)
      );
    } else {
      console.warn('[eval] Skipping Ollama: OLLAMA_MODEL is not configured.');
    }
  }

  if (choice === 'groq' || choice === 'all') {
    const apiKey = process.env.GROQ_API_KEY;
    const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS || 90000);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) {
      throw new Error('GROQ_TIMEOUT_MS must be between 1000 and 600000.');
    }
    if (apiKey) providers.push(new GroqProvider(apiKey, process.env.GROQ_MODEL || 'openai/gpt-oss-120b', fetch, timeoutMs));
    else console.warn('[eval] Skipping Groq: GROQ_API_KEY is not configured.');
  }

  return providers;
};

const main = async (): Promise<void> => {
  const providers = configuredProviders(readProviderChoice());
  if (providers.length === 0) {
    throw new Error('No requested AI provider is configured. Check the server .env file.');
  }

  const rows: Array<Record<string, string | number>> = [];

  for (const provider of providers) {
    for (const evaluationCase of readCases()) {
      console.log(`[eval] ${provider.providerName}: ${evaluationCase.id}`);
      const startedAt = performance.now();
      try {
        const extracted = await provider.calculateATS(
          evaluationCase.resumeText,
          evaluationCase.jobDescription
        );
        const result = applyHybridATSScoring(evaluationCase.resumeText, extracted, evaluationCase.jobDescription);
        const expectedCount =
          evaluationCase.expectedMatchingSkills.length +
          evaluationCase.expectedMissingSkills.length;
        const correctCount =
          evaluationCase.expectedMatchingSkills.filter((skill) =>
            includesTerm(result.matchingSkills, skill)
          ).length +
          evaluationCase.expectedMissingSkills.filter((skill) =>
            includesTerm(result.missingSkills, skill)
          ).length;

        if (correctCount !== expectedCount) {
          console.log('[eval] Skill assertion details:', JSON.stringify({
            case: evaluationCase.id,
            expectedMatchesNotFound: evaluationCase.expectedMatchingSkills.filter((skill) => !includesTerm(result.matchingSkills, skill)),
            expectedMissingNotFound: evaluationCase.expectedMissingSkills.filter((skill) => !includesTerm(result.missingSkills, skill)),
            actualMatches: result.matchingSkills,
            actualMissing: result.missingSkills,
          }));
        }

        rows.push({
          provider: provider.providerName,
          model: provider.providerVersion,
          case: evaluationCase.id,
          status: correctCount === expectedCount ? 'pass' : 'assertion failure',
          skillAssertions: `${correctCount}/${expectedCount}`,
          atsScore: result.atsScore,
          latencyMs: Math.round(performance.now() - startedAt),
        });
      } catch (error) {
        rows.push({
          provider: provider.providerName,
          model: provider.providerVersion,
          case: evaluationCase.id,
          status: error instanceof Error ? `error: ${error.message}` : 'error',
          skillAssertions: '0/0',
          atsScore: 0,
          latencyMs: Math.round(performance.now() - startedAt),
        });
      }
    }
  }

  console.table(rows);
  const failed = rows.some((row) => row.status !== 'pass');
  if (failed) process.exitCode = 1;
};

void main().catch((error) => {
  console.error('[eval]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
