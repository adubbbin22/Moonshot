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
- **Thesis builder:** start from a big belief ("Do you believe in AI?") and
  reason it through from first principles:
  - give your gut number, then see how past cases like it went (the outside
    view);
  - break the belief into the parts it depends on, each with the case for and
    the case against, and rate each one;
  - run a pre-mortem: assume you were wrong, mark the stories that could
    happen, and their warning signs become your kill criteria;
  - follow "which means…" steps down to the bets that pay if your chain holds.
    Each step asks "then what?": does the effect outlast the response it
    provokes until the bets expire?

  Code multiplies your ratings, so you see when the whole belief is less
  likely than it felt.
- **The framework for each stock:** every security has a catalyst map, what
  pushes it up, what pushes it down, how fast, and what to watch, plus the
  ways to lose even if you're right about the world. Every bet shows which
  catalysts it rides, and every question shows the stocks it moves.
- **More than one way in:** every idea comes in three shapes, priced side by
  side: a capped spread, an aggressive spread further out (cheaper, bigger
  multiple, lower odds) and an uncapped long option.
- **Simulated returns:** thousands of runs of your open bets to expiry, at the
  market's odds or at yours, and "if you made this bet 10 times" on every
  bet. Most moonshots expire worthless; this shows what the set looks like.
- **Prediction markets:** Kalshi and Polymarket odds next to each question,
  the gap between the venues (an arbitrage before fees), and how often the
  stock would have to follow the event for the options bet to be fairly
  priced. Sample odds by default; live ones through the demo server.
- **Your own belief:** type what you think happens, and a model drafts the
  tree for you to reason through. The model writes the reasoning and picks
  from a curated library of world-to-market mechanisms; it never names a
  security, a price or a trade, and code checks that before you see
  anything. Off by default; see below.

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

### Host the web build from any path

```bash
EXPO_PUBLIC_INTELLIGENCE=fixture EXPO_PUBLIC_TEST_SHORTCUTS=1 node scripts/export-web-hosted.js   # → dist-hosted/
```

`EXPO_PUBLIC_TEST_SHORTCUTS=1` keeps the welcome screen's **Skip setup · testing**
button in the build: it jumps past onboarding with a few sample calls so testers
land on the takes screen with bets to look at. Dev builds always have it; leave
it unset for a release.

`expo export` assumes the site root; this script makes the build relative
and patches the route loader so the folder works from a subpath or a hosted
page. Serve the folder and open `index.html`.

### Live prediction-market odds

The demo server fetches Kalshi and Polymarket quotes for the markets listed
on each question (`markets` in `src/data/events.ts`: a Kalshi ticker or a
Polymarket slug). Start the app with `EXPO_PUBLIC_PREDICTION_MARKETS=proxy`.
`GET /odds/search?q=…` on the server finds Polymarket slugs; Kalshi tickers
come from kalshi.com. Without a mapping, questions show no live odds; the
default `sample` mode shows made-up quotes labelled as such.

### Draft a thesis from your own belief (Claude)

The same demo server drafts thesis trees when the Anthropic SDK finds
credentials. Model outputs are logged to `server/logs/thesis-drafts.jsonl`.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run market-data          # terminal 1
EXPO_PUBLIC_INTELLIGENCE=proxy npx expo start -c          # terminal 2
```

Without credentials, `EXPO_PUBLIC_INTELLIGENCE=fixture` shows a canned sample
draft so the flow can be demoed offline.

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm start`         | Expo dev server                      |
| `npm run web`       | Run in the browser                   |
| `npm run market-data` | Demo server on :8787: market data (Yahoo Finance) and thesis drafting (Claude) |
| `npm run draft-profile -- AMD` | Draft the catalyst map for a symbol with Claude, into `server/drafts/` for review |
| `node scripts/export-web-hosted.js` | Web build that works from any path (see above) |
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
    thesis/[id].tsx    Thesis tree: gut check → break it down → pre-mortem → what follows → bets
    thesis/draft.tsx   Your own belief → a drafted tree
    stock/[symbol]     The framework for a security: catalyst map, bets, risks
    simulate.tsx       Monte Carlo of your open bets, market odds vs yours
    bet/[id].tsx       Bet detail: legs, payoff, market odds, contracts, place (paper)
  domain/              Pure TypeScript: Black-Scholes and implied odds,
                       option legs and payoffs, strategy pricing and shapes,
                       sizing, calls and take profile, question selector,
                       horizon guard, thesis-tree chain math, catalysts,
                       returns simulation, prediction-market arbitrage.
                       No React. Fully unit tested.
  data/                Sample questions (with resolution rules), bet
                       templates, underlying profiles (catalyst maps),
                       the mechanism library, thesis trees (+ integrity tests)
  services/            catalog, marketData (synthetic | alpaca | proxy),
                       predictionMarkets (sample | proxy), pricing cache,
                       broker (paper, multi-leg orders),
                       intelligence/narrator (take profile → plain English),
                       intelligence/thesisDrafter (belief → tree, via the backend)
  hooks/               usePricedBet(s), useTakeProfile, useNarrative,
                       useThesisWork, useReasoning
  state/               App state (React context + reducer)
  components/          UI kit and Moonshot-specific components
  theme/               Design tokens and labels
  test/                Shared test fixtures
server/                Demo server: Yahoo Finance chains, and thesis drafting with
                       the Anthropic SDK (draft → review → validate)
docs/                  Product, data and architecture notes
```
