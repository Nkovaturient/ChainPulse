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

export type FeedbackValue = 'up' | 'down' | null;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  data?: QueryResponse | null;
  createdAt: Date;
  pending?: boolean;
  feedback?: FeedbackValue;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotaState {
  blocked: boolean;
  resetAt: string | null;
  limit: number | null;
}

interface ChatContextValue {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  sessionsLoading: boolean;
  messagesLoading: boolean;
  quota: QuotaState;
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
  /** Set thumbs feedback on a stored assistant message */
  setFeedback: (messageId: string, value: FeedbackValue) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Start `true`: we always fetch on mount. Keeping the SSR & first client
  // render in the same "loading" branch prevents a hydration mismatch in
  // <Sidebar> (loading spinner vs "No chats yet").
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [quota, setQuota] = useState<QuotaState>({ blocked: false, resetAt: null, limit: null });
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
        messages: { id: string; role: string; text: string; dataJson: QueryResponse | null; feedback: FeedbackValue; createdAt: string }[]
      };
      setMessages(data.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        text: m.text,
        data: m.dataJson,
        feedback: m.feedback ?? null,
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
      if (res.status === 429) {
        const e = (await res.json().catch(() => ({}))) as { error?: string; resetAt?: string; limit?: number };
        setQuota({ blocked: true, resetAt: e.resetAt ?? null, limit: e.limit ?? null });
        setMessages((prev) =>
          prev
            .filter((m) => m.id !== `${optimisticId}-pending`)
            .concat({
              id: `${optimisticId}-err`,
              role: 'assistant' as const,
              text: e.error ?? "You've reached your message limit. Upgrade to continue.",
              createdAt: new Date(),
            }),
        );
        return null;
      }
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || 'Request failed');
      }
      const data = (await res.json()) as QueryResponse & { sessionId?: string; assistantMessageId?: string };

      // Replace pending bubble with real response — use the server-issued ID
      // so the feedback endpoint can find it.
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== `${optimisticId}-pending`)
          .concat({
            id: data.assistantMessageId ?? `${optimisticId}-res`,
            role: 'assistant' as const,
            text: data.summary ?? '',
            data,
            feedback: null,
            createdAt: new Date(),
          }),
      );

      // If a new sessionId was minted server-side, sync it
      if (data.sessionId && data.sessionId !== sid) {
        setActiveSessionId(data.sessionId);
      }

      // Clear any previous quota block on success
      setQuota({ blocked: false, resetAt: null, limit: null });

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

  const setFeedback = useCallback(async (messageId: string, value: FeedbackValue) => {
    // Optimistic update — assume the server accepts. Revert on failure.
    const prevValue = messages.find((m) => m.id === messageId)?.feedback ?? null;
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: value } : m)),
    );
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error('Feedback failed');
    } catch {
      // Revert
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: prevValue } : m)),
      );
    }
  }, [messages]);

  return (
    <ChatContext.Provider value={{
      sessions,
      activeSessionId,
      messages,
      sessionsLoading,
      messagesLoading,
      quota,
      openSession,
      newSession,
      deleteSession,
      sendMessage,
      reloadSessions,
      setFeedback,
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
