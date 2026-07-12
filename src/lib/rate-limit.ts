import { prisma } from '@/lib/db';
import { CONSOLE_WINDOW_HOURS } from '@/lib/tier';
import type { Entitlements } from '@/lib/tier';
import { consoleMessageLimit } from '@/lib/tier';

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

type Surface = 'console' | 'explorer' | 'insider';

export async function checkAndConsumeQuota(
  userId: string,
  ent: Entitlements,
  surface: Surface,
): Promise<QuotaResult> {
  const limit = consoleMessageLimit(ent);

  // Elite = unlimited
  if (limit === null) {
    await prisma.messageUsage.create({ data: { userId, surface } });
    return { allowed: true, used: 0, limit: null, remaining: null, resetAt: null };
  }

  const windowStart = new Date(Date.now() - CONSOLE_WINDOW_HOURS * 3600_000);

  const rows = await prisma.messageUsage.findMany({
    where: { userId, createdAt: { gte: windowStart } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  const used = rows.length;

  if (used >= limit) {
    // resetAt = oldest in-window message + 24h
    const oldest = rows[0]?.createdAt;
    const resetAt = oldest
      ? new Date(oldest.getTime() + CONSOLE_WINDOW_HOURS * 3600_000).toISOString()
      : null;
    return { allowed: false, used, limit, remaining: 0, resetAt };
  }

  await prisma.messageUsage.create({ data: { userId, surface } });
  return {
    allowed: true,
    used: used + 1,
    limit,
    remaining: limit - used - 1,
    resetAt: null,
  };
}
