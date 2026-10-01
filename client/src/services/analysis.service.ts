import apiClient from './api';
import type { ApiSuccessResponse } from '../types/api.types';
import type { Analysis, AnalysisResponse } from '../types/analysis.types';

export const analysisService = {
  /**
   * Trigger analysis for a resume.
   * Pass force=true to bypass cache and re-run AI analysis.
   */
  async analyzeResume(resumeId: string, force = false): Promise<Analysis> {
    const url = force
      ? `/analysis/${resumeId}?force=true`
      : `/analysis/${resumeId}`;
    const { data } = await apiClient.post<ApiSuccessResponse<AnalysisResponse>>(url);
    return data.data.analysis!;
  },

  /**
   * Get a previously stored analysis. Returns null if none exists.
   */
  async getAnalysis(resumeId: string): Promise<Analysis | null> {
    const { data } = await apiClient.get<ApiSuccessResponse<AnalysisResponse>>(
      `/analysis/${resumeId}`
    );
    return data.data.analysis;
  },

  /**
   * Delete stored analysis (allows fresh re-analysis).
   */
  async deleteAnalysis(resumeId: string): Promise<void> {
    await apiClient.delete(`/analysis/${resumeId}`);
  },
};
