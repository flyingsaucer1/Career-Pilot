import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className, size = 'md' }) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { isAuthenticated, updateThemePreference } = useAuth();
  const isDark = theme === 'dark';

  const handleToggle = async () => {
    const nextTheme = isDark ? 'light' : 'dark';
    if (!isAuthenticated) {
      toggleTheme();
      return;
    }
    setTheme(nextTheme);
    try {
      await updateThemePreference(nextTheme);
    } catch {
      setTheme(theme);
      toast.error('Theme preference could not be saved.');
    }
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900',
        size === 'md' ? 'w-12 h-6' : 'w-9 h-5',
        isDark
          ? 'bg-brand-600'
          : 'bg-surface-200 dark:bg-surface-700',
        className
      )}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'flex items-center justify-center rounded-full bg-white shadow-sm text-surface-600',
          size === 'md' ? 'w-5 h-5' : 'w-4 h-4',
          isDark
            ? size === 'md' ? 'translate-x-6' : 'translate-x-4'
            : 'translate-x-0.5'
        )}
      >
        {isDark ? (
          <Moon size={size === 'md' ? 11 : 9} className="text-brand-600" />
        ) : (
          <Sun size={size === 'md' ? 11 : 9} className="text-amber-500" />
        )}
      </motion.div>
    </button>
  );
};
