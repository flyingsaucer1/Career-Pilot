import { z } from 'zod/v3';
import { providerSignal, assertRequestActive } from '../../services/aiRequestContext.service';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type {
  ATSResult,
  CoverLetterResult,
  IAIProvider,
  InterviewQuestionsResult,
  InterviewAnswerFeedbackResult,
  InterviewQuestion,
  ResumeAnalysisResult,
  ResumeOptimizationResult,
  SkillGapResult,
} from './ai.interface';
import { NotImplementedError } from './ai.interface';
import {
  analysisResultSchema,
  atsResultSchema,
  optimizationResultSchema,
  interviewQuestionsResultSchema,
  interviewAnswerFeedbackSchema,
} from './schemas';
import {
  buildResumeAnalysisPrompt,
  RESUME_ANALYSIS_SYSTEM_INSTRUCTION,
} from './prompts/resumeAnalysis.prompt';
import { buildATSPrompt, ATS_SYSTEM_INSTRUCTION } from './prompts/ats.prompt';
import {
  buildResumeOptimizerPrompt,
  RESUME_OPTIMIZER_SYSTEM_INSTRUCTION,
} from './prompts/resumeOptimizer.prompt';
import {
  buildInterviewFeedbackPrompt,
  buildInterviewQuestionsPrompt,
  INTERVIEW_SYSTEM_INSTRUCTION,
} from './prompts/interview.prompt';

type FetchLike = typeof fetch;

interface OllamaChatResponse {
  message?: {
    role: string;
    content: string;
  };
  error?: string;
}

const operationalError = (message: string, cause?: unknown, retryable = true): Error =>
  Object.assign(new Error(message), {
    statusCode: 503,
    isOperational: true,
    retryable,
    ...(cause === undefined ? {} : { cause }),
  });

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');

const timeoutError = (timeoutMs: number): Error => operationalError(
  `Ollama timed out after ${Math.round(timeoutMs / 1000)} seconds. Wait for the model to load, try a shorter resume, or increase OLLAMA_TIMEOUT_MS.`,
  undefined, false
);

/**
 * Local AI provider backed by Ollama's /api/chat endpoint.
 *
 * Ollama is deliberately accessed over HTTP instead of through a package so
 * the server has no additional runtime dependency and can use any locally
 * installed instruct model selected through OLLAMA_MODEL.
 */
export class OllamaProvider implements IAIProvider {
  readonly providerName = 'Ollama (local)';
  readonly providerVersion: string;

  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(baseUrl: string, model: string, fetchImpl: FetchLike = fetch, private readonly timeoutMs = 120_000) {
    if (!model.trim()) {
      throw operationalError('OLLAMA_MODEL must name an installed local model.');
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.providerVersion = model.trim();
    this.fetchImpl = fetchImpl;
  }

  private async generateStructured<T>(
    prompt: string,
    systemInstruction: string,
    schema: z.ZodType<T>,
    operation: string
  ): Promise<T> {
    assertRequestActive();
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.providerVersion,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          stream: false,
          format: zodToJsonSchema(schema as z.ZodTypeAny, { $refStrategy: 'none' }),
          think: false,
          options: { temperature: 0.1, num_ctx: 8192, num_batch: 128, num_predict: 4096 },
        }),
        signal: providerSignal(this.timeoutMs),
      });
    } catch (error) {
      if (isTimeout(error)) throw timeoutError(this.timeoutMs);
      throw operationalError(
        `Cannot reach Ollama at ${this.baseUrl}. Start Ollama and verify OLLAMA_BASE_URL.`,
        undefined, false
      );
    }

    let payload: OllamaChatResponse;
    try {
      payload = (await response.json()) as OllamaChatResponse;
    } catch (error) {
      if (isTimeout(error)) throw timeoutError(this.timeoutMs);
      throw operationalError(`Ollama returned an unreadable response for ${operation}.`, error);
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw operationalError(`Ollama model "${this.providerVersion}" is not installed. Download it with ollama pull ${this.providerVersion}.`, undefined, false);
      }
      throw operationalError(payload.error || `Ollama request failed with HTTP ${response.status}.`, undefined, response.status >= 500);
    }

    const content = payload.message?.content;
    if (!content) {
      throw operationalError(`Ollama returned no content for ${operation}.`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw operationalError(`Ollama returned invalid JSON for ${operation}.`, error);
    }

    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      const issues = validated.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw operationalError(`Ollama response failed ${operation} validation: ${issues}`);
    }

    return validated.data;
  }

  private async withRetry<T>(operation: string, attempt: () => Promise<T>): Promise<T> {
    try {
      return await attempt();
    } catch (firstError) {
      if ((firstError as Error & { retryable?: boolean }).retryable === false) throw firstError;
      console.warn(`[OllamaProvider] ${operation} response failed validation or generation; retrying once.`);
      try {
        return await attempt();
      } catch (secondError) {
        const message = secondError instanceof Error ? secondError.message : 'Unknown error';
        throw operationalError(`${operation} failed after retry: ${message}`, secondError);
      }
    }
  }

  async analyzeResume(text: string): Promise<ResumeAnalysisResult> {
    const prompt = buildResumeAnalysisPrompt(text);

    return this.withRetry('Resume analysis', () =>
      this.generateStructured(
        prompt,
        RESUME_ANALYSIS_SYSTEM_INSTRUCTION,
        analysisResultSchema,
        'resume analysis'
      )
    );
  }

  async calculateATS(resumeText: string, jobDescription: string): Promise<ATSResult> {
    const prompt = buildATSPrompt(resumeText, jobDescription);
    return this.withRetry('ATS analysis', () =>
      this.generateStructured(prompt, ATS_SYSTEM_INSTRUCTION, atsResultSchema, 'ATS analysis')
    );
  }

  async optimizeResume(
    resumeText: string,
    jobDescription: string,
    analysis?: ResumeAnalysisResult,
    atsResult?: ATSResult
  ): Promise<ResumeOptimizationResult> {
    const analysisSummary = analysis
      ? `Score: ${analysis.score}/100 | Grammar: ${analysis.grammarScore} | Readability: ${analysis.readabilityScore} | Formatting: ${analysis.formattingScore}
Weak bullets: ${analysis.weakBullets.slice(0, 3).join('; ') || 'none'}
Missing skills: ${analysis.missingSkills.slice(0, 5).join(', ') || 'none'}
Suggestions: ${analysis.suggestions.slice(0, 3).map((item) => `${item.priority}: ${item.description}`).join('; ') || 'none'}`
      : undefined;
    const atsSummary = atsResult
      ? `ATS Score: ${atsResult.atsScore}/100 | Match: ${atsResult.matchPercentage}% | Keywords: ${atsResult.keywordMatchPercentage}%
Missing keywords: ${atsResult.missingKeywords.slice(0, 8).join(', ') || 'none'}
Missing skills: ${atsResult.missingSkills.slice(0, 5).join(', ') || 'none'}
Strengths: ${atsResult.strengths.slice(0, 3).join('; ') || 'none'}
Weaknesses: ${atsResult.weaknesses.slice(0, 3).join('; ') || 'none'}`
      : undefined;
    const prompt = buildResumeOptimizerPrompt(
      resumeText,
      jobDescription,
      analysisSummary,
      atsSummary
    );

    return this.withRetry('Resume optimization', () =>
      this.generateStructured(
        prompt,
        RESUME_OPTIMIZER_SYSTEM_INSTRUCTION,
        optimizationResultSchema,
        'resume optimization'
      )
    );
  }

  async generateCoverLetter(
    _resumeText: string,
    _jobDescription: string
  ): Promise<CoverLetterResult> {
    throw new NotImplementedError('generateCoverLetter', 'Phase 7');
  }

  async generateInterviewQuestions(
    resumeText: string,
    targetRole: string,
    jobDescription: string
  ): Promise<InterviewQuestionsResult> {
    const prompt = buildInterviewQuestionsPrompt(resumeText, targetRole, jobDescription);
    return this.withRetry('Interview question generation', () => this.generateStructured(
      prompt, INTERVIEW_SYSTEM_INSTRUCTION, interviewQuestionsResultSchema, 'interview question generation'
    ));
  }

  async evaluateInterviewAnswer(
    resumeText: string,
    targetRole: string,
    question: InterviewQuestion,
    answer: string
  ): Promise<InterviewAnswerFeedbackResult> {
    const prompt = buildInterviewFeedbackPrompt(resumeText, targetRole, question, answer);
    return this.withRetry('Interview answer feedback', () => this.generateStructured(
      prompt, INTERVIEW_SYSTEM_INSTRUCTION, interviewAnswerFeedbackSchema, 'interview answer feedback'
    ));
  }

  async skillGapAnalysis(_resumeText: string, _targetRole: string): Promise<SkillGapResult> {
    throw new NotImplementedError('skillGapAnalysis', 'Phase 9');
  }
}
