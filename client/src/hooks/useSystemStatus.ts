import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/api';

interface SystemStatus {
  databaseReady: boolean;
  ai: { provider: string; model: string | null; ready: boolean; message: string };
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: SystemStatus }>('/status', { timeout: 5000 });
      return response.data.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
    retry: false,
  });
}
