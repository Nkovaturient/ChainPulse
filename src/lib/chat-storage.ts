import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { ChatSurface } from '@/lib/agent-config';
import type { QueryResponse } from '@/types';

export type FeedbackValue = 'up' | 'down' | null;

export interface StoredMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  dataJson: QueryResponse | null;
  feedback: FeedbackValue | null;
  createdAt: Date;
}

export interface StoredSession {
  id: string;
  userId: string;
  title: string;
  surface: ChatSurface;
  summary: string | null;
  summaryUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: StoredMessage[];
}

function mapSession(row: {
  id: string;
  userId: string;
  title: string;
  surface: string;
  summary: string | null;
  summaryUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): StoredSession {
  return {
    ...row,
    surface: row.surface as ChatSurface,
  };
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function listSessions(
  userId: string,
  surface: ChatSurface = 'console',
): Promise<StoredSession[]> {
  const rows = await prisma.chatSession.findMany({
    where: { userId, surface },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  return rows.map(mapSession);
}

export async function createSession(
  userId: string,
  title = 'New chat',
  surface: ChatSurface = 'console',
): Promise<StoredSession> {
  const session = await prisma.chatSession.create({
    data: { userId, title, surface },
  });
  return mapSession(session);
}

export async function verifySessionOwnership(
  sessionId: string,
  userId: string,
  surface?: ChatSurface,
): Promise<boolean> {
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId, ...(surface ? { surface } : {}) },
    select: { id: true },
  });
  return session !== null;
}

export async function renameSession(id: string, userId: string, title: string): Promise<void> {
  await prisma.chatSession.updateMany({
    where: { id, userId },
    data: { title },
  });
}

export async function deleteSession(id: string, userId: string): Promise<void> {
  await prisma.chatSession.deleteMany({ where: { id, userId } });
}

export async function getSessionSummary(sessionId: string): Promise<string | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { summary: true },
  });
  return session?.summary ?? null;
}

export async function setSessionSummary(sessionId: string, summary: string): Promise<void> {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { summary, summaryUpdatedAt: new Date() },
  });
}

export async function countSessionMessages(sessionId: string): Promise<number> {
  return prisma.chatMessage.count({ where: { sessionId } });
}

export async function getMessagesForSummary(
  sessionId: string,
  excludeLastN: number,
  maxMessages: number,
): Promise<StoredMessage[]> {
  const all = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      sessionId: true,
      role: true,
      text: true,
      dataJson: true,
      feedback: true,
      createdAt: true,
    },
  });
  const older = all.slice(0, Math.max(0, all.length - excludeLastN));
  const capped = older.slice(-maxMessages);
  return capped.map((r) => ({
    ...r,
    role: r.role as 'user' | 'assistant',
    dataJson: r.dataJson as QueryResponse | null,
    feedback: (r.feedback as FeedbackValue) ?? null,
  }));
}

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getMessages(sessionId: string, userId: string): Promise<StoredMessage[]> {
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) return [];

  const rows = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((r) => ({
    ...r,
    role: r.role as 'user' | 'assistant',
    dataJson: r.dataJson as QueryResponse | null,
    feedback: (r.feedback as FeedbackValue) ?? null,
  }));
}

export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  text: string,
  dataJson?: QueryResponse | null,
): Promise<StoredMessage> {
  const safeJson = dataJson ? (dataJson as unknown as Prisma.InputJsonValue) : undefined;
  const [msg] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { sessionId, role, text, dataJson: safeJson },
    }),
    prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return {
    ...msg,
    role: msg.role as 'user' | 'assistant',
    dataJson: msg.dataJson as QueryResponse | null,
    feedback: (msg.feedback as FeedbackValue) ?? null,
  };
}

export async function setFeedback(
  messageId: string,
  userId: string,
  value: FeedbackValue,
): Promise<boolean> {
  const msg = await prisma.chatMessage.findFirst({
    where: { id: messageId, session: { userId } },
    select: { id: true },
  });
  if (!msg) return false;

  await prisma.chatMessage.update({
    where: { id: messageId },
    data: { feedback: value },
  });
  return true;
}

export async function autoTitleSession(sessionId: string, firstUserText: string): Promise<void> {
  const title = firstUserText.length > 40 ? firstUserText.slice(0, 38) + '…' : firstUserText;
  await prisma.chatSession.update({ where: { id: sessionId }, data: { title } });
}

export async function getRecentContext(
  sessionId: string,
  limit = 4,
): Promise<{ role: 'user' | 'assistant'; text: string }[]> {
  const rows = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { role: true, text: true },
  });
  return rows.reverse().map((r) => ({ role: r.role as 'user' | 'assistant', text: r.text }));
}
