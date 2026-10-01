import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { AuthSpaceScene } from './AuthSpaceScene';

interface AuthVisualPanelProps {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  mode: 'login' | 'register';
  isLaunching?: boolean;
}

export const AuthVisualPanel: React.FC<AuthVisualPanelProps> = ({
  eyebrow,
  title,
  accent,
  description,
  mode,
  isLaunching,
}) => (
  <aside className="auth-space-panel relative hidden min-h-screen w-[45%] max-w-[680px] overflow-hidden p-8 lg:flex lg:flex-col xl:p-10">
    <div aria-hidden="true" className="auth-space-grain absolute inset-0" />

    <Link to="/" className="relative z-10 flex w-fit items-center gap-2.5 text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#28cfc3] text-[#06202e] shadow-[0_8px_30px_rgba(45,212,191,0.25)]">
        <Rocket size={17} />
      </span>
      <span className="text-lg font-bold tracking-tight">Career<span className="text-[#76e5dc]">Pilot</span></span>
    </Link>

    <div className="relative z-10 my-auto py-6">
      <AuthSpaceScene isLaunching={isLaunching} />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8aece3]">{eyebrow}</p>
      <h2 className="mt-3 max-w-md text-4xl font-semibold leading-[1.12] tracking-[-0.03em] text-white xl:text-[42px]">
        {title}<br /><span className="text-[#8aece3]">{accent}</span>
      </h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">{description}</p>
      <p className="mt-5 flex items-center gap-2 text-[11px] text-slate-400">
        <span className="h-px w-8 bg-[#8aece3]/50" />
        {mode === 'login' ? 'Pick up where you left off' : 'Your next chapter starts here'}
      </p>
    </div>

    <p className="relative z-10 text-[10px] text-slate-500">© {new Date().getFullYear()} CareerPilot · Your path, your pace</p>
  </aside>
);
