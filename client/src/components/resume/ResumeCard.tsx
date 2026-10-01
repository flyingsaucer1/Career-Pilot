import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  File,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { cn } from '../../utils/cn';
import { formatDate, formatRelativeTime, truncate } from '../../utils/format';
import type { Resume } from '../../types/resume.types';
import { resumeService } from '../../services/resume.service';
import toast from 'react-hot-toast';

interface ResumeCardProps {
  resume: Resume;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
  index?: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const ResumeCard: React.FC<ResumeCardProps> = ({
  resume,
  onDelete,
  isDeleting = false,
  index = 0,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadOriginal = async () => {
    setIsDownloading(true);
    try {
      const blob = await resumeService.downloadOriginal(resume._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Could not download this resume. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const isPdf = resume.fileType === 'pdf';
  const hasExtractedText = resume.extractedText?.trim().length > 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.07, duration: 0.35 }}
        layout
      >
        <Card padding="none" className="overflow-hidden group">
          {/* ── Top accent bar ─────────────────────────────────── */}
          <div
            className={cn(
              'h-1 w-full',
              isPdf
                ? 'bg-gradient-to-r from-red-500 to-rose-600'
                : 'bg-gradient-to-r from-blue-500 to-blue-700'
            )}
          />

          <div className="p-5">
            {/* ── Header row ─────────────────────────────────────── */}
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm',
                  isPdf
                    ? 'bg-gradient-to-br from-red-500 to-rose-700'
                    : 'bg-gradient-to-br from-blue-500 to-blue-700'
                )}
              >
                {isPdf ? <FileText size={20} /> : <File size={20} />}
              </div>

              {/* Name + badges */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate leading-snug"
                  title={resume.originalName}
                >
                  {resume.originalName}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <Badge variant={isPdf ? 'danger' : 'primary'} size="sm">
                    {resume.fileType.toUpperCase()}
                  </Badge>
                  <span className="flex items-center gap-1 text-[11px] text-surface-400 dark:text-surface-500">
                    <HardDrive size={10} />
                    {formatBytes(resume.fileSize)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-surface-400 dark:text-surface-500">
                    <Calendar size={10} />
                    <span title={formatDate(resume.createdAt)}>
                      {formatRelativeTime(resume.createdAt)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 transition-opacity duration-150">
                <Link to={`/dashboard/analysis?resumeId=${resume._id}`}>
                  <Button size="sm" leftIcon={<Sparkles size={13} />}>
                    Analyze
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={downloadOriginal}
                  disabled={isDownloading}
                  title="Download original resume"
                  aria-label={isDownloading ? 'Downloading original resume' : 'Download original resume'}
                  className="p-2 rounded-lg text-surface-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors disabled:opacity-50"
                >
                  <Download size={15} />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete resume"
                  className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* ── Extracted text section ──────────────────────────── */}
            {hasExtractedText && (
              <div className="mt-4 border-t border-surface-100 dark:border-surface-700 pt-3">
                <button
                  onClick={() => setShowText((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
                >
                  {showText ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {showText ? 'Hide extracted text' : 'Show extracted text'}
                </button>

                {showText && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 max-h-48 overflow-y-auto"
                  >
                    <p className="text-[11px] leading-relaxed text-surface-600 dark:text-surface-400 whitespace-pre-wrap font-mono">
                      {truncate(resume.extractedText, 1500)}
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {!hasExtractedText && (
              <p className="mt-3 text-[11px] text-surface-400 dark:text-surface-500 italic">
                No text could be extracted (scanned or image-based document).
              </p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── Delete confirmation modal ─────────────────────────────── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Resume"
        description="This permanently removes the uploaded file, analysis, ATS results, and optimized drafts. This action cannot be undone."
        size="sm"
      >
        <div className="flex justify-end gap-3 mt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isDeleting}
            onClick={() => {
              onDelete(resume._id);
              setShowDeleteModal(false);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
};
