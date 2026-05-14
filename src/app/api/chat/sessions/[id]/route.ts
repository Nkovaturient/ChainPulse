import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { deleteSession, getMessages, renameSession } from '@/lib/chat-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const messages = await getMessages(id, user.sub);
  return NextResponse.json({ messages });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title } = (await req.json().catch(() => ({}))) as { title?: string };
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  await renameSession(id, user.sub, title);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteSession(id, user.sub);
  return NextResponse.json({ ok: true });
}
