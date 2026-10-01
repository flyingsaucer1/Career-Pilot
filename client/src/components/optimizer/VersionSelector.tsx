import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Edit2, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import type { ResumeVersion } from '../../types/optimizer.types';

interface VersionSelectorProps {
  versions: ResumeVersion[];
  currentVersion: ResumeVersion | null;
  onSelectVersion: (version: ResumeVersion) => void;
  onDeleteVersion?: (version: ResumeVersion) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versions,
  currentVersion,
  onSelectVersion,
  onDeleteVersion,
  isLoading,
  disabled = false,
}) => {
  if (isLoading) {
    return (
      <Card padding="md">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      </Card>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <Card padding="md" className="text-center py-8">
        <FileText size={24} className="text-stone-400 mx-auto mb-2" />
        <p className="text-sm text-stone-500 dark:text-stone-400">No versions yet. Run an optimization to create your first draft.</p>
      </Card>
    );
  }

  // Sort versions: newest first for display
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <Card padding="md" className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">Optimized drafts</h3>
          <p className="mt-0.5 text-[10px] text-stone-400">Your uploaded original remains unchanged.</p>
        </div>
        <Badge variant="default" className="text-[10px]">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <AnimatePresence>
        {sortedVersions.map((version, index) => (
          <motion.div
            key={version._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
            className={cn(
              'relative p-3 rounded-xl border transition-all duration-200',
              currentVersion?.versionNumber === version.versionNumber
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/[0.05] shadow-sm shadow-violet-500/10'
                : 'border-stone-200/60 dark:border-white/[0.05] hover:border-violet-300 dark:hover:border-violet-700/50'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectVersion(version)}
                disabled={disabled}
                aria-pressed={currentVersion?.versionNumber === version.versionNumber}
                aria-label={`Open version ${version.versionNumber}: ${version.versionName}`}
                className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  version.source === 'original'
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    : version.source === 'optimized'
                    ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400'
                    : 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                )}>
                  {version.source === 'original' ? (
                    <FileText size={16} />
                  ) : version.source === 'optimized' ? (
                    <Sparkles size={16} />
                  ) : (
                    <Edit2 size={16} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                      Version {version.versionNumber}
                    </span>
                    {version.source !== 'original' && (
                      <Badge variant="default" className="text-[9px] px-1.5 py-0.5">
                        {version.source}
                      </Badge>
                    )}
                    {currentVersion?.versionNumber === version.versionNumber && (
                      <CheckCircle2 size={11} className="text-violet-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {version.versionName}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-stone-400">
                    <span className="flex items-center gap-0.5">
                      <Clock size={9} />
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                    {version.targetJobDescription && version.atsScoreBefore !== null && (
                      <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                        ATS Before: {Math.round(version.atsScoreBefore)}%
                      </span>
                    )}
                    {version.targetJobDescription && version.atsScoreAfter !== null && (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                        ATS After: {Math.round(version.atsScoreAfter)}%{' '}
                        <span className="text-[9px] text-amber-500">(est.)</span>
                      </span>
                    )}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                {version.source !== 'original' && onDeleteVersion && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); onDeleteVersion!(version); }}
                    disabled={disabled}
                    className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                    title="Delete version"
                    aria-label={`Delete version ${version.versionNumber}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {currentVersion && (
        <div className="pt-2 border-t border-stone-200/60 dark:border-white/[0.05]">
          <p className="text-[10px] text-stone-400 text-center">
            Currently viewing: <strong className="text-stone-600 dark:text-stone-300">Version {currentVersion.versionNumber}</strong>
          </p>
        </div>
      )}
    </Card>
  );
};
