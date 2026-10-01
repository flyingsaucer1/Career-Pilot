import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  FilePenLine,
  Gauge,
  ScanText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';

const assurances = [
  { icon: ShieldCheck, label: 'Original resume stays untouched' },
  { icon: Gauge, label: 'Explainable ATS scoring' },
  { icon: FilePenLine, label: 'Editable PDF and Word drafts' },
];

export const HeroSection: React.FC = () => (
  <section className="relative overflow-hidden border-b border-surface-200/70 bg-white pt-16 dark:border-surface-800 dark:bg-surface-950">
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute -left-48 top-16 h-96 w-96 rounded-full bg-teal-200/25 blur-3xl dark:bg-teal-700/10" />
      <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-violet-200/25 blur-3xl dark:bg-violet-800/10" />
      <div className="dot-grid absolute inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,black,transparent_90%)] dark:opacity-20" />
    </div>

    <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl"
      >
        <span className="section-tag mb-6">A focused workspace for your job search</span>
        <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-surface-950 dark:text-white sm:text-5xl lg:text-6xl">
          Build a resume that is clear, relevant, and{' '}
          <span className="text-teal-700 dark:text-teal-300">ready to send.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-surface-600 dark:text-surface-300 sm:text-lg">
          Analyze what you have, compare it with a real job description, and turn verified suggestions into an editable resume—without losing your original.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" as={Link} to="/register" rightIcon={<ArrowRight size={17} />}>
            Start with your resume
          </Button>
          <Button size="lg" variant="outline" as={Link} to="/login">
            Sign in
          </Button>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {assurances.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-start gap-2 text-xs leading-5 text-surface-600 dark:text-surface-400">
              <Icon size={15} className="mt-0.5 shrink-0 text-teal-700 dark:text-teal-300" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.08 }}
        className="relative mx-auto w-full max-w-[560px]"
      >
        <div className="absolute -inset-5 rounded-[32px] bg-gradient-to-br from-teal-500/10 to-violet-500/10 blur-2xl" />
        <div className="relative overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-[0_28px_80px_rgba(15,43,54,0.16)] dark:border-surface-700 dark:bg-surface-900 dark:shadow-[0_28px_80px_rgba(0,0,0,0.4)]">
          <div className="flex h-11 items-center gap-2 border-b border-surface-200 px-4 dark:border-surface-700">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            <span className="ml-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-surface-400">Resume workspace</span>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-[150px_1fr] sm:p-6">
            <div className="rounded-xl bg-surface-950 p-4 text-white dark:bg-black/30">
              <ScanText size={19} className="text-teal-300" />
              <p className="mt-8 text-[10px] uppercase tracking-[0.16em] text-surface-400">Readiness</p>
              <p className="mt-1 text-4xl font-semibold">76</p>
              <p className="mt-1 text-xs text-surface-400">Strong foundation</p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-teal-400" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-surface-900 dark:text-white">Recommended improvements</p>
                  <p className="text-[10px] text-surface-400">Review before applying</p>
                </div>
                <span className="rounded-full bg-teal-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">3 ready</span>
              </div>
              {[
                ['Clarify project impact', 'High priority'],
                ['Strengthen opening summary', 'Suggested edit'],
                ['Group technical skills', 'ATS structure'],
              ].map(([title, note], index) => (
                <div key={title} className="flex items-center gap-3 rounded-xl border border-surface-200 p-3 dark:border-surface-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                    <Check size={12} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-surface-800 dark:text-surface-100">{title}</p>
                    <p className="text-[9px] text-surface-400">{note}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-semibold text-surface-400">0{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-surface-200 bg-surface-50/70 px-5 py-3 text-[10px] text-surface-500 dark:border-surface-700 dark:bg-surface-800/40 dark:text-surface-400">
            <span>Analysis → ATS → Editable draft</span>
            <span className="font-semibold text-teal-700 dark:text-teal-300">You approve every change</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

