import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getRecentAlerts } from '@/lib/insider/alerts';
import { hasInsiderAccess } from '@/lib/insider/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await hasInsiderAccess(session.sub))) {
    return NextResponse.json({ error: 'Elite access required.' }, { status: 403 });
  }

  const alerts = await getRecentAlerts(50);
  return NextResponse.json({ alerts });
}
