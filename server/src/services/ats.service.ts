import { Types } from 'mongoose';
import { Resume } from '../models/Resume.model';
import { ATSResult, IATSResult } from '../models/ATSResult.model';
import { getAIProvider, getAIProviderMetadata } from '../providers/ai';
import { applyHybridATSScoring, HYBRID_SCORING_METHOD } from './atsScoring.service';
import { withOwnedWrite } from './ownedWrite.service';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const makeOperationalError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode: number; isOperational: boolean };
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};

// In-memory lock: prevents duplicate simultaneous ATS analysis for the same resume
const atsInProgress = new Set<string>();

// ─────────────────────────────────────────────────────────────
// ATS Service
// ─────────────────────────────────────────────────────────────

export class ATSService {
  /**
   * Run ATS analysis comparing a resume against a job description.
   * - Returns cached result if one exists for the same resume (unless force=true).
   * - Re-analysis is triggered when force=true OR jobDescription changes.
   * - Prevents duplicate simultaneous requests with an in-memory lock.
   */
  async calculateATS(
    userId: string,
    resumeId: string,
    jobDescription: string,
    force = false
  ): Promise<IATSResult> {
    // Validate inputs
    const trimmedJD = jobDescription?.trim();
    if (!trimmedJD || trimmedJD.length < 50) {
      throw makeOperationalError(
        'Job description is too short. Please provide at least 50 characters.',
        400
      );
    }
    if (trimmedJD.length > 5000) {
      throw makeOperationalError('Job description exceeds maximum length of 5,000 characters.', 400);
    }

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

    // Return cached result unless force=true
    if (!force) {
      const existing = await ATSResult.findOne({
        resumeId: new Types.ObjectId(resumeId),
        userId: new Types.ObjectId(userId),
      }).sort({ createdAt: -1 });

      if (existing && existing.jobDescription === trimmedJD && existing.scoringMethod === HYBRID_SCORING_METHOD) return existing;
    }

    // Prevent duplicate simultaneous analysis
    const lockKey = `ats:${userId}:${resumeId}`;
    if (atsInProgress.has(lockKey)) {
      throw makeOperationalError(
        'ATS analysis is already in progress for this resume. Please wait.',
        409
      );
    }

    atsInProgress.add(lockKey);
    const startTime = Date.now();

    try {
      const provider = getAIProvider();
      console.log(
        `[ATSService] Starting ATS analysis | provider: ${provider.providerName} | resumeId: ${resumeId}`
      );

      const llmResult = await provider.calculateATS(resume.extractedText, trimmedJD);
      const providerMetadata = getAIProviderMetadata(llmResult, provider);
      const result = applyHybridATSScoring(resume.extractedText, llmResult, trimmedJD);

      const elapsedMs = Date.now() - startTime;
      console.log(
        `[ATSService] ATS complete | provider: ${providerMetadata.providerName} | resumeId: ${resumeId} | score: ${result.atsScore} | time: ${elapsedMs}ms`
      );

      // Upsert: replace the latest ATS result for this resume (one per resume)
      const atsResult = await withOwnedWrite(userId, resumeId, async (session) => ATSResult.findOneAndUpdate(
        {
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
        },
        {
          ...result,
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
          jobDescription: trimmedJD,
          provider: providerMetadata.providerName,
          providerVersion: providerMetadata.providerVersion,
          analyzedAt: new Date(),
        },
        { upsert: true, new: true, runValidators: true, session }
      ));

      return atsResult;
    } catch (err) {
      const elapsedMs = Date.now() - startTime;
      console.error(
        `[ATSService] ATS failed | time: ${elapsedMs}ms | type: ${(err as Error).name}`
      );
      throw err;
    } finally {
      atsInProgress.delete(lockKey);
    }
  }

  /**
   * Get the most recent ATS result for a resume.
   * Returns null if no ATS check has been run yet.
   */
  async getATS(userId: string, resumeId: string): Promise<IATSResult | null> {
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    return ATSResult.findOne({
      resumeId: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
      scoringMethod: HYBRID_SCORING_METHOD,
    }).sort({ createdAt: -1 });
  }

  /**
   * Delete ATS result for a resume (allows fresh re-analysis).
   */
  async deleteATS(userId: string, resumeId: string): Promise<void> {
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    await ATSResult.deleteOne({
      resumeId: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
    });
  }
}

export const atsService = new ATSService();
