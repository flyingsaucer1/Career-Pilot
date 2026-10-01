import { Types } from 'mongoose';
import { Resume } from '../models/Resume.model';
import { Analysis, IAnalysis } from '../models/Analysis.model';
import { getAIProvider, getAIProviderMetadata } from '../providers/ai';
import { withOwnedWrite } from './ownedWrite.service';

// ─────────────────────────────────────────────────────────────
// In-memory lock: prevents duplicate simultaneous analysis
// ─────────────────────────────────────────────────────────────
const analysisInProgress = new Set<string>();

const makeOperationalError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode: number; isOperational: boolean };
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export class AnalysisService {
  /**
   * Trigger AI analysis for a resume.
   * - Returns cached result if one exists (unless force=true).
   * - Prevents duplicate simultaneous requests.
   * - Logs timing and provider info.
   */
  async analyzeResume(
    userId: string,
    resumeId: string,
    force = false
  ): Promise<IAnalysis> {
    // Security: verify resume belongs to this user
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });

    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    if (!resume.extractedText?.trim()) {
      throw makeOperationalError(
        'This resume has no extracted text. Please re-upload a text-based PDF or DOCX file.',
        422
      );
    }

    // Return cached analysis unless forced
    if (!force) {
      const existing = await Analysis.findOne({
        resumeId: new Types.ObjectId(resumeId),
        userId: new Types.ObjectId(userId),
      });
      if (existing) return existing;
    }

    // Prevent duplicate simultaneous analysis for same resume
    const lockKey = `${userId}:${resumeId}`;
    if (analysisInProgress.has(lockKey)) {
      throw makeOperationalError(
        'Analysis is already in progress for this resume. Please wait.',
        409
      );
    }

    analysisInProgress.add(lockKey);
    const startTime = Date.now();

    try {
      const provider = getAIProvider();
      console.log(`[AnalysisService] Starting analysis | provider: ${provider.providerName} | resumeId: ${resumeId}`);

      const result = await provider.analyzeResume(resume.extractedText);
      const providerMetadata = getAIProviderMetadata(result, provider);

      const elapsedMs = Date.now() - startTime;
      console.log(`[AnalysisService] Analysis complete | provider: ${providerMetadata.providerName} | resumeId: ${resumeId} | score: ${result.score} | time: ${elapsedMs}ms`);

      // Upsert: replace existing analysis if force=true, otherwise create
      const analysis = await withOwnedWrite(userId, resumeId, async (session) => Analysis.findOneAndUpdate(
        { resumeId: new Types.ObjectId(resumeId), userId: new Types.ObjectId(userId) },
        {
          ...result,
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
          provider: providerMetadata.providerName,
          providerVersion: providerMetadata.providerVersion,
          analyzedAt: new Date(),
        },
        { upsert: true, new: true, runValidators: true, session }
      ));

      return analysis;
    } catch (err) {
      const elapsedMs = Date.now() - startTime;
      console.error(`[AnalysisService] Analysis failed | time: ${elapsedMs}ms | type: ${(err as Error).name}`);
      throw err;
    } finally {
      analysisInProgress.delete(lockKey);
    }
  }

  /**
   * Get an existing analysis result.
   * Returns null if no analysis has been run yet.
   */
  async getAnalysis(userId: string, resumeId: string): Promise<IAnalysis | null> {
    // Verify resume ownership before returning analysis
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    return Analysis.findOne({
      resumeId: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
    });
  }

  /**
   * Delete an analysis result (allows re-analysis from scratch).
   */
  async deleteAnalysis(userId: string, resumeId: string): Promise<void> {
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    await Analysis.deleteOne({
      resumeId: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
    });
  }
}

export const analysisService = new AnalysisService();
