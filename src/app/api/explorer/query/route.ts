import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isEvmAddress } from '@/lib/explorer/address';
import { buildWalletReport } from '@/lib/explorer/wallet';
import { runExplorerAgent, chainKeysFromQuery } from '@/lib/explorer/agent';
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

  try {
    // 1. Pull a fresh snapshot (cached 30s server-side via fetch revalidate)
    //    If the query mentions a specific chain, only fetch that one for speed.
    const chains = chainKeysFromQuery(query);
    const snapshot = await buildWalletReport(address, chains ? { chains } : {});

    // 2. Run the explorer agent with snapshot in system prompt + tools available
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
