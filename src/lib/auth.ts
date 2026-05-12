import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

export const SESSION_COOKIE = 'cp_session';
const EXPIRES_IN = 60 * 60 * 24 * 7; // 7 days in seconds

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(s);
}

export interface JWTPayload {
  sub: string;       // user id
  email: string;
  username: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: EXPIRES_IN,
};

/** Prefer attaching to NextResponse in Route Handlers so Set-Cookie is always on the response. */
export function attachSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
}

export function detachSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 });
}

export async function getSessionUser(): Promise<JWTPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
