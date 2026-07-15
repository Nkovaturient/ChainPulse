import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { safePostAuthPath } from '@/lib/auth-redirect';

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

  const supabase = createClient(env.url, env.key);
  const { data, error } = await supabase.auth.signInWithOAuth({
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

  return NextResponse.redirect(data.url);
}
