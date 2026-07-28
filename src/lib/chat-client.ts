import type { FeedbackValue } from '@/lib/chat-storage';
import type { InsiderEvidence } from '@/types';

export interface ApiChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiChatMessage {
  id: string;
  role: string;
  text: string;
  dataJson?: InsiderEvidence | null;
  feedback?: FeedbackValue;
  createdAt: string;
}

export function mapSessionDates(
  sessions: ApiChatSession[],
): { id: string; title: string; createdAt: Date; updatedAt: Date }[] {
  return sessions.map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
  }));
}

export function mapMessagesFromApi(
  data: ApiChatMessage[],
): {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  evidence?: InsiderEvidence | null;
  feedback: FeedbackValue;
  createdAt: Date;
}[] {
  return data.map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    text: m.text,
    evidence: (m.dataJson as InsiderEvidence | null) ?? null,
    feedback: m.feedback ?? null,
    createdAt: new Date(m.createdAt),
  }));
}

export async function postFeedback(messageId: string, value: FeedbackValue): Promise<boolean> {
  const res = await fetch(`/api/chat/messages/${messageId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  });
  return res.ok;
}
