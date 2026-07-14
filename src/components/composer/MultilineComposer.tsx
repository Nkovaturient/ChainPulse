'use client';

import { useEffect, useRef } from 'react';
import { ArrowUp, Mic } from 'lucide-react';
import { useWisprDictation } from '@/hooks/useWisprDictation';

type Variant = 'default' | 'insider';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  submitLabel?: string;
  loadingLabel?: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  rows?: number;
}

export default function MultilineComposer({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask anything…',
  submitLabel = 'Ask',
  loadingLabel = 'Thinking…',
  isLoading = false,
  disabled = false,
  variant = 'default',
  rows = 2,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const submit = () => {
    const q = value.trim();
    if (q && !isLoading && !disabled) onSubmit();
  };

  const shellClass = variant === 'insider'
    ? 'composer-shell composer-shell--insider'
    : 'composer-shell';

  const ctaClass = variant === 'insider'
    ? 'px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center gap-2'
    : 'glass-cta px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center gap-2';

  const ctaStyle = variant === 'insider'
    ? { background: 'linear-gradient(135deg, #ca8a04, #a16207)' }
    : undefined;

  return (
    <div className={shellClass}>
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        rows={rows}
        disabled={isLoading || disabled}
        className="w-full px-4 pt-4 pb-2 text-sm bg-transparent border-none outline-none placeholder:opacity-40 leading-relaxed resize-none"
        style={{ color: 'var(--text)', fontFamily: 'inherit' }}
      />
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <div className="flex items-center gap-1">
          {supported && (
            <button
              type="button"
              onClick={() => void toggle()}
              disabled={disabled || isLoading || dictationState === 'processing'}
              title={isActive ? 'Stop dictation' : 'Voice input'}
              aria-label={isActive ? 'Stop dictation' : 'Voice input'}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 hover:bg-white/[.06]"
              style={{
                color: isActive ? (variant === 'insider' ? '#facc15' : 'var(--accent3)') : 'var(--text-muted)',
                background: isActive ? 'rgba(255,255,255,.06)' : 'transparent',
              }}
            >
              {/* <Mic size={16} className={isActive ? 'animate-pulse' : ''} /> */}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={isLoading || disabled || !value.trim()}
          className={ctaClass}
          style={ctaStyle}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {loadingLabel}
            </>
          ) : (
            <>
              {submitLabel}
              <ArrowUp size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
