<div align="center">

# ChainPulse

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Netlify](https://img.shields.io/badge/deploy-Netlify-000?style=flat-square&logo=netlify)](https://netlify.com/)

**Agentic mediator for crypto intel** — EN · हिं · বাং — Read-only. No wallet connection. No upfront subscription — opt into Premium or Insider Bot access whenever you like.

</div>

<img width="1536" height="1024" alt="chainpulse-logo" src="https://github.com/user-attachments/assets/fde1c557-e3e8-4b62-b6bd-e9ae6048cb88" />


Most people juggling markets, staking, or “what moved on-chain today?” bounce between dashboards, explorers, and feeds. ChainPulse collapses that into **one conversational surface**: ask natural questions (“major Solana/Ethereum updates today?”, “governance worth watching this week?”, “unusual large flows?”), get **answers backed by sourced data** — charts, cards, catalogs — routed from verified APIs/RSS **server-side**.

```
   You                    ChainPulse agents                 Outcome
 ┌────────┐              ┌─────────────────────┐          ┌──────────────┐
 │ ask    │  ─intent──►  │ live fetches ·       │ ─cards─► │ concise,      │
 │ en/hi/bn│ ◄──────────  │ multilingual summary │          │ actionable    │
 └────────┘              └─────────────────────┘          └──────────────┘
        ▲                                                       │
        └── no wallet · transparent sources · timestamps ─────────┘
```

**Built for:** prices · whale-ish large tx signals · protocol/TVL/yield signals · concise news · EVM/SVM ecosystem noise reduction · early visibility into staking/pool shifts — **not** price predictions or financial advice.

**End goal:** turn dense on-chain and market context into **plain, actionable** answers you can scan in seconds.

---

### Agent architecture

ChainPulse runs two agent surfaces with shared doctrine (`src/lib/agent-prompts.ts`):

| Surface | Entry | Model path |
|---------|-------|------------|
| **Intelligence console** (`/app`) | `POST /api/query` | Haiku router → **simple** (parallel fetch + Haiku synthesizer) or **complex** (Sonnet tool loop, ≤3 turns) |
| **Wallet explorer** (`/explorer`) | `POST /api/explorer/query` | Snapshot + Sonnet tool loop scoped to one address |

**Routing (console):** Haiku emits `{ intents, coins, language, complexity }`. Simple queries fan out to external APIs in parallel (zero LLM cost), then Haiku synthesizes from compact payload. Complex queries enter a Sonnet tool loop (max 3 iterations).

**Tools (console):** `get_prices` · `get_news` · `get_whale_transactions` · `get_defi_tvl` · `get_staking_yields` — each with structured descriptions (returns, use-when, synthesis hints).

**Tools (explorer):** `get_native_balance` · `get_recent_transactions` · `get_token_transfers` — snapshot-first; tools only for drill-down.

**Response doctrine (both agents):**
1. Direct answer from live data
2. Evidence with cited numbers
3. One insight layer (mechanism / on-chain implication) — tagged `(general knowledge)` when not from fetch
4. Explicit data limits when insufficient
5. Single ⚠ disclaimer on price/yield/risk topics — **never financial advice**

**Data sources:** CoinGecko (prices + 24h change + token categories) · DefiLlama (TVL/yields) · Etherscan v2 + Solscan (whales) · Cointelegraph/Decrypt RSS (news) · Etherscan v2 multichain (explorer).

### Wallet explorer (`/explorer`)

Read-only multichain wallet inspection — no wallet connect. Paste any `0x…` address; ChainPulse builds one **`WalletReport`** (`src/lib/explorer/wallet.ts`) and treats it as the single source of truth for UI and agent context.

**Chains (15 EVM):** Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche, Linea, Scroll, zkSync Era, Mantle, Blast, Gnosis, Polygon zkEVM, Celo — all defined in `src/lib/explorer/chains.ts` (`CHAINS`). Downstream logic (Etherscan fan-out, agent tools, marketing copy) reads from that registry only.

**Data layer**

| Module | Role |
|--------|------|
| `valuation.ts` | CoinGecko USD prices, `change24h`, bounded category lookups |
| `categories.ts` | CoinGecko categories → display buckets (DeFi, L2, Meme, Stablecoin, …) |
| `portfolio.ts` | Pure derivations: positions, coin/category allocation, 24h performance, insights, premium summary |

**UI** (all take `WalletReport` — no duplicate fetch logic)

- `WalletOverview` · `AllocationCharts` (coin + category donuts) · `PerformanceChart` (24h movers/laggards) · `PortfolioInsights` (flags; premium narrative when `tier === premium`)
- `TokenList` · `TxTimeline` · `ExplorerChat` (Sonnet + explorer tools; `InlineComposer` pill input)
- `WalletTracker` — DB-backed watchlist sidebar

**API**

| Route | Purpose |
|-------|---------|
| `GET /api/explorer/wallet/[address]` | Build and return `WalletReport` |
| `POST /api/explorer/query` | Agent Q&A over a wallet snapshot |
| `GET/POST /api/tracked-wallets` | List / add watchlist (server-enforced limits) |
| `DELETE /api/tracked-wallets/[id]` | Remove tracked address |
| `POST /api/wispr/token` | Mint short-lived Wispr Flow client token for voice dictation |

**Accounts & tiers** (`prisma/schema.prisma`)

- `User.tier`: `free` (default) \| `premium`
- `TrackedWallet`: per-user saved addresses (`@@unique([userId, address])`)
- Limits (`src/lib/tier.ts`): **free = 3**, **premium = 100** wallets — enforced in API, surfaced on `/api/auth/me`

```bash
# After pulling explorer schema changes
npx prisma migrate deploy --config prisma.config.ts
```

### Sustainable token strategy

ChainPulse separates **cheap routing/synthesis** from **expensive reasoning**. All budgets live in `src/lib/agent-config.ts`.

```
                    ┌─────────────────────────────────────────┐
  User query ──────►│ Haiku router (~200 out tokens)          │
                    │ → intents · coins · simple | complex    │
                    └──────────────┬──────────────────────────┘
                                   │
              simple (~80% queries)│ complex (~20%)
                                   ▼
         ┌─────────────────────────┴──────────────────────────┐
         │ parallel API fetch (no LLM)                          │
         │ CoinGecko · DefiLlama · Etherscan · RSS              │
         └─────────────────────────┬──────────────────────────┘
                                   ▼
         ┌─────────────────────────┴──────────────────────────┐
         │ Haiku synthesizer (~550 out)                         │
         │ compact payload · shared doctrine                    │
         └──────────────────────────────────────────────────────┘

         complex path ──► Sonnet agent loop (≤3 iterations, ~900 out/turn)
                            tools choose fetches · compact tool results
```

| Stage | Model | When | Typical cost profile |
|-------|-------|------|----------------------|
| Router | Haiku 4.5 | Every console query | Smallest — JSON only, no tools |
| Synthesizer | Haiku 4.5 | `simple` path after parallel fetch | Low — data pre-fetched, no tool loop |
| Agent | Sonnet 4.6 | `complex` path + explorer | Higher — reserved for multi-step reasoning |

**Context discipline** (`compact-payload.ts`, `history-context.ts`):

- History: last **2 turns**, each truncated to **300 chars** (full text stays in DB/UI cards)
- Tool results: sparklines sampled to **24 points**, whales/news capped at **6**, prices at **5**
- Agent loop capped at **3 iterations** (most queries resolve in 1–2)
- Classifier prefers **`simple`** when one clear intent — Sonnet only when orchestration is needed

**Why Haiku → Sonnet, not Sonnet everywhere:** fetchers do the heavy lifting (live prices, TVL, txns). The LLM's job on simple queries is *interpretation*, not retrieval — Haiku with structured doctrine is sufficient and ~10× cheaper per token. Sonnet earns its cost on tool selection, comparisons, backtest-limit honesty, and wallet forensics.

**Feedback loop (not online RL):** thumbs up/down on assistant messages (`chat_messages.feedback`) records human signal for **offline** prompt and routing review. ChainPulse does not retrain models in-request — that would add latency and cost without guaranteed gain. The sustainable path: collect feedback → periodic prompt/routing tuning → A/B on classifier thresholds.

**Tuning knobs** (edit `agent-config.ts` only):

```ts
MODELS.synthesize  // swap to Sonnet if Haiku quality drops on your workload
CONTEXT_LIMITS.historyTurns       // 2 → 3 for more multi-turn memory (+tokens)
CONTEXT_LIMITS.maxAgentIterations // 3 → 2 to hard-cap complex-path billing
TOKEN_BUDGETS.synthesize            // 550 — raise if answers feel clipped
```

**Prudent billing guardrails already in place:**

- Query max length 500 chars
- No wallet signing / no repeated full-history replay
- Snapshot-first explorer (tools only on drill-down)
- `Promise.allSettled` on external APIs — failed fetch ≠ retry loop burning tokens

---

### Input & voice

Shared composers in `src/components/composer/` — container-level focus (darken + neutral border via `.composer-shell` / `.glass-input:focus-within`), no purple field outline.

| Surface | Component | Layout |
|---------|-----------|--------|
| Console (`/app`) | `MultilineComposer` | Multi-line textarea + bottom row (mic · Ask↑) |
| Insider (`/insider`) | `MultilineComposer` | Same, gold variant |
| Explorer chat | `InlineComposer` | Single-line pill — mic + Ask inside the bar |
| Explorer address | `AddressInput` | Single-line pill — mic + Inspect → |

**Voice dictation** ([Wispr Flow](https://api-docs.wisprflow.ai)): mic buttons render when `WISPR_API_KEY` is set. Browser streams audio over Wispr’s WebSocket; org key stays server-side (`POST /api/wispr/token`).

---

### Run locally

```bash
npm install
npx prisma migrate deploy --config prisma.config.ts   # PostgreSQL + tracked wallets / tier
npm run dev
```

**Required:** `DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`  
**Recommended:** `COINGECKO_API_KEY`, `ETHERSCAN_API_KEY`  
**Billing (Razorpay):** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`  
**Optional:** `WISPR_API_KEY` (voice input — `fl-…` from Wispr Flow developers)

**Razorpay checkout:** Premium ₹999 / 3 mo · Elite ₹2,499 / 3 mo — Standard Checkout modal via `POST /api/billing/checkout` → verify at `POST /api/billing/verify`. Webhook backup: `POST /api/billing/webhook` (`payment.captured`).

---

<div align="center">

⛓ *Read-only · No Subscriptions · No Wallet · Promise.allSettled on fetches*

</div>
