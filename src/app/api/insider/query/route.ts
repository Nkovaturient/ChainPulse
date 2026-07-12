import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { computeEntitlements } from '@/lib/tier';
import { checkAndConsumeQuota } from '@/lib/rate-limit';
import { runInsiderAgentLoop } from '@/lib/insider/agent';
import { hasInsiderAccess } from '@/lib/insider/access';
import type { Language } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await hasInsiderAccess(session.sub))) {
    return NextResponse.json({ error: 'Elite access required.' }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { premiumExpiresAt: true, eliteExpiresAt: true },
  });
  const ent = computeEntitlements({
    premiumExpiresAt: dbUser?.premiumExpiresAt?.toISOString() ?? null,
    eliteExpiresAt: dbUser?.eliteExpiresAt?.toISOString() ?? null,
  });

  const effectiveEnt = { ...ent, eliteActive: true };
  const quota = await checkAndConsumeQuota(session.sub, effectiveEnt, 'insider');
  if (!quota.allowed) {
    return NextResponse.json({ error: 'Message limit reached.', resetAt: quota.resetAt }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    query?: string;
    language?: Language;
    history?: Array<{ role: 'user' | 'assistant'; text: string }>;
  };
  const { query, language = 'en', history = [] } = body;
  if (!query || typeof query !== 'string' || query.length > 500) {
    return NextResponse.json({ error: 'Invalid query.' }, { status: 400 });
  }

  const result = await runInsiderAgentLoop(query, language, history);
  return NextResponse.json({ summary: result.summary, data: result.data, errors: result.errors });
}
