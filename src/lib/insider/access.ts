import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';
import { computeEntitlements } from '@/lib/tier';

const ADMIN_SENTINEL = '__CP_ADMIN_INSIDER__';

export function isAdminInviteCode(raw: string): boolean {
  const expected = process.env.INSIDER_ADMIN_INVITE_CODE?.trim();
  if (!expected) return false;
  const submitted = raw.trim().toUpperCase();
  const target = expected.toUpperCase();
  if (submitted.length !== target.length) return false;
  return timingSafeEqual(Buffer.from(submitted), Buffer.from(target));
}

export async function grantAdminInsiderAccess(userId: string): Promise<void> {
  const inviteCode = await prisma.inviteCode.upsert({
    where: { code: ADMIN_SENTINEL },
    create: {
      code: ADMIN_SENTINEL,
      maxRedemptions: 9999,
      usedCount: 0,
      active: true,
      note: 'Env-gated admin/dev Insider access',
    },
    update: { active: true },
  });

  const existing = await prisma.inviteRedemption.findUnique({
    where: { codeId_userId: { codeId: inviteCode.id, userId } },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.inviteRedemption.create({
      data: { codeId: inviteCode.id, userId },
    }),
    prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usedCount: { increment: 1 } },
    }),
  ]);
}

export async function hasInsiderAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { eliteExpiresAt: true },
  });
  const ent = computeEntitlements({
    premiumExpiresAt: null,
    eliteExpiresAt: user?.eliteExpiresAt?.toISOString() ?? null,
  });
  if (ent.eliteActive) return true;

  const redemption = await prisma.inviteRedemption.findFirst({ where: { userId } });
  return redemption !== null;
}
