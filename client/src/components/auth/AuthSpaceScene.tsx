import React, { useEffect, useRef } from 'react';
import { BriefcaseBusiness, FileText, Sparkles } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import './authSpace.css';

const stars = [
  [24, 42, 1.2], [68, 80, 1], [99, 24, 1.6], [138, 76, 1], [180, 32, 1.3],
  [214, 68, 0.8], [282, 27, 1.1], [333, 63, 1.5], [394, 34, 1], [448, 70, 1.2],
  [38, 142, 1], [87, 184, 1.2], [154, 123, 0.8], [327, 132, 1], [432, 164, 1.5],
  [29, 226, 1.2], [121, 250, 0.8], [362, 212, 1], [460, 232, 1.2],
] as const;

const Satellite: React.FC<{
  label: string;
  icon: React.ReactNode;
  className: string;
  delay: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  reducedMotion: boolean | null;
}> = ({ label, icon, className, delay, x, y, reducedMotion }) => (
  <motion.div className={`auth-space-satellite ${className}`} style={{ x, y }}>
    <motion.div
      className="flex items-center gap-2"
      animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 4.5, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span className="auth-space-satellite-icon">{icon}</span>
      <span>{label}</span>
    </motion.div>
  </motion.div>
);

export const AuthSpaceScene: React.FC<{ isLaunching?: boolean }> = ({ isLaunching = false }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const lightX = useMotionValue(240);
  const lightY = useMotionValue(240);
  const smoothX = useSpring(pointerX, { stiffness: 75, damping: 22 });
  const smoothY = useSpring(pointerY, { stiffness: 75, damping: 22 });
  const smoothLightX = useSpring(lightX, { stiffness: 85, damping: 25 });
  const smoothLightY = useSpring(lightY, { stiffness: 85, damping: 25 });
  const shipX = useTransform(smoothX, [-1, 1], [-22, 22]);
  const shipY = useTransform(smoothY, [-1, 1], [-15, 15]);
  const shipRotate = useTransform(smoothX, [-1, 1], [-5, 5]);
  const farX = useTransform(smoothX, [-1, 1], [10, -10]);
  const farY = useTransform(smoothY, [-1, 1], [8, -8]);
  const nearX = useTransform(smoothX, [-1, 1], [-13, 13]);
  const nearY = useTransform(smoothY, [-1, 1], [-10, 10]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const move = (event: PointerEvent) => {
      const bounds = rootRef.current?.getBoundingClientRect();
      if (!bounds) return;
      pointerX.set((event.clientX / window.innerWidth - 0.5) * 2);
      pointerY.set((event.clientY / window.innerHeight - 0.5) * 2);
      lightX.set(Math.max(0, Math.min(bounds.width, event.clientX - bounds.left)));
      lightY.set(Math.max(0, Math.min(bounds.height, event.clientY - bounds.top)));
    };

    const reset = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', reset);
    };
  }, [lightX, lightY, pointerX, pointerY, reducedMotion]);

  return (
    <div ref={rootRef} className="auth-space-scene relative mx-auto mb-6 h-[310px] w-full max-w-[480px] overflow-hidden" aria-hidden="true">
      <motion.div className="auth-space-cursor-light" style={{ left: smoothLightX, top: smoothLightY }} />
      <motion.svg className="absolute inset-0 h-full w-full" viewBox="0 0 480 330" fill="none" style={{ x: farX, y: farY }}>
        <defs>
          <radialGradient id="career-planet" cx="0" cy="0" r="1" gradientTransform="translate(235 253) rotate(90) scale(182 185)">
            <stop stopColor="#174d68" /><stop offset=".56" stopColor="#0d2c45" /><stop offset="1" stopColor="#071a2c" />
          </radialGradient>
          <linearGradient id="career-horizon" x1="72" y1="240" x2="408" y2="240">
            <stop stopColor="#27d9ca" stopOpacity="0" /><stop offset=".5" stopColor="#65ece0" /><stop offset="1" stopColor="#27d9ca" stopOpacity="0" />
          </linearGradient>
          <clipPath id="career-planet-clip"><circle cx="240" cy="327" r="168" /></clipPath>
        </defs>
        {stars.map(([cx, cy, r], index) => (
          <circle key={`${cx}-${cy}`} className="auth-space-star" style={{ animationDelay: `${index * 0.32}s` }} cx={cx} cy={cy} r={r} fill={index % 4 === 0 ? '#f9cc86' : '#b5f9f5'} />
        ))}
        <path d="M53 91 99 24 154 123 214 68 282 27 333 63 394 34" stroke="#9bdadf" strokeOpacity=".16" strokeWidth=".8" />
        <path d="M333 63 432 164 362 212" stroke="#9bdadf" strokeOpacity=".12" strokeWidth=".8" />
        <path d="M58 228c20-61 83-96 182-96s164 35 184 96" stroke="#79e9df" strokeOpacity=".18" strokeDasharray="3 8" />
        <circle cx="240" cy="327" r="168" fill="url(#career-planet)" stroke="#53d9d5" strokeOpacity=".55" />
        <g clipPath="url(#career-planet-clip)" stroke="#42bfd0" strokeOpacity=".22" strokeWidth="1">
          <ellipse cx="240" cy="327" rx="168" ry="48" /><ellipse cx="240" cy="327" rx="168" ry="92" />
          <ellipse cx="240" cy="327" rx="168" ry="137" /><ellipse cx="240" cy="327" rx="56" ry="168" />
          <ellipse cx="240" cy="327" rx="108" ry="168" /><path d="M240 157v340M72 327h336" />
        </g>
        <path d="M70 244a168 168 0 0 1 340 0" stroke="url(#career-horizon)" strokeWidth="3" />
        <path className="auth-space-orbit-path" d="M44 253c70-71 338-87 394-14" stroke="#77eee1" strokeOpacity=".48" strokeWidth="1" strokeDasharray="2 8" />
        <circle cx="44" cy="253" r="3" fill="#f9c879" /><circle cx="438" cy="239" r="3" fill="#6beadd" />
      </motion.svg>

      <motion.div
        className="auth-space-ship absolute left-1/2 top-[12%] ml-[-75px] h-[175px] w-[150px]"
        style={{ x: shipX, y: shipY, rotate: shipRotate }}
      >
        <motion.div
          className="relative h-full w-full"
          animate={isLaunching && !reducedMotion ? { y: -340, opacity: 0, scale: 0.55 } : reducedMotion ? undefined : { y: [0, -8, 0] }}
          transition={isLaunching ? { duration: 0.68, ease: 'easeIn' } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="auth-space-exhaust" />
          <svg viewBox="0 0 150 175" fill="none" className="relative h-full w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)]">
            <defs>
              <linearGradient id="career-ship-shell" x1="75" y1="10" x2="75" y2="140">
                <stop stopColor="#f3fffb" /><stop offset=".46" stopColor="#a4d8df" /><stop offset="1" stopColor="#2e6884" />
              </linearGradient>
              <linearGradient id="career-ship-glass" x1="56" y1="55" x2="94" y2="105">
                <stop stopColor="#9df9e6" /><stop offset="1" stopColor="#176581" />
              </linearGradient>
            </defs>
            <path d="M61 112 26 135l9-49 35 21M89 112l35 23-9-49-35 21" fill="#27758a" stroke="#7ed9da" strokeWidth="2" />
            <path d="M75 12c-27 24-33 65-31 103l31 23 31-23c2-38-4-79-31-103Z" fill="url(#career-ship-shell)" stroke="#d8fff4" strokeWidth="2" />
            <path d="M75 25c-11 10-18 24-19 42 12-6 26-6 38 0-1-18-8-32-19-42Z" fill="#ffffff" fillOpacity=".65" />
            <path d="M75 62c-14 0-23 11-23 25 0 17 12 31 23 31s23-14 23-31c0-14-9-25-23-25Z" fill="url(#career-ship-glass)" stroke="#d6fff2" strokeWidth="2" />
            <path d="M64 86c2-8 7-13 15-15" stroke="#e1fff2" strokeWidth="3" strokeLinecap="round" opacity=".8" />
            <path d="M58 125h34l-7 22H65l-7-22Z" fill="#e9bb75" stroke="#fff0c7" strokeWidth="2" />
            <path d="M52 111h-8M106 111h-8" stroke="#ffcf81" strokeWidth="4" strokeLinecap="round" />
            <circle cx="75" cy="45" r="3" fill="#f7bd72" />
          </svg>
        </motion.div>
      </motion.div>

      <Satellite label="Skills" icon={<Sparkles size={14} />} className="left-[5%] top-[13%]" delay={0} x={nearX} y={nearY} reducedMotion={reducedMotion} />
      <Satellite label="Resume" icon={<FileText size={14} />} className="right-[2%] top-[26%]" delay={1.3} x={farX} y={nearY} reducedMotion={reducedMotion} />
      <Satellite label="Opportunities" icon={<BriefcaseBusiness size={14} />} className="right-[1%] bottom-[11%]" delay={2.2} x={nearX} y={farY} reducedMotion={reducedMotion} />
    </div>
  );
};
