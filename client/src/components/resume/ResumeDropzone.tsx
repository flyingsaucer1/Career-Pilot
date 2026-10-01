import React, { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X, File } from 'lucide-react';
import { cn } from '../../utils/cn';
import { MAX_UPLOAD_MB, MAX_UPLOAD_BYTES } from '../../utils/uploadLimits';

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE_BYTES = MAX_UPLOAD_BYTES;

interface ResumeDropzoneProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ onFileSelect, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setValidationError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setValidationError('Invalid file type. Only PDF and DOCX files are accepted.');
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setValidationError(`File is too large. Maximum allowed size is ${MAX_UPLOAD_MB} MB.`);
        return;
      }
      if (file.size === 0) {
        setValidationError('The file is empty. Choose a text-based PDF or DOCX resume.');
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  // ── Drag events ──────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  // ── Input change ─────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  const clearFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    onFileSelect(null);
  };

  const isDocx = selectedFile?.type.includes('wordprocessingml');

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !selectedFile && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-all duration-200',
          isDragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 scale-[1.01]'
            : 'border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50',
          !disabled && !selectedFile && 'cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-950/20',
          disabled && 'opacity-60 pointer-events-none'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          aria-label="Choose a resume file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            // ── Selected file preview ─────────────────────────────
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <div
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md',
                  isDocx
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-red-500 to-red-700'
                )}
              >
                {isDocx ? <File size={28} /> : <FileText size={28} />}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-50 max-w-xs truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  {isDocx ? 'DOCX' : 'PDF'} · {formatBytes(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-red-500 transition-colors"
              >
                <X size={13} />
                Remove
              </button>
            </motion.div>
          ) : (
            // ── Empty state ────────────────────────────────────────
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={isDragging ? { scale: 1.15, rotate: -3 } : { scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400"
              >
                <UploadCloud size={28} />
              </motion.div>
              <div className="text-center">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  {isDragging ? 'Drop it here!' : 'Drag & drop your resume'}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                  or{' '}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}
                    className="text-brand-600 dark:text-brand-400 font-medium underline underline-offset-2"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-[11px] text-surface-400 dark:text-surface-500 mt-2">
                  Text-based PDF or DOCX · up to {MAX_UPLOAD_MB} MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Validation error */}
      <AnimatePresence>
        {validationError && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400"
          >
            <X size={12} className="shrink-0" />
            {validationError}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
