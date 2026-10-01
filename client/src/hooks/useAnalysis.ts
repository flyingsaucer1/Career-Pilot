import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analysisService } from '../services/analysis.service';

export const analysisQueryKey = (resumeId: string) => ['analysis', resumeId] as const;

// ─────────────────────────────────────────────────────────────
// Get existing analysis (read-only, no AI call)
// ─────────────────────────────────────────────────────────────
export const useAnalysis = (resumeId: string | null) =>
  useQuery({
    queryKey: analysisQueryKey(resumeId ?? ''),
    queryFn: () => analysisService.getAnalysis(resumeId!),
    enabled: !!resumeId,
    staleTime: 1000 * 60 * 10, // 10 minutes — analysis results don't change unless re-run
    retry: 1,
  });

// ─────────────────────────────────────────────────────────────
// Trigger analysis (POST to AI, store result)
// ─────────────────────────────────────────────────────────────
export const useAnalyzeMutation = (resumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (force: boolean) => analysisService.analyzeResume(resumeId, force),
    onSuccess: (data) => {
      // Populate cache immediately so the GET query doesn't re-fetch
      queryClient.setQueryData(analysisQueryKey(resumeId), data);
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Delete analysis
// ─────────────────────────────────────────────────────────────
export const useDeleteAnalysis = (resumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analysisService.deleteAnalysis(resumeId),
    onSuccess: () => {
      queryClient.setQueryData(analysisQueryKey(resumeId), null);
    },
  });
};
