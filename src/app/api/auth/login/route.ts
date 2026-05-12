import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { attachSessionCookie, comparePassword, signToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };

    if (!email || !password) {
      return Response.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.hashedPassword);
    if (!valid) {
      return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = await signToken({
      sub: user.id, email: user.email, username: user.username, role: user.role,
    });
    const res = NextResponse.json({
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
    attachSessionCookie(res, token);
    return res;
  } catch (e) {
    console.error('[login]', e);
    return Response.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
