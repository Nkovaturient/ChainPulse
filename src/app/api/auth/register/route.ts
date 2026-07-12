import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { attachSessionCookie, hashPassword, signToken } from '@/lib/auth';
import { Prisma, UserRole } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES = Object.values(UserRole);

export async function POST(req: Request) {
  try {
    const { email, username, password, role } = (await req.json()) as {
      email?: string; username?: string; password?: string; role?: string;
    };

    if (!email || !username || !password || !role) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (username.length < 3 || username.length > 24 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return Response.json({ error: 'Username must be 3–24 alphanumeric characters.' }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(role as UserRole)) {
      return Response.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username.trim(),
        hashedPassword: hashed,
        role: role as UserRole,
      },
    });

    const token = await signToken({
      sub: user.id, email: user.email, username: user.username, role: user.role,
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
    return res;
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const fields = e.meta?.target as string[] | undefined;
      if (fields?.includes('email')) {
        return Response.json({ error: 'Email already registered.' }, { status: 409 });
      }
      if (fields?.includes('username')) {
        return Response.json({ error: 'Username taken.' }, { status: 409 });
      }
      return Response.json({ error: 'Email or username already taken.' }, { status: 409 });
    }
    console.error('[register]', e);
    return Response.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
