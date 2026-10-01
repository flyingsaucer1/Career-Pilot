import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  FileText,
  AlertCircle,
  Bot,
  ChevronDown,
  Trash2,
  Clock,
  Wand2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useResumes } from '../../hooks/useResumes';
import { useATS, useATSMutation, useDeleteATS } from '../../hooks/useATS';
import { useJobApplication } from '../../hooks/useJobApplications';
import { useOptimizeMutation } from '../../hooks/useResumeOptimizer';

// ATS sub-components
import { ATSScoreCircle } from '../../components/ats/ATSScoreCircle';
import { KeywordComparison } from '../../components/ats/KeywordComparison';
import { SkillsComparison } from '../../components/ats/SkillsComparison';
import { ATSRadarChart } from '../../components/ats/ATSRadarChart';
import { KeywordDensityChart } from '../../components/ats/KeywordDensityChart';
import { ATSChecklist } from '../../components/ats/ATSChecklist';
import { ATSSuggestionsPanel } from '../../components/ats/ATSSuggestionsPanel';
import { ATSSkeleton } from '../../components/ats/ATSSkeleton';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const ScoreStat: React.FC<{ label: string; value: number; color?: string }> = ({
  label,
  value,
  color = 'text-violet-600 dark:text-violet-400',
}) => (
  <div className="flex flex-col items-center justify-center p-3 bg-stone-50 dark:bg-white/[0.03] rounded-xl border border-stone-200/60 dark:border-white/[0.05]">
    <span className={`text-xl font-bold ${color}`}>{Math.round(value)}%</span>
    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5 text-center">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// ATS Page
// ─────────────────────────────────────────────────────────────
const ATSPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const jobId = searchParams.get('jobId');

  const [jobDescription, setJobDescription] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const { data: resumes = [], isLoading: isLoadingResumes } = useResumes();
  const { data: existingReport, isLoading: isLoadingReport } = useATS(resumeId);
  const atsMutation = useATSMutation(resumeId ?? '');
  const deleteMutation = useDeleteATS(resumeId ?? '');
  const updateResumeMutation = useOptimizeMutation(resumeId ?? '');
  const { data: linkedJob } = useJobApplication(jobId);

  const selectedResume = resumes.find((r) => r._id === resumeId);
  const isAnalyzing = atsMutation.isPending;
  const hasReport = !!existingReport;
  const initializedRef = React.useRef(false);

  // A saved job is the source of truth when this page is opened from the tracker.
  useEffect(() => {
    if (!linkedJob) return;
    setJobDescription(linkedJob.description);
    initializedRef.current = true;
    if (!resumeId && linkedJob.resumeId) {
      setSearchParams({ resumeId: linkedJob.resumeId, jobId: linkedJob._id }, { replace: true });
    }
  }, [linkedJob, resumeId, setSearchParams]);

  // Otherwise pre-fill from the cached report for the selected resume.
  useEffect(() => {
    if (!jobId && !initializedRef.current && existingReport?.jobDescription && !jobDescription) {
      setJobDescription(existingReport.jobDescription);
      initializedRef.current = true;
    }
  }, [existingReport, jobDescription, jobId]);

  const handleSelectResume = (id: string) => {
    setSearchParams({ resumeId: id, ...(jobId ? { jobId } : {}) });
    if (!jobId) setJobDescription('');
  };

  const handleAnalyze = (force = false) => {
    if (!resumeId) {
      toast.error('Please select a resume first.');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      toast.error('Please paste a job description (at least 50 characters).');
      return;
    }

    atsMutation.mutate(
      { jobDescription, force },
      {
        onError: (err: any) => {
          const msg =
            err?.response?.data?.message ??
            'ATS analysis failed. Please check your API key or try again.';
          toast.error(msg);
        },
        onSuccess: () => {
          toast.success(force ? 'ATS re-analysis complete!' : 'ATS analysis complete!');
        },
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('ATS report deleted.');
        setShowConfirmDelete(false);
      },
      onError: () => toast.error('Failed to delete report.'),
    });
  };

  const isLoading = isLoadingReport || isAnalyzing;
  const report = atsMutation.data ?? existingReport;

  const handleUpdateResume = () => {
    if (!resumeId || !report) return;
    updateResumeMutation.mutate(
      {
        jobDescription: report.jobDescription,
        atsResultId: report._id,
      },
      {
        onSuccess: ({ version }) => {
          toast.success('Updated resume draft created. Review each suggested change.');
          navigate(`/dashboard/optimizer?resumeId=${resumeId}&version=${version.versionNumber}&review=changes${jobId ? `&jobId=${jobId}` : ''}`);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message ?? 'Could not create the updated resume draft.');
        },
      }
    );
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Page Header ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">
          ATS compatibility
        </p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
          ATS Compatibility Check
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-xl">
          Paste a job description and select your resume to see how well they align, with a clear breakdown of your score.
        </p>
      </motion.div>

      {/* ── Input Panel ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
      >
        {/* Left: resume selector + JD textarea — 3 columns */}
        <div className="lg:col-span-3 space-y-4">
          {/* Resume selector */}
          <Card padding="md">
            <label className="label-base">Select Resume</label>
            {isLoadingResumes ? (
              <div className="h-10 skeleton rounded-xl" />
            ) : resumes.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <AlertCircle size={14} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  No resumes uploaded yet. Go to <strong>Resumes</strong> to upload one first.
                </p>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={resumeId ?? ''}
                  onChange={(e) => handleSelectResume(e.target.value)}
                  className="input-base appearance-none pr-8 cursor-pointer"
                >
                  <option value="" disabled>
                    — Select a resume —
                  </option>
                  {resumes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.originalName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
              </div>
            )}
          </Card>

          {/* Job description textarea */}
          <Card padding="md" className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label className="label-base">Job Description</label>
              <span className="text-[10px] text-stone-400">{jobDescription.length} / 5,000 chars</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here — include responsibilities, requirements, preferred skills, and qualifications..."
              rows={12}
              maxLength={5000}
              className="input-base resize-none flex-1 font-mono text-[12px] leading-relaxed"
              disabled={isAnalyzing}
            />
            <p className="text-[10px] text-stone-400 mt-1.5">
              Minimum 50 characters · More detail = more accurate ATS score
            </p>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleAnalyze(false)}
              disabled={!resumeId || isAnalyzing || jobDescription.trim().length < 50}
              isLoading={isAnalyzing && !atsMutation.variables?.force}
              leftIcon={<Sparkles size={15} />}
              className="flex-1"
            >
              {hasReport ? 'Analyze Again' : 'Run ATS Check'}
            </Button>

            {hasReport && report && (
              <Button
                variant="secondary"
                onClick={handleUpdateResume}
                disabled={isAnalyzing || deleteMutation.isPending || updateResumeMutation.isPending}
                isLoading={updateResumeMutation.isPending}
                leftIcon={<Wand2 size={14} />}
              >
                Update resume
              </Button>
            )}

            {hasReport && (
              <Button
                variant="secondary"
                onClick={() => handleAnalyze(true)}
                disabled={isAnalyzing || jobDescription.trim().length < 50}
                isLoading={isAnalyzing && !!atsMutation.variables?.force}
                leftIcon={<RefreshCw size={14} />}
              >
                Force Re-analyze
              </Button>
            )}

            {hasReport && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors border border-stone-200/60 dark:border-white/[0.06]"
                title="Delete ATS report"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Delete confirmation */}
          <AnimatePresence>
            {showConfirmDelete && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40"
              >
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  Delete this ATS report permanently?
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    isLoading={deleteMutation.isPending}
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: score preview / status — 2 columns */}
        <div className="lg:col-span-2">
          {!resumeId ? (
            <Card padding="lg" className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center mb-4">
                <FileText size={22} className="text-stone-400" />
              </div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1">
                Select a Resume
              </p>
              <p className="text-xs text-stone-400 max-w-[180px]">
                Choose a resume from the left to start your ATS check.
              </p>
            </Card>
          ) : isLoading ? (
            <Card padding="lg" className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-4" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1">
                Analyzing…
              </p>
              <p className="text-xs text-stone-400">
                Comparing your resume with the job description.
              </p>
            </Card>
          ) : report ? (
            <Card padding="lg" className="flex flex-col items-center gap-5">
              <ATSScoreCircle score={report.atsScore} size="lg" />
              <div className="w-full grid grid-cols-3 gap-2">
                <ScoreStat label="Match" value={report.matchPercentage} color="text-emerald-600 dark:text-emerald-400" />
                <ScoreStat label="Keywords" value={report.keywordMatchPercentage} color="text-blue-600 dark:text-blue-400" />
                <ScoreStat
                  label="Sections"
                  value={Math.round(
                    (Object.values(report.sectionMatching).filter(Boolean).length /
                      Object.values(report.sectionMatching).length) *
                      100
                  )}
                />
              </div>
              {selectedResume && (
                <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/[0.05]">
                  <FileText size={13} className="text-stone-400 shrink-0" />
                  <span className="text-xs text-stone-600 dark:text-stone-400 truncate">
                    {selectedResume.originalName}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-stone-400 shrink-0">
                    <Clock size={10} />
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {report.scoringMethod?.startsWith('hybrid-') && report.scoringBreakdown && (
                <div className="w-full rounded-xl border border-violet-200/60 bg-violet-50/70 p-3 dark:border-violet-900/40 dark:bg-violet-950/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                    Hybrid scoring · Explainable v1
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-stone-500 dark:text-stone-400">
                    35% skills · 30% keywords · 25% requirements · 10% sections
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <Card padding="lg" className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mb-4">
                <Bot size={22} className="text-violet-500" />
              </div>
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1">
                Ready to Analyze
              </p>
              <p className="text-xs text-stone-400 max-w-[180px]">
                Paste a job description and click "Run ATS Check".
              </p>
            </Card>
          )}
        </div>
      </motion.div>

      {/* ── Full Report ───────────────────────────────────── */}
      <AnimatePresence>
        {isAnalyzing && !report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ATSSkeleton />
          </motion.div>
        )}

        {report && !isAnalyzing && (
          <motion.div
            key={report._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200 dark:bg-white/[0.06]" />
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2">
                ATS Report
              </span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-white/[0.06]" />
            </div>

            {/* AI Summary */}
            {report.aiSummary && (
              <Card padding="lg" className="border-l-4 border-violet-500">
                <div className="flex items-start gap-3">
                  <Bot size={16} className="text-violet-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
                      Recruiter AI Summary
                    </p>
                    <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                      {report.aiSummary}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ATSRadarChart report={report} />
              <KeywordDensityChart keywordDensity={report.keywordDensity} />
            </div>

            {/* Keywords */}
            <KeywordComparison
              matchingKeywords={report.matchingKeywords}
              missingKeywords={report.missingKeywords}
            />

            {/* Skills */}
            <SkillsComparison
              matchingSkills={report.matchingSkills}
              missingSkills={report.missingSkills}
            />

            {/* Checklist + Suggestions row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <ATSChecklist
                  requirements={report.importantRequirements}
                  sectionMatching={report.sectionMatching}
                />
              </div>
              <div className="lg:col-span-3">
                <ATSSuggestionsPanel
                  suggestions={report.improvementSuggestions}
                  strengths={report.strengths}
                  weaknesses={report.weaknesses}
                />
              </div>
            </div>

            {/* Report timestamp */}
            <div className="flex items-center justify-end text-[10px] text-stone-400 pt-2 border-t border-stone-100 dark:border-white/[0.04]">
              <span>Analyzed: {new Date(report.analyzedAt).toLocaleString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ATSPage;
