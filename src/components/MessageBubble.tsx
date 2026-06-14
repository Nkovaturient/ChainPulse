'use client';

import type { ChatMessage } from '@/contexts/ChatContext';
import { useChat } from '@/contexts/ChatContext';
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
  const { setFeedback } = useChat();

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed glass-panel glass-panel-glow-purple"
          style={{ color: 'var(--text)' }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  // Only show feedback on persisted server-backed messages
  const canFeedback = !isPending && message.text && !message.id.startsWith('opt-');

  const handleFeedback = (next: 'up' | 'down') => {
    // Toggle off if same value clicked again
    const value = message.feedback === next ? null : next;
    void setFeedback(message.id, value);
  };

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
            <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm glass-read">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              {/* Summary text bubble — rendered as markdown */}
              {message.text && (
                <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm glass-read">
                  <MarkdownBody>{message.text}</MarkdownBody>

                  {/* Feedback bar */}
                  {canFeedback && (
                    <div className="mt-2 pt-2 flex items-center gap-1 border-t border-[var(--glass-border)]">
                      <FeedbackButton
                        active={message.feedback === 'up'}
                        onClick={() => handleFeedback('up')}
                        kind="up"
                      />
                      <FeedbackButton
                        active={message.feedback === 'down'}
                        onClick={() => handleFeedback('down')}
                        kind="down"
                      />
                      <span className="ml-auto text-[11px]" style={{ color: 'var(--text-muted-read)' }}>
                        {message.feedback === 'up'
                          ? 'Thanks — helps us improve'
                          : message.feedback === 'down'
                            ? 'Noted — we’ll tune'
                            : 'Was this helpful?'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Data cards */}
              {message.data && <ResponseFeed response={message.data} lang={lang} compact />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FeedbackButton({
  active, onClick, kind,
}: { active: boolean; onClick: () => void; kind: 'up' | 'down' }) {
  const isUp = kind === 'up';
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-110"
      style={{
        background: active ? (isUp ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)') : 'transparent',
        border: active
          ? `1px solid ${isUp ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)'}`
          : '1px solid var(--border)',
        color: active ? (isUp ? '#10b981' : '#ef4444') : 'var(--text-muted)',
      }}
      title={isUp ? 'Helpful' : 'Not helpful'}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        {isUp ? (
          <path d="M7 22V11h2.293l1.122-7.854A2 2 0 0 1 12.4 1.5h.2a2 2 0 0 1 1.985 2.265L13.8 9h5.5a2 2 0 0 1 1.98 2.293l-1.66 9.5A2 2 0 0 1 17.65 22.5H7zM1 22h4V11H1v11z" />
        ) : (
          <path d="M17 2v11h-2.293l-1.122 7.854A2 2 0 0 1 11.6 22.5h-.2a2 2 0 0 1-1.985-2.265L10.2 15H4.7a2 2 0 0 1-1.98-2.293l1.66-9.5A2 2 0 0 1 6.35 1.5H17zm6 0h-4v11h4V2z" />
        )}
      </svg>
    </button>
  );
}
