import type { IAIProvider } from './ai.interface';
import { GeminiProvider } from './gemini.provider';
import { OllamaProvider } from './ollama.provider';
import { GroqProvider } from './groq.provider';
import { FallbackAIProvider } from './fallback.provider';
import { env } from '../../config/env';

// ─────────────────────────────────────────────────────────────
// AI Provider Factory
//
// Returns the active provider based on env config.
// To swap providers in the future, update this file only.
// ─────────────────────────────────────────────────────────────

let _provider: IAIProvider | null = null;

export const getAIProvider = (): IAIProvider => {
  if (_provider) return _provider;

  if (env.AI_PROVIDER === 'fallback') {
    const providers: IAIProvider[] = [];
    if (env.GEMINI_API_KEY && (env.NODE_ENV !== 'production' || env.GEMINI_BILLING_VERIFIED)) providers.push(new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_TIMEOUT_MS));
    if (env.GROQ_API_KEY) {
      providers.push(new GroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL, fetch, env.GROQ_TIMEOUT_MS));
    }
    if (env.OLLAMA_MODEL) {
      providers.push(new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL, fetch, env.OLLAMA_TIMEOUT_MS));
    }
    _provider = new FallbackAIProvider(providers, env.AI_FALLBACK_COOLDOWN_MS);
    return _provider;
  }

  if (env.AI_PROVIDER === 'ollama') {
    if (!env.OLLAMA_MODEL) {
      throw Object.assign(
        new Error('Local AI is not configured. Set OLLAMA_MODEL to an installed Ollama model.'),
        { statusCode: 503, isOperational: true }
      );
    }
    _provider = new OllamaProvider(env.OLLAMA_BASE_URL, env.OLLAMA_MODEL, fetch, env.OLLAMA_TIMEOUT_MS);
    return _provider;
  }

  if (env.AI_PROVIDER === 'groq') {
    if (!env.GROQ_API_KEY) {
      throw Object.assign(
        new Error('Groq is not configured. Set GROQ_API_KEY in server/.env.'),
        { statusCode: 503, isOperational: true }
      );
    }
    _provider = new GroqProvider(env.GROQ_API_KEY, env.GROQ_MODEL, fetch, env.GROQ_TIMEOUT_MS);
    return _provider;
  }

  if (!env.GEMINI_API_KEY) {
    throw Object.assign(
      new Error('AI service is not configured. Please add GEMINI_API_KEY to your server .env file.'),
      { statusCode: 503, isOperational: true }
    );
  }
  _provider = new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_TIMEOUT_MS);
  return _provider;
};

export { GeminiProvider } from './gemini.provider';
export { OllamaProvider } from './ollama.provider';
export { GroqProvider } from './groq.provider';
export { FallbackAIProvider, getAIProviderMetadata } from './fallback.provider';
