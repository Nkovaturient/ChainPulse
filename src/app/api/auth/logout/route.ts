import { NextResponse } from 'next/server';
import { detachSessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  detachSessionCookie(res);
  return res;
}
