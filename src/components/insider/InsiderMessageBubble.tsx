'use client';

import type { InsiderChatMessage } from '@/contexts/InsiderChatContext';
import { useInsiderChat } from '@/contexts/InsiderChatContext';
import MarkdownBody from '@/components/MarkdownBody';
import InsiderCitationBar from '@/components/insider/InsiderCitationBar';

interface Props {
  message: InsiderChatMessage;
}

export default function InsiderMessageBubble({ message }: Props) {
  const { setFeedback } = useInsiderChat();
  const isUser = message.role === 'user';
  const isPending = message.pending;
  const canFeedback = !isPending && message.text && !message.id.startsWith('opt-');

  const handleFeedback = (next: 'up' | 'down') => {
    const value = message.feedback === next ? null : next;
    void setFeedback(message.id, value);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] px-4 py-2.5 rounded-xl rounded-tr-sm text-sm leading-relaxed"
          style={{ background: 'rgba(234,179,8,.12)', color: '#fde047', border: '1px solid rgba(234,179,8,.25)' }}
        >
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      {isPending ? (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl rounded-tl-sm glass-read">
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="max-w-full px-4 py-3 rounded-xl rounded-tl-sm text-sm leading-relaxed glass-read">
          <MarkdownBody className="text-sm leading-relaxed insider-markdown">{message.text}</MarkdownBody>
          <InsiderCitationBar evidence={message.evidence} />
          {canFeedback && (
            <div
              className="mt-2 pt-2 flex items-center gap-1 border-t"
              style={{ borderColor: 'rgba(234,179,8,.12)' }}
            >
              <FeedbackButton active={message.feedback === 'up'} onClick={() => handleFeedback('up')} kind="up" />
              <FeedbackButton active={message.feedback === 'down'} onClick={() => handleFeedback('down')} kind="down" />
              <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                {message.feedback === 'up'
                  ? 'Thanks'
                  : message.feedback === 'down'
                    ? 'Noted'
                    : 'Helpful?'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackButton({
  active,
  onClick,
  kind,
}: {
  active: boolean;
  onClick: () => void;
  kind: 'up' | 'down';
}) {
  const isUp = kind === 'up';
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-110"
      style={{
        background: active ? (isUp ? 'rgba(16,185,129,.18)' : 'rgba(239,68,68,.18)') : 'transparent',
        border: active
          ? `1px solid ${isUp ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)'}`
          : '1px solid rgba(234,179,8,.15)',
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
