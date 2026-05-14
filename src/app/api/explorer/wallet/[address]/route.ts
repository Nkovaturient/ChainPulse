import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isEvmAddress, detectAddressKind } from '@/lib/explorer/address';
import { buildWalletReport } from '@/lib/explorer/wallet';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ address: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { address } = await params;

  const kind = detectAddressKind(address);
  if (kind === 'unknown') {
    return NextResponse.json({ error: 'Could not detect a valid address format.' }, { status: 400 });
  }
  if (kind !== 'evm') {
    return NextResponse.json({
      error: `${kind.toUpperCase()} addresses aren't supported yet — coming soon.`,
      kind,
    }, { status: 400 });
  }
  if (!isEvmAddress(address)) {
    return NextResponse.json({ error: 'Invalid EVM address.' }, { status: 400 });
  }

  try {
    const report = await buildWalletReport(address);
    return NextResponse.json(report);
  } catch (e) {
    console.error('[explorer/wallet]', e);
    return NextResponse.json({ error: 'Failed to build wallet report.' }, { status: 500 });
  }
}
