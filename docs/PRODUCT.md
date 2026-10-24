# Moonshot: product notes

> **Update (October 2026):** a four-specialist review recommends refocusing on
> forecasting first, with options bets as the paid way to act on a view. See
> [STRATEGY.md](STRATEGY.md). Where the two disagree, STRATEGY.md is newer.

## The idea

Passive index investing is the right default for most of your money. Moonshot
is for the slice you can afford to lose. It borrows from two places:

- **Taleb's barbell and convexity.** Keep most of your money very safe. Put a
  small amount into bets with a capped downside and a large upside. You want
  exposure to positive surprises without being exposed to ruin.
- **Venture capital's power law.** Most bets go to zero. The portfolio works
  because one or two winners return many times the total stake. Size every bet
  so losing it doesn't matter and winning it does.

The product's job is to turn "I think X is going to happen" into a small,
well-shaped **options** bet. It should also make you write down why, and later
check whether you were right.

## Why options, and which ones

Options are the natural instrument for asymmetry: you pay a premium once,
that's the most you can lose, and the payoff can be many times the premium.
Moonshot only uses structures where that holds:

| Structure | View | Max loss | Max gain | Why it's in |
| --- | --- | --- | --- | --- |
| Long call | Up | Premium | Uncapped | Purest convexity, but often expensive |
| Long put | Down | Premium | Strike − premium | Bearish convexity |
| Call debit spread | Up | Net debit | Width − debit | Much cheaper; capped upside |
| Put debit spread | Down | Net debit | Width − debit | Same, bearish |

**Excluded on purpose:** credit spreads, naked short options, iron condors
and covered calls. They all collect premium and risk more than they can make:
the opposite payoff shape. `validateStructure` in `src/domain/options.ts`
rejects anything that isn't a debit with defined risk.

Two consequences shape the product:

- **Spreads cap the upside.** The principle becomes "defined risk,
  asymmetric reward" rather than "unlimited upside". Moonshot requires every
  bet to be able to return **at least 3x its cost** (`MIN_PAYOFF_MULTIPLE`).
- **Narrow spreads act like binary bets.** A $5-wide call spread costing $1.20
  pays $5 if the stock ends above the upper strike and roughly nothing below
  the lower one. Its price divided by its width is close to the market's
  implied probability. That maps neatly onto feed questions ("Will X
  happen?") and makes the odds honest: they come from the market, not from us.

## Principles

1. **Defined risk, always.** Long options and debit spreads only. No margin.
   What you pay up front is the most you can lose, and the UI says so on
   every bet.
2. **Asymmetry is the filter.** Every bet must be able to pay at least 3x its
   cost at today's prices. If live prices break that, the bet is flagged.
3. **Market odds, not opinions.** Every bet shows the odds implied by option
   prices for each outcome range: lose it all, get some back, profit, max
   payout. They're risk-neutral and labelled as what the market is pricing.
4. **Thesis first.** Every bet is reached through a belief about the world,
   either a feed question or a guided thesis. Each bet lists what has to be
   true and the signals that would mean you're wrong.
5. **Small stakes, many shots.** Users set a monthly moonshot budget, and each
   bet is capped at 30% of it. Options trade in whole 100-share contracts, so
   bet ideas are built to cost roughly $50–$200 per contract.
6. **Honest framing.** "Expect most to expire worthless." No confetti.

## Core loop

```
Belief ──► Bet ──► Journal ──► Expiry / resolution ──► Better beliefs
(feed or    (option   ("your why",   (spread settles,          (track record:
 thesis)    or spread) kill criteria) question resolves)        where were you right?)
```

The scaffold covers belief → bet → journal. Settling at expiry and the track
record are next.

## What's in the scaffold

| Area | Status |
| --- | --- |
| Onboarding | Philosophy, how it works, budget picker ($100–$1,000/mo), disclaimer |
| Feed | 5 sample event questions; each linked bet shows live cost, max payout and market odds |
| Thesis | 4 themes × 2–3 questions → generated thesis → matched bets |
| Bet ideas | 17 strategy templates (strikes relative to spot, minimum days to expiry) priced against the chain |
| Bet screen | Exact legs, payoff diagram, market-odds ladder, contract picker within budget, kill criteria, "your why" |
| Portfolio | Total at risk, "if your best one hits", positions with legs, breakeven, thesis |
| Market data | Synthetic chains (default), Alpaca adapter (dev), backend proxy client. See [DATA.md](DATA.md) |
| Execution | Paper broker, with multi-leg limit orders modelled |
| Persistence | In memory (resets on reload) |

## Open questions

- **Contract minimums vs. "small amounts".** One contract is the minimum,
  which for most names means $50–$200. Options: lean on narrow spreads and
  cheaper underlyings, raise the default budget, or pool users into
  fractional exposure. Pooling is a much heavier regulatory lift.
- **Closing early and expiry handling.** Users will want to take profits
  before expiry. Spreads with a short leg in the money at expiry carry
  assignment and pin risk, so Moonshot should auto-close spreads before
  expiry rather than let them exercise.
- **Options approval friction.** Spreads need Level 3 approval at Alpaca.
  Onboarding has to collect experience, income and objectives, and some users
  will only get Level 2 (long options). The bet catalog should adapt to the
  user's approved level.
- **Resolution and track record.** When a question resolves or a spread
  expires, show how the call and the bet did. Over time this becomes a
  calibration score: arguably the most valuable thing the app teaches.
- **Generating the feed.** Questions should come from the news, each with a
  clear resolution criterion and a defensible mapping to a structure. An LLM
  can draft them; a human approves them.
- **Business model.** Subscription is cleanest. Payment for order flow
  conflicts with "fewer, better bets", and options order flow is where that
  conflict is sharpest.
- **Regulation.** Matching bets to a user's stated beliefs may count as
  personalized advice. Options have specific suitability and disclosure rules
  (FINRA 2360, the options disclosure document), and engagement features get
  scrutiny. This needs counsel before any real money moves (see
  ARCHITECTURE.md).
