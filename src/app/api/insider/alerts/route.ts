import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getRecentAlerts } from '@/lib/insider/alerts';
import { isInsiderCategoryFilter } from '@/lib/insider/categories';
import { hasInsiderAccess } from '@/lib/insider/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await hasInsiderAccess(session.sub))) {
    return NextResponse.json({ error: 'Elite access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const rawCategory = searchParams.get('category') ?? 'all';
  const category = isInsiderCategoryFilter(rawCategory) ? rawCategory : 'all';

  const alerts = await getRecentAlerts(50, category);
  return NextResponse.json({ alerts, category });
}
