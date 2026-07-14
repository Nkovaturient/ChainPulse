const WISPR_API_BASE = 'https://platform-api.wisprflow.ai/api/v1/dash';

export function getWisprApiKey(): string | null {
  const key = process.env.WISPR_API_KEY?.trim();
  return key || null;
}

export async function generateWisprAccessToken(clientId: string, durationSecs = 3600) {
  const apiKey = getWisprApiKey();
  if (!apiKey) {
    throw new Error('WISPR_API_KEY is not configured');
  }

  const res = await fetch(`${WISPR_API_BASE}/generate_access_token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      duration_secs: durationSecs,
      metadata: { app: 'chainpulse' },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Wispr token error (${res.status}): ${detail || res.statusText}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return data;
}

export const WISPR_CLIENT_WS_URL = 'wss://platform-api.wisprflow.ai/api/v1/dash/client_ws';
