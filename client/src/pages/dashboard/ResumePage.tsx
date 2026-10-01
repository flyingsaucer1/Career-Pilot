import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, RefreshCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ResumeDropzone } from '../../components/resume/ResumeDropzone';
import { UploadProgress } from '../../components/resume/UploadProgress';
import { ResumeCard } from '../../components/resume/ResumeCard';
import { useResumes, useDeleteResume, RESUMES_QUERY_KEY } from '../../hooks/useResumes';
import { resumeService } from '../../services/resume.service';
import { MAX_UPLOAD_MB } from '../../utils/uploadLimits';

const ResumePage: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const dropzoneKeyRef = useRef(0);

  const { data: resumes = [], isLoading, isError, refetch } = useResumes();
  const { mutate: deleteResume, isPending: isDeleting, variables: deletingId } = useDeleteResume();

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
    setUploadError(null);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    setIsUploading(true);
    setUploadPercent(0);
    setUploadError(null);
    try {
      await resumeService.uploadResume(selectedFile, (percent) => setUploadPercent(percent));
      toast.success('Resume uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY });
      setSelectedFile(null);
      setUploadPercent(0);
      dropzoneKeyRef.current += 1;
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Upload failed. Please try again.';
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteResume(id, {
      onSuccess: ({ storageCleanupPending }) => {
        if (storageCleanupPending) toast('Resume and reports deleted. File cleanup will retry automatically.', { icon: '⏳' });
        else toast.success('Resume and related reports deleted.');
      },
      onError: () => toast.error('Failed to delete resume.'),
    });
  };

  return (
    <div className="space-y-8">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-2">
          Resume Builder
        </p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
          Your Resumes
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-lg">
          Upload PDF or DOCX files. We extract text automatically for AI-powered analysis and scoring.
        </p>
      </motion.div>

      {/* ── Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Upload Card ── 2 columns */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="lg:col-span-2"
        >
          <Card padding="lg" className="sticky top-24 space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                <UploadCloud size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-white">Upload Resume</h2>
                <p className="text-[11px] text-stone-400">Text-based PDF or DOCX · Max {MAX_UPLOAD_MB} MB</p>
              </div>
            </div>

            {/* Dropzone */}
            <ResumeDropzone
              key={dropzoneKeyRef.current}
              onFileSelect={handleFileSelect}
              disabled={isUploading}
            />

            {/* Progress */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <UploadProgress percent={uploadPercent} fileName={selectedFile?.name} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {uploadError && !isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50"
                >
                  <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              fullWidth
              isLoading={isUploading}
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              leftIcon={<UploadCloud size={15} />}
            >
              {isUploading ? (uploadPercent >= 100 ? 'Checking and saving…' : 'Uploading…') : 'Upload Resume'}
            </Button>
          </Card>
        </motion.div>

        {/* Right: Resume List ── 3 columns */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Section header */}
          <div className="flex items-center justify-between h-9">
            <h2 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <FileText size={15} className="text-stone-400" />
              Uploaded Resumes
              {resumes.length > 0 && (
                <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
                  ({resumes.length})
                </span>
              )}
            </h2>
            {isError && (
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                <RefreshCcw size={12} />
                Retry
              </button>
            )}
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl skeleton" />)}
            </div>
          )}

          {/* Error */}
          {isError && !isLoading && (
            <Card padding="lg" className="text-center py-10">
              <AlertCircle size={28} className="text-red-400 mx-auto mb-3" />
              <p className="text-sm text-stone-500">
                Failed to load resumes. Check your connection and try again.
              </p>
            </Card>
          )}

          {/* Empty state */}
          {!isLoading && !isError && resumes.length === 0 && (
            <Card padding="lg" className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-stone-400" />
              </div>
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-200 mb-1">No resumes yet</h3>
              <p className="text-xs text-stone-400 max-w-[200px] mx-auto">
                Upload your first resume on the left to get started.
              </p>
            </Card>
          )}

          {/* Resume cards */}
          <AnimatePresence mode="popLayout">
            {!isLoading &&
              resumes.map((resume, i) => (
                <ResumeCard
                  key={resume._id}
                  resume={resume}
                  onDelete={handleDelete}
                  isDeleting={isDeleting && deletingId === resume._id}
                  index={i}
                />
              ))}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
};

export default ResumePage;
