'use client';

import { useWisprDictation } from '@/hooks/useWisprDictation';
import { Mic } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function WisprMicButton({ value, onChange, disabled = false }: Props) {
  const handleTranscript = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange(value ? `${value.trimEnd()} ${trimmed}` : trimmed);
  };

  const { toggle, supported, isActive, state } = useWisprDictation({
    onTranscript: handleTranscript,
    contextText: value,
    disabled,
  });

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={disabled || state === 'processing'}
      title={isActive ? 'Stop dictation' : 'Voice input'}
      aria-label={isActive ? 'Stop dictation' : 'Voice input'}
      className="absolute right-[7.5rem] top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:bg-white/[.06]"
      style={{
        color: isActive ? 'var(--accent3)' : 'var(--text-muted)',
        background: isActive ? 'rgba(255,255,255,.06)' : 'transparent',
      }}
    >
      <Mic size={16} className={isActive ? 'animate-pulse' : ''} />
    </button>
  );
}
