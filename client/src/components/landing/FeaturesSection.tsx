import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, FilePenLine, ScanText, Target } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: ScanText,
    title: 'Understand your resume',
    description: 'See writing quality, detected skills, missing sections, and specific areas worth improving.',
  },
  {
    number: '02',
    icon: Target,
    title: 'Compare it with the role',
    description: 'Use the actual job description to review evidence, keyword coverage, and explainable ATS alignment.',
  },
  {
    number: '03',
    icon: FilePenLine,
    title: 'Review and export',
    description: 'Create an editable version, accept only truthful changes, compare scores, and export PDF or Word.',
  },
];

export const FeaturesSection: React.FC = () => (
  <section id="features" className="bg-surface-50 py-20 dark:bg-surface-900 sm:py-24">
    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-8 border-b border-surface-200 pb-10 dark:border-surface-700 lg:grid-cols-[.8fr_1.2fr] lg:items-end"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">One clear workflow</span>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-surface-950 dark:text-white sm:text-4xl">From upload to application-ready.</h2>
        </div>
        <p className="max-w-2xl text-base leading-7 text-surface-600 dark:text-surface-300 lg:justify-self-end">
          CareerPilot keeps analysis, job matching, and editing connected so you do not have to copy results between scattered tools.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {steps.map(({ number, icon: Icon, title, description }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: index * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-6 dark:border-surface-700 dark:bg-surface-950"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                <Icon size={19} />
              </span>
              <span className="text-xs font-semibold tracking-[0.18em] text-surface-300 dark:text-surface-600">{number}</span>
            </div>
            <h3 className="mt-8 text-lg font-semibold text-surface-950 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-surface-600 dark:text-surface-400">{description}</p>
            <ArrowRight size={16} className="mt-6 text-teal-700 transition-transform group-hover:translate-x-1 dark:text-teal-300" />
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

