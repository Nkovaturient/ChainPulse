import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { addTrackedWallet, listTrackedWallets } from '@/lib/tracked-wallets';
import { computeEntitlements, walletTrackLimit } from '@/lib/tier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { premiumExpiresAt: true, eliteExpiresAt: true },
  });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ent = computeEntitlements({
    premiumExpiresAt: user.premiumExpiresAt?.toISOString() ?? null,
    eliteExpiresAt: user.eliteExpiresAt?.toISOString() ?? null,
  });

  const wallets = await listTrackedWallets(session.sub);
  return NextResponse.json({
    wallets,
    limit: walletTrackLimit(ent),
    premiumActive: ent.premiumActive,
  });
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { premiumExpiresAt: true, eliteExpiresAt: true },
  });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ent = computeEntitlements({
    premiumExpiresAt: user.premiumExpiresAt?.toISOString() ?? null,
    eliteExpiresAt: user.eliteExpiresAt?.toISOString() ?? null,
  });

  const body = (await req.json().catch(() => ({}))) as { address?: string; label?: string };
  if (!body.address?.trim()) {
    return NextResponse.json({ error: 'Address required.' }, { status: 400 });
  }

  const result = await addTrackedWallet(session.sub, ent, body.address, body.label);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const count = await prisma.trackedWallet.count({ where: { userId: session.sub } });
  return NextResponse.json(
    {
      wallet: result.wallet,
      limit: walletTrackLimit(ent),
      count,
    },
    { status: 201 },
  );
}
