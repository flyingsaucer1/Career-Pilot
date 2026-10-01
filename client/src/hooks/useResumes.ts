import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resumeService } from '../services/resume.service';

export const RESUMES_QUERY_KEY = ['resumes'] as const;

// ─────────────────────────────────────────────────────────────
// List all resumes
// ─────────────────────────────────────────────────────────────
export const useResumes = () => {
  return useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: () => resumeService.getResumes(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// ─────────────────────────────────────────────────────────────
// Delete a resume
// ─────────────────────────────────────────────────────────────
export const useDeleteResume = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resumeService.deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY });
    },
  });
};
