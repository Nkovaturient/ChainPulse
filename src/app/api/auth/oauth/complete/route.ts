import { NextResponse } from 'next/server';
import { Prisma, UserRole } from '@prisma/client';
import { prisma } from '@/lib/db';
import { attachSessionCookie, signToken } from '@/lib/auth';
import { clearOAuthPendingCookie, readOAuthPending } from '@/lib/oauth-pending';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES = Object.values(UserRole);

export async function POST(req: Request) {
  try {
    const pending = await readOAuthPending();
    if (!pending) {
      return Response.json(
        { error: 'Google sign-in session expired. Please try again.' },
        { status: 401 },
      );
    }

    const { username, role } = (await req.json()) as { username?: string; role?: string };

    if (!username || !role) {
      return Response.json({ error: 'Username and role are required.' }, { status: 400 });
    }
    if (username.length < 3 || username.length > 24 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return Response.json({ error: 'Username must be 3–24 alphanumeric characters.' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role as UserRole)) {
      return Response.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: pending.email } });
    if (existing) {
      const token = await signToken({
        sub: existing.id,
        email: existing.email,
        username: existing.username,
        role: existing.role,
      });
      const res = NextResponse.json({
        user: {
          id: existing.id,
          email: existing.email,
          username: existing.username,
          role: existing.role,
          premiumExpiresAt: existing.premiumExpiresAt?.toISOString() ?? null,
          eliteExpiresAt: existing.eliteExpiresAt?.toISOString() ?? null,
        },
      });
      attachSessionCookie(res, token);
      clearOAuthPendingCookie(res);
      return res;
    }

    const user = await prisma.user.create({
      data: {
        email: pending.email,
        username: username.trim(),
        hashedPassword: null,
        authProvider: 'google',
        role: role as UserRole,
      },
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        premiumExpiresAt: null,
        eliteExpiresAt: null,
      },
    });
    attachSessionCookie(res, token);
    clearOAuthPendingCookie(res);
    return res;
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const fields = e.meta?.target as string[] | undefined;
      if (fields?.includes('username')) {
        return Response.json({ error: 'Username taken.' }, { status: 409 });
      }
      if (fields?.includes('email')) {
        return Response.json({ error: 'Email already registered.' }, { status: 409 });
      }
      return Response.json({ error: 'Email or username already taken.' }, { status: 409 });
    }
    console.error('[oauth/complete]', e);
    return Response.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
