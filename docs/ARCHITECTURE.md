# Architecture

## Today (mobile app only)

```
src/app (routes / screens)
   │ content          │ prices (async)            │ user state                │ narrative (async)
   ▼                  ▼                           ▼                           ▼
services/catalog   hooks/usePricedBet(s)     state/store.tsx ──► broker   services/intelligence/narrator
   │                  │                           │  (paper, multi-leg)       (template today, LLM later;
   ▼                  ▼                           ▼                            sees the take profile only)
data/*.ts          services/pricing ──► services/marketData ──► synthetic | alpaca | proxy
(questions,           │
 bet templates)       ▼
                   domain/*.ts (pure: pricing, options, strategy, sizing, portfolio, thesis engine,
                                calls, take profile, question selector, horizon, expression)
```

- **`domain/`** holds the rules of the product and has no React or I/O.
  - `pricing.ts`: Black-Scholes, implied volatility, and risk-neutral
    probabilities.
  - `options.ts`: legs, payoff at expiry, and the debit-only structure
    validation.
  - `strategy.ts`: turns a bet template plus a chain into a priced position
    (strike selection, cost, max value, breakeven, outcome ladder with market
    odds, 3x asymmetry check). `impliedOdds` gives the market's odds for a bet:
    cost ÷ max payout for a spread, the model's chance of profit for a long
    option.
  - `sizing.ts` and `portfolio.ts`: budget guardrails in whole contracts, and
    the power-law summary.
  - `thesisTree.ts`: first-principles reasoning as arithmetic.
    - A belief's parts are rated, each assuming the ones above it hold, and
      multiply into the belief.
    - Each "which means…" step multiplies into a chain (the belief, or its
      failure, times every step on the way).
    - Also: the weakest link, the gut check, and filling ratings from the
      user's calls on the questions that test a claim.
    - Thinking tools:
      - `outsideViewRate` gives the base rate using Laplace's rule.
      - `carriedBelief` gives the parts, optionally blended halfway with the
        base rate.
      - `betChain` multiplies the chain by the chance a step's effect
        outlasts its "then what?".
      - `killCriteria` collects the warning signs of the pre-mortem stories
        the user marked.
  - The cold start (see [STRATEGY.md](STRATEGY.md#cold-start-from-a-stranger-to-ways-to-express-built)):
    - `calls.ts`: a call is a side plus a probability (presets 60/75/90%), and
      its conviction.
    - `takeProfile.ts`: calls, skips and seed topics → topic affinity, views
      ordered by conviction, call style.
    - `questionSelector.ts`: the deterministic next question (coverage first,
      then engagement).
    - `horizon.ts`: the earliest allowed expiration for a question
      (resolution date + 30 days).
    - `expression.ts`: views → linked bets, and whether each priced bet fits
      (`ok`, `too-short`, `not-asymmetric`, `over-limit`).
- **Bets are templates, not trades.** `data/bets.ts` stores strikes relative
  to spot (e.g. buy 1.30×, sell 1.33×) and a minimum days-to-expiry. Each time
  a bet is shown, it's priced against today's chain, so the catalog never
  goes stale.
- **The framework for each security** lives in `data/underlyings.ts`: an
  `UnderlyingProfile` per symbol with its catalyst map. `domain/catalysts.ts`
  turns that into bets: a bet's direction comes from its structure
  (`betDirection`), the bets that express a catalyst are every bet on the
  symbol in its direction (`betsExpressing`), and a bet's `catalystsRidden`
  and `catalystsAgainst` are read off the map. `catalystsCheckedBy` links a
  feed question to the stocks it moves.
- **The mechanism library** (`data/mechanisms.ts`) is the only way a thesis
  reaches a bet. Each mechanism is something happening in the world and the
  catalysts it sets off. `createLinkResolver` follows each catalyst's
  direction to bets, with the catalyst's why; thesis steps name mechanisms
  by id and `domain/thesisDraft.ts#resolveMechanisms` fills in the bets when
  the catalog loads. The user's ratings live in the store, never in the
  content, and `components/BetExpressions.tsx` renders the same filtered,
  expiry-ordered bet list for thesis steps, calls and the stock screen.
- **Thesis trees come from two places with one shape.** `data/theses.ts`
  holds the five curated trees. Drafted trees come from an LLM through
  `services/intelligence/thesisDrafter.ts`, which never runs a model in the
  app: `proxy` posts the belief to our backend, `fixture` returns a canned
  draft for demos, `off` hides the feature. Drafted trees carry `provenance`
  and live in the store (`draftedTheses`); `hooks/useThesis` resolves an id
  against the catalog, then the store, so every screen works on either.
- **`domain/thesisDraft.ts` is the firewall as code.** `THESIS_DRAFT_SCHEMA`
  is the structured output the model must fill. `validateDraft` rejects
  prices, percentages, multiples, the word "should", any catalog ticker or
  company name, unknown mechanism or question ids, cases without sources,
  and stories that break no real part, and returns every problem so they can
  go back to the model. `toThesisTree` turns a valid draft into a tree.
- **`server/profile.ts`** drafts the framework for a symbol with the same
  SDK: one structured-output call, `validateProfileDraft` (no numbers, no
  advice, both directions, real questions), one retry. `npm run
  draft-profile -- AMD` writes the result to `server/drafts/AMD.json` for a
  person to review and paste into `data/underlyings.ts`, where the integrity
  tests hold it to the same rules. Drafted profiles never reach the app
  unreviewed.
- **`server/thesis.ts`** runs the pipeline with the Anthropic SDK: a draft
  call with the system prompt (mechanism library, feed questions, the rules)
  cached across requests, a review call that gives each past case a verdict
  and drops the disputed ones, validation with one retry, and an `audit`
  callback that the demo server appends to `server/logs/thesis-drafts.jsonl`.
  Credentials stay on the server; the app only ever sees finished trees.
- **`services/marketData/`** is the only place prices come from. Every
  provider implements `getChain(underlying, { minExpiration })` →
  `ChainSnapshot`:
  - `synthetic.ts`: deterministic Black-Scholes chains, no keys. The default.
  - `alpaca.ts`: Alpaca option-chain snapshots. Dev builds only when called
    from the app.
  - `proxy.ts`: our backend. The production path. The demo server in
    `server/` (Yahoo Finance) speaks the same protocol, which is what
    `EXPO_PUBLIC_MARKET_DATA=yahoo` uses.
  - `index.ts` picks one from `EXPO_PUBLIC_MARKET_DATA` (see `.env.example`).
    Sourcing and licensing are covered in [DATA.md](DATA.md).
- **`services/pricing.ts`** caches priced bets for 5 minutes so lists and
  detail screens share one fetch. Pass the question a bet is shown for, and
  the chain is fetched from the question's earliest allowed expiration. The
  cache key includes that date. `hooks/usePricedBet` (one bet) and
  `usePricedBets` (a list) expose it to screens with loading and error
  states.
- **`services/intelligence/narrator.ts`** is the first LLM seam. A
  `TakeNarrator` turns a take profile into a short paragraph. Its input type
  carries no money or identity data. `templateNarrator` works offline. The
  production narrator will call our backend and follow the firewall: no
  securities, no numbers.
- **`services/broker.ts`** is the only place orders go. Orders are multi-leg
  limit orders for a net debit, which is the shape spread-capable broker APIs
  take. `paperBroker` fills at the limit.
- **`state/store.tsx`** is a React context with a plain reducer. It holds:
  - the profile (budget, per-bet cap, onboarded);
  - positions, with legs, contracts, cost and breakeven;
  - the user's work on each thesis tree: gut number, ratings, "then what?"
    ratings, marked pre-mortem stories and the blend choice;
  - calls, skips and seed topics.

  `usePlaceBet` enforces the budget before calling the broker, and
  `useTakeProfile` derives the take profile from calls and skips. State is
  in memory; persisting it is a change inside this file.
- **`data/__tests__/integrity.test.ts`** prices every bet against synthetic
  chains, and checks that every question resolves on a named source. The
  build fails if:
  - a linked bet isn't asymmetric, costs too much per contract, or expires
    less than 30 days after its question resolves;
  - a referenced bet is missing;
  - a thesis tree links a missing bet or question, leaves a claim without
    its case against, or puts a price in a bet's why;
  - a tree lacks an outside view with at least three cases, has a
    pre-mortem story that breaks no real part, or has a step with bets but
    no "then what?";
  - a bet in the catalog isn't reachable from any thesis tree, so it would
    have no line of reasoning.

Routing uses Expo Router with typed routes. The onboarding gate is a
`Stack.Protected` guard on `profile.onboarded`. Before onboarding, only
`welcome/` is reachable: intro, topics, calls, take profile, terms. After
onboarding, only the tabs and the screens pushed from them are.

## What the backend needs

Rough order of when each piece becomes necessary:

1. **Market data proxy.** `GET /chains/{underlying}?minExpiration=YYYY-MM-DD`
   → `ChainSnapshot`. It holds vendor keys, caches chains, and records which
   users saw real-time data (OPRA reporting). A small edge function is
   enough to start. See [DATA.md](DATA.md).
2. **Accounts and persistence.** Auth, then server-side storage for profile,
   positions and theses. Postgres is a fine default (Supabase gives you auth,
   Postgres and row-level security in one).
3. **Content service.** Events, thesis trees, mechanisms and bet templates
   as data with an editorial workflow (draft → review → published). The
   `domain/types.ts` shapes are the starting schema. Drafted thesis trees
   that users rate highly are the natural candidates for review into the
   curated set.
3a. **Thesis drafting.** `POST /thesis/draft` as in `server/thesis.ts`,
   behind auth and a per-user budget, with the audit log in durable
   storage. The firewall stays in `domain/thesisDraft.ts`, shared by the
   server and the app.
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
