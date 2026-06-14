import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { removeTrackedWallet, updateTrackedWalletLabel } from '@/lib/tracked-wallets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: { label?: string };
  try {
    body = (await req.json()) as { label?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (typeof body.label !== 'string') {
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }

  const result = await updateTrackedWalletLabel(session.sub, id, body.label);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const result = await removeTrackedWallet(session.sub, id);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
