import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import {
  deleteSession,
  getMessages,
  renameSession,
  verifySessionOwnership,
} from '@/lib/chat-storage';
import { hasInsiderAccess } from '@/lib/insider/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

async function guardInsiderSession(userId: string, sessionId: string) {
  if (!(await hasInsiderAccess(userId))) return false;
  return verifySessionOwnership(sessionId, userId, 'insider');
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await guardInsiderSession(user.sub, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const messages = await getMessages(id, user.sub);
  return NextResponse.json({ messages });
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await guardInsiderSession(user.sub, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title required' }, { status: 400 });
  }
  await renameSession(id, user.sub, body.title.trim());
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await ctx.params;
  if (!(await guardInsiderSession(user.sub, id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await deleteSession(id, user.sub);
  return NextResponse.json({ ok: true });
}
