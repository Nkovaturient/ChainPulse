'use client';

import { Mic } from 'lucide-react';
import { useWisprDictation } from '@/hooks/useWisprDictation';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function InlineComposer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask anything…',
  submitLabel = 'Ask',
  isLoading = false,
  disabled = false,
}: Props) {
  const handleTranscript = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onChange(value ? `${value.trimEnd()} ${trimmed}` : trimmed);
  };

  const { toggle, supported, isActive, state: dictationState } = useWisprDictation({
    onTranscript: handleTranscript,
    contextText: value,
    disabled: disabled || isLoading,
  });

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="composer-shell flex items-center gap-2 px-2 py-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent border-none outline-none"
        style={{ color: 'var(--text-read)' }}
      />
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {supported && (
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={disabled || isLoading || dictationState === 'processing'}
            title={isActive ? 'Stop dictation' : 'Voice input'}
            aria-label={isActive ? 'Stop dictation' : 'Voice input'}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:bg-white/[.06]"
            style={{
              color: isActive ? 'var(--accent3)' : 'var(--text-muted-read)',
              background: isActive ? 'rgba(255,255,255,.06)' : 'transparent',
            }}
          >
            <Mic size={16} className={isActive ? 'animate-pulse' : ''} />
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || disabled || !value.trim()}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 glass-cta"
        >
          {isLoading ? '…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
