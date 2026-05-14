'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/contexts/ChatContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { sessions, activeSessionId, sessionsLoading, openSession, newSession, deleteSession } = useChat();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleNew = async () => {
    await newSession();
    onClose();
  };

  const handleOpen = async (id: string) => {
    await openSession(id);
    onClose();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteSession(id);
    setDeletingId(null);
  };

  const formatDate = (d: Date) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const panel = (
    <div className="flex flex-col h-full w-72"
      style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 group">
          <span className="text-base">⛓</span>
          <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text)' }}>
            ChainPulse
          </span>
          </button>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-card2)' }}
        >
          ✕
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--bg-card2)' }}
        >
          <span className="w-5 h-5 rounded-md flex items-center justify-center text-white flex-shrink-0 text-sm leading-none"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            +
          </span>
          New chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 min-h-0">
        {sessionsLoading && (
          <div className="flex justify-center py-6">
            <span className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}
        {!sessionsLoading && sessions.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>No chats yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>Start a new conversation</p>
          </div>
        )}
        {sessions.map((s) => (
          // Use div + role=button to avoid <button> nesting (delete btn inside)
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            onClick={() => handleOpen(s.id)}
            onKeyDown={(e) => e.key === 'Enter' && handleOpen(s.id)}
            className="w-full px-3 py-2.5 rounded-xl transition-all group flex items-start gap-2 cursor-pointer select-none"
            style={{
              background: activeSessionId === s.id ? 'rgba(99,102,241,.12)' : 'transparent',
              border: activeSessionId === s.id ? '1px solid rgba(99,102,241,.25)' : '1px solid transparent',
            }}
          >
            <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>💬</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate leading-snug" style={{ color: 'var(--text)' }}>{s.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>{formatDate(s.updatedAt)}</p>
            </div>
            <button
              onClick={(e) => handleDelete(e, s.id)}
              disabled={deletingId === s.id}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 mt-0.5 disabled:opacity-30 hover:text-red-500"
              style={{ color: 'var(--text-muted)' }}
              title="Delete"
            >
              {deletingId === s.id
                ? <span className="w-3 h-3 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                : '🗑'}
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          Chats saved · No financial advice
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile overlay ── */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <div className={`fixed top-0 left-0 h-full z-40 lg:hidden transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {panel}
      </div>

      {/* ── Desktop inline panel ── (width-animated, no overlay) */}
      <div
        className="hidden lg:block h-full flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
        style={{ width: open ? '18rem' : '0px' }}
      >
        {panel}
      </div>
    </>
  );
}
