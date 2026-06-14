'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/contexts/ChatContext';
import MessageBubble from '@/components/MessageBubble';
import SkeletonCard from '@/components/SkeletonCard';
import type { Language } from '@/types';

interface ChatThreadProps {
  lang: Language;
  onHintClick?: (hint: string) => void;
}

const HINTS = [
  'BTC & ETH prices today',
  'Top staking yields',
  'Whale activity now',
  'Latest crypto news',
];

export default function ChatThread({ lang, onHintClick }: ChatThreadProps) {
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
      <div className="relative flex flex-col items-center justify-center py-20 text-center z-[2]">
        <div className="text-5xl mb-4 animate-fade-up" style={{ opacity: 0.5 }}>⛓</div>
        <h3 className="text-base font-semibold mb-2 animate-fade-up delay-100" style={{ color: 'var(--text)' }}>
          Ask anything about crypto
        </h3>
        <p className="text-sm max-w-xs leading-relaxed animate-fade-up delay-200" style={{ color: 'var(--text-muted)' }}>
          Prices, whale moves, DeFi TVL, staking yields, or news — in English, Hindi, or Bengali.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 max-w-xs w-full chip-stagger">
          {HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => onHintClick?.(hint)}
              className="px-3 py-2 rounded-xl text-xs text-center transition-all glass-panel hover:scale-[1.02]"
              style={{ color: 'var(--text-muted)' }}
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 relative z-[2]">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} lang={lang} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
