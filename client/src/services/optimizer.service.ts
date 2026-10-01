import apiClient from './api';
import type { ApiSuccessResponse } from '../types/api.types';
import type {
  ResumeVersion,
  OptimizeResumeRequest,
  OptimizeResumeResponse,
  VersionsResponse,
  VersionResponse,
  CompareATSRequest,
  SaveResumeDraftRequest,
} from '../types/optimizer.types';

export const optimizerService = {
  /**
   * Trigger resume optimization for a job description.
   */
  async optimizeResume(resumeId: string, request: OptimizeResumeRequest): Promise<OptimizeResumeResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<OptimizeResumeResponse>>(
      `/resume-optimizer/${resumeId}`,
      request
    );
    return data.data;
  },

  /**
   * Get all versions for a resume.
   */
  async getVersions(resumeId: string): Promise<ResumeVersion[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<VersionsResponse>>(
      `/resume-optimizer/${resumeId}`
    );
    return data.data.versions;
  },

  /**
   * Get a specific version by version number.
   */
  async getVersion(resumeId: string, versionNumber: number): Promise<ResumeVersion> {
    const { data } = await apiClient.get<ApiSuccessResponse<VersionResponse>>(
      `/resume-optimizer/${resumeId}/${versionNumber}`
    );
    return data.data.version;
  },

  async saveDraft(resumeId: string, versionNumber: number, request: SaveResumeDraftRequest): Promise<ResumeVersion> {
    const { data } = await apiClient.patch<ApiSuccessResponse<VersionResponse>>(
      `/resume-optimizer/${resumeId}/${versionNumber}/content`, request
    );
    return data.data.version;
  },

  async exportDraft(resumeId: string, versionNumber: number, format: 'pdf' | 'docx'): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
      `/resume-optimizer/${resumeId}/${versionNumber}/export/${format}`,
      { responseType: 'blob' }
    );
    return data;
  },

  /** Re-evaluate the original and saved draft for the same target job. */
  async compareATSScores(
    resumeId: string,
    versionNumber: number,
    request: CompareATSRequest
  ): Promise<ResumeVersion> {
    const { data } = await apiClient.post<ApiSuccessResponse<VersionResponse>>(
      `/resume-optimizer/${resumeId}/${versionNumber}/ats-comparison`,
      request
    );
    return data.data.version;
  },

  /**
   * Delete a specific version (not version 1).
   */
  async deleteVersion(resumeId: string, versionNumber: number): Promise<void> {
    await apiClient.delete(`/resume-optimizer/${resumeId}/${versionNumber}`);
  },
};
