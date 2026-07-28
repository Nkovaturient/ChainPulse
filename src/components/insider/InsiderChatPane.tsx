'use client';

import { useEffect, useRef, useState } from 'react';
import MultilineComposer from '@/components/composer/MultilineComposer';
import InsiderMessageBubble from '@/components/insider/InsiderMessageBubble';
import InsiderCategoryChips from '@/components/insider/InsiderCategoryChips';
import InsiderSessionSidebar, { InsiderSidebarToggle } from '@/components/insider/InsiderSessionSidebar';
import { useInsiderChat } from '@/contexts/InsiderChatContext';
import { useInsiderCategory } from '@/contexts/InsiderCategoryContext';
import { categoryHintPrompts } from '@/lib/insider/categories';

export default function InsiderChatPane() {
  const { messages, messagesLoading, busy, sendMessage } = useInsiderChat();
  const { category, setCategory } = useInsiderCategory();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hints = categoryHintPrompts(category);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col min-h-0 h-full w-full min-w-0">
      <div
        className="px-5 py-3 border-b flex-shrink-0 flex items-center justify-between gap-2"
        style={{ borderColor: 'rgba(234,179,8,.12)' }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-tight" style={{ color: '#facc15' }}>
            Ask Insider Bot
          </p>
          <p className="text-xs mt-1 truncate leading-snug" style={{ color: 'var(--text-muted)' }}>
            Which wallets bought before the last pump? What are whales accumulating?
          </p>
        </div>
        {!sidebarOpen && (
          <InsiderSidebarToggle open={sidebarOpen} onToggle={() => setSidebarOpen(true)} />
        )}
      </div>

      <div className="px-4 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'rgba(234,179,8,.08)' }}>
        <InsiderCategoryChips value={category} onChange={setCategory} />
      </div>

      <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messagesLoading && (
              <div className="flex justify-center py-8">
                <span className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              </div>
            )}
            {!messagesLoading && messages.length === 0 && (
              <div className="flex flex-col gap-2 pt-4">
                {hints.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    className="text-left text-sm leading-relaxed px-3.5 py-3 rounded-xl border transition-all hover:opacity-80"
                    style={{
                      background: 'rgba(234,179,8,.04)',
                      borderColor: 'rgba(234,179,8,.12)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m) => (
              <InsiderMessageBubble key={m.id} message={m} />
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(234,179,8,.12)' }}>
            <MultilineComposer
              value={input}
              onChange={setInput}
              onSubmit={() => {
                void sendMessage(input);
                setInput('');
              }}
              placeholder="Ask anything about smart-money flows…"
              submitLabel="Send"
              isLoading={busy}
              variant="insider"
              rows={1}
            />
          </div>
        </div>

        <InsiderSessionSidebar
          open={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen((v) => !v)}
        />
      </div>
    </div>
  );
}
