import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';
export interface PublicConfig { processors: string[]; operator: string | null; supportEmail: string | null; consentVersion: string; maxUploadMB: number; maxResumes: number; dailyAIRequestLimit: number }
export function usePublicConfig() {
  return useQuery({ queryKey: ['public-config'], queryFn: async () => (await apiClient.get<{ data: PublicConfig }>('/public-config')).data.data, staleTime: 60_000, retry: 1 });
}
