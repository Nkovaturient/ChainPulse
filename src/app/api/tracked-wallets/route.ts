import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addTrackedWallet, listTrackedWallets } from '@/lib/tracked-wallets';
import { trackLimitFor } from '@/lib/tier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { tier: true },
  });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wallets = await listTrackedWallets(session.sub);
  return NextResponse.json({
    wallets,
    tier: user.tier,
    limit: trackLimitFor(user.tier),
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { tier: true },
  });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { address?: string; label?: string };
  if (!body.address?.trim()) {
    return NextResponse.json({ error: 'Address required.' }, { status: 400 });
  }

  const result = await addTrackedWallet(session.sub, user.tier, body.address, body.label);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const count = await prisma.trackedWallet.count({ where: { userId: session.sub } });
  return NextResponse.json(
    {
      wallet: result.wallet,
      tier: user.tier,
      limit: trackLimitFor(user.tier),
      count,
    },
    { status: 201 },
  );
}
