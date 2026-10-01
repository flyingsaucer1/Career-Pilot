import type {
  ATSResult,
  CoverLetterResult,
  IAIProvider,
  InterviewAnswerFeedbackResult,
  InterviewQuestion,
  InterviewQuestionsResult,
  ResumeAnalysisResult,
  ResumeOptimizationResult,
  SkillGapResult,
} from './ai.interface';
import { assertRequestActive } from '../../services/aiRequestContext.service';

export interface AIProviderMetadata {
  providerName: string;
  providerVersion: string;
}

type ProviderFailure = Error & {
  fallbackEligible?: boolean;
  isOperational?: boolean;
  statusCode?: number;
};

const providerMetadata = Symbol('aiProviderMetadata');

type ResultWithProviderMetadata = {
  [providerMetadata]?: AIProviderMetadata;
};

const attachProviderMetadata = <T>(result: T, provider: IAIProvider): T => {
  if (result !== null && typeof result === 'object') {
    Object.defineProperty(result, providerMetadata, {
      value: {
        providerName: provider.providerName,
        providerVersion: provider.providerVersion,
      } satisfies AIProviderMetadata,
      enumerable: false,
      configurable: true,
      writable: false,
    });
  }
  return result;
};

export const getAIProviderMetadata = <T>(result: T, provider: IAIProvider): AIProviderMetadata => {
  if (result !== null && typeof result === 'object') {
    const metadata = (result as ResultWithProviderMetadata)[providerMetadata];
    if (metadata) return metadata;
  }
  return { providerName: provider.providerName, providerVersion: provider.providerVersion };
};

const allProvidersUnavailable = (): ProviderFailure => Object.assign(
  new Error('All configured AI providers are temporarily unavailable. Please try again shortly.'),
  { statusCode: 503, isOperational: true, fallbackEligible: true }
);

interface ProviderState {
  provider: IAIProvider;
  cooldownUntil: number;
}

export interface ProviderExecution<T> {
  result: T;
  metadata: AIProviderMetadata;
}

/**
 * Executes an operation against providers in priority order. A provider is
 * bypassed only when it reports a rate limit, timeout, network failure, or
 * service outage. Authentication, request, and validation failures remain
 * visible instead of being hidden by another model.
 */
export class FallbackAIProvider implements IAIProvider {
  readonly providerName = 'Automatic AI fallback';
  readonly providerVersion: string;

  private readonly states: ProviderState[];

  constructor(providers: IAIProvider[], private readonly cooldownMs = 60_000) {
    if (providers.length === 0) {
      throw Object.assign(new Error('No AI providers are configured for automatic fallback.'), {
        statusCode: 503,
        isOperational: true,
      });
    }
    this.states = providers.map((provider) => ({ provider, cooldownUntil: 0 }));
    this.providerVersion = providers
      .map((provider) => `${provider.providerName}:${provider.providerVersion}`)
      .join(' -> ');
  }

  async executeWithProvider<T>(
    operation: string,
    action: (provider: IAIProvider) => Promise<T>
  ): Promise<ProviderExecution<T>> {
    const now = Date.now();
    let attempted = false;
    let lastAvailabilityError: unknown;

    for (let index = 0; index < this.states.length; index++) {
      assertRequestActive();
      const state = this.states[index];
      if (state.cooldownUntil > now) continue;
      attempted = true;

      try {
        const result = await action(state.provider);
        const metadata = {
          providerName: state.provider.providerName,
          providerVersion: state.provider.providerVersion,
        };
        if (index > 0) {
          console.info(`[FallbackAIProvider] ${operation} completed with ${metadata.providerName}.`);
        }
        return { result: attachProviderMetadata(result, state.provider), metadata };
      } catch (error) {
        const failure = error as ProviderFailure;
        if (failure.fallbackEligible !== true) throw error;

        lastAvailabilityError = error;
        state.cooldownUntil = Date.now() + this.cooldownMs;
        const nextProvider = this.states
          .slice(index + 1)
          .find((candidate) => candidate.cooldownUntil <= Date.now())?.provider.providerName;
        console.warn(
          `[FallbackAIProvider] ${state.provider.providerName} is temporarily unavailable for ${operation}` +
          (nextProvider ? `; trying ${nextProvider}.` : '.')
        );
      }
    }

    if (attempted && lastAvailabilityError) throw lastAvailabilityError;
    throw allProvidersUnavailable();
  }

  private async run<T>(operation: string, action: (provider: IAIProvider) => Promise<T>): Promise<T> {
    return (await this.executeWithProvider(operation, action)).result;
  }

  analyzeResume(text: string): Promise<ResumeAnalysisResult> {
    return this.run('resume analysis', (provider) => provider.analyzeResume(text));
  }

  calculateATS(resumeText: string, jobDescription: string): Promise<ATSResult> {
    return this.run('ATS analysis', (provider) => provider.calculateATS(resumeText, jobDescription));
  }

  optimizeResume(
    resumeText: string,
    jobDescription: string,
    analysis?: ResumeAnalysisResult,
    atsResult?: ATSResult
  ): Promise<ResumeOptimizationResult> {
    return this.run('resume optimization', (provider) =>
      provider.optimizeResume(resumeText, jobDescription, analysis, atsResult)
    );
  }

  generateCoverLetter(resumeText: string, jobDescription: string): Promise<CoverLetterResult> {
    return this.run('cover letter generation', (provider) =>
      provider.generateCoverLetter(resumeText, jobDescription)
    );
  }

  generateInterviewQuestions(
    resumeText: string,
    targetRole: string,
    jobDescription: string
  ): Promise<InterviewQuestionsResult> {
    return this.run('interview question generation', (provider) =>
      provider.generateInterviewQuestions(resumeText, targetRole, jobDescription)
    );
  }

  evaluateInterviewAnswer(
    resumeText: string,
    targetRole: string,
    question: InterviewQuestion,
    answer: string
  ): Promise<InterviewAnswerFeedbackResult> {
    return this.run('interview answer feedback', (provider) =>
      provider.evaluateInterviewAnswer(resumeText, targetRole, question, answer)
    );
  }

  skillGapAnalysis(resumeText: string, targetRole: string): Promise<SkillGapResult> {
    return this.run('skill-gap analysis', (provider) =>
      provider.skillGapAnalysis(resumeText, targetRole)
    );
  }
}
