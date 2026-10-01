import apiClient from './api';
import type { ApiSuccessResponse } from '../types/api.types';
import type { ApplicationAnalytics, ApplicationStatus, JobApplication, JobApplicationInput } from '../types/jobApplication.types';

type Filters = { search?: string; status?: ApplicationStatus; archived?: boolean };

export const jobApplicationService = {
  async list(filters: Filters = {}): Promise<JobApplication[]> {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.archived) params.set('archived', 'true');
    const { data } = await apiClient.get<ApiSuccessResponse<{ applications: JobApplication[] }>>(
      `/applications${params.size ? `?${params}` : ''}`
    );
    return data.data.applications;
  },
  async get(id: string): Promise<JobApplication> {
    const { data } = await apiClient.get<ApiSuccessResponse<{ application: JobApplication }>>(`/applications/${id}`);
    return data.data.application;
  },
  async create(input: JobApplicationInput): Promise<JobApplication> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ application: JobApplication }>>('/applications', input);
    return data.data.application;
  },
  async update(id: string, input: Partial<JobApplicationInput> & { archived?: boolean }): Promise<JobApplication> {
    const { data } = await apiClient.patch<ApiSuccessResponse<{ application: JobApplication }>>(`/applications/${id}`, input);
    return data.data.application;
  },
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/applications/${id}`);
  },
  async analytics(): Promise<ApplicationAnalytics> {
    const { data } = await apiClient.get<ApiSuccessResponse<{ analytics: ApplicationAnalytics }>>('/applications/analytics');
    return data.data.analytics;
  },
};
