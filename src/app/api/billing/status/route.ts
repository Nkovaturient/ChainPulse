import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeEntitlements, consoleMessageLimit, CONSOLE_WINDOW_HOURS } from '@/lib/tier';

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

  const windowStart = new Date(Date.now() - CONSOLE_WINDOW_HOURS * 3600_000);
  const used = await prisma.messageUsage.count({
    where: { userId: session.sub, createdAt: { gte: windowStart } },
  });

  const limit = consoleMessageLimit(ent);

  return NextResponse.json({
    premiumActive: ent.premiumActive,
    premiumExpiresAt: ent.premiumExpiresAt?.toISOString() ?? null,
    eliteActive: ent.eliteActive,
    eliteExpiresAt: ent.eliteExpiresAt?.toISOString() ?? null,
    quota: {
      used,
      limit,
      unlimited: limit === null,
      remaining: limit === null ? null : Math.max(0, limit - used),
    },
  });
}
