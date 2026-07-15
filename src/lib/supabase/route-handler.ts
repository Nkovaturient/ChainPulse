import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase SSR client for Route Handlers. When `response` is passed, auth cookies
 * (including PKCE verifier) are written onto that NextResponse — required for OAuth.
 */
export async function createRouteHandlerClient(response?: NextResponse) {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  const pending: CookieToSet[] = [];

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach((c) => {
          cookieStore.set(c.name, c.value, c.options);
          pending.push(c);
          if (response) {
            response.cookies.set(c.name, c.value, c.options);
          }
        });
      },
    },
  });

  function applyPendingCookies(target: NextResponse) {
    pending.forEach(({ name, value, options }) => {
      target.cookies.set(name, value, options);
    });
  }

  return { supabase, applyPendingCookies };
}
