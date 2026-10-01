import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

export const CTASection: React.FC = () => (
  <section className="bg-white py-16 dark:bg-surface-950 sm:py-20">
    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-[#10333b] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-14 lg:py-12">
        <div aria-hidden="true" className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -right-8 -top-12 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">Your next application</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Make it evidence-based, not guesswork.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Start with the resume you already have. CareerPilot will help you understand it before suggesting what to change.</p>
        </div>
        <div className="relative mt-7 shrink-0 lg:mt-0">
          <Button as={Link} to="/register" size="lg" rightIcon={<ArrowRight size={17} />} className="bg-white text-[#10333b] hover:bg-slate-100 focus:ring-white">
            Create your workspace
          </Button>
        </div>
      </div>
    </div>
  </section>
);

