import React from 'react';
import { cn } from '../../utils/cn';

type LoaderSize = 'sm' | 'md' | 'lg';
type LoaderVariant = 'spinner' | 'dots' | 'page';

interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  className?: string;
  label?: string;
}

const sizeMap: Record<LoaderSize, number> = { sm: 16, md: 24, lg: 40 };

const SpinnerLoader: React.FC<{ size: LoaderSize; className?: string }> = ({
  size,
  className,
}) => {
  const px = sizeMap[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin text-brand-600', className)}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="0"
        className="opacity-25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="23.5"
      />
    </svg>
  );
};

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  variant = 'spinner',
  className,
  label = 'Loading...',
}) => {
  if (variant === 'page') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <SpinnerLoader size="lg" />
          <p className="text-sm text-surface-400 animate-pulse">{label}</p>
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <span className={cn('inline-flex items-center gap-1', className)} aria-label={label}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    );
  }

  return <SpinnerLoader size={size} className={className} />;
};
