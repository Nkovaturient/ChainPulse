'use client';

import { useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { FEATURE_NAV_ITEMS, featureNavIdFromPath } from '@/lib/nav-config';

export default function FeatureNav() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const activeId = featureNavIdFromPath(pathname);
  const navRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const buttons = navRef.current?.querySelectorAll<HTMLButtonElement>('[data-nav-segment]');
    if (!buttons?.length) return;
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const next = (index + delta + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }, []);

  return (
    <motion.nav
      ref={navRef}
      className="elite-feature-nav"
      role="tablist"
      aria-label="ChainPulse features"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {FEATURE_NAV_ITEMS.map((item, index) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-nav-segment
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => router.push(item.href)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              'elite-feature-nav__segment',
              isActive ? 'elite-feature-nav__segment--active' : '',
              item.eliteAccent ? 'elite-feature-nav__segment--gold' : '',
            ].filter(Boolean).join(' ')}
          >
            {isActive && (
              <motion.span
                layoutId="elite-nav-indicator"
                className="elite-feature-nav__indicator"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 32 }
                }
              />
            )}
            <Icon size={14} className="elite-feature-nav__icon" aria-hidden />
            <span className="elite-feature-nav__label hidden sm:inline">{item.label}</span>
            <span className="elite-feature-nav__label sm:hidden">{item.shortLabel}</span>
          </button>
        );
      })}
    </motion.nav>
  );
}
