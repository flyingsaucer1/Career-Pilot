import { z } from 'zod/v3';
import { providerSignal, assertRequestActive } from '../../services/aiRequestContext.service';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type {
  ATSResult, CoverLetterResult, IAIProvider, InterviewQuestionsResult, InterviewAnswerFeedbackResult, InterviewQuestion,
  ResumeAnalysisResult, ResumeOptimizationResult, SkillGapResult,
} from './ai.interface';
import { NotImplementedError } from './ai.interface';
import { analysisResultSchema, atsResultSchema, optimizationResultSchema, interviewQuestionsResultSchema, interviewAnswerFeedbackSchema } from './schemas';
import { buildResumeAnalysisPrompt, RESUME_ANALYSIS_SYSTEM_INSTRUCTION } from './prompts/resumeAnalysis.prompt';
import { buildATSPrompt, ATS_SYSTEM_INSTRUCTION } from './prompts/ats.prompt';
import { buildResumeOptimizerPrompt, RESUME_OPTIMIZER_SYSTEM_INSTRUCTION } from './prompts/resumeOptimizer.prompt';
import { buildInterviewFeedbackPrompt, buildInterviewQuestionsPrompt, INTERVIEW_SYSTEM_INSTRUCTION } from './prompts/interview.prompt';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string | null; refusal?: string | null } }>;
}

interface GroqErrorResponse {
  error?: { code?: unknown; message?: unknown; type?: unknown; failed_generation?: unknown };
}

const operationalError = (message: string, retryable = false, fallbackEligible = false): Error =>
  Object.assign(new Error(message), {
    statusCode: 503,
    isOperational: true,
    retryable,
    fallbackEligible,
  });

// Only use provider error text to choose a fixed, safe message. Groq's raw
// error body may include the submitted resume or generated resume edits.
const badRequestError = (payload: GroqErrorResponse): Error => {
  const details = [payload.error?.code, payload.error?.type, payload.error?.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ').toLowerCase().slice(0, 4000);

  if (/json_validate_failed|failed_generation|generated json.*(schema|valid)/.test(details)) {
    return operationalError('Groq could not produce a valid structured response. Please try again.', true);
  }
  if (/(context.length|context_window|prompt.too.long|too.many.tokens|token.limit)/.test(details)) {
    return operationalError('Groq says this request is too long. Shorten the resume or job description and try again.');
  }
  if (/(model.*(not found|does not exist|unavailable|decommissioned|blocked)|invalid.model)/.test(details)) {
    return operationalError('The configured Groq model is unavailable. Check GROQ_MODEL and model permissions.');
  }
  if (/(json.schema|response.format|structured.output|strict.mode)/.test(details)) {
    return operationalError('This Groq model rejected strict structured output. Use a model that supports JSON Schema strict mode.');
  }
  if (/(content.policy|content.filter|safety)/.test(details)) {
    return operationalError('Groq could not process this content. Review the submitted text and try again.');
  }
  return operationalError('Groq rejected this request (HTTP 400). Please retry; if it persists, check the model settings.');
};

// Groq strict structured outputs require every object field to be required and
// additional properties to be forbidden, including nested array items.
const strictSchema = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(strictSchema);
  if (value === null || typeof value !== 'object') return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(source)) {
    if (key !== '$schema') result[key] = strictSchema(child);
  }
  if (result.type === 'object' && result.properties && typeof result.properties === 'object') {
    result.required = Object.keys(result.properties);
    result.additionalProperties = false;
  }
  return result;
};

/** Hosted Groq chat completions adapter. The key is kept server-side only. */
export class GroqProvider implements IAIProvider {
  readonly providerName = 'Groq (hosted)';
  readonly providerVersion: string;

  constructor(
    private readonly apiKey: string,
    model = 'openai/gpt-oss-120b',
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = 90_000
  ) {
    if (!apiKey.trim()) throw operationalError('Set GROQ_API_KEY in server/.env to enable Groq.');
    if (!model.trim()) throw operationalError('Set GROQ_MODEL to an available Groq model.');
    this.providerVersion = model.trim();
  }

  private async generateStructured<T>(
    prompt: string,
    instruction: string,
    schema: z.ZodType<T>,
    operation: string,
    schemaName: string
  ): Promise<T> {
    assertRequestActive();
    let response: Response;
    try {
      response = await this.fetchImpl(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.providerVersion,
          messages: [
            { role: 'system', content: instruction },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: schemaName,
              strict: true,
              schema: strictSchema(zodToJsonSchema(schema as z.ZodTypeAny, { $refStrategy: 'none' })),
            },
          },
        }),
        signal: providerSignal(this.timeoutMs),
      });
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw operationalError(
          `Groq timed out after ${Math.round(this.timeoutMs / 1000)} seconds. Try again later.`,
          false,
          true
        );
      }
      throw operationalError('Cannot reach Groq. Check your internet connection and try again.', false, true);
    }

    // Never surface the provider response body: it can contain submitted resume
    // text, request details, or other sensitive account information.
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw operationalError('Groq rejected the API key. Replace GROQ_API_KEY in server/.env.');
      }
      if (response.status === 429) {
        throw operationalError('Groq rate limit reached. Wait and try again.', false, true);
      }
      if (response.status === 400) {
        let payload: GroqErrorResponse = {};
        try {
          payload = await response.json() as GroqErrorResponse;
        } catch {
          // Keep the fallback message; do not expose a non-JSON response body.
        }
        throw badRequestError(payload);
      }
      throw operationalError(
        `Groq request failed with HTTP ${response.status}.`,
        false,
        response.status >= 500
      );
    }

    let payload: GroqChatResponse;
    try {
      payload = await response.json() as GroqChatResponse;
    } catch (error) {
      if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
        throw operationalError(
          `Groq timed out after ${Math.round(this.timeoutMs / 1000)} seconds. Try again later.`,
          false,
          true
        );
      }
      throw operationalError(`Groq returned an unreadable response for ${operation}.`);
    }

    const message = payload.choices?.[0]?.message;
    if (message?.refusal) throw operationalError(`Groq refused ${operation}. Try different input.`);
    if (!message?.content) throw operationalError(`Groq returned no content for ${operation}.`, true);

    let parsed: unknown;
    try {
      parsed = JSON.parse(message.content);
    } catch {
      throw operationalError(`Groq returned invalid JSON for ${operation}.`, true);
    }
    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw operationalError(`Groq response failed ${operation} validation.`, true);
    }
    return result.data;
  }

  private async withRetry<T>(attempt: () => Promise<T>): Promise<T> {
    try {
      return await attempt();
    } catch (error) {
      if ((error as Error & { retryable?: boolean }).retryable !== true) throw error;
      return attempt();
    }
  }

  analyzeResume(text: string): Promise<ResumeAnalysisResult> {
    const prompt = buildResumeAnalysisPrompt(text);
    return this.withRetry(() => this.generateStructured(
      prompt, RESUME_ANALYSIS_SYSTEM_INSTRUCTION, analysisResultSchema,
      'resume analysis', 'resume_analysis'
    ));
  }

  calculateATS(resumeText: string, jobDescription: string): Promise<ATSResult> {
    const prompt = buildATSPrompt(resumeText, jobDescription);
    return this.withRetry(() => this.generateStructured(
      prompt, ATS_SYSTEM_INSTRUCTION, atsResultSchema, 'ATS analysis', 'ats_analysis'
    ));
  }

  optimizeResume(
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
    const prompt = buildResumeOptimizerPrompt(resumeText, jobDescription, analysisSummary, atsSummary);
    return this.withRetry(() => this.generateStructured(
      prompt, RESUME_OPTIMIZER_SYSTEM_INSTRUCTION, optimizationResultSchema,
      'resume optimization', 'resume_optimization'
    ));
  }

  async generateCoverLetter(_resumeText: string, _jobDescription: string): Promise<CoverLetterResult> {
    throw new NotImplementedError('generateCoverLetter', 'Phase 7');
  }

  async generateInterviewQuestions(resumeText: string, targetRole: string, jobDescription: string): Promise<InterviewQuestionsResult> {
    const prompt = buildInterviewQuestionsPrompt(resumeText, targetRole, jobDescription);
    return this.withRetry(() => this.generateStructured(
      prompt, INTERVIEW_SYSTEM_INSTRUCTION, interviewQuestionsResultSchema,
      'interview question generation', 'interview_questions'
    ));
  }

  async evaluateInterviewAnswer(
    resumeText: string,
    targetRole: string,
    question: InterviewQuestion,
    answer: string
  ): Promise<InterviewAnswerFeedbackResult> {
    const prompt = buildInterviewFeedbackPrompt(resumeText, targetRole, question, answer);
    return this.withRetry(() => this.generateStructured(
      prompt, INTERVIEW_SYSTEM_INSTRUCTION, interviewAnswerFeedbackSchema,
      'interview answer feedback', 'interview_feedback'
    ));
  }

  async skillGapAnalysis(_resumeText: string, _targetRole: string): Promise<SkillGapResult> {
    throw new NotImplementedError('skillGapAnalysis', 'Phase 9');
  }
}
