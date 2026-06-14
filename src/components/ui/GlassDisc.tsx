'use client';

interface GlassDiscProps {
  visible: boolean;
}

export default function GlassDisc({ visible }: GlassDiscProps) {
  return (
    <div
      className={`glass-disc z-[1] ${visible ? 'glass-disc-visible' : 'glass-disc-hidden'}`}
      aria-hidden
    />
  );
}
