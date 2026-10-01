export const APPLICATION_STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export interface ApplicationEvent {
  kind: 'created' | 'status_changed' | 'archived' | 'restored';
  fromStatus?: ApplicationStatus;
  toStatus?: ApplicationStatus;
  occurredAt: string;
}

export interface JobApplication {
  _id: string;
  userId: string;
  company: string;
  role: string;
  url: string;
  description: string;
  status: ApplicationStatus;
  applicationDate: string | null;
  followUpDate: string | null;
  notes: string;
  resumeId: string | null;
  resumeVersionId: string | null;
  resumeVersionNumber: number | null;
  archivedAt: string | null;
  events: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface JobApplicationInput {
  company: string;
  role: string;
  url?: string;
  description: string;
  status: ApplicationStatus;
  applicationDate?: string | null;
  followUpDate?: string | null;
  notes?: string;
  resumeId?: string | null;
  resumeVersionNumber?: number | null;
}

export interface ApplicationAnalytics {
  total: number;
  archived: number;
  interviews: number;
  byStatus: Record<ApplicationStatus, number>;
  upcomingFollowUps: Array<{ _id: string; company: string; role: string; followUpDate: string }>;
  scoreHistory: Array<{
    _id: string; resumeId: string; versionNumber: number; versionName: string;
    atsScoreBefore: number; atsScoreAfter: number; updatedAt: string;
  }>;
  recentActivity: Array<{
    applicationId: string; company: string; role: string; status: ApplicationStatus;
    updatedAt: string; event: ApplicationEvent | null;
  }>;
}
