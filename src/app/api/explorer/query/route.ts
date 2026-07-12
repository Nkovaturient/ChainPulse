import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isEvmAddress } from '@/lib/explorer/address';
import { buildWalletReport } from '@/lib/explorer/wallet';
import { runExplorerAgent, chainKeysFromQuery } from '@/lib/explorer/agent';
import { computeEntitlements } from '@/lib/tier';
import { checkAndConsumeQuota } from '@/lib/rate-limit';
import type { Language } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
  address?: string;
  query?: string;
  language?: Language;
  history?: Array<{ role: 'user' | 'assistant'; text: string }>;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { address, query, language = 'en', history = [] } = body;
  if (!address || !isEvmAddress(address)) {
    return NextResponse.json({ error: 'Valid EVM address required.' }, { status: 400 });
  }
  if (!query || typeof query !== 'string' || query.length > 500) {
    return NextResponse.json({ error: 'Invalid query.' }, { status: 400 });
  }

  // ── Rate-limit check ──────────────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { premiumExpiresAt: true, eliteExpiresAt: true },
  });
  const ent = computeEntitlements({
    premiumExpiresAt: dbUser?.premiumExpiresAt?.toISOString() ?? null,
    eliteExpiresAt: dbUser?.eliteExpiresAt?.toISOString() ?? null,
  });
  const quota = await checkAndConsumeQuota(user.sub, ent, 'explorer');
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'Message limit reached. Upgrade to send more.', resetAt: quota.resetAt, limit: quota.limit },
      { status: 429 },
    );
  }

  try {
    const chains = chainKeysFromQuery(query);
    const snapshot = await buildWalletReport(address, chains ? { chains } : {});
    const result = await runExplorerAgent(address, query, snapshot, history, language);

    return NextResponse.json({
      summary: result.summary,
      snapshot,
      errors: { ...snapshot.errors, ...result.errors },
      iterations: result.iterations,
    });
  } catch (e) {
    console.error('[explorer/query]', e);
    return NextResponse.json({ error: 'Explorer query failed.' }, { status: 500 });
  }
}
