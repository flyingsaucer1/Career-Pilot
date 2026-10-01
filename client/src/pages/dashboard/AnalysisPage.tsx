import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCw, 
  Trash2, 
  FileDown, 
  AlertCircle, 
  FileText, 
  Clock,
  CheckCircle2,
  ListChecks,
  FileCheck,
  Wand2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useResumes } from '../../hooks/useResumes';
import { useAnalysis, useAnalyzeMutation, useDeleteAnalysis } from '../../hooks/useAnalysis';
import { useATS } from '../../hooks/useATS';
import { useOptimizeMutation } from '../../hooks/useResumeOptimizer';

// Subcomponents
import { ScoreCircle } from '../../components/analysis/ScoreCircle';
import { ScoreBreakdownChart } from '../../components/analysis/ScoreBreakdownChart';
import { SkillsSection } from '../../components/analysis/SkillsSection';
import { SkillsDistributionChart } from '../../components/analysis/SkillsDistributionChart';
import { SectionCompletenessChart } from '../../components/analysis/SectionCompletenessChart';
import { BulletAnalysis } from '../../components/analysis/BulletAnalysis';
import { SuggestionsPanel } from '../../components/analysis/SuggestionsPanel';
import { AnalysisSkeleton } from '../../components/analysis/AnalysisSkeleton';

const AnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');

  const { data: resumes = [], isLoading: isLoadingResumes } = useResumes();
  
  const { 
    data: analysis, 
    isLoading: isLoadingAnalysis, 
    isError: isErrorAnalysis, 
    error: analysisError,
    refetch: refetchAnalysis 
  } = useAnalysis(resumeId);

  const analyzeMutation = useAnalyzeMutation(resumeId || '');
  const { mutate: runAnalysis, reset: resetAnalysis } = analyzeMutation;
  const deleteMutation = useDeleteAnalysis(resumeId || '');
  const { data: existingATS } = useATS(resumeId);
  const updateResumeMutation = useOptimizeMutation(resumeId || '');

  const [showConfirmReanalyze, setShowConfirmReanalyze] = useState(false);
  const [showUpdateResume, setShowUpdateResume] = useState(false);
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const triggeredRef = useRef<string | null>(null);

  // Reset only when the selected resume changes, before considering auto-analysis.
  useEffect(() => {
    resetAnalysis();
    triggeredRef.current = null;
  }, [resumeId, resetAnalysis]);

  // Automatically trigger analysis if we just selected a resume and there's no stored analysis
  useEffect(() => {
    if (
      resumeId && 
      resumeId !== triggeredRef.current &&
      !analysis && 
      !isLoadingAnalysis && 
      !isErrorAnalysis
    ) {
      triggeredRef.current = resumeId;
      runAnalysis(false, {
        onError: (err: any) => {
          const errMsg = err?.response?.data?.message ?? 'We couldn’t analyze this resume. Please try again shortly.';
          toast.error(errMsg);
        }
      });
    }
  }, [resumeId, analysis, isLoadingAnalysis, isErrorAnalysis, runAnalysis]);

  const handleSelectResume = (id: string) => {
    setSearchParams({ resumeId: id });
  };

  const handleAnalyze = (force = false) => {
    if (!resumeId) return;
    setShowConfirmReanalyze(false);
    analyzeMutation.mutate(force, {
      onSuccess: () => {
        toast.success(force ? 'Re-analysis complete!' : 'Analysis complete!');
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message ?? 'Analysis failed. Please check your setup.';
        toast.error(errMsg);
      }
    });
  };

  const handleDeleteAnalysis = () => {
    if (!resumeId) return;
    if (window.confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      deleteMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success('Analysis deleted.');
        },
        onError: () => {
          toast.error('Failed to delete analysis.');
        }
      });
    }
  };

  const handleExportPDF = () => {
    toast.success('Exporting analysis report as PDF...');
  };

  const handleOpenUpdateResume = () => {
    setTargetJobDescription(existingATS?.jobDescription ?? '');
    setShowUpdateResume(true);
  };

  const handleCreateUpdatedResume = () => {
    if (!resumeId || !analysis) return;
    const jobDescription = targetJobDescription.trim();
    if (jobDescription.length < 50) {
      toast.error('Paste a job description with at least 50 characters.');
      return;
    }
    updateResumeMutation.mutate(
      {
        jobDescription,
        analysisId: analysis._id,
        atsResultId: existingATS?.jobDescription.trim() === jobDescription
          ? existingATS._id
          : undefined,
      },
      {
        onSuccess: ({ version }) => {
          toast.success('Updated resume draft created. Review each suggested change.');
          navigate(`/dashboard/optimizer?resumeId=${resumeId}&version=${version.versionNumber}&review=changes`);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message ?? 'Could not create the updated resume draft.');
        },
      }
    );
  };

  // 1. Loading resumes state
  if (isLoadingResumes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-2">
        <RefreshCw className="w-6 h-6 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-surface-500">Loading resumes...</p>
      </div>
    );
  }

  // 2. Select resume state
  if (!resumeId || resumes.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white tracking-tight">
            Resume Analysis
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Select an uploaded resume below to generate an overall score, feedback, and skill breakdown.
          </p>
        </div>

        {resumes.length === 0 ? (
          <Card className="text-center py-14">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} />
            </div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-1">No Resumes Found</h3>
            <p className="text-sm text-surface-500 max-w-xs mx-auto mb-5">
              Upload a resume first to run automated analysis and scoring.
            </p>
            <Link to="/dashboard/resume">
              <Button leftIcon={<FileText size={16} />}>Upload Resume</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-500">
              Select Resume ({resumes.length})
            </h3>
            <div className="grid gap-2.5">
              {resumes.map((resume) => (
                <div
                  key={resume._id}
                  className="flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-brand-500 dark:hover:border-brand-500 transition-colors"
                >
                  <div 
                    onClick={() => handleSelectResume(resume._id)}
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <div className="p-2.5 rounded-lg bg-surface-100 dark:bg-surface-750 text-surface-600 dark:text-surface-300 shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
                        {resume.originalName}
                      </h4>
                      <p className="text-xs text-surface-400 mt-0.5">
                        {(resume.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSelectResume(resume._id)}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedResume = resumes.find(r => r._id === resumeId);
  const isCurrentlyAnalyzing = analyzeMutation.isPending;
  const showSkeleton = isLoadingAnalysis;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Clean Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-200 dark:border-surface-750">
        <div>
          <div className="flex items-center gap-2 text-xs text-surface-400 mb-1">
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <Link to="/dashboard/analysis" className="hover:underline">Resumes</Link>
            <span>/</span>
            <span className="text-surface-600 dark:text-surface-300 font-medium">Analysis Report</span>
          </div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            Resume Analysis Report
          </h1>
          {selectedResume && (
            <p className="text-xs text-surface-500 mt-0.5">
              File: <strong className="text-surface-700 dark:text-surface-300 font-semibold">{selectedResume.originalName}</strong>
            </p>
          )}
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedResume && (
            <>
              {analysis && !showSkeleton && (
                <Button
                  size="sm"
                  onClick={handleOpenUpdateResume}
                  disabled={updateResumeMutation.isPending}
                  leftIcon={<Wand2 size={14} />}
                >
                  Update your resume
                </Button>
              )}
              {analysis && !showSkeleton && (
                <Button variant="secondary" size="sm" onClick={handleExportPDF} leftIcon={<FileDown size={14} />}>
                  Export PDF
                </Button>
              )}
              {analysis && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowConfirmReanalyze(true)} 
                  isLoading={isCurrentlyAnalyzing}
                  leftIcon={<RefreshCw size={14} />}
                >
                  {isCurrentlyAnalyzing ? 'Analyzing...' : 'Re-analyze'}
                </Button>
              )}
              {analysis && (
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={handleDeleteAnalysis} 
                  isLoading={deleteMutation.isPending}
                  leftIcon={<Trash2 size={14} />}
                >
                  Delete
                </Button>
              )}
            </>
          )}
          <Link to="/dashboard/analysis" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline ml-2">
            Switch Resume
          </Link>
        </div>
      </div>

      {/* Confirmation Card for Re-analyze */}
      <AnimatePresence>
        {showConfirmReanalyze && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card padding="md" className="border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-200">Re-run Analysis?</h4>
                  <p className="text-xs text-brand-700 dark:text-brand-300/80 mt-0.5">
                    This will perform a fresh review of the resume content and replace the current score and suggestions.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => setShowConfirmReanalyze(false)}>Cancel</Button>
                  <Button size="sm" onClick={() => handleAnalyze(true)}>Confirm</Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create a separate editable draft from this report. */}
      <AnimatePresence>
        {showUpdateResume && analysis && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card padding="md" className="border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                    <Wand2 size={17} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-brand-900 dark:text-brand-200">Create an updated, editable resume</h4>
                    <p className="mt-1 text-xs leading-5 text-brand-700 dark:text-brand-300/80">
                      CareerPilot will use this analysis and your target job to generate exact wording changes in a new draft. Your uploaded resume stays unchanged. Review every claim before applying or downloading AI wording.
                    </p>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="analysis-target-job" className="text-xs font-semibold text-surface-700 dark:text-surface-200">Target job description</label>
                    <span className="text-[10px] text-surface-400">{targetJobDescription.length} / 5,000</span>
                  </div>
                  <textarea
                    id="analysis-target-job"
                    value={targetJobDescription}
                    onChange={(event) => setTargetJobDescription(event.target.value)}
                    rows={6}
                    maxLength={5000}
                    disabled={updateResumeMutation.isPending}
                    placeholder="Paste the role, responsibilities, requirements, and preferred skills…"
                    className="input-base resize-y text-xs leading-5"
                  />
                  {existingATS?.jobDescription && (
                    <p className="mt-1.5 text-[10px] text-surface-500 dark:text-surface-400">Pre-filled from your latest ATS comparison. Edit it if you are targeting a different role.</p>
                  )}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowUpdateResume(false)}
                    disabled={updateResumeMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateUpdatedResume}
                    isLoading={updateResumeMutation.isPending}
                    disabled={targetJobDescription.trim().length < 50}
                    leftIcon={<Wand2 size={14} />}
                  >
                    Generate updated draft
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Body */}
      {showSkeleton ? (
        <AnalysisSkeleton />
      ) : isErrorAnalysis ? (
        <Card padding="lg" className="text-center py-12">
          <AlertCircle size={36} className="text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-surface-900 dark:text-white mb-1">Analysis Failed</h3>
          <p className="text-sm text-surface-500 max-w-sm mx-auto mb-5">
            {analysisError?.message || 'Unable to generate analysis at this time.'}
          </p>
          <div className="flex justify-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => refetchAnalysis()} leftIcon={<RefreshCw size={14} />}>Retry</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteAnalysis} isLoading={deleteMutation.isPending} leftIcon={<Trash2 size={14} />}>Delete</Button>
          </div>
        </Card>
      ) : !analysis ? (
        // Initial Ready to Analyze State
        <Card padding="lg" className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 flex items-center justify-center mx-auto mb-4">
            <FileCheck size={28} />
          </div>

          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Resume Ready for Analysis</h3>
          <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">
            Generate detailed score breakdowns, skill detection, formatting checks, and bullet point evaluations.
          </p>

          <Button 
            size="md"
            onClick={() => handleAnalyze(false)} 
            isLoading={isCurrentlyAnalyzing}
            leftIcon={<Sparkles size={16} />}
          >
            {isCurrentlyAnalyzing ? 'Analyzing Resume...' : 'Start Resume Analysis'}
          </Button>
        </Card>
      ) : (
        // Clean Professional Report Dashboard
        <div className="space-y-6">
          {/* Section 1: Overall Score & Sub-scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card padding="lg" className="flex flex-col items-center justify-center text-center">
              <CardTitle className="mb-4 text-sm font-bold uppercase tracking-wider text-surface-500">Overall Grade</CardTitle>
              <ScoreCircle score={analysis.score} />
              {analysis.analyzedAt && (
                <div className="flex items-center gap-1 mt-4 text-xs text-surface-400 font-medium">
                  <Clock size={12} />
                  <span>Analyzed {new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                </div>
              )}
            </Card>

            <Card padding="lg" className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Category Breakdown</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="flex items-center justify-center">
                  <ScoreBreakdownChart 
                    grammarScore={analysis.grammarScore}
                    readabilityScore={analysis.readabilityScore}
                    formattingScore={analysis.formattingScore}
                    skillsScore={
                      analysis.technicalSkills.length > 0 
                        ? Math.round(
                            (analysis.technicalSkills.length / 
                              (analysis.technicalSkills.length + analysis.missingSkills.length)) * 100
                          )
                        : 0
                    }
                  />
                </div>
                <div className="flex flex-col justify-center space-y-3.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-surface-600 dark:text-surface-400">Grammar & Phrasing</span>
                      <span className="text-surface-900 dark:text-white font-bold">{analysis.grammarScore}/100</span>
                    </div>
                    <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${analysis.grammarScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-surface-600 dark:text-surface-400">Readability</span>
                      <span className="text-surface-900 dark:text-white font-bold">{analysis.readabilityScore}/100</span>
                    </div>
                    <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-600 rounded-full" style={{ width: `${analysis.readabilityScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-surface-600 dark:text-surface-400">Formatting</span>
                      <span className="text-surface-900 dark:text-white font-bold">{analysis.formattingScore}/100</span>
                    </div>
                    <div className="h-2 w-full bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${analysis.formattingScore}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 2: Skills Overview */}
          <Card padding="lg">
            <CardHeader className="border-b border-surface-100 dark:border-surface-700/60 pb-3">
              <div>
                <CardTitle className="text-base font-bold">Skills Analysis</CardTitle>
                <p className="text-xs text-surface-400 mt-0.5">Detected technical and soft skills alongside suggested additions.</p>
              </div>
              <div className="w-48 hidden sm:block">
                <SkillsDistributionChart 
                  technicalCount={analysis.technicalSkills.length}
                  softCount={analysis.softSkills.length}
                  missingCount={analysis.missingSkills.length}
                />
              </div>
            </CardHeader>
            <CardBody className="pt-4">
              <SkillsSection 
                technicalSkills={analysis.technicalSkills}
                softSkills={analysis.softSkills}
                missingSkills={analysis.missingSkills}
              />
            </CardBody>
          </Card>

          {/* Section 3: Recommendations & Completeness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card padding="lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ListChecks size={18} className="text-brand-600" />
                  Key Recommendations
                </CardTitle>
              </CardHeader>
              <SuggestionsPanel suggestions={analysis.suggestions} />
            </Card>

            <Card padding="lg" className="space-y-6">
              <div>
                <CardTitle className="mb-3 text-base font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  Section Completeness
                </CardTitle>
                <SectionCompletenessChart sectionCompleteness={analysis.sectionCompleteness} />
              </div>
              
              <div className="border-t border-surface-100 dark:border-surface-700/60 pt-5">
                <CardTitle className="mb-2 text-sm font-bold">Length & Page Count</CardTitle>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-50/50 dark:bg-surface-800/30 border border-surface-200/70 dark:border-surface-700/50 text-xs">
                  <div>
                    <span className="text-surface-400 block">Word Count</span>
                    <strong className="text-surface-900 dark:text-surface-100 font-bold">{analysis.resumeLength.wordCount} words</strong>
                  </div>
                  <div className="w-px h-7 bg-surface-200 dark:bg-surface-700" />
                  <div>
                    <span className="text-surface-400 block">Estimated Length</span>
                    <strong className="text-surface-900 dark:text-surface-100 font-bold">{analysis.resumeLength.pageEstimate} page{analysis.resumeLength.pageEstimate > 1 ? 's' : ''}</strong>
                  </div>
                  <div className="w-px h-7 bg-surface-200 dark:bg-surface-700" />
                  <div>
                    <span className={`font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[11px] ${
                      analysis.resumeLength.verdict === 'ideal' 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {analysis.resumeLength.verdict.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 4: Writing Audit */}
          <Card padding="lg">
            <CardHeader className="pb-2">
              <div>
                <CardTitle className="text-base font-bold">Bullet Point & Writing Evaluation</CardTitle>
                <p className="text-xs text-surface-400 mt-0.5">Evaluation of metrics, bullet structure, and action verbs.</p>
              </div>
            </CardHeader>
            <CardBody className="pt-2">
              <BulletAnalysis 
                weakBullets={analysis.weakBullets}
                strongBullets={analysis.strongBullets}
                actionVerbs={analysis.actionVerbs}
              />
            </CardBody>
          </Card>

          {/* Section 5: Grammar Issues */}
          {analysis.grammarIssues && analysis.grammarIssues.length > 0 && (
            <Card padding="lg">
              <CardHeader className="pb-2">
                <div>
                  <CardTitle className="text-base font-bold text-red-600 dark:text-red-400">
                    Grammar & Phrasing Corrections ({analysis.grammarIssues.length})
                  </CardTitle>
                  <p className="text-xs text-surface-400 mt-0.5">Specific writing corrections identified in the document.</p>
                </div>
              </CardHeader>
              <CardBody className="pt-2 space-y-2.5">
                {analysis.grammarIssues.map((issue, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-red-50/40 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-xs"
                  >
                    <div className="flex-1">
                      <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Original Text</span>
                      <p className="text-surface-700 dark:text-surface-300 mt-0.5 italic">"{issue.text}"</p>
                    </div>
                    <div className="w-4 hidden sm:block self-center text-red-400 font-bold">→</div>
                    <div className="flex-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Suggested Correction</span>
                      <p className="text-surface-900 dark:text-surface-100 mt-0.5 font-semibold">{issue.suggestion}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Section 6: Style Audits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.passiveVoiceInstances && analysis.passiveVoiceInstances.length > 0 && (
              <Card padding="lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-surface-500">
                    Passive Voice Phrases
                  </CardTitle>
                </CardHeader>
                <div className="space-y-1.5 pt-1">
                  {analysis.passiveVoiceInstances.map((item, idx) => (
                    <div key={idx} className="p-2 bg-surface-50 dark:bg-surface-800/40 border border-surface-200/70 dark:border-surface-700/50 rounded-md text-xs text-surface-700 dark:text-surface-300">
                      {item}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {analysis.repeatedWords && analysis.repeatedWords.length > 0 && (
              <Card padding="lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-surface-500">
                    Overused Phrases
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.repeatedWords.map((word, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 rounded-md text-xs font-medium">
                      {word}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
