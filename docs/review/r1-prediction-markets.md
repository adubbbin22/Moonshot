# Round 1: Prediction-market specialist memo

## Verdict on the current app

- **None of the questions can resolve.** "Back to normal," "on its own" and "most US smartphones" have no source, no threshold and no exact date, and `EventQuestion` (src/domain/types.ts) has no field to hold any of them. Without resolution there is no track record, no calibration and no payoff moment. The back half of the loop is missing, and the front half isn't built to feed it.
- **Users can be right and still lose on timing.** Taking the minimum horizons in `src/data/bets.ts` from today (Oct 24, 2026):

  | Bet | Expires around | Question resolves |
  | --- | --- | --- |
  | FRO / JETS (200d) | May 2027 | Hormuz, Jun 2027 |
  | ASTS (140d) | Mar 2027 | Satellite phones, Dec 2027 |
  | OKLO / URA / EQT (420d) | Dec 2027 | SMR, Dec 2028 |
  | IWM / USO / QQQ puts (360d) | Oct 2027 | Fed and AI questions, Dec 2027 |

  This timing mismatch is the worst kind of basis risk, because the user never sees it.
- **The screen shows two unrelated probabilities.** A made-up "42% yes" sits above "Max payout: 11%", and users will read both as the odds of the event. The first is fake. The second is the risk-neutral chance that a stock finishes past a strike, which is a different question. The ladder also prices every range with the bought leg's implied volatility in a lognormal model, so it ignores skew. The spread's own price ÷ width is closer to what the market actually charges.
- **What's right:** defined risk, kill criteria, "your why," and "Sometimes the right move is no bet at all." That is a forecasting journal waiting for a scoring engine. "A narrow spread is nearly a binary bet" is the best idea in the repo, and the app barely uses it.

## Lens by lens

**1. Unique take.** Kalshi and Polymarket price the event. Moonshot can price the consequence: a second-order prediction market. Nobody owns "if X happens, what pays?" Today the chain from event to trade is only implied. *Proposal:* every bet shows **Event → Mechanism → Price** as three links, each with a probability. It also lists the ways you can be right and still lose: the outcome is already priced in, it happens after expiry, or the stock moves for other reasons.

**2. Word of mouth.** In prediction markets the thing people share is "I called it at 12%," not a P&L. *Proposal:* an entry card ("I say 35%. Options say 11%.") and a resolution card (your number, the market's number at the time, the outcome, your score). Lead with the forecast, not the dollars.

**3. Viable at scale.** Polymarket's worst trust losses came from vague wording settled by token-holder votes, in its 2025 Ukraine-minerals and Zelensky-suit disputes. Kalshi holds up because every contract has rulebook-grade terms. Copy Kalshi. *Proposal:* an LLM pipeline.
- News → draft question → structured resolution spec: source URL, metric, threshold, timestamp, revision rule, and when it resolves N/A.
- A second "rules lawyer" LLM pass tries to break the spec.
- Ticker linking with the mechanism and its direction.
- Automatic checks: expiry at least resolution date plus settlement lag, open interest, bid-ask width.
- A human approves.

Prefer questions that resolve from data. Polymarket settles its Hormuz markets on [IMF PortWatch transit counts](https://orrery.me/markets/will-40-ships-transit-the-strait-of-hormuz-on-any-day-by-july-31-2026) (rules as shown on a third-party mirror). The AI question could resolve on METR's measured task time horizon, and the Fed question on the upper bound of the target range after the December 2027 FOMC meeting. LLMs draft and check the questions; humans resolve them, with a public log and an appeal window.

**4. Smart.** Calibration should be the core mechanic. Because of the power law, most moonshots lose, so P&L says almost nothing about skill for years. A Brier score tells you something every time a question resolves. Ask users for a probability, not a side.
- Edge = your number minus the market's. If yours is below the market's, the app says "no edge, no bet."
- Decision trees are conditional forecasts. For example: Hormuz stays disrupted (you: 60%) → Brent above $100 given that (50%) → FRO above $32 given that (55%) = 16.5%, against 11% implied.
- Multiplying the steps exposes the conjunction fallacy, the forecasting lesson that most makes people feel smart.
- Each step in the tree becomes its own short-dated question that can resolve.

**5. Gamified.** Kalshi and Polymarket are compulsive because loops close within hours. Moonshot's close in 6–14 months, which leaves a long stretch with nothing happening. Fill it with free checkpoint questions that resolve weekly or monthly from data and sit under each thesis. Put streaks and leagues on calibration, never on trades.

**Real event contracts? Stay options-first.** Use event contracts as reference odds now, and as an optional exact-match bet later.
- *For:* Alpaca, the planned broker, has [registered as a futures commission merchant](https://alpaca.markets/blog/alpaca-registers-as-futures-commission-merchant-with-the-cftc-and-nfa-to-advance-launch-of-prediction-markets/) and [partnered with Kalshi](https://alpaca.markets/blog/alpaca-partners-with-kalshi-to-expand-prediction-market-access-through-its-global-brokerage-infrastructure/), so this is the same API. An event contract has zero basis risk and can be bought a dollar at a time, which solves the contract-minimum question in PRODUCT.md.
- *Against, point 1:* the law keeps shifting. In September 2026 the [Sixth Circuit ruled against Kalshi](https://sbcamericas.com/2026/09/25/kalshi-sixth-circuit-sides-oh-tn/), opposite the Third Circuit, and the Supreme Court is weighing a petition to settle the split. The CFTC also opened [advance rulemaking in March 2026](https://cftc.gov/PressRoom/PressReleases/9194-26).
- *Against, point 2:* US-regulated contracts run into the Commodity Exchange Act's public-interest limits (war, terrorism). Your best questions, like Hormuz, often won't have one.
- *Against, point 3:* on Kalshi, [cheap longshot contracts lose money on average](https://cepr.org/voxeu/columns/economics-kalshi-prediction-market). A "moonshot" app would steer users straight into that corner.
- *Against, point 4:* broker event-contract volume is mostly sports, which would wreck the "anti-index fund" brand.

If you add them, offer economic and financial contracts only. Never sports.

**The crowd signal.** Delete the fake number. A real crowd should be blind first: you forecast before seeing anyone else's number, as Good Judgment and Metaculus do to prevent herding. The reveal afterwards is a fun moment in itself. Show the sample size, hide the crowd number below about 50 forecasts, and offer a "sharp crowd" view weighted by track record. Market odds (Kalshi or Polymarket where they exist, or options-implied) and crowd odds measure different things, so label each one.

## Top 5 proposals, ranked

1. **Resolution spec plus horizon guard.**
   - *User sees:* "Resolves YES if PortWatch's 7-day average reaches 80% of the 2025 average on any day by Jun 30, 2027."
   - *Build:* add a `resolution` field to `EventQuestion`. Make `src/data/__tests__/integrity.test.ts` fail if any linked bet expires before its question resolves.
   - *Lenses:* 3, 4.
   - *Risk:* questions get drier. Fix it with a plain-English headline above the fine print.
   - *Effort:* **S**.
2. **Probability slider plus calibration record.**
   - *User sees:* tap yes or no, then optionally refine to a percentage. Crowd and market odds appear only after you commit.
   - *Build:* score forecasts separately from bets: Brier for display, a score relative to the market for leagues.
   - *Lenses:* 4, 5, 2.
   - *Risk:* extra friction. Also, options overprice the tails, so scoring against raw options odds rewards people who lowball the tails, the opposite of moonshot betting. Score against a baseline adjusted for that bias.
   - *Effort:* **M**.
3. **Basis bridge / edge meter.**
   - *User sees:* the Event → Mechanism → Price chain with prediction-market reference odds, plus the "right and still lose" list.
   - *Lenses:* 1, 4.
   - *Risk:* "edge" language may count as personalized advice. Needs counsel.
   - *Effort:* **M**.
4. **Conditional decision tree with checkpoints.**
   - *User sees:* the LLM proposes 2–4 steps from vetted templates, the user adjusts each probability, and the product versus the implied probability is their edge. Each step resolves monthly.
   - *Lenses:* 4, 5, 1, 3.
   - *Risk:* invented cause-and-effect links and false precision. Keep a human-curated library of steps.
   - *Effort:* **L**.
5. **"Called it" cards.**
   - *User sees:* entry and resolution cards, forecast first, with timestamped market odds.
   - *Lenses:* 2, 5.
   - *Risk:* winners-only bragging. Showing returns brings in FINRA 2210 rules on communications.
   - *Effort:* **S** once #1 and #2 exist.

## One big swing

**"Beat Wall Street's odds."** A free, always-on forecasting game.
- Every question shows what the market charges for it: options-implied, or Kalshi where a contract exists.
- You forecast, the question resolves, and you build a public, verifiable record of where you beat the market and where you didn't.
- Each week Moonshot publishes a "Crowd vs. Wall Street" board, drawn from its best-calibrated users, showing where they disagree with the market.
- Real-money bets become an optional way to act on an edge you've already shown, not the product itself.

The calibrated leaderboard is the moat: nobody else scores retail forecasts against the options market. It also justifies every 3x bet ("you've shown edge here"), and it hits all five lenses.

## Red lines from my discipline

- No made-up crowd numbers or odds in any build that outsiders see. Remove `crowdYes` or label it SAMPLE.
- No question ships without a named source, a threshold, an exact timestamp, and a check that the bet doesn't expire first.
- Never call risk-neutral odds "the chance," and never present the probability of a stock move as the probability of the event.
- No sports, election or war contracts. Show Kalshi and Polymarket odds for reference only until counsel approves, and check their data licenses.
- Gamify forecasts, not trades: no P&L leaderboards, no trading streaks, no confetti. Robinhood's 2024 settlement with Massachusetts was over exactly this.
- An LLM never resolves a question on its own.
- Wherever the app sells outcomes the market prices below 15%, say plainly that longshots lose money on average.
