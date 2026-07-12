import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return Response.json({ user: null }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
    });
    if (!user) return Response.json({ user: null }, { status: 401 });
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        premiumExpiresAt: user.premiumExpiresAt?.toISOString() ?? null,
        eliteExpiresAt: user.eliteExpiresAt?.toISOString() ?? null,
        created_at: user.createdAt.toISOString(),
        last_login: user.lastLogin?.toISOString() ?? null,
      },
    });
  } catch {
    return Response.json({ user: null }, { status: 500 });
  }
}
