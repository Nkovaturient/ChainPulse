import { getSessionUser } from '@/lib/auth';
import { generateWisprAccessToken, getWisprApiKey } from '@/lib/wispr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  if (!getWisprApiKey()) {
    return Response.json({ error: 'Voice dictation is not configured' }, { status: 503 });
  }

  const user = await getSessionUser();
  const clientId = user ? `cp-user-${user.sub}` : 'cp-guest';

  try {
    const token = await generateWisprAccessToken(clientId, 3600);
    return Response.json({ access_token: token.access_token, expires_in: token.expires_in });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create Wispr token';
    return Response.json({ error: message }, { status: 502 });
  }
}
