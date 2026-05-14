'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { QueryResponse } from '@/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  data?: QueryResponse | null;
  createdAt: Date;
  pending?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContextValue {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  sessionsLoading: boolean;
  messagesLoading: boolean;
  /** Switch to (or create) a session and load its messages */
  openSession: (id: string) => Promise<void>;
  /** Create a fresh session and switch to it */
  newSession: () => Promise<string>;
  /** Delete a session */
  deleteSession: (id: string) => Promise<void>;
  /** Append an optimistic user message + fire query */
  sendMessage: (query: string, lang: string) => Promise<QueryResponse | null>;
  /** Reload sessions list */
  reloadSessions: () => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const pendingId = useRef(0);

  const reloadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/chat/sessions');
      if (!res.ok) return;
      const { sessions: data } = (await res.json()) as { sessions: ChatSession[] };
      setSessions(data.map((s) => ({ ...s, createdAt: new Date(s.createdAt), updatedAt: new Date(s.updatedAt) })));
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // Load sessions on mount
  useEffect(() => { void reloadSessions(); }, [reloadSessions]);

  const openSession = useCallback(async (id: string) => {
    setActiveSessionId(id);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (!res.ok) return;
      const { messages: data } = (await res.json()) as {
        messages: { id: string; role: string; text: string; dataJson: QueryResponse | null; createdAt: string }[]
      };
      setMessages(data.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        text: m.text,
        data: m.dataJson,
        createdAt: new Date(m.createdAt),
      })));
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const newSession = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/chat/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const { session } = (await res.json()) as { session: ChatSession };
    const s: ChatSession = { ...session, createdAt: new Date(session.createdAt), updatedAt: new Date(session.updatedAt) };
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
    setMessages([]);
    return s.id;
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [activeSessionId]);

  const sendMessage = useCallback(async (query: string, lang: string): Promise<QueryResponse | null> => {
    // Ensure we have an active session
    let sid = activeSessionId;
    if (!sid) {
      sid = await newSession();
    }

    // Optimistic user bubble
    const optimisticId = `opt-${++pendingId.current}`;
    const userMsg: ChatMessage = {
      id: optimisticId,
      role: 'user',
      text: query,
      createdAt: new Date(),
    };
    // Pending assistant bubble
    const pendingMsg: ChatMessage = {
      id: `${optimisticId}-pending`,
      role: 'assistant',
      text: '…',
      createdAt: new Date(),
      pending: true,
    };
    setMessages((prev) => [...prev, userMsg, pendingMsg]);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: lang, sessionId: sid }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || 'Request failed');
      }
      const data = (await res.json()) as QueryResponse & { sessionId?: string };

      // Replace pending bubble with real response
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== `${optimisticId}-pending`)
          .concat({
            id: `${optimisticId}-res`,
            role: 'assistant' as const,
            text: data.summary ?? '',
            data,
            createdAt: new Date(),
          }),
      );

      // If a new sessionId was minted server-side, sync it
      if (data.sessionId && data.sessionId !== sid) {
        setActiveSessionId(data.sessionId);
      }

      // Refresh session list to pick up title update
      void reloadSessions();

      return data;
    } catch (err) {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== `${optimisticId}-pending`)
          .concat({
            id: `${optimisticId}-err`,
            role: 'assistant' as const,
            text: err instanceof Error ? err.message : 'Something went wrong.',
            createdAt: new Date(),
          }),
      );
      return null;
    }
  }, [activeSessionId, newSession, reloadSessions]);

  return (
    <ChatContext.Provider value={{
      sessions,
      activeSessionId,
      messages,
      sessionsLoading,
      messagesLoading,
      openSession,
      newSession,
      deleteSession,
      sendMessage,
      reloadSessions,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside <ChatProvider>');
  return ctx;
}
