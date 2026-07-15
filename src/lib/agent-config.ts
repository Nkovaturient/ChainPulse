/**
 * Model routing + token budgets — single place to calibrate cost vs quality.
 *
 * Strategy: Haiku for routing + simple synthesis (cheap, fast).
 *           Sonnet only when tool selection or multi-step reasoning is required.
 *           Insider uses Sonnet 5 with tighter caps than Console agent.
 *
 * Sonnet 5: do NOT pass temperature, top_p, or top_k — non-default values return 400.
 */

export const MODELS = {
  /** Intent/complexity router — ~200 out tokens, no tools */
  router: 'claude-haiku-4-5-20251001',
  /** Simple-path synthesis — data pre-fetched, no tool loop */
  synthesize: 'claude-haiku-4-5-20251001',
  /** Complex console agent loop + explorer wallet agent */
  agent: 'claude-sonnet-4-6',
  /** Insider Bot agent loop only */
  insider: process.env.INSIDER_MODEL ?? 'claude-sonnet-5',
} as const;

export const TOKEN_BUDGETS = {
  router: 200,
  synthesize: 550,
  /** Console Sonnet tool loop — tightened for post-Sep tokenizer inflation (~30%) */
  agent: 750,
  /** Explorer wallet agent — same inflation offset */
  explorer: 650,
  /** Insider Sonnet loop — signal-first answers, no long essays */
  insider: 500,
  insiderSummary: 200,
} as const;

/** Context discipline — keeps input tokens predictable per request */
export const CONTEXT_LIMITS = {
  /** Prior turns injected into LLM (user+assistant pairs ≈ 2–4 messages) */
  historyTurns: 2,
  /** Truncate long assistant replies in history — cards hold the full data */
  historyCharsPerTurn: 300,
  /** Agent tool-loop cap — most queries resolve in 1–2 iterations */
  maxAgentIterations: 3,
  /** Payload caps sent back to the model after tool calls */
  sparklinePointsForModel: 24,
  maxWhalesForModel: 6,
  maxNewsForModel: 6,
  maxDefiForModel: 8,
  maxStakingForModel: 8,
  maxPricesForModel: 5,
} as const;

/** Insider-only limits — keeps per-request cost bounded */
export const INSIDER_LIMITS = {
  /** Locked at 2 — multi-round loops re-tokenize full history; never raise for Insider */
  maxAgentIterations: 2,
  summaryTriggerMessages: 6,
  summaryMaxChars: 450,
  summaryMaxInputMessages: 16,
  historyTurns: 2,
  historyCharsPerTurn: 300,
  maxAlertsForModel: 12,
} as const;

export type ChatSurface = 'console' | 'insider';
