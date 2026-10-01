import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Edit2, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { ChangeItem } from '../../types/optimizer.types';

interface ChangeComparisonProps {
  changes: ChangeItem[];
  title?: string;
  icon?: React.ReactNode;
  emptyMessage: string;
  onAccept?: (change: ChangeItem) => void;
  onReject?: (change: ChangeItem) => void;
  onEdit?: (change: ChangeItem) => void;
  showActions?: boolean;
  hideHeader?: boolean;
}

export const ChangeComparison: React.FC<ChangeComparisonProps> = ({
  changes,
  title,
  icon,
  emptyMessage,
  onAccept,
  onReject,
  onEdit,
  showActions = true,
  hideHeader = false,
}) => {
  if (!changes || changes.length === 0) {
    return (
      <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 py-4">
        {icon}
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!hideHeader && title && (
        <div className="flex items-center gap-2">
          {icon && <span className="text-stone-400 dark:text-stone-600">{icon}</span>}
          <h3 className="text-sm font-semibold text-stone-900 dark:text-white">{title}</h3>
          <Badge variant="default" className="ml-auto text-[10px]">
            {changes.length}
          </Badge>
        </div>
      )}

      {changes.map((change, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="space-y-2 p-3 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/[0.05]"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400">Before</span>
                <ArrowRight size={12} className="text-stone-400 mx-1" />
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">After</span>
              </div>
              <p className="text-sm text-stone-700 dark:text-stone-300 italic leading-relaxed">
                "{change.original}"
              </p>
            </div>
            {showActions && onAccept && onReject && (
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAccept?.(change)}
                  className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                  title="Accept"
                >
                  <Check size={13} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReject?.(change)}
                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  title="Reject"
                >
                  <X size={13} />
                </Button>
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit?.(change)}
                    className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-stone-200/60 dark:border-white/[0.05]">
            <div className="w-10 flex-shrink-0 text-center text-stone-400">
              <ArrowRight size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
                "{change.optimized}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-10">
            <Zap size={11} className="text-amber-500 shrink-0" />
            <p className="text-[11px] text-stone-500 dark:text-stone-400 italic">
              {change.reason}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};