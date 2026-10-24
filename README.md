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
  Strait of Hormuz be back to normal by June 2027?"). Each one resolves on a
  named public source. Make the call, see what the market charges, and see
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
- [docs/STRATEGY.md](docs/STRATEGY.md): **where the product should go next**,
  from a two-round review by a designer, a fintech expert, a prediction-market
  specialist and a growth marketer (memos in `docs/review/`).
- [docs/PRODUCT.md](docs/PRODUCT.md): principles, which option structures
  are allowed and why, and open questions.
- [docs/DATA.md](docs/DATA.md): **where real options data comes from**:
  vendors, OPRA licensing, costs and the recommended path.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): code layout and what the
  backend will need.

## Run it

Requires Node 22+.

```bash
npm install
npx expo start        # then press i (iOS simulator), a (Android) or w (web)
```

On a phone, install **Expo Go** and scan the QR code. Every native module
used here ships in Expo Go, so you don't need a custom build yet.

Prices are synthetic by default.

### Demo with real prices (Yahoo Finance)

Run a small local server that fetches option chains from Yahoo Finance, and
point the app at it:

```bash
npm run market-data                                # terminal 1: server on :8787
EXPO_PUBLIC_MARKET_DATA=yahoo npx expo start -c    # terminal 2: the app
```

- The app finds the server through Metro's address, so a phone running Expo
  Go on the same Wi-Fi works with no extra setup. To point elsewhere, set
  `EXPO_PUBLIC_MARKET_DATA_URL`.
- Run the server on your own machine. Yahoo blocks most cloud servers.
- Demo during US market hours (9:30am–4pm ET). Outside them, Yahoo often
  reports zero bids and asks, so prices fall back to the last trade, and
  some bets may not price.
- This is for demos only. Yahoo has no official API and its terms don't cover
  showing its data in an app. The market version uses licensed OPRA data
  (see [docs/DATA.md](docs/DATA.md)).

Other sources (Alpaca keys for development, or our own backend) are
configured in `.env.example`.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm start`         | Expo dev server                      |
| `npm run web`       | Run in the browser                   |
| `npm run market-data` | Demo market data server (Yahoo Finance) on :8787 |
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
    welcome/           Cold start: intro → topics → 6 calls → take profile → terms
    (tabs)/            Feed · Theses · Bets (portfolio) · You (take profile, budget)
    calls.tsx          More calls (call → reveal deck)
    takes.tsx          Ways to express your takes: the bets that pay if you're right
    event/[id].tsx     A question: how it resolves, your call, bets for each side
    thesis/[themeId]   Guided thesis builder → thesis → matched bets
    bet/[id].tsx       Bet detail: legs, payoff, market odds, contracts, place (paper)
  domain/              Pure TypeScript: Black-Scholes and implied odds,
                       option legs and payoffs, strategy pricing, sizing,
                       thesis engine, calls and take profile, question
                       selector, horizon guard. No React. Fully unit tested.
  data/                Sample questions (with resolution rules), bet
                       templates, themes (+ integrity tests)
  services/            catalog, marketData (synthetic | alpaca | proxy),
                       pricing cache, broker (paper, multi-leg orders),
                       intelligence/narrator (take profile → plain English)
  hooks/               usePricedBet(s), useTakeProfile, useNarrative
  state/               App state (React context + reducer)
  components/          UI kit and Moonshot-specific components
  theme/               Design tokens and labels
  test/                Shared test fixtures
server/                Demo market data server (Yahoo Finance via yahoo-finance2)
docs/                  Product, data and architecture notes
```
