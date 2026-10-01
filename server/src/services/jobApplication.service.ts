import mongoose, { Types } from 'mongoose';
import { JobApplication, IJobApplication, APPLICATION_STATUSES } from '../models/JobApplication.model';
import { Resume } from '../models/Resume.model';
import { ResumeVersion } from '../models/ResumeVersion.model';
import { InterviewSession } from '../models/InterviewSession.model';
import type { CreateJobApplicationInput, UpdateJobApplicationInput } from '../validators/jobApplication.validator';
import { withOwnedWrite } from './ownedWrite.service';

const makeOperationalError = (message: string, statusCode: number) => Object.assign(new Error(message), {
  statusCode, isOperational: true,
});

type LinkInput = { resumeId?: string | null; resumeVersionNumber?: number | null };

export class JobApplicationService {
  private async resolveResumeLink(userId: string, input: LinkInput) {
    if (!input.resumeId) return { resumeId: null, resumeVersionId: null, resumeVersionNumber: null };
    const resume = await Resume.findOne({ _id: input.resumeId, userId });
    if (!resume) throw makeOperationalError('Linked resume not found.', 404);
    if (input.resumeVersionNumber == null) {
      return { resumeId: resume._id, resumeVersionId: null, resumeVersionNumber: null };
    }
    const version = await ResumeVersion.findOne({
      userId, resumeId: resume._id, versionNumber: input.resumeVersionNumber,
    });
    if (!version) throw makeOperationalError('Linked resume version not found.', 404);
    return { resumeId: resume._id, resumeVersionId: version._id, resumeVersionNumber: version.versionNumber };
  }

  async create(userId: string, input: CreateJobApplicationInput): Promise<IJobApplication> {
    const link = await this.resolveResumeLink(userId, input);
    const now = new Date();
    return withOwnedWrite(userId, input.resumeId ?? null, async (session) => {
    const [created] = await JobApplication.create([{
      ...input,
      url: input.url ?? '',
      notes: input.notes ?? '',
      applicationDate: input.applicationDate ? new Date(input.applicationDate) : null,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      ...link,
      userId: new Types.ObjectId(userId),
      events: [{ kind: 'created', toStatus: input.status, occurredAt: now }],
    }], { session });
    return created;
    });
  }

  async list(userId: string, filters: { search?: string; status?: string; archived?: boolean }) {
    const query: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      archivedAt: filters.archived ? { $ne: null } : null,
    };
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { company: { $regex: escaped, $options: 'i' } },
        { role: { $regex: escaped, $options: 'i' } },
        { notes: { $regex: escaped, $options: 'i' } },
      ];
    }
    return JobApplication.find(query).sort({ updatedAt: -1 });
  }

  async getById(userId: string, id: string): Promise<IJobApplication> {
    const application = await JobApplication.findOne({ _id: id, userId });
    if (!application) throw makeOperationalError('Application not found.', 404);
    return application;
  }

  async update(userId: string, id: string, input: UpdateJobApplicationInput): Promise<IJobApplication> {
    const application = await this.getById(userId, id);
    const now = new Date();
    if ('resumeId' in input || 'resumeVersionNumber' in input) {
      const link = await this.resolveResumeLink(userId, {
        resumeId: input.resumeId ?? application.resumeId?.toString() ?? null,
        resumeVersionNumber: input.resumeVersionNumber ?? null,
      });
      application.resumeId = link.resumeId;
      application.resumeVersionId = link.resumeVersionId;
      application.resumeVersionNumber = link.resumeVersionNumber;
    }
    if (input.status && input.status !== application.status) {
      application.events.push({
        kind: 'status_changed', fromStatus: application.status, toStatus: input.status, occurredAt: now,
      });
      application.status = input.status;
    }
    if (typeof input.archived === 'boolean') {
      const willArchive = input.archived && !application.archivedAt;
      const willRestore = !input.archived && !!application.archivedAt;
      if (willArchive || willRestore) {
        application.archivedAt = willArchive ? now : null;
        application.events.push({ kind: willArchive ? 'archived' : 'restored', occurredAt: now });
      }
    }
    const directFields = ['company', 'role', 'url', 'description', 'notes'] as const;
    for (const field of directFields) if (input[field] !== undefined) application[field] = input[field] ?? '';
    if (input.applicationDate !== undefined) application.applicationDate = input.applicationDate ? new Date(input.applicationDate) : null;
    if (input.followUpDate !== undefined) application.followUpDate = input.followUpDate ? new Date(input.followUpDate) : null;
    await application.save();
    return application;
  }

  async delete(userId: string, id: string): Promise<void> {
    const owner = new Types.ObjectId(userId);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const application = await JobApplication.findOne({ _id: id, userId: owner }).session(session);
        if (!application) throw makeOperationalError('Application not found.', 404);
        await InterviewSession.updateMany(
          { userId: owner, jobApplicationId: application._id },
          { $set: { jobApplicationId: null } },
          { session }
        );
        await JobApplication.deleteOne({ _id: application._id, userId: owner }, { session });
      });
    } finally { await session.endSession(); }
  }

  async analytics(userId: string) {
    const owner = new Types.ObjectId(userId);
    const grouped = await JobApplication.aggregate<{ _id: string; count: number }>([
      { $match: { userId: owner, archivedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, 0])) as Record<string, number>;
    for (const item of grouped) byStatus[item._id] = item.count;
    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
    const [archived, interviews, upcomingFollowUps, scoreVersions] = await Promise.all([
      JobApplication.countDocuments({ userId: owner, archivedAt: { $ne: null } }),
      JobApplication.countDocuments({ userId: owner, $or: [{ status: 'interview' }, { 'events.toStatus': 'interview' }] }),
      JobApplication.find({
        userId: owner, archivedAt: null, followUpDate: { $gte: new Date(), $lte: new Date(Date.now() + 14 * 86400000) },
      }).sort({ followUpDate: 1 }).select('company role followUpDate'),
      ResumeVersion.find({ userId: owner, atsScoreAfter: { $ne: null } })
        .sort({ updatedAt: -1 }).limit(20)
        .select('resumeId versionNumber versionName atsScoreBefore atsScoreAfter updatedAt'),
    ]);
    const recentApplications = await JobApplication.find({ userId: owner })
      .sort({ updatedAt: -1 }).limit(8).select('company role status updatedAt events');
    return {
      total,
      archived,
      interviews,
      byStatus,
      upcomingFollowUps,
      scoreHistory: scoreVersions,
      recentActivity: recentApplications.map((application) => ({
        applicationId: application._id,
        company: application.company,
        role: application.role,
        status: application.status,
        updatedAt: application.updatedAt,
        event: application.events.at(-1) ?? null,
      })),
    };
  }
}

export const jobApplicationService = new JobApplicationService();
