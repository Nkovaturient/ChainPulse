import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createSession, listSessions } from '@/lib/chat-storage';
import { hasInsiderAccess } from '@/lib/insider/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await hasInsiderAccess(user.sub))) {
    return NextResponse.json({ error: 'Elite access required.' }, { status: 403 });
  }
  const sessions = await listSessions(user.sub, 'insider');
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await hasInsiderAccess(user.sub))) {
    return NextResponse.json({ error: 'Elite access required.' }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const session = await createSession(user.sub, body.title ?? 'New chat', 'insider');
  return NextResponse.json({ session }, { status: 201 });
}
