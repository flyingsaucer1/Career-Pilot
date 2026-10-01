import { Types } from 'mongoose';
import { getAIProvider, getAIProviderMetadata } from '../providers/ai';
import type { InterviewQuestion } from '../providers/ai/ai.interface';
import { InterviewSession, IInterviewSession } from '../models/InterviewSession.model';
import { JobApplication } from '../models/JobApplication.model';
import { Resume } from '../models/Resume.model';
import { ResumeVersion } from '../models/ResumeVersion.model';
import { buildGroundedExampleAnswer } from './interviewGrounding.service';
import { withOwnedWrite } from './ownedWrite.service';

const makeOperationalError = (message: string, statusCode: number) => Object.assign(new Error(message), {
  statusCode, isOperational: true,
});

const generationLocks = new Set<string>();
const feedbackLocks = new Set<string>();

export class InterviewService {
  async create(userId: string, applicationId: string): Promise<IInterviewSession> {
    const owner = new Types.ObjectId(userId);
    const application = await JobApplication.findOne({ _id: applicationId, userId: owner });
    if (!application) throw makeOperationalError('Application not found.', 404);
    if (!application.resumeId) throw makeOperationalError('Link a resume to this application before starting interview practice.', 400);
    if (application.description.length > 5000) {
      throw makeOperationalError('Shorten the saved job description to 5,000 characters before starting interview practice.', 422);
    }

    let resumeText: string;
    let resumeVersionId: Types.ObjectId | null = null;
    if (application.resumeVersionId) {
      const version = await ResumeVersion.findOne({
        _id: application.resumeVersionId, userId: owner, resumeId: application.resumeId,
      });
      if (!version) throw makeOperationalError('The linked resume version is no longer available. Select another version.', 409);
      resumeText = version.optimizedContent;
      resumeVersionId = version._id;
    } else {
      const resume = await Resume.findOne({ _id: application.resumeId, userId: owner });
      if (!resume) throw makeOperationalError('The linked resume is no longer available. Select another resume.', 409);
      resumeText = resume.extractedText;
    }

    const lockKey = `${userId}:${applicationId}`;
    if (generationLocks.has(lockKey)) throw makeOperationalError('Interview questions are already being generated for this application.', 409);
    generationLocks.add(lockKey);
    try {
      const provider = getAIProvider();
      const generated = await provider.generateInterviewQuestions(resumeText, application.role, application.description);
      const providerMetadata = getAIProviderMetadata(generated, provider);
      return withOwnedWrite(userId, application.resumeId.toString(), async (session) => {
      const source = await JobApplication.updateOne({ _id: application._id, userId: owner }, { $inc: { __v: 1 } }, { session });
      if (!source.matchedCount) throw makeOperationalError('The application was deleted while questions were generated.', 409);
      const [created] = await InterviewSession.create([{
        userId: owner,
        jobApplicationId: application._id,
        resumeId: application.resumeId,
        resumeVersionId,
        resumeVersionNumber: application.resumeVersionNumber,
        company: application.company,
        targetRole: application.role,
        jobDescription: application.description,
        resumeTextSnapshot: resumeText,
        status: 'active',
        questions: generated.questions.map((question) => ({ ...question, answer: '', feedback: null, answeredAt: null })),
        providerName: providerMetadata.providerName,
        providerVersion: providerMetadata.providerVersion,
      }], { session });
      return created;
      });
    } finally {
      generationLocks.delete(lockKey);
    }
  }

  async list(userId: string) {
    return InterviewSession.find({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 });
  }

  async getById(userId: string, id: string, includeSnapshot = false): Promise<IInterviewSession> {
    const query = InterviewSession.findOne({ _id: id, userId: new Types.ObjectId(userId) });
    if (includeSnapshot) query.select('+resumeTextSnapshot');
    const session = await query;
    if (!session) throw makeOperationalError('Interview session not found.', 404);
    return session;
  }

  async answer(userId: string, sessionId: string, questionId: string, answer: string): Promise<IInterviewSession> {
    const lockKey = `${sessionId}:${questionId}`;
    if (feedbackLocks.has(lockKey)) throw makeOperationalError('Feedback is already being generated for this answer.', 409);
    feedbackLocks.add(lockKey);
    try {
      const session = await this.getById(userId, sessionId, true);
      const question = session.questions.find((item) => item._id.toString() === questionId);
      if (!question) throw makeOperationalError('Interview question not found.', 404);
      const providerQuestion: InterviewQuestion = {
        type: question.type,
        difficulty: question.difficulty,
        question: question.question,
        intent: question.intent,
        followUpPrompts: [...question.followUpPrompts],
        answerGuidance: question.answerGuidance,
      };
      const feedback = await getAIProvider().evaluateInterviewAnswer(
        session.resumeTextSnapshot, session.targetRole, providerQuestion, answer
      );
      feedback.exampleAnswer = buildGroundedExampleAnswer(answer);
      question.answer = answer;
      question.feedback = feedback;
      question.answeredAt = new Date();
      session.status = 'active';
      session.completedAt = null;
      await withOwnedWrite(userId, null, async (transaction) => session.save({ session: transaction }));
      return session;
    } finally {
      feedbackLocks.delete(lockKey);
    }
  }

  async setStatus(userId: string, id: string, status: 'active' | 'completed'): Promise<IInterviewSession> {
    const session = await this.getById(userId, id);
    if (status === 'completed' && !session.questions.some((question) => question.feedback)) {
      throw makeOperationalError('Answer at least one question before completing the session.', 400);
    }
    session.status = status;
    session.completedAt = status === 'completed' ? new Date() : null;
    await session.save();
    return session;
  }

  async delete(userId: string, id: string): Promise<void> {
    const result = await InterviewSession.deleteOne({ _id: id, userId: new Types.ObjectId(userId) });
    if (result.deletedCount !== 1) throw makeOperationalError('Interview session not found.', 404);
  }
}

export const interviewService = new InterviewService();
