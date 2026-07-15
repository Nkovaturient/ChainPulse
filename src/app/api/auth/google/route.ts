import { NextResponse } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { safePostAuthPath } from '@/lib/auth-redirect';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const env = getSupabaseEnv();
  if (!env) {
    console.error('[auth/google] SUPABASE_URL or SUPABASE_ANON_KEY not set');
    return NextResponse.json({ error: 'Google sign-in is not configured on this server.' }, { status: 500 });
  }

  const { searchParams, origin } = new URL(req.url);
  const next = safePostAuthPath(searchParams.get('next'), '/dashboard');
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const client = await createRouteHandlerClient();
  if (!client) {
    return NextResponse.json({ error: 'Google sign-in is not configured on this server.' }, { status: 500 });
  }

  const { data, error } = await client.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error || !data.url) {
    console.error('[auth/google] signInWithOAuth', error);
    return NextResponse.json(
      { error: error?.message ?? 'Could not start Google sign-in.' },
      { status: 500 },
    );
  }

  const response = NextResponse.redirect(data.url);
  client.applyPendingCookies(response);
  return response;
}
