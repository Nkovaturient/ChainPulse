'use client';

import type { ChatMessage } from '@/contexts/ChatContext';
import ResponseFeed from '@/components/ResponseFeed';
import MarkdownBody from '@/components/MarkdownBody';
import type { Language } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  lang: Language;
}

export default function MessageBubble({ message, lang }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isPending = message.pending;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
          style={{
            background: 'linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.15))',
            border: '1px solid rgba(99,102,241,.3)',
            color: 'var(--text)',
          }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2.5 max-w-full w-full">
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-sm mt-0.5 text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          ⛓
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          {isPending ? (
            // Typing indicator
            <div
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              {/* Summary text bubble — rendered as markdown */}
              {message.text && (
                <div
                  className="px-4 py-3 rounded-2xl rounded-tl-sm"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <MarkdownBody>{message.text}</MarkdownBody>
                </div>
              )}

              {/* Data cards */}
              {message.data && (
                <ResponseFeed response={message.data} lang={lang} compact />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
