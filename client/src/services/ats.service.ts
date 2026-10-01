import apiClient from './api';
import type { ApiSuccessResponse } from '../types/api.types';
import type { ATSReport, ATSResponse } from '../types/ats.types';

export const atsService = {
  /**
   * Run ATS analysis for a resume against a job description.
   * Pass force=true to bypass cache and re-run AI analysis.
   */
  async calculateATS(
    resumeId: string,
    jobDescription: string,
    force = false
  ): Promise<ATSReport> {
    const url = force
      ? `/ats/${resumeId}?force=true`
      : `/ats/${resumeId}`;
    const { data } = await apiClient.post<ApiSuccessResponse<ATSResponse>>(url, {
      jobDescription,
    });
    return data.data.atsResult!;
  },

  /**
   * Get a previously stored ATS result. Returns null if none exists.
   */
  async getATS(resumeId: string): Promise<ATSReport | null> {
    const { data } = await apiClient.get<ApiSuccessResponse<ATSResponse>>(
      `/ats/${resumeId}`
    );
    return data.data.atsResult;
  },

  /**
   * Delete a stored ATS result (allows fresh re-analysis).
   */
  async deleteATS(resumeId: string): Promise<void> {
    await apiClient.delete(`/ats/${resumeId}`);
  },
};
