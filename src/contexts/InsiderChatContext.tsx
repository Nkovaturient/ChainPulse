'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  mapMessagesFromApi,
  mapSessionDates,
  postFeedback,
  type ApiChatMessage,
  type ApiChatSession,
} from '@/lib/chat-client';
import type { FeedbackValue } from '@/lib/chat-storage';

export interface InsiderChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: Date;
  pending?: boolean;
  feedback?: FeedbackValue;
}

export interface InsiderChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsiderChatContextValue {
  sessions: InsiderChatSession[];
  activeSessionId: string | null;
  messages: InsiderChatMessage[];
  sessionsLoading: boolean;
  messagesLoading: boolean;
  busy: boolean;
  openSession: (id: string) => Promise<void>;
  newSession: () => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (query: string) => Promise<void>;
  reloadSessions: () => Promise<void>;
  setFeedback: (messageId: string, value: FeedbackValue) => Promise<void>;
}

const InsiderChatContext = createContext<InsiderChatContextValue | null>(null);

export function InsiderChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<InsiderChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<InsiderChatMessage[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingId = useRef(0);

  const reloadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/insider/sessions');
      if (!res.ok) return;
      const { sessions: data } = (await res.json()) as { sessions: ApiChatSession[] };
      setSessions(mapSessionDates(data));
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadSessions();
  }, [reloadSessions]);

  const openSession = useCallback(async (id: string) => {
    setActiveSessionId(id);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/insider/sessions/${id}`);
      if (!res.ok) return;
      const { messages: data } = (await res.json()) as { messages: ApiChatMessage[] };
      setMessages(mapMessagesFromApi(data));
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const newSession = useCallback(async (): Promise<string> => {
    const res = await fetch('/api/insider/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const { session } = (await res.json()) as { session: ApiChatSession };
    const s: InsiderChatSession = {
      id: session.id,
      title: session.title,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
    setMessages([]);
    return s.id;
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await fetch(`/api/insider/sessions/${id}`, { method: 'DELETE' });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [activeSessionId]);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || busy) return;

    let sid = activeSessionId;
    if (!sid) {
      sid = await newSession();
    }

    const optimisticId = `opt-${++pendingId.current}`;
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: 'user', text: query, createdAt: new Date() },
      { id: `${optimisticId}-pending`, role: 'assistant', text: '…', createdAt: new Date(), pending: true },
    ]);
    setBusy(true);

    try {
      const res = await fetch('/api/insider/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, language: 'en', sessionId: sid }),
      });
      const data = (await res.json()) as {
        summary?: string;
        error?: string;
        sessionId?: string;
        assistantMessageId?: string;
      };

      if (!res.ok) {
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== `${optimisticId}-pending`)
            .concat({
              id: `${optimisticId}-err`,
              role: 'assistant',
              text: data.error ?? 'Request failed.',
              createdAt: new Date(),
            }),
        );
        return;
      }

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== `${optimisticId}-pending`)
          .concat({
            id: data.assistantMessageId ?? `${optimisticId}-res`,
            role: 'assistant',
            text: data.summary ?? '(no response)',
            feedback: null,
            createdAt: new Date(),
          }),
      );

      if (data.sessionId && data.sessionId !== sid) {
        setActiveSessionId(data.sessionId);
      }

      void reloadSessions();
    } catch {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== `${optimisticId}-pending`)
          .concat({
            id: `${optimisticId}-err`,
            role: 'assistant',
            text: 'Network error.',
            createdAt: new Date(),
          }),
      );
    } finally {
      setBusy(false);
    }
  }, [activeSessionId, busy, newSession, reloadSessions]);

  const setFeedback = useCallback(async (messageId: string, value: FeedbackValue) => {
    const prevValue = messages.find((m) => m.id === messageId)?.feedback ?? null;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: value } : m)),
    );
    const ok = await postFeedback(messageId, value);
    if (!ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: prevValue } : m)),
      );
    }
  }, [messages]);

  return (
    <InsiderChatContext.Provider
      value={{
        sessions,
        activeSessionId,
        messages,
        sessionsLoading,
        messagesLoading,
        busy,
        openSession,
        newSession,
        deleteSession,
        sendMessage,
        reloadSessions,
        setFeedback,
      }}
    >
      {children}
    </InsiderChatContext.Provider>
  );
}

export function useInsiderChat() {
  const ctx = useContext(InsiderChatContext);
  if (!ctx) throw new Error('useInsiderChat must be used inside <InsiderChatProvider>');
  return ctx;
}
