import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { setFeedback, type FeedbackValue } from '@/lib/chat-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { value } = (await req.json().catch(() => ({}))) as { value?: FeedbackValue };
  if (value !== 'up' && value !== 'down' && value !== null) {
    return NextResponse.json({ error: 'value must be "up" | "down" | null' }, { status: 400 });
  }

  const ok = await setFeedback(id, user.sub, value);
  if (!ok) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
