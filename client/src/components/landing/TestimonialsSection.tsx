import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  avatar?: string;
  rating: number;
  quote: string;
  highlight: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Software Engineer',
    company: 'Google',
    rating: 5,
    quote:
      'CareerPilot AI transformed my resume completely. My ATS score jumped from 42% to 94% and I started getting 3x more interview calls within a week.',
    highlight: '3x more interview calls',
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'Stripe',
    rating: 5,
    quote:
      'The interview prep feature is incredible. I practiced with AI-generated questions for my PM role and walked in feeling completely prepared. Got the offer!',
    highlight: 'Got the offer!',
  },
  {
    id: 3,
    name: 'Priya Patel',
    role: 'Data Analyst',
    company: 'Meta',
    rating: 5,
    quote:
      "I landed my dream role at Meta after using CareerPilot's skill gap analysis. It showed me exactly what I needed to learn and gave me a clear roadmap.",
    highlight: 'Landed dream role at Meta',
  },
  {
    id: 4,
    name: 'Alex Rivera',
    role: 'UX Designer',
    company: 'Figma',
    rating: 5,
    quote:
      'The resume builder templates are stunning. I got compliments on my resume design in every interview. The AI suggestions were spot-on for my field.',
    highlight: 'Compliments in every interview',
  },
  {
    id: 5,
    name: 'Emily Watson',
    role: 'Marketing Lead',
    company: 'HubSpot',
    rating: 5,
    quote:
      "Job tracking made my search so organized. No more spreadsheets! I could see exactly where I was in each application process and never missed a follow-up.",
    highlight: 'Never missed a follow-up',
  },
  {
    id: 6,
    name: 'David Kim',
    role: 'Backend Engineer',
    company: 'Shopify',
    rating: 5,
    quote:
      "Best investment for my career. Went from 2 months of silence to 4 offers in 3 weeks. The AI optimization is genuinely impressive — it knows what recruiters want.",
    highlight: '4 offers in 3 weeks',
  },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-surface-200'}
      />
    ))}
  </div>
);

const TestimonialCard: React.FC<{ testimonial: Testimonial; index: number }> = ({
  testimonial,
  index,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="card card-hover p-6 flex flex-col gap-4 relative"
    >
      <Quote
        size={28}
        className="absolute top-5 right-5 text-surface-100 dark:text-surface-700"
        strokeWidth={1}
      />
      <StarRating rating={testimonial.rating} />
      <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed flex-1">
        "{testimonial.quote}"
      </p>
      <div className="flex items-center gap-3 pt-2 border-t border-surface-100 dark:border-surface-700">
        <Avatar name={testimonial.name} size="sm" />
        <div>
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            {testimonial.name}
          </p>
          <p className="text-xs text-surface-400">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export const TestimonialsSection: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(headerRef, { once: true });

  return (
    <section id="testimonials" className="py-24 bg-white dark:bg-surface-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center mb-16"
        >
          <span className="section-tag mb-4">Loved by Job Seekers</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white text-balance">
            Real results from real people
          </h2>
          <p className="mt-4 text-lg text-surface-500 dark:text-surface-400 max-w-2xl">
            Join thousands of professionals who landed their dream jobs with CareerPilot AI.
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {testimonials.map((t, i) => (
            <div key={t.id} className="break-inside-avoid">
              <TestimonialCard testimonial={t} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
