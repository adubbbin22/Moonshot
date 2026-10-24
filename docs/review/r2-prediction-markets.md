# Round 2: Prediction-market specialist

## Endorse / challenge / merge

**Fintech**
- **Firewall: endorse.**
- **Executable truth: strong endorse.** On a narrow spread, the natural debit ÷ width is the bet's break-even probability: no model needed, and you can actually trade at it.
- **Lifecycle autopilot: endorse.** The horizon guard must check the planned auto-close date, not the expiry date.
- **Stagger expiries: endorse, later dates only.**
- **Barbell Account: right destination, wrong first move.**

**Designer**
- **Call → Reveal → Express: endorse.**
- **"1-in-9 shot" headline: challenge.** It must be the executable break-even odds, never the lognormal ladder.
- **One-glance bet screen: endorse.**
- **Thesis Health: challenge.** Data-resolved checkpoints are the spine; cited LLM news is a secondary layer.
- **Night sky: endorse** as the presentation layer.

**Growth**
- **Called It cards and free calls / Season 0: endorse.**
- **"Breaking question within 60 minutes": challenge.** Fast publishing only from pre-approved templates (Fed, CPI, launches, earnings) with resolution specs written in advance.
- **"Early" badge: challenge.** It only counts hits, so it rewards spamming longshots. Every badge must come from the proper score.
- **Widget votes: challenge.** They stay out of crowd numbers unless the voter is logged in.

## Positions

- **T1:** the forecasting game is the front door and the retention engine. Options bets are the paid layer and the skin in the game. Play-money forecasting keeps people but doesn't make money (Manifold, Metaculus), so the money side must make "the market's odds" a real price you could have taken. Free: calls, record, leagues. Paid at about $10/mo: real-money bets, autopilot, unlimited Thesis Trees, full calibration analytics. No payment for order flow.
- **T2:** the firewall split.
  - The LLM proposes *world* steps as resolvable claims, and the user puts a probability on each.
  - Curated, compliance-reviewed mechanism templates output parameters.
  - Code shows every catalog match unranked, each with its break-even odds.
  - The final step ("given your world, how likely is FRO above $32?") is a number the user enters. The LLM produces no numbers at all.
  - A **checkpoint** is a world step with a date and a data source, resolving monthly.
- **T3:** the planned close date must be at least the question's resolution date plus 30 days, enforced in `integrity.test.ts` and at pricing time. Write questions to fit the instrument: set deadlines from the listed expirations. Every bet shows the Event → Mechanism → Price bridge. Event contracts: not in year one. Kalshi and Polymarket odds are shown for reference only, under license. Offering them would need Moonshot's own NFA analysis, the courts are split, and the CFTC rule isn't final.
- **T4:**
  - *Headline:* "Breaks even if it hits more than 1 in X", from the natural debit ÷ width.
  - *The market's estimate:* mid ÷ width. Show the gap as the trading cost.
  - *Model ladder:* goes under the hood, made skew-aware, labeled as a model.
  - *League score:* the relative log score, ln(p_user[outcome]) − ln(p_base[outcome]). User probabilities are clipped to 1–99% and the baseline to 2–98%. Time-averaged over the open window, equal weight per question, and at least 10 resolutions to rank.
  - *Baseline:* the mid-implied probability passed through a recalibration curve backtested on historical options chains (the tail-bias fix). Where no option exists, use the crowd median at call time.
  - *Personal display:* Brier.
- **T5:** merge Thesis Health, Pulse and checkpoints.
  - At most 1 scheduled push a week (the Sunday Check), opt-in by theme.
  - Event pushes only when your call or checkpoint resolves, or a data trigger on your kill criterion fires.
  - Non-operational pushes are capped at 2 a week, with quiet hours.
  - Operational pushes (expiry, assignment, autopilot) are mandatory and uncapped.
  - Never price moves, never securities the user doesn't hold, never "trade now".
- **T6:** for spreads the problem isn't the minimum. Cost ≈ width × probability × 100, so a $1-wide spread at 15% costs about $15. The real constraint is executable cost: gate each bet on (natural − mid) ÷ mid < 15% and an open-interest floor. Minimum budget $250/mo; under that, free calls only. No pooling.
- **T7:** rename before any public launch. Back **Barbell**, pending a trademark check.
- **T8:** merge into **"Fund I: beat the market's odds"**. The scoring engine is the moat; the night sky and the season letter are the frame. The Barbell Account is phase 3.
- **T9:** yes, it's flat when the only opponent is points. The fixes:
  - the market price as the opponent
  - the record as the stake
  - weekly resolutions
  - the reveal
  - friend leagues with seasons that reset
  - the record unlocking status
  - no virtual currency

## Final top 5

1. **Questions that can resolve, plus the horizon guard and executable odds.** Metric: fewer than 1 dispute per 100 resolutions.
2. **Call → Reveal, free and without an account.** Metric: at least 40% of new users make 3+ calls in their first session.
3. **Checkpoints plus the Sunday Check.** Metric: at least 1 resolution per weekly active user per week, and weekly/monthly actives of at least 40%.
4. **Beat-the-market record:** relative-log leagues, seasons framed as fund vintages, Called It cards. Metric: D30 retention for users who make calls of at least 25%.
5. **Express:** firewalled Thesis Tree → one-glance bet → autopilot. Metric: at least 10% paper-to-real conversion within 90 days, with trades per user flat.

## What changed

- **Executable pricing gives a model-free probability.** Demote the lognormal ladder.
- **The firewall makes the tree better.** Less hallucination and less resolution risk.
- **Event contracts moved from "later" to "not in year one".** The guard uses the autopilot close date.
