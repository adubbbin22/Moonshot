# Moonshot

A consumer app for small, thesis-driven, **asymmetric** stock bets.

Index-fund apps are built to make you average. Moonshot is the other end of the
barbell: you put small, fixed amounts into bets where being wrong costs a little
and being right pays a lot. Every bet starts from a view about the world, so you
always know why you own it and what would prove you wrong.

> **Prototype.** Bets are simulated (paper trading), all content is sample data,
> and nothing in the app is investment advice.

## The two ways in

- **Feed:** yes/no questions tied to current events ("Will shipping through the
  Strait of Hormuz be back to normal by June 2027?"). Pick a side and you see
  the bets that pay off if you're right.
- **Thesis builder:** start from a big question ("Do you believe in AI?"),
  answer three prompts, and get a plain-English thesis plus the bets that follow
  from it.

Both lead to the same **bet screen**. It shows the worst case (your stake), the
best case, the odds of losing, and what your stake turns into in each scenario.
It also lists what has to be true for the bet to work and how you'll know
you're wrong. You pick a small amount from your monthly budget and write down
your "why".

See [docs/PRODUCT.md](docs/PRODUCT.md) for the product principles and open
questions, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code is
organized and what the backend will need.

## Run it

Requires Node 20+.

```bash
npm install
npx expo start        # then press i (iOS simulator), a (Android) or w (web)
```

On a phone, install **Expo Go** and scan the QR code. Every native module
used here ships in Expo Go, so you don't need a custom build yet.

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
    bet/[id].tsx       Bet detail: payoff, stake, "your why", place (paper)
  domain/              Pure TypeScript: types, payoff math, sizing rules,
                       thesis engine. No React. Fully unit tested.
  data/                Sample bets, events and themes (+ integrity tests)
  services/            catalog (content) and broker (order execution) seams
  state/               App state (React context + reducer)
  components/          UI kit and Moonshot-specific components
  theme/               Design tokens
docs/                  Product and architecture notes
```
