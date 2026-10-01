import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: React.ElementType;
  to?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white shadow-sm focus:ring-brand-500 dark:focus:ring-offset-slate-900 font-semibold tracking-tight',
  secondary:
    'bg-stone-100 dark:bg-white/[0.07] hover:bg-stone-200 dark:hover:bg-white/[0.12] active:scale-[0.98] text-stone-700 dark:text-stone-300 focus:ring-stone-400 dark:focus:ring-offset-[#111110] border border-stone-200/60 dark:border-white/[0.06]',
  ghost:
    'hover:bg-stone-100 dark:hover:bg-white/[0.06] active:scale-[0.98] text-stone-600 dark:text-stone-400 focus:ring-stone-400',
  danger:
    'bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white shadow-sm focus:ring-red-500 dark:focus:ring-offset-[#111110] font-semibold',
  outline:
    'border border-stone-300 dark:border-white/[0.10] hover:bg-stone-50 dark:hover:bg-white/[0.05] active:scale-[0.98] text-stone-700 dark:text-stone-300 focus:ring-stone-400',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-sm gap-2.5 rounded-md',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  as: Component = 'button',
  className,
  children,
  disabled,
  ...props
}) => {
  return (
    <Component
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-40 disabled:pointer-events-none',
        'select-none',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 13 : 15} />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </Component>
  );
};
