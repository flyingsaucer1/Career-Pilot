import mongoose, { Types } from 'mongoose';
import { Resume } from '../models/Resume.model';
import { Analysis } from '../models/Analysis.model';
import { ATSResult } from '../models/ATSResult.model';
import { ResumeVersion, IResumeVersion } from '../models/ResumeVersion.model';
import { FallbackAIProvider, getAIProvider, getAIProviderMetadata } from '../providers/ai';
import type { IAIProvider } from '../providers/ai/ai.interface';
import type { ResumeOptimizationResult } from '../providers/ai/ai.interface';
import { applyHybridATSScoring, HYBRID_SCORING_METHOD } from './atsScoring.service';
import { JobApplication } from '../models/JobApplication.model';
import { InterviewSession } from '../models/InterviewSession.model';
import { withOwnedWrite } from './ownedWrite.service';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────

const makeOperationalError = (message: string, statusCode: number) => {
  const err = new Error(message) as Error & { statusCode: number; isOperational: boolean };
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};

// In-memory lock: prevents duplicate simultaneous optimization
const optimizationInProgress = new Set<string>();
const comparisonInProgress = new Set<string>();

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export class ResumeOptimizerService {
  /**
   * Optimize a resume for a specific job description.
   * - Validates ownership
   * - Fetches resume, analysis, and ATS result if provided
   * - Calls AI provider
   * - Creates a new ResumeVersion (never overwrites original)
   * - Returns optimization result with version info
   */
  async optimizeResume(
    userId: string,
    resumeId: string,
    jobDescription: string,
    options?: {
      atsResultId?: string;
      analysisId?: string;
    }
  ): Promise<{ optimization: ResumeOptimizationResult; version: IResumeVersion }> {
    // Validate job description
    const trimmedJD = jobDescription?.trim();
    if (!trimmedJD || trimmedJD.length < 50) {
      throw makeOperationalError(
        'Job description is too short. Please provide at least 50 characters.',
        400
      );
    }
    if (trimmedJD.length > 10000) {
      throw makeOperationalError('Job description exceeds maximum length of 10,000 characters.', 400);
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

    // Prevent duplicate simultaneous optimization
    const lockKey = `optimize:${userId}:${resumeId}`;
    if (optimizationInProgress.has(lockKey)) {
      throw makeOperationalError(
        'Resume optimization is already in progress. Please wait.',
        409
      );
    }

    optimizationInProgress.add(lockKey);
    const startTime = Date.now();

    try {
      // Fetch existing analysis if available (or specified)
      let analysis = null;
      if (options?.analysisId) {
        analysis = await Analysis.findOne({
          _id: options.analysisId,
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
        });
      } else {
        analysis = await Analysis.findOne({
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
        });
      }

      // Fetch ATS result if available (or specified)
      let atsResult = null;
      if (options?.atsResultId) {
        atsResult = await ATSResult.findOne({
          _id: options.atsResultId,
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
        });
      } else {
        atsResult = await ATSResult.findOne({
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
        }).sort({ createdAt: -1 });
      }
      const matchingATSResult = atsResult?.jobDescription === trimmedJD ? atsResult : null;

      // Call AI provider
      const provider = getAIProvider();
      console.log(
        `[ResumeOptimizerService] Starting optimization | provider: ${provider.providerName} | resumeId: ${resumeId}`
      );

      const startTime = Date.now();
      const optimization = await provider.optimizeResume(
        resume.extractedText,
        trimmedJD,
        analysis ? (analysis.toObject() as any) : undefined,
        matchingATSResult ? (matchingATSResult.toObject() as any) : undefined
      );
      const providerMetadata = getAIProviderMetadata(optimization, provider);

      const elapsedMs = Date.now() - startTime;
      console.log(
        `[ResumeOptimizerService] Optimization complete | provider: ${providerMetadata.providerName} | resumeId: ${resumeId} | time: ${elapsedMs}ms`
      );

      // Allocate a monotonic version number atomically. For legacy resumes,
      // seed the counter from the highest stored version before incrementing.
      return await withOwnedWrite(userId, resumeId, async (session) => {
      const lastVersion = await ResumeVersion.findOne({
        resumeId: new Types.ObjectId(resumeId),
        userId: new Types.ObjectId(userId),
      }).sort({ versionNumber: -1 }).session(session);
      const numberedResume = await Resume.findOneAndUpdate(
        { _id: resume._id, userId: resume.userId },
        [{
          $set: {
            lastVersionNumber: {
              $add: [{ $max: [{ $ifNull: ['$lastVersionNumber', 0] }, lastVersion?.versionNumber ?? 0] }, 1],
            },
          },
        }],
        { new: true, session }
      );
      if (!numberedResume) throw makeOperationalError('Resume changed during optimization. Please retry.', 409);
      const nextVersionNumber = numberedResume.lastVersionNumber;

      // Determine version name
      const versionName = `Optimized for ${this.extractRoleFromJD(trimmedJD)}`;

      // Suggestions are not facts until the candidate reviews them. Start from
      // the uploaded text and let the editor apply individual accepted edits.
      const optimizedContent = resume.extractedText.replace(/\r\n/g, '\n').trim();

      // Create new ResumeVersion
      const [version] = await ResumeVersion.create([{
        userId: new Types.ObjectId(userId),
        resumeId: new Types.ObjectId(resumeId),
        versionNumber: nextVersionNumber,
        versionName,
        jobDescriptionId: matchingATSResult?._id ?? null,
        targetJobDescription: trimmedJD,
        source: 'optimized',
        optimizedContent,
        contentFormat: 'resume',
        changes: optimization,
        atsScoreBefore: matchingATSResult?.scoringMethod === HYBRID_SCORING_METHOD
          ? matchingATSResult.atsScore : null,
        atsScoreAfter: null, // Estimated — will be filled after re-analysis
      }], { session });

      return { optimization, version };
      });
    } catch (err) {
      const elapsedMs = Date.now() - startTime;
      console.error(
        `[ResumeOptimizerService] Optimization failed | time: ${elapsedMs}ms | type: ${(err as Error).name}`
      );
      throw err;
    } finally {
      optimizationInProgress.delete(lockKey);
    }
  }

  /**
   * Get all versions for a resume (version history)
   */
  async getVersions(userId: string, resumeId: string): Promise<IResumeVersion[]> {
    // Verify resume ownership
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    return ResumeVersion.find({
      resumeId: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
    }).sort({ versionNumber: 1 });
  }

  /**
   * Get a specific version by version number
   */
  async getVersion(userId: string, resumeId: string, versionNumber: number): Promise<IResumeVersion | null> {
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    return ResumeVersion.findOne({
      resumeId: new Types.ObjectId(resumeId),
      userId: new Types.ObjectId(userId),
      versionNumber,
    });
  }

  async updateVersionContent(
    userId: string,
    resumeId: string,
    versionNumber: number,
    content: string,
    expectedUpdatedAt: string
  ): Promise<IResumeVersion> {
    const resume = await Resume.findOne({ _id: resumeId, userId: new Types.ObjectId(userId) });
    if (!resume) throw makeOperationalError('Resume not found or access denied.', 404);

    const version = await ResumeVersion.findOne({
      resumeId: new Types.ObjectId(resumeId), userId: new Types.ObjectId(userId), versionNumber,
    });
    if (!version) throw makeOperationalError('Version not found.', 404);
    if (version.updatedAt.toISOString() !== expectedUpdatedAt) {
      throw makeOperationalError('This version changed elsewhere. Reload it before saving.', 409);
    }

    // Match the revision atomically so two editor tabs cannot silently overwrite.
    const saved = await ResumeVersion.findOneAndUpdate(
      { _id: version._id, updatedAt: new Date(expectedUpdatedAt) },
      { $set: { optimizedContent: content.trim(), contentFormat: 'resume', source: 'manual', atsScoreAfter: null } },
      { new: true, runValidators: true }
    );
    if (!saved) throw makeOperationalError('This version changed elsewhere. Reload it before saving.', 409);
    return saved;
  }

  /** Score the original and the saved draft against one target job description. */
  async compareATSScores(
    userId: string,
    resumeId: string,
    versionNumber: number,
    suppliedJobDescription?: string
  ): Promise<IResumeVersion> {
    const resume = await Resume.findOne({ _id: resumeId, userId: new Types.ObjectId(userId) });
    if (!resume) throw makeOperationalError('Resume not found or access denied.', 404);
    const version = await ResumeVersion.findOne({
      resumeId: new Types.ObjectId(resumeId), userId: new Types.ObjectId(userId), versionNumber,
    });
    if (!version) throw makeOperationalError('Version not found.', 404);
    if (version.contentFormat !== 'resume') {
      throw makeOperationalError('Save this version as a resume draft before comparing ATS scores.', 409);
    }
    const linkedATS = version.jobDescriptionId
      ? await ATSResult.findOne({ _id: version.jobDescriptionId, resumeId: resume._id, userId: resume.userId })
      : null;
    // Older versions did not retain their target. The linked ATS document can
    // be overwritten by a later job, so require the user to supply it again.
    const jobDescription = (version.targetJobDescription || suppliedJobDescription || '').trim();
    if (jobDescription.length < 50) {
      throw makeOperationalError('Paste the original job description to compare this older version.', 400);
    }
    if (!resume.extractedText?.trim() || !version.optimizedContent?.trim()) {
      throw makeOperationalError('Original or saved resume text is missing.', 422);
    }

    const lockKey = `${userId}:${resumeId}:${versionNumber}`;
    if (comparisonInProgress.has(lockKey)) {
      throw makeOperationalError('ATS comparison is already in progress for this version.', 409);
    }
    comparisonInProgress.add(lockKey);
    try {
      const provider = getAIProvider();
      const compareWithProvider = async (activeProvider: IAIProvider) => {
        // Reuse a baseline only when it was scored for this exact job by the
        // same concrete provider and rubric. The automatic router retries this
        // whole callback on one fallback provider so before/after stay comparable.
        const matchingBaseline = linkedATS?.jobDescription === jobDescription &&
          linkedATS.scoringMethod === HYBRID_SCORING_METHOD &&
          linkedATS.provider === activeProvider.providerName &&
          linkedATS.providerVersion === activeProvider.providerVersion;
        const before = matchingBaseline
          ? linkedATS.atsScore
          : applyHybridATSScoring(
            resume.extractedText,
            await activeProvider.calculateATS(resume.extractedText, jobDescription),
            jobDescription
          ).atsScore;
        const after = version.optimizedContent.trim() === resume.extractedText.trim()
          ? before
          : applyHybridATSScoring(
            version.optimizedContent,
            await activeProvider.calculateATS(version.optimizedContent, jobDescription),
            jobDescription
          ).atsScore;
        return { before, after };
      };
      const comparison = provider instanceof FallbackAIProvider
        ? (await provider.executeWithProvider('ATS comparison', compareWithProvider)).result
        : await compareWithProvider(provider);
      const { before, after } = comparison;

      const scored = await withOwnedWrite(userId, resumeId, async (session) => ResumeVersion.findOneAndUpdate(
        { _id: version._id, updatedAt: version.updatedAt },
        { $set: { atsScoreBefore: before, atsScoreAfter: after, targetJobDescription: jobDescription } },
        { new: true, runValidators: true, session }
      ));
      if (!scored) throw makeOperationalError('This draft changed during scoring. Reload and compare again.', 409);
      return scored;
    } finally {
      comparisonInProgress.delete(lockKey);
    }
  }

  /**
   * Delete a specific version (not the original resume)
   */
  async deleteVersion(userId: string, resumeId: string, versionNumber: number): Promise<void> {
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: new Types.ObjectId(userId),
    });
    if (!resume) {
      throw makeOperationalError('Resume not found or access denied.', 404);
    }

    const version = await ResumeVersion.findOne({
      resumeId: new Types.ObjectId(resumeId), userId: new Types.ObjectId(userId), versionNumber,
    });
    if (!version) throw makeOperationalError('Version not found.', 404);
    if (version.source === 'original') {
      throw makeOperationalError('Cannot delete the original resume version.', 400);
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await JobApplication.updateMany(
          { userId: new Types.ObjectId(userId), resumeVersionId: version._id },
          { $set: { resumeVersionId: null, resumeVersionNumber: null } },
          { session }
        );
        await InterviewSession.updateMany(
          { userId: new Types.ObjectId(userId), resumeVersionId: version._id },
          { $set: { resumeVersionId: null, resumeVersionNumber: null } },
          { session }
        );
        const result = await ResumeVersion.deleteOne({
          resumeId: new Types.ObjectId(resumeId),
          userId: new Types.ObjectId(userId),
          versionNumber,
        }, { session });
        if (result.deletedCount !== 1) throw makeOperationalError('Version changed during deletion. Please retry.', 409);
      });
    } finally {
      await session.endSession();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────

  private extractRoleFromJD(jobDescription: string): string {
    // Simple heuristic: look for common role indicators
    const lines = jobDescription.split('\n').slice(0, 10);
    const text = lines.join(' ').toLowerCase();

    const roleKeywords = [
      'software engineer',
      'frontend developer',
      'backend developer',
      'full stack',
      'fullstack',
      'web developer',
      'mobile developer',
      'devops',
      'data scientist',
      'data engineer',
      'machine learning',
      'ml engineer',
      'product manager',
      'project manager',
      'designer',
      'ux designer',
      'ui designer',
      'qa engineer',
      'test engineer',
      'security engineer',
      'cloud engineer',
      'site reliability',
      'sre',
      'engineering manager',
      'tech lead',
      'architect',
    ];

    for (const role of roleKeywords) {
      if (text.includes(role)) {
        return role
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    // Fallback: use first meaningful line
    const firstLine = lines.find((l) => l.trim().length > 10);
    if (firstLine) {
      return firstLine.trim().slice(0, 50);
    }

    return 'Target Role';
  }

}

export const resumeOptimizerService = new ResumeOptimizerService();
