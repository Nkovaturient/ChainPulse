'use client';

import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { BG_PLACEHOLDERS } from '@/lib/bg-placeholders';

type Variant = 'console' | 'explorer';

const BG_SRC: Record<Variant, { webp: string; jpg: string; placeholder: string }> = {
  console: {
    webp: '/a1.webp',
    jpg: '/a1.jpg',
    placeholder: BG_PLACEHOLDERS.console,
  },
  explorer: {
    webp: '/a7.webp',
    jpg: '/a7.png',
    placeholder: BG_PLACEHOLDERS.explorer,
  },
};

interface AtmosphereBackgroundProps {
  variant: Variant;
}

export default function AtmosphereBackground({ variant }: AtmosphereBackgroundProps) {
  const { theme } = useTheme();
  const src = BG_SRC[variant];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      <Image
        src={src.webp}
        alt=""
        fill
        priority
        quality={75}
        sizes="100vw"
        placeholder="blur"
        blurDataURL={src.placeholder}
        className="object-cover object-center scale-105"
      />
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ background: 'var(--scrim-photo)' }}
      />
      {theme === 'dark' && (
        <>
          <div
            className="atmosphere-orb atmosphere-orb-purple w-[420px] h-[420px] -top-24 -left-20"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="atmosphere-orb atmosphere-orb-teal w-[360px] h-[360px] bottom-10 right-[-60px]"
            style={{ animationDelay: '-4s' }}
          />
          <div
            className="atmosphere-orb atmosphere-orb-purple w-[280px] h-[280px] bottom-[-40px] left-[25%]"
            style={{ animationDelay: '-8s' }}
          />
        </>
      )}
    </div>
  );
}
