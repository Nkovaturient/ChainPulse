import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { addMessage } from '@/lib/chat-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id: sessionId } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { role, text, dataJson } = (await req.json()) as {
    role: 'user' | 'assistant';
    text: string;
    dataJson?: unknown;
  };
  if (!role || !text) return NextResponse.json({ error: 'role and text required' }, { status: 400 });
  const msg = await addMessage(sessionId, role, text, dataJson as never);
  return NextResponse.json({ message: msg }, { status: 201 });
}
