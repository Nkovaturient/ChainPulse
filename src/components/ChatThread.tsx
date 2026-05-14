'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import MessageBubble from '@/components/MessageBubble';
import SkeletonCard from '@/components/SkeletonCard';
import type { Language } from '@/types';

interface ChatThreadProps {
  lang: Language;
}

const HINTS = [
  'BTC & ETH prices today',
  'Top staking yields',
  'Whale activity now',
  'Latest crypto news',
];

export default function ChatThread({ lang }: ChatThreadProps) {
  const { messages, messagesLoading } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messagesLoading) {
    return (
      <div className="space-y-4 py-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-5xl mb-4" style={{ opacity: 0.4 }}>⛓</div>
        <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Ask anything about crypto
        </h3>
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Prices, whale moves, DeFi TVL, staking yields, or news — in English, Hindi, or Bengali.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 max-w-xs w-full">
          {HINTS.map((hint) => (
            <div
              key={hint}
              className="px-3 py-2 rounded-xl text-xs text-center transition-colors"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-card2)',
                color: 'var(--text-muted)',
              }}
            >
              {hint}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} lang={lang} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
