import { SignJWT, jwtVerify } from 'jose';
import type { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const OAUTH_PENDING_COOKIE = 'cp_oauth_pending';
const TTL_SECONDS = 60 * 10;

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(s);
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: TTL_SECONDS,
};

export async function signOAuthPending(email: string): Promise<string> {
  return new SignJWT({ email: email.toLowerCase().trim() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifyOAuthPending(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    const email = payload.email;
    if (typeof email !== 'string' || !email) return null;
    return { email };
  } catch {
    return null;
  }
}

export function attachOAuthPendingCookie(res: NextResponse, email: string) {
  return signOAuthPending(email).then((token) => {
    res.cookies.set(OAUTH_PENDING_COOKIE, token, cookieOptions);
    return res;
  });
}

export function clearOAuthPendingCookie(res: NextResponse) {
  res.cookies.set(OAUTH_PENDING_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

export async function readOAuthPending(): Promise<{ email: string } | null> {
  const jar = await cookies();
  const token = jar.get(OAUTH_PENDING_COOKIE)?.value;
  if (!token) return null;
  return verifyOAuthPending(token);
}
