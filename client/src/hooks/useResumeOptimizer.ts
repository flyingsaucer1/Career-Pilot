import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { optimizerService } from '../services/optimizer.service';
import type { CompareATSRequest, OptimizeResumeRequest, ResumeVersion, SaveResumeDraftRequest } from '../types/optimizer.types';

// ─────────────────────────────────────────────────────────────
// Query key factory
// ─────────────────────────────────────────────────────────────
export const optimizerQueryKey = (resumeId: string) => ['optimizer', resumeId] as const;
export const versionQueryKey = (resumeId: string, versionNumber: number) =>
  ['optimizer', resumeId, 'version', versionNumber] as const;
export const draftQueryKey = (version: ResumeVersion) =>
  ['optimizer-draft', version.userId, version._id] as const;

export interface ResumeDraftState {
  text: string;
  savedText: string;
  expectedUpdatedAt: string;
  needsConversion: boolean;
}

// Keep in-progress edits in memory when the user visits another workspace page.
// A reload still requires saving; resume content is never put in browser storage.
export const useResumeDraftState = (version: ResumeVersion, originalText: string) => {
  const queryClient = useQueryClient();
  const startingText = version.contentFormat === 'resume' ? version.optimizedContent : originalText;
  const { data } = useQuery<ResumeDraftState>({
    queryKey: draftQueryKey(version),
    enabled: false,
    gcTime: Infinity,
    initialData: {
      text: startingText,
      savedText: startingText,
      expectedUpdatedAt: version.updatedAt,
      needsConversion: version.contentFormat !== 'resume',
    },
  });
  const updateDraft = useCallback((draft: ResumeDraftState | ((current: ResumeDraftState) => ResumeDraftState)) => {
      queryClient.setQueryData<ResumeDraftState>(draftQueryKey(version), (current) =>
        typeof draft === 'function' ? draft(current!) : draft
      );
  }, [queryClient, version]);
  return { draft: data!, updateDraft };
};

// ─────────────────────────────────────────────────────────────
// Get version history (read-only, no AI call)
// ─────────────────────────────────────────────────────────────
export const useVersions = (resumeId: string | null) =>
  useQuery({
    queryKey: optimizerQueryKey(resumeId ?? ''),
    queryFn: () => optimizerService.getVersions(resumeId!),
    enabled: !!resumeId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

// ─────────────────────────────────────────────────────────────
// Get a specific version
// ─────────────────────────────────────────────────────────────
export const useVersion = (resumeId: string | null, versionNumber: number | null) =>
  useQuery({
    queryKey: versionQueryKey(resumeId ?? '', versionNumber ?? 0),
    queryFn: () => optimizerService.getVersion(resumeId!, versionNumber!),
    enabled: !!resumeId && versionNumber !== null && versionNumber > 0,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

// ─────────────────────────────────────────────────────────────
// Trigger optimization (POST to AI, store result)
// ─────────────────────────────────────────────────────────────
export const useOptimizeMutation = (resumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: OptimizeResumeRequest) => optimizerService.optimizeResume(resumeId, request),
    onSuccess: async ({ version }) => {
      await queryClient.cancelQueries({ queryKey: optimizerQueryKey(resumeId) });
      queryClient.setQueryData<ResumeVersion[]>(optimizerQueryKey(resumeId), (current = []) =>
        [...current.filter((item) => item.versionNumber !== version.versionNumber), version]
          .sort((a, b) => a.versionNumber - b.versionNumber)
      );
      queryClient.setQueryData(versionQueryKey(resumeId, version.versionNumber), version);
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Compare ATS scores for the original and saved draft
// ─────────────────────────────────────────────────────────────
export const useCompareATSScores = (resumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      versionNumber,
      request,
    }: {
      versionNumber: number;
      request: CompareATSRequest;
    }) => optimizerService.compareATSScores(resumeId, versionNumber, request),
    onSuccess: async (version) => {
      await queryClient.cancelQueries({ queryKey: optimizerQueryKey(resumeId) });
      queryClient.setQueryData(versionQueryKey(resumeId, version.versionNumber), version);
      queryClient.setQueryData<ResumeVersion[]>(optimizerQueryKey(resumeId), (current = []) =>
        current.map((item) => item.versionNumber === version.versionNumber ? version : item)
      );
    },
  });
};

export const useSaveResumeDraft = (resumeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ versionNumber, request }: { versionNumber: number; request: SaveResumeDraftRequest }) =>
      optimizerService.saveDraft(resumeId, versionNumber, request),
    onSuccess: async (saved, { request }) => {
      await queryClient.cancelQueries({ queryKey: optimizerQueryKey(resumeId) });
      queryClient.setQueryData(versionQueryKey(resumeId, saved.versionNumber), saved);
      queryClient.setQueryData<ResumeVersion[]>(
        optimizerQueryKey(resumeId),
        (current = []) => current.map((version) =>
          version.versionNumber === saved.versionNumber ? saved : version
        )
      );
      // The request can finish after the editor unmounts during navigation.
      queryClient.setQueryData<ResumeDraftState>(draftQueryKey(saved), (current) => current && ({
        text: current.text.trim() === request.content ? saved.optimizedContent : current.text,
        savedText: saved.optimizedContent,
        expectedUpdatedAt: saved.updatedAt,
        needsConversion: false,
      }));
    },
  });
};

// ─────────────────────────────────────────────────────────────
// Delete a version
// ─────────────────────────────────────────────────────────────
export const useDeleteVersion = (resumeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionNumber: number) => optimizerService.deleteVersion(resumeId, versionNumber),
    onSuccess: async (_data, versionNumber) => {
      await queryClient.cancelQueries({ queryKey: optimizerQueryKey(resumeId) });
      const deleted = queryClient.getQueryData<ResumeVersion[]>(optimizerQueryKey(resumeId))
        ?.find((version) => version.versionNumber === versionNumber);
      queryClient.setQueryData<ResumeVersion[]>(optimizerQueryKey(resumeId), (current = []) =>
        current.filter((version) => version.versionNumber !== versionNumber)
      );
      queryClient.removeQueries({ queryKey: versionQueryKey(resumeId, versionNumber), exact: true });
      if (deleted) queryClient.removeQueries({ queryKey: draftQueryKey(deleted), exact: true });
    },
  });
};
