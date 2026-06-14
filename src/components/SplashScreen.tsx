'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { BG_PLACEHOLDERS, LOGO_DIMENSIONS } from '@/lib/bg-placeholders';

const EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_AT = 2.1;
const TOTAL_MS = 3100;
const REDUCED_MS = 1200;

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const ms = reduceMotion ? REDUCED_MS : TOTAL_MS;
    const timer = setTimeout(onComplete, ms);
    return () => clearTimeout(timer);
  }, [onComplete, reduceMotion]);

  const exitDelay = reduceMotion ? 0.8 : EXIT_AT;
  const exitDuration = reduceMotion ? 0.3 : TOTAL_MS / 1000 - EXIT_AT;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: '#0a0a1a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: exitDelay, duration: exitDuration, ease: 'easeInOut' }}
      aria-label="ChainPulse intro"
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          className="splash-logo-glow mb-6"
          initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: EASE }}
        >
          <Image
            src="/cp-logo.webp"
            alt="ChainPulse"
            width={LOGO_DIMENSIONS.width}
            height={LOGO_DIMENSIONS.height}
            priority
            placeholder="blur"
            blurDataURL={BG_PLACEHOLDERS.logo}
            className="w-[min(72vw,320px)] sm:w-[min(60vw,400px)] h-auto"
          />
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
          initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.4, ease: EASE }}
        >
          ChainPulse
        </motion.h1>

        <motion.p
          className="mt-3 text-sm sm:text-base font-medium text-[#a78bfa]/90 max-w-xs sm:max-w-md leading-relaxed"
          initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.9, ease: EASE }}
        >
          Simplifying Blockchain Data for Every Trader
        </motion.p>
      </div>
    </motion.div>
  );
}
