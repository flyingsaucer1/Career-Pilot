import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

export const Footer: React.FC = () => (
  <footer className="border-t border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-950">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white"><Rocket size={15} /></span>
        <div>
          <p className="text-sm font-bold text-surface-950 dark:text-white">CareerPilot</p>
          <p className="text-[11px] text-surface-500 dark:text-surface-400">Resume decisions stay yours.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-surface-500 dark:text-surface-400">
        <a href="#features" className="hover:text-teal-700 dark:hover:text-teal-300">How it works</a>
        <Link to="/login" className="hover:text-teal-700 dark:hover:text-teal-300">Sign in</Link>
        <Link to="/register" className="hover:text-teal-700 dark:hover:text-teal-300">Create account</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/support">Support</Link>
      </div>
      <p className="text-xs text-surface-400">© {new Date().getFullYear()} CareerPilot</p>
    </div>
  </footer>
);
