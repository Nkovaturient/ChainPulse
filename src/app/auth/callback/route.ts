import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { attachSessionCookie, signToken } from '@/lib/auth';
import { safePostAuthPath } from '@/lib/auth-redirect';
import { attachOAuthPendingCookie } from '@/lib/oauth-pending';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function oauthErrorRedirect(origin: string, reason: string) {
  const url = new URL('/login', origin);
  url.searchParams.set('error', 'oauth');
  url.searchParams.set('reason', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safePostAuthPath(searchParams.get('next'), '/dashboard');

  if (!code) {
    return oauthErrorRedirect(origin, 'missing_code');
  }

  if (!getSupabaseEnv()) {
    return oauthErrorRedirect(origin, 'config');
  }

  const response = NextResponse.redirect(new URL(next, origin));
  const client = await createRouteHandlerClient(response);
  if (!client) {
    return oauthErrorRedirect(origin, 'config');
  }

  const { error: exchangeError } = await client.supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession', exchangeError);
    return oauthErrorRedirect(origin, 'exchange');
  }

  const { data: { user }, error: userError } = await client.supabase.auth.getUser();
  if (userError || !user?.email) {
    console.error('[auth/callback] getUser', userError);
    return oauthErrorRedirect(origin, 'no_email');
  }

  const email = user.email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { lastLogin: new Date() },
      });

      const token = await signToken({
        sub: existing.id,
        email: existing.email,
        username: existing.username,
        role: existing.role,
      });

      attachSessionCookie(response, token);
      return response;
    }

    const signupUrl = new URL('/signup', origin);
    signupUrl.searchParams.set('oauth', '1');
    if (searchParams.get('next')) {
      signupUrl.searchParams.set('next', searchParams.get('next')!);
    }

    const signupResponse = NextResponse.redirect(signupUrl);
    client.applyPendingCookies(signupResponse);
    await attachOAuthPendingCookie(signupResponse, email);
    return signupResponse;
  } catch (e) {
    console.error('[auth/callback]', e);
    return oauthErrorRedirect(origin, 'server');
  }
}
