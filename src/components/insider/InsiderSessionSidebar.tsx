'use client';

import { useState } from 'react';
import { CircleX, PanelRightClose, PanelRightOpen, Zap } from 'lucide-react';
import { useInsiderChat } from '@/contexts/InsiderChatContext';

interface Props {
  open: boolean;
  onCloseMobile: () => void;
  onToggle: () => void;
}

export default function InsiderSessionSidebar({ open, onCloseMobile, onToggle }: Props) {
  const { sessions, activeSessionId, sessionsLoading, openSession, newSession, deleteSession } =
    useInsiderChat();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (d: Date) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleNew = async () => {
    await newSession();
    onCloseMobile();
  };

  const handleOpen = async (id: string) => {
    await openSession(id);
    onCloseMobile();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteSession(id);
    setDeletingId(null);
  };

  const panel = (
    <div className="insider-session-sidebar flex flex-col h-full w-[280px] flex-shrink-0">
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b gap-2"
        style={{ borderColor: 'rgba(234,179,8,.12)' }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap size={12} className="text-yellow-400 flex-shrink-0" />
          <span className="text-sm font-semibold" style={{ color: '#facc15' }}>
            Chat history
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <InsiderSidebarToggle open={open} onToggle={onToggle} />
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-3 py-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => void handleNew()}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #eab308, #ca8a04 55%, #a16207)',
            boxShadow: '0 4px 16px rgba(202,138,4,.25)',
          }}
        >
          <span className="text-sm leading-none">+</span>
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 min-h-0">
        {sessionsLoading && (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
          </div>
        )}
        {!sessionsLoading && sessions.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              No chats yet
            </p>
          </div>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            onClick={() => void handleOpen(s.id)}
            onKeyDown={(e) => e.key === 'Enter' && void handleOpen(s.id)}
            className={[
              'insider-glow-card w-full px-3 py-2.5 rounded-xl group flex items-start gap-2 cursor-pointer select-none',
              activeSessionId === s.id ? 'insider-glow-card--selected' : '',
            ].join(' ').trim()}
          >
            <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: '#facc15', opacity: 0.6 }}>
              ⚡
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-snug" style={{ color: 'var(--text)' }}>
                {s.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                {formatDate(s.updatedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => void handleDelete(e, s.id)}
              disabled={deletingId === s.id}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 mt-0.5 disabled:opacity-30 hover:text-red-500"
              style={{ color: 'var(--text-muted)' }}
              title="Delete"
            >
              {deletingId === s.id ? (
                <span className="w-3 h-3 border border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              ) : (
                <CircleX size={13} />
              )}
            </button>
          </div>
        ))}
      </div>

      <div
        className="px-4 py-3 flex-shrink-0 border-t text-center"
        style={{ borderColor: 'rgba(234,179,8,.12)' }}
      >
        <p className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          Sessions saved · Not financial advice
        </p>
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          style={{ top: 'var(--app-header-height, 3.25rem)' }}
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <div
        className={`fixed right-0 z-40 lg:hidden transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          top: 'var(--app-header-height, 3.25rem)',
          height: 'calc(100vh - var(--app-header-height, 3.25rem))',
          borderLeft: '1px solid rgba(234,179,8,.12)',
          background: 'rgba(5,9,18,.97)',
          boxShadow: open ? '-8px 0 32px rgba(0,0,0,.35)' : 'none',
        }}
      >
        {panel}
      </div>
      <div
        className="hidden lg:flex h-full flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
        style={{
          width: open ? '280px' : '0px',
          borderLeft: open ? '1px solid rgba(234,179,8,.12)' : 'none',
          background: 'rgba(5,9,18,.55)',
        }}
      >
        {open && panel}
      </div>
    </>
  );
}

export function InsiderSidebarToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
      style={{ background: 'rgba(234,179,8,.08)', color: '#facc15' }}
      title={open ? 'Hide chat history' : 'Show chat history'}
    >
      {open ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
    </button>
  );
}
