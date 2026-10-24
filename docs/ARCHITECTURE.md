# Architecture

## Today (mobile app only)

```
src/app (routes / screens)
   │  read content           │  read & update user state
   ▼                         ▼
services/catalog.ts      state/store.tsx ──► services/broker.ts (paper)
   │                         │
   ▼                         ▼
data/*.ts (sample)       domain/*.ts (pure: payoff, sizing, thesis engine)
```

- **`domain/`** holds the rules of the product and has no React or I/O.
  `payoff.ts` does scenario math. `sizing.ts` holds budget and per-bet
  guardrails. `thesisEngine.ts` turns answers into a thesis and ranks bets by
  tag overlap. This is where most logic should live and be tested.
- **`services/catalog.ts`** is the single read path for events, themes and
  bets. Today it's backed by bundled sample data. When a backend exists,
  replace the bodies with API calls behind a cache (e.g. TanStack Query) and
  the screens don't change.
- **`services/broker.ts`** is the only place orders go. `paperBroker` fills
  instantly. A live broker implements the same `Broker` interface.
- **`state/store.tsx`** is a React context with a plain reducer. It holds the
  profile (budget, onboarding), positions and saved theses. `usePlaceBet`
  enforces the sizing rules before calling the broker, so the UI can't bypass
  them. State is in memory; persisting it is a change inside this file.
- **`data/__tests__/integrity.test.ts`** guards content. It checks that every
  referenced bet exists, scenario probabilities sum to 1, every thesis answer
  maps to at least one bet, and every bet lists kill criteria.

Routing uses Expo Router with typed routes. The onboarding gate is a
`Stack.Protected` guard on `profile.onboarded`.

## What the backend needs

Rough order of when each piece becomes necessary:

1. **Accounts and persistence.** Auth, then server-side storage for profile,
   positions and theses. Postgres is a fine default (Supabase gives you auth,
   Postgres and row-level security in one).
2. **Content service.** Events, themes and bets as data with an editorial
   workflow (draft → review → published). The `domain/types.ts` shapes are the
   starting schema.
3. **News → question pipeline.** Ingest headlines, have an LLM draft
   candidate questions with a resolution date and criterion, and propose
   instrument mappings with "what has to be true" and kill criteria. A human
   editor approves before anything ships.
4. **Market data.** Quotes and option chains. Use them to replace the
   hand-written scenarios with market-implied ones and to show live prices on
   the bet screen.
5. **Resolution and notifications.** Resolve questions and expire bets.
   Notify users when a kill criterion fires or a horizon arrives, and build the
   track record.
6. **Live execution.** A brokerage-as-a-service partner (e.g. Alpaca Broker
   API, DriveWealth) handles KYC, custody, fractional shares and options
   approval. Implement `Broker` against it and keep paper mode for new users.

## Before real money

This is not legal advice, but these questions need a securities lawyer before
the live broker is switched on:

- Broker-dealer status: introduce accounts through a partner broker, or
  register.
- Whether thesis → bet matching is personalized advice (adviser registration)
  or general education, and how to design and word it either way.
- Options approval and suitability rules if options are offered to retail
  users.
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
