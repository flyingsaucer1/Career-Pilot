import { GoogleGenerativeAI } from '@google/generative-ai';
import { providerSignal, assertRequestActive } from '../../services/aiRequestContext.service';
import { z } from 'zod/v3';
import { analysisResultSchema, atsResultSchema, optimizationResultSchema, interviewQuestionsResultSchema, interviewAnswerFeedbackSchema } from './schemas';
export { analysisResultSchema, atsResultSchema, optimizationResultSchema } from './schemas';
import type { IAIProvider, ResumeAnalysisResult, ATSResult, ResumeOptimizationResult, CoverLetterResult, InterviewQuestionsResult, InterviewAnswerFeedbackResult, InterviewQuestion, SkillGapResult } from './ai.interface';
import { NotImplementedError } from './ai.interface';
import { buildResumeAnalysisPrompt, RESUME_ANALYSIS_SYSTEM_INSTRUCTION } from './prompts/resumeAnalysis.prompt';
import { buildATSPrompt, ATS_SYSTEM_INSTRUCTION } from './prompts/ats.prompt';
import { buildResumeOptimizerPrompt, RESUME_OPTIMIZER_SYSTEM_INSTRUCTION } from './prompts/resumeOptimizer.prompt';
import { buildInterviewFeedbackPrompt, buildInterviewQuestionsPrompt, INTERVIEW_SYSTEM_INSTRUCTION } from './prompts/interview.prompt';

type GeminiFailure = Error & {
  status?: number;
  statusCode?: number;
  fallbackEligible?: boolean;
  isOperational?: boolean;
};

const geminiStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined;
  const failure = error as GeminiFailure;
  if (typeof failure.status === 'number') return failure.status;
  if (typeof failure.statusCode === 'number' && failure.statusCode !== 503) return failure.statusCode;
  const message = failure.message || '';
  const match = message.match(/(?:^|\D)(4(?:01|03|08|29)|5\d\d)(?:\D|$)/);
  return match ? Number(match[1]) : undefined;
};

const normalizeGeminiError = (operation: string, error: unknown): GeminiFailure => {
  const failure = error as GeminiFailure;
  if (failure?.isOperational && typeof failure.fallbackEligible === 'boolean') return failure;

  const status = geminiStatus(error);
  const message = error instanceof Error ? error.message : '';
  const isTimeout = error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError' || /timed?\s*out/i.test(message));
  const isNetworkFailure = /fetch failed|network|econnreset|enotfound|socket hang up/i.test(message);
  const fallbackEligible = status === 429 || (status !== undefined && status >= 500) || isTimeout || isNetworkFailure;

  let safeMessage = `Gemini could not complete ${operation}.`;
  if (status === 401 || status === 403) safeMessage = 'Gemini rejected the API key. Replace GEMINI_API_KEY in server/.env.';
  else if (status === 429) safeMessage = 'Gemini rate limit reached. Wait and try again.';
  else if (fallbackEligible) safeMessage = 'Gemini is temporarily unavailable. Try again shortly.';
  else if (/returned non-JSON|response failed .* validation/i.test(message)) safeMessage = message;

  return Object.assign(new Error(safeMessage), {
    statusCode: 503,
    isOperational: true,
    fallbackEligible,
  });
};


export class GeminiProvider implements IAIProvider {
  readonly providerName = 'Google Gemini';
  readonly providerVersion = 'gemini-flash-latest';

  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string, private readonly timeoutMs = 45_000) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  private async callGemini(prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({
      model: this.providerVersion,
      systemInstruction: RESUME_ANALYSIS_SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // lower = more deterministic JSON output
        maxOutputTokens: 4096,
      },
    });

    assertRequestActive();
    const result = await model.generateContent(prompt, { signal: providerSignal(this.timeoutMs) });
    const text = result.response.text();
    return text;
  }

  private async generateStructured<T>(prompt: string, instruction: string, schema: z.ZodType<T>, operation: string): Promise<T> {
    const attempt = async () => {
      const model = this.client.getGenerativeModel({
        model: this.providerVersion,
        systemInstruction: instruction,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.15, maxOutputTokens: 4096 },
      });
      assertRequestActive();
      const result = await model.generateContent(prompt, { signal: providerSignal(this.timeoutMs) });
      let parsed: unknown;
      try { parsed = JSON.parse(result.response.text()); }
      catch { throw new Error(`Gemini returned non-JSON response for ${operation}`); }
      const validated = schema.safeParse(parsed);
      if (!validated.success) throw new Error(`Gemini response failed ${operation} validation`);
      return validated.data;
    };
    try { return await attempt(); }
    catch (firstError) {
      const normalized = normalizeGeminiError(operation, firstError);
      if (normalized.fallbackEligible) throw normalized;
      try { return await attempt(); }
      catch (error) {
        throw normalizeGeminiError(operation, error);
      }
    }
  }

  async analyzeResume(text: string): Promise<ResumeAnalysisResult> {
    const prompt = buildResumeAnalysisPrompt(text);

    const makeAttempt = async (): Promise<ResumeAnalysisResult> => {
      const raw = await this.callGemini(prompt);

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('Gemini returned non-JSON response');
      }

      const validated = analysisResultSchema.safeParse(parsed);
      if (!validated.success) {
        const issues = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(`Gemini response failed validation: ${issues}`);
      }

      return validated.data as ResumeAnalysisResult;
    };

    // First attempt
    try {
      return await makeAttempt();
    } catch (firstError) {
      const normalized = normalizeGeminiError('resume analysis', firstError);
      if (normalized.fallbackEligible) throw normalized;
      console.warn('[GeminiProvider] Retrying an invalid structured response.');
      // Single retry
      try {
        return await makeAttempt();
      } catch (secondError) {
        throw normalizeGeminiError('resume analysis', secondError);
      }
    }
  }

  // —— Phase 4: calculateATS ———————————————————————————————————————————————
  async calculateATS(resumeText: string, jobDescription: string): Promise<ATSResult> {
    const prompt = buildATSPrompt(resumeText, jobDescription);

    const makeAttempt = async (): Promise<ATSResult> => {
      // Use dedicated ATS model call with ATS system instruction
      const model = this.client.getGenerativeModel({
        model: this.providerVersion,
        systemInstruction: ATS_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1, // very deterministic for scoring
          maxOutputTokens: 4096,
        },
      });

      assertRequestActive();
      const result = await model.generateContent(prompt, { signal: providerSignal(this.timeoutMs) });
      const raw = result.response.text();

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('Gemini returned non-JSON response for ATS');
      }

      const validated = atsResultSchema.safeParse(parsed);
      if (!validated.success) {
        const issues = validated.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        throw new Error(`ATS response failed validation: ${issues}`);
      }

      return validated.data as ATSResult;
    };

    // First attempt
    try {
      return await makeAttempt();
    } catch (firstError) {
      const normalized = normalizeGeminiError('ATS analysis', firstError);
      if (normalized.fallbackEligible) throw normalized;
      console.warn('[GeminiProvider] Retrying an invalid structured response.');
      try {
        return await makeAttempt();
      } catch (secondError) {
        throw normalizeGeminiError('ATS analysis', secondError);
      }
    }
  }

  // —— Phase 5: optimizeResume ———————————————————————————————————————————————
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
Suggestions: ${analysis.suggestions.slice(0, 3).map((s) => `${s.priority}: ${s.description}`).join('; ') || 'none'}`
      : undefined;

    const atsSummary = atsResult
      ? `ATS Score: ${atsResult.atsScore}/100 | Match: ${atsResult.matchPercentage}% | Keywords: ${atsResult.keywordMatchPercentage}%
Missing keywords: ${atsResult.missingKeywords.slice(0, 8).join(', ') || 'none'}
Missing skills: ${atsResult.missingSkills.slice(0, 5).join(', ') || 'none'}
Strengths: ${atsResult.strengths.slice(0, 3).join('; ') || 'none'}
Weaknesses: ${atsResult.weaknesses.slice(0, 3).join('; ') || 'none'}`
      : undefined;

    const prompt = buildResumeOptimizerPrompt(resumeText, jobDescription, analysisSummary, atsSummary);

    const makeAttempt = async (): Promise<ResumeOptimizationResult> => {
      const model = this.client.getGenerativeModel({
        model: this.providerVersion,
        systemInstruction: RESUME_OPTIMIZER_SYSTEM_INSTRUCTION,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.15, // very deterministic for structured optimization
          maxOutputTokens: 4096,
        },
      });

      assertRequestActive();
      const result = await model.generateContent(prompt, { signal: providerSignal(this.timeoutMs) });
      const raw = result.response.text();

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('Gemini returned non-JSON response for resume optimization');
      }

      const validated = optimizationResultSchema.safeParse(parsed);
      if (!validated.success) {
        const issues = validated.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        throw new Error(`Resume optimization response failed validation: ${issues}`);
      }

      return validated.data as ResumeOptimizationResult;
    };

    // First attempt
    try {
      return await makeAttempt();
    } catch (firstError) {
      const normalized = normalizeGeminiError('resume optimization', firstError);
      if (normalized.fallbackEligible) throw normalized;
      console.warn('[GeminiProvider] Retrying an invalid structured response.');
      try {
        return await makeAttempt();
      } catch (secondError) {
        throw normalizeGeminiError('resume optimization', secondError);
      }
    }
  }

  async generateCoverLetter(_resumeText: string, _jobDescription: string): Promise<CoverLetterResult> {
    throw new NotImplementedError('generateCoverLetter', 'Phase 4');
  }

  async generateInterviewQuestions(resumeText: string, targetRole: string, jobDescription: string): Promise<InterviewQuestionsResult> {
    return this.generateStructured(
      buildInterviewQuestionsPrompt(resumeText, targetRole, jobDescription),
      INTERVIEW_SYSTEM_INSTRUCTION, interviewQuestionsResultSchema, 'interview question generation'
    );
  }

  async evaluateInterviewAnswer(
    resumeText: string,
    targetRole: string,
    question: InterviewQuestion,
    answer: string
  ): Promise<InterviewAnswerFeedbackResult> {
    return this.generateStructured(
      buildInterviewFeedbackPrompt(resumeText, targetRole, question, answer),
      INTERVIEW_SYSTEM_INSTRUCTION, interviewAnswerFeedbackSchema, 'interview answer feedback'
    );
  }

  async skillGapAnalysis(_resumeText: string, _targetRole: string): Promise<SkillGapResult> {
    throw new NotImplementedError('skillGapAnalysis', 'Phase 4');
  }
}
