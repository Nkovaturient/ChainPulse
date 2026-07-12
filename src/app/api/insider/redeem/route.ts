import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { grantAdminInsiderAccess, isAdminInviteCode } from '@/lib/insider/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = body.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'Invite code required.' }, { status: 400 });

  if (isAdminInviteCode(code)) {
    await grantAdminInsiderAccess(session.sub);
    return NextResponse.json({ ok: true, message: 'Admin access granted. Welcome to Insider Bot.' });
  }

  const inviteCode = await prisma.inviteCode.findUnique({ where: { code } });
  if (!inviteCode || !inviteCode.active) {
    return NextResponse.json({ error: 'Invalid or inactive invite code.' }, { status: 400 });
  }
  if (inviteCode.usedCount >= inviteCode.maxRedemptions) {
    return NextResponse.json({ error: 'This invite code has reached its redemption limit.' }, { status: 400 });
  }

  const existing = await prisma.inviteRedemption.findUnique({
    where: { codeId_userId: { codeId: inviteCode.id, userId: session.sub } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, message: 'Already redeemed — you have Insider access.' });
  }

  await prisma.$transaction([
    prisma.inviteRedemption.create({
      data: { codeId: inviteCode.id, userId: session.sub },
    }),
    prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { usedCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true, message: 'Invite code redeemed. Welcome to Insider Bot.' });
}
