import { prisma } from '@/lib/db';
import { ALL_SCANNERS } from '@/lib/insider/scanners';
import type { InsiderCategoryFilter } from '@/lib/insider/categories';
import type { InsiderCategory } from '@/types';
import type { InsiderAlert, Prisma } from '@prisma/client';

export async function scanAndStoreAlerts(): Promise<{ inserted: number; skipped: number }> {
  const results = await Promise.allSettled(ALL_SCANNERS.map((scanner) => scanner()));
  const drafts = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  let inserted = 0;
  let skipped = 0;

  for (const draft of drafts) {
    if (!draft.txHash) {
      skipped++;
      continue;
    }

    const existing = await prisma.insiderAlert.findUnique({ where: { txHash: draft.txHash } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.insiderAlert.create({
      data: {
        chain: draft.chain,
        kind: draft.kind,
        category: draft.category,
        address: draft.address,
        txHash: draft.txHash,
        amountUsd: draft.amountUsd,
        summary: draft.summary,
        sourceUrl: draft.sourceUrl,
        detectedAt: draft.detectedAt,
        metadata: draft.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    inserted++;
  }

  return { inserted, skipped };
}

export async function getRecentAlerts(
  limit = 50,
  category?: InsiderCategoryFilter,
): Promise<InsiderAlert[]> {
  const where =
    category && category !== 'all'
      ? { category: category as InsiderCategory }
      : undefined;

  return prisma.insiderAlert.findMany({
    where,
    orderBy: { detectedAt: 'desc' },
    take: limit,
  });
}
