import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interviewService } from '../services/interview.service';

export const INTERVIEWS_KEY = ['interviews'] as const;

export const useInterviewSessions = () => useQuery({
  queryKey: INTERVIEWS_KEY,
  queryFn: interviewService.list,
  staleTime: 30_000,
});

export const useInterviewSession = (id: string | null) => useQuery({
  queryKey: [...INTERVIEWS_KEY, 'detail', id ?? ''],
  queryFn: () => interviewService.get(id!),
  enabled: !!id,
  staleTime: 30_000,
});

const useRefreshInterviews = () => {
  const client = useQueryClient();
  return (session?: { _id: string }) => {
    client.invalidateQueries({ queryKey: INTERVIEWS_KEY });
    if (session) client.setQueryData([...INTERVIEWS_KEY, 'detail', session._id], session);
  };
};

export const useCreateInterview = () => {
  const refresh = useRefreshInterviews();
  return useMutation({ mutationFn: interviewService.create, onSuccess: refresh });
};

export const useAnswerInterview = () => {
  const refresh = useRefreshInterviews();
  return useMutation({
    mutationFn: ({ sessionId, questionId, answer }: { sessionId: string; questionId: string; answer: string }) =>
      interviewService.answer(sessionId, questionId, answer),
    onSuccess: refresh,
  });
};

export const useUpdateInterviewStatus = () => {
  const refresh = useRefreshInterviews();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'completed' }) => interviewService.updateStatus(id, status),
    onSuccess: refresh,
  });
};

export const useDeleteInterview = () => {
  const refresh = useRefreshInterviews();
  return useMutation({ mutationFn: interviewService.delete, onSuccess: () => refresh() });
};
