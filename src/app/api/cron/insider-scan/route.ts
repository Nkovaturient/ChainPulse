import { NextResponse } from 'next/server';
import { scanAndStoreAlerts } from '@/lib/insider/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = new URL(req.url).searchParams.get('secret') ?? req.headers.get('x-cron-secret');

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await scanAndStoreAlerts();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[cron/insider-scan]', e);
    return NextResponse.json({ error: 'Scan failed.' }, { status: 500 });
  }
}
