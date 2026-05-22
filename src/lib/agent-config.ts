/**
 * Model routing + token budgets — single place to calibrate cost vs quality.
 *
 * Strategy: Haiku for routing + simple synthesis (cheap, fast).
 *           Sonnet only when tool selection or multi-step reasoning is required.
 */

export const MODELS = {
  /** Intent/complexity router — ~200 out tokens, no tools */
  router: 'claude-haiku-4-5-20251001',
  /** Simple-path synthesis — data pre-fetched, no tool loop */
  synthesize: 'claude-haiku-4-5-20251001',
  /** Complex console agent loop + explorer wallet agent */
  agent: 'claude-sonnet-4-6',
} as const;

export const TOKEN_BUDGETS = {
  router: 200,
  synthesize: 550,
  agent: 900,
  explorer: 800,
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
