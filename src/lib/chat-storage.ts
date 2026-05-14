import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { QueryResponse } from '@/types';

export interface StoredMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  text: string;
  dataJson: QueryResponse | null;
  createdAt: Date;
}

export interface StoredSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: StoredMessage[];
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function listSessions(userId: string): Promise<StoredSession[]> {
  const rows = await prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  return rows as StoredSession[];
}

export async function createSession(userId: string, title = 'New chat'): Promise<StoredSession> {
  const session = await prisma.chatSession.create({
    data: { userId, title },
  });
  return session as StoredSession;
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

// ── Messages ──────────────────────────────────────────────────────────────────

export async function getMessages(sessionId: string, userId: string): Promise<StoredMessage[]> {
  // Verify ownership first
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
    // Bump session updatedAt
    prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    }),
  ]);
  return { ...msg, role: msg.role as 'user' | 'assistant', dataJson: msg.dataJson as QueryResponse | null };
}

/** Auto-generate a title from the first user message (≤ 40 chars). */
export async function autoTitleSession(sessionId: string, firstUserText: string): Promise<void> {
  const title = firstUserText.length > 40 ? firstUserText.slice(0, 38) + '…' : firstUserText;
  await prisma.chatSession.update({ where: { id: sessionId }, data: { title } });
}

/** Return last N messages (text only) for context injection into the AI. */
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
