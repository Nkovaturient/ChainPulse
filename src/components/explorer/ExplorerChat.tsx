'use client';

import { useEffect, useRef, useState } from 'react';
import MarkdownBody from '@/components/MarkdownBody';
import GlassPanel from '@/components/ui/GlassPanel';
import type { Language } from '@/types';

interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

interface Props {
  address: string;
  lang: Language;
}

const SUGGESTIONS = [
  'What chains is this wallet most active on?',
  'Biggest transaction in the past week',
  'Does this wallet hold any stablecoins?',
  'Is this wallet a whale?',
];

export default function ExplorerChat({ address, lang }: Props) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  useEffect(() => {
    setTurns([]);
  }, [address]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const id = `t-${++counter.current}`;
    const userTurn: ChatTurn = { id, role: 'user', text };
    const pendingTurn: ChatTurn = { id: `${id}-p`, role: 'assistant', text: '…', pending: true };
    setTurns((prev) => [...prev, userTurn, pendingTurn]);
    setInput('');
    setBusy(true);

    try {
      const history = turns.slice(-4).map((t) => ({ role: t.role, text: t.text }));
      const res = await fetch('/api/explorer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, query: text, language: lang, history }),
      });
      const data = (await res.json()) as { summary?: string; error?: string };
      const reply: ChatTurn = {
        id: `${id}-r`,
        role: 'assistant',
        text: res.ok ? (data.summary ?? '(empty response)') : (data.error ?? 'Request failed.'),
      };
      setTurns((prev) => prev.filter((t) => t.id !== `${id}-p`).concat(reply));
    } catch {
      setTurns((prev) =>
        prev.filter((t) => t.id !== `${id}-p`).concat({
          id: `${id}-e`, role: 'assistant', text: 'Network error. Please try again.',
        }),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <GlassPanel className="rounded-2xl overflow-hidden flex flex-col !p-0">

      <div className="px-4 py-3 flex items-center gap-2 border-b border-[var(--glass-border)]">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs glass-cta !p-0">⛓</div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-read)' }}>Ask about this wallet</span>
        <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--text-muted-read)' }}>
          Tools: native balance · txns · transfers
        </span>
      </div>

      <div className="px-4 py-4 space-y-3 max-h-[400px] overflow-y-auto min-h-[120px]">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-muted-read)' }}>
              Try one of these:
            </p>
            <div className="flex flex-wrap gap-1.5 chip-stagger">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg glass-read-inner transition-all hover:opacity-80"
                  style={{ color: 'var(--text-read)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t) =>
          t.role === 'user' ? (
            <div key={t.id} className="flex justify-end">
              <div className="max-w-[80%] px-3 py-2 rounded-xl rounded-tr-sm text-xs glass-read-inner glass-panel-glow-purple"
                style={{ color: 'var(--text-read)' }}>
                {t.text}
              </div>
            </div>
          ) : (
            <div key={t.id} className="flex justify-start">
              {t.pending ? (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl rounded-tl-sm glass-read">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <div className="max-w-full px-3 py-2.5 rounded-xl rounded-tl-sm text-xs glass-read">
                  <MarkdownBody className="text-xs">{t.text}</MarkdownBody>
                </div>
              )}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--glass-border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this wallet…"
            disabled={busy}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none glass-read-inner"
            style={{ color: 'var(--text-read)' }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 glass-cta"
          >
            {busy ? '…' : 'Ask'}
          </button>
        </div>
      </form>
    </GlassPanel>
  );
}
