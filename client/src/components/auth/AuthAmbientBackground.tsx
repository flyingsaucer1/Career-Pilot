import React, { useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';

interface AuthAmbientBackgroundProps {
  variant: 'login' | 'register';
}

const particles = [
  { left: '10%', top: '17%', size: 5, delay: 0 },
  { left: '18%', top: '74%', size: 7, delay: 1.1 },
  { left: '76%', top: '14%', size: 6, delay: 0.4 },
  { left: '87%', top: '67%', size: 4, delay: 1.8 },
  { left: '69%', top: '88%', size: 5, delay: 0.8 },
];

export const AuthAmbientBackground: React.FC<AuthAmbientBackgroundProps> = ({ variant }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const glowX = useMotionValue(320);
  const glowY = useMotionValue(300);

  const smoothX = useSpring(pointerX, { stiffness: 70, damping: 24, mass: 0.7 });
  const smoothY = useSpring(pointerY, { stiffness: 70, damping: 24, mass: 0.7 });
  const smoothGlowX = useSpring(glowX, { stiffness: 95, damping: 26, mass: 0.5 });
  const smoothGlowY = useSpring(glowY, { stiffness: 95, damping: 26, mass: 0.5 });

  const nearX = useTransform(smoothX, [-1, 1], [-28, 28]);
  const nearY = useTransform(smoothY, [-1, 1], [-20, 20]);
  const farX = useTransform(smoothX, [-1, 1], [16, -16]);
  const farY = useTransform(smoothY, [-1, 1], [12, -12]);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = rootRef.current?.getBoundingClientRect();
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 2);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 2);

      if (bounds) {
        glowX.set(event.clientX - bounds.left);
        glowY.set(event.clientY - bounds.top);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [glowX, glowY, pointerX, pointerY, prefersReducedMotion]);

  const primaryGlow = variant === 'login' ? 'bg-teal-300/25' : 'bg-violet-300/25';
  const shapeAccent = variant === 'login' ? 'border-teal-400/20' : 'border-violet-400/20';

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="dot-grid absolute inset-0 opacity-30 dark:opacity-[0.06]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.82),transparent_48%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(20,38,47,0.72),transparent_52%)]" />

      <motion.div
        className={`absolute -left-48 -top-48 h-96 w-96 rounded-full blur-3xl ${primaryGlow}`}
        style={{ x: smoothGlowX, y: smoothGlowY }}
      />

      <motion.div
        className={`absolute -right-28 top-[8%] h-64 w-64 rounded-[38%] border ${shapeAccent}`}
        style={{ x: farX, y: farY }}
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute inset-7 rounded-full border border-slate-400/15 dark:border-white/10" />
        <div className="absolute inset-[42%] rounded-full bg-teal-400/35 shadow-[0_0_30px_rgba(45,212,191,0.4)]" />
      </motion.div>

      <motion.div
        className="absolute -bottom-24 left-[4%] h-56 w-56 rounded-full border border-violet-400/15"
        style={{ x: nearX, y: nearY }}
        animate={prefersReducedMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/70 shadow-[0_0_20px_rgba(167,139,250,0.55)]" />
        <div className="absolute inset-12 rotate-45 rounded-3xl border border-slate-400/10 dark:border-white/10" />
      </motion.div>

      <motion.div
        className="absolute left-[8%] top-[20%] h-12 w-12 rotate-12 rounded-2xl border border-teal-500/15 bg-white/25 shadow-lg backdrop-blur-sm dark:bg-white/[0.025]"
        style={{ x: nearX, y: nearY }}
        animate={prefersReducedMotion ? undefined : { rotate: [12, 25, 12], y: [0, -8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute bottom-[17%] right-[10%] h-9 w-9 rotate-45 rounded-lg border border-violet-500/20 bg-violet-300/10"
        style={{ x: farX, y: farY }}
        animate={prefersReducedMotion ? undefined : { rotate: [45, 85, 45], scale: [1, 1.12, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {particles.map((particle) => (
        <motion.span
          key={`${particle.left}-${particle.top}`}
          className="absolute rounded-full bg-teal-500/30 shadow-[0_0_12px_rgba(20,184,166,0.35)] dark:bg-teal-300/25"
          style={{ left: particle.left, top: particle.top, width: particle.size, height: particle.size }}
          animate={prefersReducedMotion ? undefined : { y: [0, -12, 0], opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 4.5, delay: particle.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};
