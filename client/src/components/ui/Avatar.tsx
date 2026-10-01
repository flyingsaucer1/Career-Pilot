import React from 'react';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/format';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

// Deterministic color from name
const nameColors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
];

const getColorFromName = (name: string): string => {
  const index = name.charCodeAt(0) % nameColors.length;
  return nameColors[index];
};

export const Avatar: React.FC<AvatarProps> = ({ src, name = 'User', size = 'md', className }) => {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={cn(
          'rounded-full object-cover ring-2 ring-white dark:ring-surface-800',
          sizeStyles[size],
          className
        )}
      />
    );
  }

  const gradient = getColorFromName(name);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white',
        `bg-gradient-to-br ${gradient}`,
        'ring-2 ring-white dark:ring-surface-800',
        sizeStyles[size],
        className
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
};
