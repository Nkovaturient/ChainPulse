import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createSession, listSessions } from '@/lib/chat-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sessions = await listSessions(user.sub);
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const session = await createSession(user.sub, body.title);
  return NextResponse.json({ session }, { status: 201 });
}
