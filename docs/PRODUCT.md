# Moonshot: product notes

## The idea

Passive index investing is the right default for most of your money. Moonshot
is for the slice you can afford to lose. It borrows from two places:

- **Taleb's barbell and convexity.** Keep most of your money very safe. Put a
  small amount into bets with a capped downside and an open-ended upside. You
  want exposure to positive surprises without being exposed to ruin.
- **Venture capital's power law.** Most bets go to zero. The portfolio works
  because one or two winners return many times the total stake. Size every bet
  so losing it doesn't matter and winning it does.

The product's job is to turn "I think X is going to happen" into a small,
well-shaped bet. It should also make you write down why, and later check
whether you were right.

## Principles

1. **Capped downside, always.** Long-only instruments. No leverage, margin or
   shorting. The most you can lose is the amount you put in, and the UI says so
   on every bet.
2. **Asymmetry is the filter.** We only surface bets where the best case is a
   large multiple of the stake. "Chance of loss" is shown openly, and it's
   usually above 50%.
3. **Thesis first.** Every bet is reached through a belief about the world,
   either a feed question or a guided thesis. Each bet lists what has to be
   true and the signals that would mean you're wrong.
4. **Small stakes, many shots.** Users set a monthly moonshot budget. Each bet
   is capped at a share of it (25% today), so the app pushes toward several
   small bets rather than one big one.
5. **Honest framing.** Odds are labelled as illustrative estimates. The
   portfolio screen says "Expect most to go to zero." No confetti for placing
   bets.

## Core loop

```
Belief ──► Bet ──► Journal ──► Resolution ──► Better beliefs
(feed or    (small,   ("your why",   (question resolves,   (track record:
 thesis)    capped)   kill criteria)  horizon reached)      where were you right?)
```

The scaffold covers belief → bet → journal. Resolution and the track record
are the next big product surface (see open questions).

## What's in the scaffold

| Area        | Status                                                          |
| ----------- | --------------------------------------------------------------- |
| Onboarding  | Philosophy, how it works, budget picker, disclaimer acceptance  |
| Feed        | 5 sample event questions with crowd split and yes/no entry      |
| Event       | Toggle sides, rationale, linked bets, "no bet" sides            |
| Thesis      | 4 themes × 2–3 questions → generated thesis → ranked bets       |
| Bet         | Stake chips (budget-aware), outcome chart, kill criteria, "why" |
| Portfolio   | Total at risk, "if your best one hits", positions with thesis   |
| Profile     | Budget setting, principles, convexity curve, reset              |
| Execution   | Paper broker only                                               |
| Persistence | In memory (resets on reload)                                    |

## Open questions

- **Instruments.** Long-dated call options are the purest asymmetric
  instrument, but they're complex for beginners and need options approval.
  Alternatives include small-cap or thematic stocks and ETFs (lower ceiling,
  no expiry), defined-outcome products, or an abstraction that packages
  options as a simple "bet" with a fixed cost and expiry.
- **Where the odds come from.** Today they're hand-written. Options-implied
  probabilities are a natural, market-based source. Analyst or model
  estimates are another. Whatever we use, it has to be explainable.
- **Generating the feed.** Questions should come from the news, but each one
  needs a clear resolution criterion and a defensible mapping to instruments.
  An LLM can draft them; a human should approve them.
- **Resolution and track record.** When a question resolves, show the user
  how their call and their bet did. Over time this becomes a calibration
  score, which is arguably the most valuable thing the app can teach.
- **Social.** Crowd split is shown today. Following other people's theses or
  posting your own call publicly could drive growth, and also herding.
- **Business model.** Subscription is cleanest. Payment for order flow
  conflicts with the "fewer, better bets" principle.
- **Regulation.** Matching bets to a user's stated beliefs may count as
  personalized investment advice. Options access carries suitability
  requirements, and engagement features get scrutiny. This needs counsel
  before any real money moves (see ARCHITECTURE.md).
