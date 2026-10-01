import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  resume: 'Resume Builder',
  jobs: 'Job Tracker',
  interview: 'Interview Prep',
  analytics: 'Analytics',
  settings: 'Settings',
  help: 'Help & Support',
};

export const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((seg, index, arr) => ({
      label: routeLabels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
      href: '/' + arr.slice(0, index + 1).join('/'),
      isLast: index === arr.length - 1,
    }));

  if (segments.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link
        to="/dashboard"
        className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
        aria-label="Dashboard home"
      >
        <Home size={14} />
      </Link>
      {segments.map((seg) => (
        <React.Fragment key={seg.href}>
          <ChevronRight size={13} className="text-surface-300 dark:text-surface-600" />
          {seg.isLast ? (
            <span className="text-surface-700 dark:text-surface-300 font-medium">
              {seg.label}
            </span>
          ) : (
            <Link
              to={seg.href}
              className="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
            >
              {seg.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
