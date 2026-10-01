import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { jobApplicationService } from '../services/jobApplication.service';
import type { ApplicationStatus, JobApplicationInput } from '../types/jobApplication.types';

export const JOB_APPLICATIONS_KEY = ['job-applications'] as const;
export const JOB_ANALYTICS_KEY = ['job-analytics'] as const;

export const useJobApplications = (filters: { search?: string; status?: ApplicationStatus; archived?: boolean } = {}) =>
  useQuery({
    queryKey: [...JOB_APPLICATIONS_KEY, filters],
    queryFn: () => jobApplicationService.list(filters),
    staleTime: 30_000,
  });

export const useJobApplication = (id: string | null) => useQuery({
  queryKey: [...JOB_APPLICATIONS_KEY, 'detail', id ?? ''],
  queryFn: () => jobApplicationService.get(id!),
  enabled: !!id,
  staleTime: 60_000,
});

export const useJobAnalytics = () => useQuery({
  queryKey: JOB_ANALYTICS_KEY,
  queryFn: jobApplicationService.analytics,
  staleTime: 30_000,
});

const useRefreshJobs = () => {
  const client = useQueryClient();
  return () => {
    client.invalidateQueries({ queryKey: JOB_APPLICATIONS_KEY });
    client.invalidateQueries({ queryKey: JOB_ANALYTICS_KEY });
  };
};

export const useCreateJobApplication = () => {
  const refresh = useRefreshJobs();
  return useMutation({ mutationFn: (input: JobApplicationInput) => jobApplicationService.create(input), onSuccess: refresh });
};

export const useUpdateJobApplication = () => {
  const refresh = useRefreshJobs();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<JobApplicationInput> & { archived?: boolean } }) =>
      jobApplicationService.update(id, input),
    onSuccess: refresh,
  });
};

export const useDeleteJobApplication = () => {
  const refresh = useRefreshJobs();
  return useMutation({ mutationFn: jobApplicationService.delete, onSuccess: refresh });
};
