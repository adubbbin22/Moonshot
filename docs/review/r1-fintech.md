# Round 1: Fintech/brokerage expert memo

## Verdict on the current app

- **The guardrails are the business.** Defined risk, a monthly budget, a 30% cap, the 3x filter, kill criteria and "no confetti" are the opposite of what Massachusetts fined Robinhood $7.5M for ([ThinkAdvisor](https://thinkadvisor.com/2024/01/18/robinhood-to-pay-7-5m-over-gamification-practices)). That's a regulatory moat. Don't trade it for engagement.
- **Two things can't reach an outside user:** the fake `crowdYes` split (it's misleading) and Yahoo prices (unlicensed).
- **Everything is priced at mid:** cost, the 3x check, paper fills and portfolio marks. On 420-day out-of-the-money spreads in OKLO, ASTS and FRO, the bid/ask can eat much of the debit. Paper will flatter real results, and "pays 3x" may be false at the price you can actually trade.
- **Sizing breaks at the low end.** At $100/mo the per-bet cap is $30, but the integrity test allows bets up to $249. At the $500 default ($150 cap), part of the catalog can't be bought.
- **The yes/no feed hides basis risk.** You can be right about Hormuz and still lose on FRO.

## Lens by lens

1. **Unique take.** A budgeted convexity sleeve is real differentiation and the best story for a regulator. What's missing: the safe side of the barbell doesn't exist (see the big swing).
2. **Word of mouth.** Today the only shareable thing would be P&L. Let users share the *call* (question, stance, market odds then, resolution later), never the return. A branded "I made 6x" card makes the firm the speaker, which is performance advertising.
3. **Viable at scale.**
   - *Unit economics:* $10/mo subscription. Data is mostly fixed, about $3–6k/mo for a vendor business plan plus a delayed display license. Avoid per-user real-time fees ($1.25/user/mo, [OPRA](https://cdn.opraplan.com/documents/OPRA_Fee_Schedule.pdf)) by never *displaying* real-time quotes: show a max-debit limit instead. Alpaca's partner pricing is negotiated ([Sacra](https://sacra.com/c/alpaca/)); budget $1–3 per funded account. The LLM costs under $0.50 per user. Expiry and assignment support is the real variable cost.
   - *CAC:* at ~70% margin and 4% monthly churn, LTV is about $175, so CAC must stay under about $60. Growth has to be organic.
   - *The killer:* most bets expire worthless, and wins arrive 12–24 months out. Churn after the first losing cycle decides the business.
   - *At 100k users:* prices computed on the server and recorded. WORM storage of every price, odds figure and LLM output shown. A principal approving 5–10 new feed items a day. Licensed support for expiry weeks. Caps on Moonshot's share of open interest per strike.
   - *At 1M users:* correlated theses become firm risk. One AI drawdown hits most users at once and becomes the headline. Publish aggregate outcomes.
4. **Smart.** "What has to be true" is excellent. The missing piece is a legal boundary for the LLM (Proposal 1). The legal "feel smart" moment: *you* say 60%, the market implies 22%, here's what you'd have to believe. It compares the user's own view with a market price.
5. **Gamified.** Score forecasts, not trades (Proposal 4).

## Top 5 proposals, ranked

**1. Thesis compiler with a recommendation firewall.**
- *What the user experiences:* the LLM interviews them about *the world*. It breaks down sub-claims, runs a pre-mortem and drafts kill criteria. It outputs only parameters (direction, horizon, size of move, sector). Plain code then shows *every* catalog match, both sides, unranked.
- *Firewall:* the LLM never names a ticker, strike or size, never says "should", and never sees KYC data. Outputs are logged and supervised like any other communication ([FINRA AI FAQ](https://www.freewritings.law/2024/05/frequently-asked-questions-for-finra-member-firms-on-ai-use-in-public-communications)).
- *Lenses:* 4, 3.
- *Risk:* the more tailored it gets, the more it looks like a recommendation. Unregistered, Moonshot can't make one at all, and Alpaca will forbid it.
- *Effort:* M.

**2. Executable truth.**
- *What the user experiences:* "Most you'll pay" (a limit at the natural price), "Worth if sold today" (the bid side), and the round-trip cost and fees. The 3x test uses executable prices. Bets that fail an open-interest or bid/ask-width gate are hidden. Paper orders fill only at a marketable limit.
- *Why it's required:* Rule 2220(d)(3) allows projections like the odds ladder only if the options disclosure document accompanies or precedes them, nothing implies certainty, and costs are included ([FINRA filing](https://www.finra.org/sites/default/files/2023-11/sr-finra-2023-016.pdf)).
- *Lenses:* 3, 4.
- *Trade-off:* fewer bets and smaller multiples.
- *Effort:* S–M.

**3. Lifecycle autopilot, chosen at entry.**
- *What the user experiences:* standing instructions picked at purchase: take profit at 90% of max, close N days before expiry, and close ahead of an ex-dividend date when a short call is at risk (FRO and EQT pay dividends). Doing this *without* the user's instruction is discretionary trading, which needs written authorization.
- *Why it matters:* Alpaca auto-exercises anything $0.01 in the money and liquidates when buying power is short ([Alpaca](https://docs.alpaca.markets/docs/non-trade-activities-for-option-events)). One early assignment on a QQQ put spread drops about $50k of stock into a $150 account.
- *Also:* stagger expiries. The same `minDays` puts every user in the same contracts with the same exit week.
- *Lenses:* 3.
- *Effort:* L.

**4. Calibration-first gamification.**
- *What the user experiences:* free forecasts on every question, Brier-scored. Short-dated questions resolve in weeks, so feedback lands before the bets do. Friend leagues rank calibration. Streaks reward kill-criteria check-ins, not trades. Budget increases take effect next month; decreases are instant.
- *Lenses:* 2, 4, 5, and retention.
- *Risk:* forecasting without money can feel flat.
- *Effort:* M.

**5. Paper, then Level 2, then Level 3, on a subscription.**
- *What the user experiences:* a paper beta on licensed delayed data with realistic fills. Real money starts with long options; spreads come after Level 3. The catalog filters to each user's approved level.
- *Guardrails:* ask Alpaca whether spreads need a margin agreement, and disclose margin if so. Robinhood's $70M FINRA case covered 818k customers who weren't told about margin, plus approval bots ([Bloomberg Law](https://news.bloomberglaw.com/antitrust/robinhood-to-pay-finra-record-70-million-penalty-over-lapses)). Deposits settle before they can fund options (instant ACH is first-party fraud bait).
- *Revenue:* no PFOF. At about $0.35–0.56 per contract ([Global Trading](https://www.globaltrading.net/?p=39306)), it pays you for more trades.
- *Lenses:* 3.
- *Effort:* L.

## One big swing: the Barbell Account, run as a registered internet adviser

- **Moonshot holds both ends.** The safe sleeve sits in a Treasury or cash sweep. Moonshots are funded from the yield plus a top-up, capped as a percentage of the safe balance.
- **Register under the 2024-amended internet adviser rule** ([Goodwin](https://www.goodwinlaw.com/en/insights/publications/2024/04/alerts-finance-pif-the-sec-amends-the-internet-adviser-exemption)). The LLM can then personalize *legally*, under a fiduciary duty, sized to the user's real assets: the only fiduciary that helps you size a moonshot.
- **Revenue:** an advisory subscription plus sweep economics, and deposits that survive losing bets.
- **Costs:** a chief compliance officer, exams, and Marketing Rule limits on hypothetical performance. You can never say "principal protected." At 3–4%, $10k yields about $30/mo, so the top-up does the work. Confirm with counsel that app-only delivery qualifies.

## Red lines from my discipline

- **No fake crowd numbers.** Real splits get labelled "Moonshot users' picks", not odds.
- **No payouts on the question, no pooled or fractional contracts, no peer-to-peer wagers.** Those are CFTC event contracts or a fund, each needing a separate license.
- **The LLM never names a security, strike or size for a user,** and KYC data never goes into a prompt.
- **No P&L leaderboards, trade streaks, celebrations on orders, random rewards, or referral bonuses paid in securities.** No pushes about securities the user doesn't hold.
- **No hypothetical-return marketing** ("$100 → $1,000"), no undisclosed influencers, no targeting of students or minors.
- **Never coach answers on the options application.** Never show mid as the cost. Never allow a budget increase right after a loss.
