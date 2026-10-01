import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  FileText,
  AlertCircle,
  Bot,
  ChevronDown,
  Clock,
  Zap,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  X,
  Settings,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useResumes } from '../../hooks/useResumes';
import { useVersions, useOptimizeMutation, useDeleteVersion } from '../../hooks/useResumeOptimizer';
import { useJobApplication, useUpdateJobApplication } from '../../hooks/useJobApplications';
import type { ResumeVersion } from '../../types/optimizer.types';
import { ResumeDraftEditor } from '../../components/optimizer/ResumeDraftEditor';

// Optimizer components
import { OptimizationSummary } from '../../components/optimizer/OptimizationSummary';
import { ChangeComparison } from '../../components/optimizer/ChangeComparison';
import { KeywordRecommendations } from '../../components/optimizer/KeywordRecommendations';
import { OptimizationWarnings } from '../../components/optimizer/OptimizationWarnings';
import { VersionSelector } from '../../components/optimizer/VersionSelector';
import { OptimizationSkeleton } from '../../components/optimizer/OptimizationSkeleton';

// Collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}> = ({ title, children, icon, defaultOpen = false, count }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card padding="md" className="border-stone-200/60 dark:border-white/[0.06]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-semibold text-stone-900 dark:text-white">{title}</h4>
          {count !== undefined && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-stone-100 dark:bg-white/[0.05] text-stone-500 dark:text-stone-400">
              {count}
            </span>
          )}
        </div>
        <ChevronRight size={14} className={isOpen ? 'rotate-90' : ''} style={{ transition: 'transform 0.2s' }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="pt-2 mt-2 border-t border-stone-200/60 dark:border-white/[0.05]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const ResumeOptimizerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const versionParam = searchParams.get('version');
  const jobId = searchParams.get('jobId');
  const reviewChanges = searchParams.get('review') === 'changes';

  const [jobDescription, setJobDescription] = useState('');
  const [showVersionDetail, setShowVersionDetail] = useState(true);
  const [atsResultId, setAtsResultId] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const initializedRef = useRef(false);
  const prevResumeIdRef = useRef<string | null>(null);

  const { data: resumes = [], isLoading: isLoadingResumes } = useResumes();
  const { data: versions = [], isLoading: isLoadingVersions, isError: versionsError, refetch: refetchVersions } = useVersions(resumeId);
  const optimizeMutation = useOptimizeMutation(resumeId ?? '');
  const deleteMutation = useDeleteVersion(resumeId ?? '');
  const { data: linkedJob } = useJobApplication(jobId);
  const updateJobMutation = useUpdateJobApplication();

  const selectedResume = resumes.find((r) => r._id === resumeId);
  const isOptimizing = optimizeMutation.isPending;
  const hasVersions = versions.length > 0;
  
  const latestVersion = versions.reduce<ResumeVersion | null>((latest, version) =>
    !latest || version.versionNumber > latest.versionNumber ? version : latest, null);
  // The URL is the single source of truth for selection, including deep links.
  const selectedVersion = versions.find(
    (v) => v.versionNumber === (versionParam ? Number(versionParam) : latestVersion?.versionNumber)
  ) ?? latestVersion;

  useEffect(() => {
    if (resumeId && selectedVersion && versionParam !== String(selectedVersion.versionNumber)) {
      setSearchParams({ resumeId, version: String(selectedVersion.versionNumber), ...(jobId ? { jobId } : {}) }, { replace: true });
    }
  }, [resumeId, selectedVersion, versionParam, jobId, setSearchParams]);

  // Reset ONLY when resumeId actually changes (not on every render)
  useEffect(() => {
    if (prevResumeIdRef.current !== resumeId) {
      prevResumeIdRef.current = resumeId;
      setJobDescription('');
      setShowVersionDetail(true);
      setDraftDirty(false);
      setDraftSaving(false);
      setAtsResultId(null);
      setAnalysisId(null);
      initializedRef.current = false;
      optimizeMutation.reset();
    }
  }, [resumeId, optimizeMutation]);

  // Keep the exact saved target text when entering from the Job Tracker.
  useEffect(() => {
    if (!linkedJob) return;
    setJobDescription(linkedJob.description);
    initializedRef.current = true;
    if (!resumeId && linkedJob.resumeId) {
      setSearchParams({
        resumeId: linkedJob.resumeId,
        jobId: linkedJob._id,
        ...(linkedJob.resumeVersionNumber ? { version: String(linkedJob.resumeVersionNumber) } : {}),
      }, { replace: true });
    }
  }, [linkedJob, resumeId, setSearchParams]);

  // Pre-fill job description from ATS result if available
  useEffect(() => {
    if (!initializedRef.current && selectedVersion?.changes?.keywordRecommendations && !jobDescription) {
      initializedRef.current = true;
    }
  }, [selectedVersion, jobDescription]);

  const handleSelectResume = useCallback((id: string) => {
    if (draftSaving || isOptimizing || deleteMutation.isPending) return;
    setSearchParams({ resumeId: id, ...(jobId ? { jobId } : {}) });
    if (!jobId) setJobDescription('');
  }, [draftSaving, isOptimizing, deleteMutation.isPending, jobId, setSearchParams]);

  const handleSelectVersion = useCallback((version: ResumeVersion) => {
    if (draftSaving || deleteMutation.isPending) return;
    setShowVersionDetail(true);
    setSearchParams({ resumeId: resumeId!, version: version.versionNumber.toString(), ...(jobId ? { jobId } : {}) });
  }, [draftSaving, deleteMutation.isPending, resumeId, jobId, setSearchParams]);

  const handleOptimize = useCallback(() => {
    if (draftSaving || deleteMutation.isPending || isOptimizing) return;
    if (!resumeId) {
      toast.error('Please select a resume first.');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      toast.error('Please paste a job description (at least 50 characters).');
      return;
    }

    optimizeMutation.mutate(
      { jobDescription, atsResultId: atsResultId || undefined, analysisId: analysisId || undefined },
      {
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ??
            'Optimization failed. Please check your API key or try again.';
          toast.error(msg);
        },
        onSuccess: (data) => {
          toast.success('Resume optimized successfully!');
          if (prevResumeIdRef.current !== resumeId) return;
          setShowVersionDetail(true);
          setSearchParams({ resumeId, version: data.version.versionNumber.toString(), ...(jobId ? { jobId } : {}) });
          if (jobId) {
            updateJobMutation.mutate({
              id: jobId,
              input: { resumeId, resumeVersionNumber: data.version.versionNumber },
            });
          }
        },
      }
    );
  }, [draftSaving, deleteMutation.isPending, isOptimizing, resumeId, jobDescription, atsResultId, analysisId, optimizeMutation, setSearchParams, jobId, updateJobMutation]);

  const handleDeleteVersion = useCallback((version: ResumeVersion) => {
    if (draftSaving || deleteMutation.isPending || isOptimizing) return;
    if (version.source === 'original') {
      toast.error('Cannot delete the original resume version.');
      return;
    }
    const isSelected = selectedVersion?.versionNumber === version.versionNumber;
    const unsavedNote = isSelected && draftDirty ? ' Your unsaved edits for this version will also be deleted.' : '';
    if (window.confirm(`Delete Version ${version.versionNumber}? This cannot be undone.${unsavedNote}`)) {
      deleteMutation.mutate(version.versionNumber, {
        onSuccess: () => {
          toast.success('Version deleted.');
          if (prevResumeIdRef.current !== resumeId) return;
          if (isSelected) {
            const nextVersion = versions.filter((item) => item.versionNumber !== version.versionNumber)
              .sort((a, b) => b.versionNumber - a.versionNumber)[0];
            setDraftDirty(false);
            setSearchParams(nextVersion
              ? { resumeId: resumeId!, version: String(nextVersion.versionNumber), ...(jobId ? { jobId } : {}) }
              : { resumeId: resumeId!, ...(jobId ? { jobId } : {}) });
          }
        },
        onError: () => toast.error('Failed to delete version.'),
      });
    }
  }, [draftSaving, draftDirty, isOptimizing, selectedVersion, versions, deleteMutation, resumeId, jobId, setSearchParams]);

  const report = selectedVersion?.changes;

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-6">
      {/* ── Page Header ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">
          AI Resume Optimizer
        </p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
          Optimize Resume for Job Description
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-2xl">
          Select a resume and paste a job description. AI suggests grounded wording changes; review and edit the resulting draft before export.
        </p>
      </motion.div>

      {/* ── Main Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Inputs (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Resume Selector + JD Input */}
          <Card padding="lg" className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resume Selector */}
              <div>
                <label htmlFor="optimizer-resume" className="label-base">Select Resume</label>
                {isLoadingResumes ? (
                  <div className="h-10 skeleton rounded-xl" />
                ) : resumes.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      No resumes uploaded. Go to <strong>Resumes</strong> to upload one.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      id="optimizer-resume"
                      value={resumeId ?? ''}
                      onChange={(e) => handleSelectResume(e.target.value)}
                      disabled={draftSaving || isOptimizing || deleteMutation.isPending}
                      className="input-base appearance-none pr-8 cursor-pointer"
                    >
                      <option value="" disabled>— Select a resume —</option>
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>{r.originalName}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Optional: Link to existing ATS/Analysis */}
              <div>
                <label className="label-base">Linked Analysis (Optional)</label>
                <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  <Settings size={14} />
                  <span>ATS Result & Analysis auto-detected from selected resume</span>
                </div>
              </div>
            </div>

            {/* Job Description - Full Width */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="optimizer-job-description" className="label-base">Job Description</label>
                <span className="text-[10px] text-stone-400">
                  {jobDescription.length} / 5,000 chars
                  {jobDescription.length < 50 && <span className="ml-2 text-amber-500">Min 50</span>}
                </span>
              </div>
              <textarea
                id="optimizer-job-description"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here — include responsibilities, requirements, preferred skills, and qualifications..."
                rows={12}
                className="input-base resize-none font-mono text-[12px] leading-relaxed"
                disabled={isOptimizing}
                maxLength={5000}
              />
              <p className="text-[10px] text-stone-400 mt-1.5">
                More detail = more accurate optimization. Minimum 50 characters required.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-200/60 dark:border-white/[0.05]">
              <Button
                onClick={handleOptimize}
                disabled={!resumeId || isOptimizing || draftSaving || deleteMutation.isPending || jobDescription.trim().length < 50}
                isLoading={isOptimizing}
                leftIcon={<Sparkles size={15} />}
                className="flex-1 min-w-[180px]"
              >
                {hasVersions ? 'Optimize Again' : 'Optimize Resume'}
              </Button>

              {hasVersions && (
                <Button
                  variant="secondary"
                  onClick={handleOptimize}
                  disabled={isOptimizing || draftSaving || deleteMutation.isPending || jobDescription.trim().length < 50}
                  isLoading={isOptimizing}
                  leftIcon={<RefreshCw size={14} />}
                >
                  New Optimization
                </Button>
              )}

            </div>
          </Card>

          {/* Version History - Collapsible */}
          <CollapsibleSection
            key={resumeId ?? 'no-resume'}
            title="Version History"
            icon={<FileText size={14} className="text-stone-400" />}
            count={versions.length}
            defaultOpen={true}
          >
            {versionsError && (
              <div role="alert" className="p-3 text-sm text-red-700 dark:text-red-300">
                <p>Could not load saved versions.</p>
                <Button size="sm" variant="secondary" className="mt-2" onClick={() => refetchVersions()}>Retry</Button>
              </div>
            )}
            <VersionSelector
              versions={versions}
              currentVersion={selectedVersion}
              onSelectVersion={handleSelectVersion}
              onDeleteVersion={handleDeleteVersion}
              isLoading={isLoadingVersions}
              disabled={draftSaving || deleteMutation.isPending || isOptimizing}
            />
          </CollapsibleSection>
        </div>

        {/* Right Panel: Status / Preview (4 cols) */}
        <div className="lg:col-span-4">
          <Card padding="lg" className="h-full flex flex-col">
            {!resumeId ? (
              <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
                  <FileText size={22} className="text-stone-400" />
                </div>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1">Select a Resume</p>
                <p className="text-xs text-stone-400 max-w-[200px]">
                  Choose a resume from the left to start optimizing.
                </p>
              </div>
            ) : isOptimizing && !report ? (
              <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-4" />
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1">Optimizing…</p>
                <p className="text-xs text-stone-400">AI is analyzing your resume against the job description.</p>
              </div>
            ) : report && !isOptimizing && showVersionDetail ? (
              <div className="flex flex-col items-center gap-4 text-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
                  <Sparkles size={24} className="text-violet-500" />
                </div>
                <p className="text-lg font-bold text-stone-900 dark:text-white">Optimization Complete</p>
                <p className="text-xs text-stone-400 max-w-[200px]">
                  Version {selectedVersion?.versionNumber} — {selectedVersion?.versionName}
                </p>
                {selectedVersion && (
                  <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/[0.05]">
                    <FileText size={13} className="text-stone-400 shrink-0" />
                    <span className="text-xs text-stone-600 dark:text-stone-400 truncate">
                      {selectedResume?.originalName}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-[10px] text-stone-400 shrink-0">
                      <Clock size={10} />
                      {new Date(selectedVersion.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowVersionDetail(false)}
                  disabled={draftSaving}
                  leftIcon={<X size={13} />}
                >
                  Back to Input
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mb-4">
                  <Bot size={22} className="text-violet-500" />
                </div>
                <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1">Ready to Optimize</p>
                <p className="text-xs text-stone-400 max-w-[200px]">
                  Paste a job description and click "Optimize Resume".
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {selectedVersion && selectedResume && resumeId && showVersionDetail && (
        <ResumeDraftEditor
          key={selectedVersion._id}
          resumeId={resumeId}
          version={selectedVersion}
          originalText={selectedResume?.extractedText ?? ''}
          jobDescription={jobDescription}
          onDirtyChange={setDraftDirty}
          onSavingChange={setDraftSaving}
          autoOpenSuggestions={reviewChanges}
        />
      )}

      {/* ── Full Optimization Report ────────────────────────── */}
      <AnimatePresence>
        {isOptimizing && !report && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OptimizationSkeleton />
          </motion.div>
        )}

        {report && !isOptimizing && showVersionDetail && (
          <motion.div
            key={selectedVersion?._id ?? 'report'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200 dark:bg-white/[0.06]" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">
                Optimization Report — Version {selectedVersion?.versionNumber}
              </span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-white/[0.06]" />
            </div>

            {/* Summary - Always Open */}
            <OptimizationSummary optimization={report} />

            {/* Collapsible Change Sections */}
            <div className="space-y-3">
              <CollapsibleSection
                title="Experience Improvements"
                icon={<FileText size={14} className="text-blue-500" />}
                count={report.experienceChanges.length}
                defaultOpen={report.experienceChanges.length > 0}
              >
                <ChangeComparison
                  changes={report.experienceChanges}
                  title=""
                  icon={<FileText size={14} className="text-blue-500" />}
                  emptyMessage="No experience changes suggested."
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Project Improvements"
                icon={<Zap size={14} className="text-amber-500" />}
                count={report.projectChanges.length}
                defaultOpen={report.projectChanges.length > 0}
              >
                <ChangeComparison
                  changes={report.projectChanges}
                  title=""
                  icon={<Zap size={14} className="text-amber-500" />}
                  emptyMessage="No project changes suggested."
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Skill Presentation Improvements"
                icon={<CheckCircle2 size={14} className="text-emerald-500" />}
                count={report.skillChanges.length}
                defaultOpen={report.skillChanges.length > 0}
              >
                <ChangeComparison
                  changes={report.skillChanges}
                  title=""
                  icon={<CheckCircle2 size={14} className="text-emerald-500" />}
                  emptyMessage="No skill presentation changes suggested."
                />
              </CollapsibleSection>

              <CollapsibleSection
                title="Bullet Point Improvements"
                icon={<ArrowRight size={14} className="text-violet-500" />}
                count={report.bulletPointChanges.length}
                defaultOpen={report.bulletPointChanges.length > 0}
              >
                <ChangeComparison
                  changes={report.bulletPointChanges}
                  title=""
                  icon={<ArrowRight size={14} className="text-violet-500" />}
                  emptyMessage="No bullet point improvements suggested."
                />
              </CollapsibleSection>
            </div>

            {/* Keywords & Warnings - Side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CollapsibleSection
                title="Keyword Recommendations"
                icon={<Zap size={14} className="text-blue-500" />}
                count={report.keywordRecommendations.length}
                defaultOpen={true}
              >
                <KeywordRecommendations optimization={report} />
              </CollapsibleSection>

              <CollapsibleSection
                title="Warnings & Safety Notes"
                icon={<AlertCircle size={14} className="text-amber-500" />}
                count={report.warnings.length}
                defaultOpen={report.warnings.length > 0}
              >
                <OptimizationWarnings optimization={report} />
              </CollapsibleSection>
            </div>

            {/* Footer metadata */}
            {selectedVersion && (
              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-2 border-t border-stone-100 dark:border-white/[0.04]">
                <span>Version: {selectedVersion.versionNumber} · Source: {selectedVersion.source}</span>
                <span>Created: {new Date(selectedVersion.createdAt).toLocaleString()}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeOptimizerPage;
