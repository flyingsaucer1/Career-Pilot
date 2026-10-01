import apiClient from './api';
import type { ApiSuccessResponse } from '../types/api.types';
import type { InterviewSession } from '../types/interview.types';

export const interviewService = {
  async list(): Promise<InterviewSession[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<{ sessions: InterviewSession[] }>>('/interviews');
    return data.data.sessions;
  },
  async get(id: string): Promise<InterviewSession> {
    const { data } = await apiClient.get<ApiSuccessResponse<{ session: InterviewSession }>>(`/interviews/${id}`);
    return data.data.session;
  },
  async create(applicationId: string): Promise<InterviewSession> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ session: InterviewSession }>>('/interviews', { applicationId });
    return data.data.session;
  },
  async answer(sessionId: string, questionId: string, answer: string): Promise<InterviewSession> {
    const { data } = await apiClient.post<ApiSuccessResponse<{ session: InterviewSession }>>(
      `/interviews/${sessionId}/questions/${questionId}/answer`, { answer }
    );
    return data.data.session;
  },
  async updateStatus(id: string, status: 'active' | 'completed'): Promise<InterviewSession> {
    const { data } = await apiClient.patch<ApiSuccessResponse<{ session: InterviewSession }>>(`/interviews/${id}`, { status });
    return data.data.session;
  },
  async delete(id: string): Promise<void> { await apiClient.delete(`/interviews/${id}`); },
};
