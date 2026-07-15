'use client';

import { useEffect, useRef, useState } from 'react';
import MultilineComposer from '@/components/composer/MultilineComposer';
import InsiderMessageBubble from '@/components/insider/InsiderMessageBubble';
import InsiderSessionSidebar, { InsiderSidebarToggle } from '@/components/insider/InsiderSessionSidebar';
import { useInsiderChat } from '@/contexts/InsiderChatContext';

export default function InsiderChatPane() {
  const { messages, messagesLoading, busy, sendMessage } = useInsiderChat();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hints = [
    'Which wallets are accumulating ETH right now?',
    "What's the biggest flow in the last hour?",
    'Any unusual gas spikes on Ethereum?',
  ];

  return (
    <div className="flex flex-col min-h-0 h-full w-full min-w-0">
      <div
        className="px-5 py-3 border-b flex-shrink-0 flex items-center justify-between gap-2"
        style={{ borderColor: 'rgba(234,179,8,.12)' }}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold" style={{ color: '#facc15' }}>
            Ask Insider Bot
          </p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
            Which wallets bought before the last pump? What are whales accumulating?
          </p>
        </div>
        <InsiderSidebarToggle open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />
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
                    className="text-left text-xs px-3 py-2.5 rounded-xl border transition-all hover:opacity-80"
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
        />
      </div>
    </div>
  );
}
