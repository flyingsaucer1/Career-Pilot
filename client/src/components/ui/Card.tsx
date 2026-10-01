import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: React.ElementType;
  onClick?: () => void;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover = false,
  padding = 'md',
  as: Tag = 'div',
  onClick,
}) => {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'bg-[var(--panel)] border border-[var(--line)] rounded-xl',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        hover && 'hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 cursor-pointer',
        onClick && !hover && 'cursor-pointer',
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </Tag>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('flex items-start justify-between mb-4', className)}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h3 className={cn('text-sm font-semibold text-stone-900 dark:text-stone-50 tracking-tight', className)}>
    {children}
  </h3>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('', className)}>{children}</div>;
