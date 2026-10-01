import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  percent: number;           // 0–100
  fileName?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ percent, fileName }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
        <span className="flex items-center gap-1.5 font-medium">
          <Loader2 size={12} className="animate-spin text-brand-500" />
          {fileName ? (
            <span className="max-w-[220px] truncate">{fileName}</span>
          ) : (
            'Uploading...'
          )}
        </span>
        <span className="font-semibold text-brand-600 dark:text-brand-400 tabular-nums">
          {percent}%
        </span>
      </div>

      {/* Track */}
      <div className="w-full h-2 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500"
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>

      {percent === 100 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="status"
          className="text-[11px] text-surface-500 dark:text-surface-400 font-medium"
        >
          File sent — checking document and saving to storage…
        </motion.p>
      )}
    </div>
  );
};
