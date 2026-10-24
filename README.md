# Moonshot

A consumer app for small, thesis-driven, **asymmetric options bets**.

Index-fund apps are built to make you average. Moonshot is the other end of the
barbell. You put small, fixed amounts into long options and debit spreads,
where what you pay is the most you can lose and being right pays several times
over. Every bet starts from a view about the world, so you always know why you
own it and what would prove you wrong.

> **Prototype.** Trades are simulated (paper trading), prices are synthetic by
> default, and nothing in the app is investment advice.

## The two ways in

- **Feed:** yes/no questions tied to current events ("Will shipping through the
  Strait of Hormuz be back to normal by June 2027?"). Pick a side and you see
  the bets that pay off if you're right.
- **Thesis builder:** start from a big question ("Do you believe in AI?"),
  answer three prompts, and get a plain-English thesis plus the bets that follow
  from it.

Both lead to the same **bet screen**. It shows the exact trade (e.g. "Buy the
NVDA $235 call, sell the $240 call, Jan 2028") priced from the option chain,
plus the cost (your max loss), the max payout and a payoff diagram. It also
shows the odds of each outcome implied by today's option prices. You pick how
many contracts fit your monthly budget and write down your "why".

Docs:
- [docs/PRODUCT.md](docs/PRODUCT.md): principles, which option structures
  are allowed and why, and open questions.
- [docs/DATA.md](docs/DATA.md): **where real options data comes from**:
  vendors, OPRA licensing, costs and the recommended path.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code layout and what the
  backend will need.

## Run it

Requires Node 20+.

```bash
npm install
npx expo start        # then press i (iOS simulator), a (Android) or w (web)
```

On a phone, install **Expo Go** and scan the QR code. Every native module
used here ships in Expo Go, so you don't need a custom build yet.

Prices are synthetic by default. To use real (delayed/indicative) chains from
your own free Alpaca account in a dev build, copy `.env.example` to
`.env.local` and set `EXPO_PUBLIC_MARKET_DATA=alpaca` with your keys. Read
[docs/DATA.md](docs/DATA.md) first: that path is for local development only.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm start`         | Expo dev server                      |
| `npm run web`       | Run in the browser                   |
| `npm test`          | Jest unit tests (domain, data, state) |
| `npm run typecheck` | `tsc --noEmit`                       |
| `npm run lint`      | ESLint via `expo lint`               |

## Stack

Expo SDK 58 · React Native 0.88 · Expo Router (file-based routes, typed) ·
TypeScript (strict) · `react-native-svg` · Jest (`jest-expo`).

## Project layout

```
src/
  app/                 Routes (Expo Router). Every file here is a screen.
    _layout.tsx        Root stack, providers, onboarding gate
    onboarding.tsx     Intro, how it works, budget, disclaimer
    (tabs)/            Feed · Theses · Bets (portfolio) · You (profile)
    event/[id].tsx     A feed question: pick a side, see bets
    thesis/[themeId]   Guided thesis builder → thesis → matched bets
    bet/[id].tsx       Bet detail: legs, payoff, market odds, contracts, place (paper)
  domain/              Pure TypeScript: Black-Scholes and implied odds,
                       option legs and payoffs, strategy pricing, sizing,
                       thesis engine. No React. Fully unit tested.
  data/                Sample bet templates, events, themes (+ integrity tests)
  services/            catalog, marketData (synthetic | alpaca | proxy),
                       pricing cache, broker (paper, multi-leg orders)
  hooks/               usePricedBet
  state/               App state (React context + reducer)
  components/          UI kit and Moonshot-specific components
  theme/               Design tokens and labels
  test/                Shared test fixtures
docs/                  Product and architecture notes
```
