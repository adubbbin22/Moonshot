# Architecture

## Today (mobile app only)

```
src/app (routes / screens)
   │ content          │ prices (async)            │ user state
   ▼                  ▼                           ▼
services/catalog   hooks/usePricedBet        state/store.tsx ──► services/broker.ts
   │                  │                           │                (paper, multi-leg limit orders)
   ▼                  ▼                           ▼
data/*.ts          services/pricing ──► services/marketData ──► synthetic | alpaca | proxy
(bet templates)       │
                      ▼
                   domain/*.ts (pure: pricing, options, strategy, sizing, portfolio, thesis engine)
```

- **`domain/`** holds the rules of the product and has no React or I/O.
  - `pricing.ts`: Black-Scholes, implied volatility, and risk-neutral
    probabilities.
  - `options.ts`: legs, payoff at expiry, and the debit-only structure
    validation.
  - `strategy.ts`: turns a bet template plus a chain into a priced position
    (strike selection, cost, max value, breakeven, outcome ladder with market
    odds, 3x asymmetry check).
  - `sizing.ts` and `portfolio.ts`: budget guardrails in whole contracts, and
    the power-law summary.
  - `thesisEngine.ts`: answers → thesis → matching bets.
- **Bets are templates, not trades.** `data/bets.ts` stores strikes relative
  to spot (e.g. buy 1.30×, sell 1.33×) and a minimum days-to-expiry. Each time
  a bet is shown, it's priced against today's chain, so the catalog never
  goes stale.
- **`services/marketData/`** is the only place prices come from. Every
  provider implements `getChain(underlying, { minExpiration })` →
  `ChainSnapshot`:
  - `synthetic.ts`: deterministic Black-Scholes chains, no keys. The default.
  - `alpaca.ts`: Alpaca option-chain snapshots. Dev builds only when called
    from the app.
  - `proxy.ts`: our backend. The production path.
  - `index.ts` picks one from `EXPO_PUBLIC_MARKET_DATA` (see `.env.example`).
    Sourcing and licensing are covered in [DATA.md](DATA.md).
- **`services/pricing.ts`** caches priced bets for 5 minutes so lists and
  detail screens share one fetch. `hooks/usePricedBet` exposes it to screens
  with loading and error states.
- **`services/broker.ts`** is the only place orders go. Orders are multi-leg
  limit orders for a net debit, which is the shape spread-capable broker APIs
  take. `paperBroker` fills at the limit.
- **`state/store.tsx`** is a React context with a plain reducer: profile,
  positions (with legs, contracts, cost and breakeven) and saved theses.
  `usePlaceBet` enforces the budget before calling the broker. State is in
  memory; persisting it is a change inside this file.
- **`data/__tests__/integrity.test.ts`** prices every bet against synthetic
  chains. A bet fails the build if it's not asymmetric or costs too much per
  contract, if a referenced bet is missing, or if a thesis answer maps to
  nothing.

Routing uses Expo Router with typed routes. The onboarding gate is a
`Stack.Protected` guard on `profile.onboarded`.

## What the backend needs

Rough order of when each piece becomes necessary:

1. **Market data proxy.** `GET /chains/{underlying}?minExpiration=YYYY-MM-DD`
   → `ChainSnapshot`. It holds vendor keys, caches chains, and records which
   users saw real-time data (OPRA reporting). A small edge function is
   enough to start. See [DATA.md](DATA.md).
2. **Accounts and persistence.** Auth, then server-side storage for profile,
   positions and theses. Postgres is a fine default (Supabase gives you auth,
   Postgres and row-level security in one).
3. **Content service.** Events, themes and bet templates as data with an
   editorial workflow (draft → review → published). The `domain/types.ts`
   shapes are the starting schema.
4. **News → question pipeline.** Ingest headlines, have an LLM draft
   candidate questions with a resolution date and criterion, and propose a
   structure (underlying, direction, strikes relative to spot, horizon) with
   "what has to be true" and kill criteria. A human editor approves before
   anything ships.
5. **Settlement, resolution and notifications.** Mark paper positions to
   market, settle them at expiry, and resolve questions. Notify users when a
   kill criterion fires or expiry approaches, and auto-close spreads before
   expiry to avoid assignment. Build the track record.
6. **Live execution.** Alpaca Broker API (Levels 1–3, so spreads are
   possible) handles KYC, custody and options approval. Implement `Broker`
   against its multi-leg orders, keep paper mode for new users, and filter
   the catalog to each user's approved options level.

## Before real money

This is not legal advice, but these questions need a securities lawyer before
the live broker is switched on:

- Broker-dealer status: introduce accounts through a partner broker, or
  register.
- Whether thesis → bet matching is personalized advice (adviser registration)
  or general education, and how to design and word it either way.
- Options account approval, suitability (FINRA Rule 2360) and delivery of
  the options disclosure document, which the broker partner may own.
- Marketing and "digital engagement practices" scrutiny for anything
  gamified.
- Content review for generated questions, especially geopolitical ones.

## Conventions

- New screens go in `src/app/`. Everything else stays outside it (route files
  should only export the screen).
- Put rules in `domain/` with tests. Keep screens thin.
- Install native packages with `npx expo install <pkg>` so versions match the
  SDK.
- Run `npm test && npm run typecheck && npm run lint` before pushing.
