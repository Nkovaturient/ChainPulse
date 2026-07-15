import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from '@/lib/supabase/env';

export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll from Server Component — ignored; Route Handlers set cookies on NextResponse
        }
      },
    },
  });
}
