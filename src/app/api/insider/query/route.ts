import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  addMessage,
  autoTitleSession,
  createSession,
  getRecentContext,
  getSessionSummary,
  verifySessionOwnership,
} from '@/lib/chat-storage';
import { computeEntitlements } from '@/lib/tier';
import { checkAndConsumeQuota } from '@/lib/rate-limit';
import { getRecentAlerts } from '@/lib/insider/alerts';
import { runInsiderAgentLoop } from '@/lib/insider/agent';
import { classifyInsiderIntent } from '@/lib/insider/router';
import { maybeRefreshSessionSummary } from '@/lib/insider/session-summary';
import { synthesizeInsiderFromAlerts } from '@/lib/insider/synthesizer';
import { hasInsiderAccess } from '@/lib/insider/access';
import type { Language } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await hasInsiderAccess(session.sub))) {
    return NextResponse.json({ error: 'Elite access required.' }, { status: 403 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { premiumExpiresAt: true, eliteExpiresAt: true },
  });
  const ent = computeEntitlements({
    premiumExpiresAt: dbUser?.premiumExpiresAt?.toISOString() ?? null,
    eliteExpiresAt: dbUser?.eliteExpiresAt?.toISOString() ?? null,
  });

  const effectiveEnt = { ...ent, eliteActive: true };
  const quota = await checkAndConsumeQuota(session.sub, effectiveEnt, 'insider');
  if (!quota.allowed) {
    return NextResponse.json({ error: 'Message limit reached.', resetAt: quota.resetAt }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    query?: string;
    language?: Language;
    sessionId?: string;
  };
  const { query, language = 'en', sessionId: incomingSessionId } = body;
  if (!query || typeof query !== 'string' || query.length > 500) {
    return NextResponse.json({ error: 'Invalid query.' }, { status: 400 });
  }

  let sessionId = incomingSessionId ?? null;
  if (sessionId) {
    const ok = await verifySessionOwnership(sessionId, session.sub, 'insider');
    if (!ok) return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  } else {
    const created = await createSession(session.sub, 'New chat', 'insider');
    sessionId = created.id;
  }

  const history = await getRecentContext(sessionId, 4);
  const sessionSummary = await getSessionSummary(sessionId);

  await addMessage(sessionId, 'user', query);
  if (history.length === 0) await autoTitleSession(sessionId, query);

  const route = await classifyInsiderIntent(query);
  const lang: Language = route.language || language;

  let summary: string;
  let data: Awaited<ReturnType<typeof runInsiderAgentLoop>>['data'] = {};
  let errors: Record<string, string> = {};
  let mode: 'simple' | 'complex' = route.complexity;

  if (route.complexity === 'simple') {
    const alerts = await getRecentAlerts();
    try {
      summary = await synthesizeInsiderFromAlerts(query, alerts, lang, history);
    } catch (err) {
      errors.synthesize = err instanceof Error ? err.message : 'synthesis failed';
      summary = '';
    }
  } else {
    const result = await runInsiderAgentLoop(query, lang, history, { sessionSummary });
    summary = result.summary;
    data = result.data;
    errors = result.errors;
  }

  const stored = await addMessage(sessionId, 'assistant', summary || '(no response)');
  await maybeRefreshSessionSummary(sessionId);

  return NextResponse.json({
    summary,
    data,
    errors,
    sessionId,
    assistantMessageId: stored.id,
    mode,
  });
}
