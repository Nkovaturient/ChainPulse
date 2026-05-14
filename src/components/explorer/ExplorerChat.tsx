'use client';

import { useEffect, useRef, useState } from 'react';
import MarkdownBody from '@/components/MarkdownBody';
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

  // Reset history when the address changes
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
      // Send last 4 turns of text-only history
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
    <div className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>⛓</div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Ask about this wallet</span>
        <span className="ml-auto text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Tools: native balance · txns · transfers
        </span>
      </div>

      {/* Turns */}
      <div className="px-4 py-4 space-y-3 max-h-[400px] overflow-y-auto min-h-[120px]">
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Try one of these:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border transition-all hover:opacity-70"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg-card2)',
                    color: 'var(--text-muted)',
                  }}
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
              <div className="max-w-[80%] px-3 py-2 rounded-xl rounded-tr-sm text-xs"
                style={{
                  background: 'linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.15))',
                  border: '1px solid rgba(99,102,241,.3)',
                  color: 'var(--text)',
                }}>
                {t.text}
              </div>
            </div>
          ) : (
            <div key={t.id} className="flex justify-start">
              {t.pending ? (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl rounded-tl-sm"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <div className="max-w-full px-3 py-2 rounded-xl rounded-tl-sm text-xs"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                  <MarkdownBody className="text-xs">{t.text}</MarkdownBody>
                </div>
              )}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this wallet…"
            disabled={busy}
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'var(--bg-card2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,.5)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            {busy ? '…' : 'Ask'}
          </button>
        </div>
      </form>
    </div>
  );
}
