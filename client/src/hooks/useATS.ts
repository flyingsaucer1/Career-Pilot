import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { atsService } from '../services/ats.service';

// ─────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────
export const atsQueryKey = (resumeId: string) => ['ats', resumeId] as const;

// ─────────────────────────────────────────────────────────────
// Get existing ATS result (read-only, no AI call)
// ─────────────────────────────────────────────────────────────
export const useATS = (resumeId: string | null) =>
  useQuery({
    queryKey: atsQueryKey(resumeId ?? ''),
    queryFn: () => atsService.getATS(resumeId!),
    enabled: !!resumeId,
    staleTime: 1000 * 60 * 10, // 10 minutes — ATS results don't change unless re-run
    retry: 1,
  });

// ─────────────────────────────────────────────────────────────
// Trigger ATS analysis (POST to AI, store result)
// ─────────────────────────────────────────────────────────────
export const useATSMutation = (resumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobDescription, force }: { jobDescription: string; force: boolean }) =>
      atsService.calculateATS(resumeId, jobDescription, force),
    onSuccess: (data) => {
      // Populate cache immediately — GET query won't re-fetch
      queryClient.setQueryData(atsQueryKey(resumeId), data);
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Delete ATS result
// ─────────────────────────────────────────────────────────────
export const useDeleteATS = (resumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => atsService.deleteATS(resumeId),
    onSuccess: () => {
      queryClient.setQueryData(atsQueryKey(resumeId), null);
    },
  });
};
