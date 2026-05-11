# ChainPulse

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Vercel](https://img.shields.io/badge/deploy-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com/)

**Agentic mediator for crypto intel** — EN · हिं · বাং — read-only, no wallet connect.

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

### Run locally

```bash
npm install && npm run dev
```

---

<div align="center">

⛓ *Read-only · no DB · Promise.allSettled on fetches*

</div>
