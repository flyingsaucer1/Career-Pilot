import apiClient from './api';
import type { ApiSuccessResponse } from '../types/api.types';
import type {
  Resume,
  ResumeUploadResponse,
  ResumeListResponse,
  ResumeSingleResponse,
} from '../types/resume.types';

export type UploadProgressCallback = (percent: number) => void;

export const resumeService = {
  /**
   * Upload a resume file. Accepts an onUploadProgress callback for progress tracking.
   */
  async uploadResume(
    file: File,
    onUploadProgress?: UploadProgressCallback
  ): Promise<Resume> {
    const formData = new FormData();
    formData.append('resume', file);

    const { data } = await apiClient.post<ApiSuccessResponse<ResumeUploadResponse>>(
      '/resumes/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percent);
          }
        },
      }
    );
    return data.data.resume;
  },

  /**
   * Get all resumes for the authenticated user.
   */
  async getResumes(): Promise<Resume[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<ResumeListResponse>>('/resumes');
    return data.data.resumes;
  },

  /**
   * Get a single resume by ID.
   */
  async getResumeById(id: string): Promise<Resume> {
    const { data } = await apiClient.get<ApiSuccessResponse<ResumeSingleResponse>>(
      `/resumes/${id}`
    );
    return data.data.resume;
  },

  async downloadOriginal(id: string): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/resumes/${id}/file`, { responseType: 'blob' });
    return data;
  },

  /**
   * Delete a resume by ID.
   */
  async deleteResume(id: string): Promise<{ storageCleanupPending: boolean }> {
    const { data } = await apiClient.delete<ApiSuccessResponse<{ storageCleanupPending: boolean }>>(`/resumes/${id}`);
    return data.data;
  },
};
