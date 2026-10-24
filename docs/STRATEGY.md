# Strategy review: four specialists, two rounds

_October 2026. A designer, a fintech/brokerage expert, a prediction-market
specialist and a growth marketer each reviewed the prototype against the
founder's five lenses. In round two they read each other's memos and resolved
their disagreements. Their memos are in [review/](review/). Figures and legal
points are as cited by the specialists; verify them before relying on them._

The five lenses:
1. A genuinely unique take on investing
2. Components that make it interesting and drive word of mouth
3. Functionally viable at scale
4. Smart: it makes people feel smart, with LLM-built decision trees
5. Gamified: it feels like a game

## The answer in one paragraph

Moonshot should be **a forecasting game where you try to beat the market's
odds, with small options bets as the paid way to act when you disagree.**
- **Forecasting is free.** Every question resolves on a named data source, so
  users build a public, timestamped record of how often they beat the market.
  Something they called resolves every week.
- **Options are what make it real.** Options price the *consequences* of world
  events, which no prediction market does. When your number is higher than
  what a bet costs, the app shows you ways to express the view, with defined
  risk and an exit plan.
- **The LLM does the reasoning, not the picking.** It turns your belief into
  testable steps and argues the other side. Plain code does every number, and
  the LLM never names a security.
- **The game rewards being right, never trading more.**

All four specialists ended round two on this shape.

## How it answers the five lenses

| Lens | The answer |
| --- | --- |
| **1. Unique** | No brokerage scores you against the market's own odds, and no prediction market can, because it *is* the odds. Options give market prices for consequences ("if Hormuz stays shut, does a tanker stock clear $32?"): a second-order prediction market nobody owns. |
| **2. Word of mouth** | The **Called It card**: timestamped, forecast-first, no dollars, and it flips when the question resolves. Plus **challenge links** (a friend picks a side on the web, no install), a real **crowd reveal**, and **news moments**: pre-approved question templates published when a Fed meeting, CPI print or launch hits. |
| **3. Viable at scale** | Free forecasting at the top of the funnel. A **~$9–10/mo membership** for real-money bets, with no payment for order flow. **Executable prices** everywhere. An **LLM drafts questions; a human approves and resolves them.** Lifecycle **autopilot** so nobody gets assigned stock. Paper first, then Level 2 (long options), then Level 3 (spreads). |
| **4. Smart** | You state a probability. The app reveals the crowd's and the market's odds. **Calibration** (does 70% from you happen 70% of the time?) gives feedback every time something resolves, while P&L says almost nothing about skill for years. The **Thesis Tree** breaks a belief into conditional steps, and the multiplied-out chain exposes the conjunction fallacy. Making that click is the "I feel smart" moment. |
| **5. Gamified** | **You vs. the market** is the opponent. Weekly **checkpoint** resolutions, quarterly **seasons**, friend **leagues** ranked on calibration, and five **conviction calls** per season scored 3×. Each year is a **Vintage**, a night sky where most stars fade and one may blaze. Nothing in the game rewards placing, sizing or making more trades. |

## The core loop

```
 Call ──► Reveal ──► (optional) Express ──► Sunday Check ──► Resolution ──► Called It card
  │         │              │                   │  checkpoints     │              │
  │         │              │                   │  resolve weekly  │              ▼
  │         │              │                   │                  │       Vintage letter
  │         │              ▼                   │                  │       (end of season)
  │         │        bet with exit plan,       │                  │
  │         │        on executable prices      │                  │
  │         ▼                                  │                  │
  │   crowd + market odds                      │                  │
  ▼   (blind until you commit)                 ▼                  ▼
 free, no account needed               one push a week     score vs. market
```

## Cold start: from a stranger to ways to express (built)

_In the prototype as of October 2026. Routes are in `src/app/welcome/`._

A new user arrives with no data. The rule is **personalize the questions,
never the trades.** What we learn decides which question comes next. The bets
come only from the user's own calls, and they're the same for anyone who made
that call.

1. **Intro.** One screen: make the call, see the market's odds, bet small only
   when you disagree.
2. **Topics (optional).** Six chips. They're only a seed: they set which topics
   come first and add a small bonus. Skipping works fine.
3. **Six quick calls.** Tap Yes or No, then a confidence chip (Lean 60%,
   Likely 75%, Sure 90%; Likely is preselected), then "Lock it in". "Skip, no
   take" is a signal too. You can leave after three calls.
4. **Reveal after each call.**
   - Your number.
   - The crowd, shown as "Shows after 50 calls". It is never faked.
   - "What the market charges ~X%" for the linked bet. A caption says this is
     the bet's price, not the odds of the question.
   - Questions where no bet fits say so. The call still counts.
5. **Your take profile.** What you think, not what you'd buy:
   - topics weighted by calls and skips;
   - your strongest views, ordered by conviction;
   - a call style (measured, confident or bold);
   - a short narrative that never contains a number.
6. **Terms.** Budget and disclaimer. These come after the user has seen what
   the app does, not before.
7. **Ways to express.**
   - Your views, ordered by your conviction.
   - Under each view, the bets that pay if you're right, in expiration order.
   - A bet is shown only if it passes the horizon guard, still pays 3x at
     today's prices and fits under your per-bet limit.
   - Bets that don't fit are counted, with the reason ("2 more are over your
     $150 per-bet limit").
   - Nothing is pre-sized.

**Two profiles, kept apart:**

| | Take profile | Money profile |
| --- | --- | --- |
| Holds | Views, topics, confidence, call style | Budget, per-bet cap; later KYC and options level |
| Comes from | Calls and skips | The user, at the terms step |
| Drives | The next question; the narrative | Which bets fit; sizing on the bet screen |
| The LLM sees it | Yes, for the narrative | Never |

**Choosing the next question** (`domain/questionSelector.ts`) is
deterministic:
- **Coverage first.** Ask one question from each seeded topic, or from every
  topic if none were picked.
- **Then follow engagement.** A topic's score is +1 per call, −0.75 per skip,
  and +0.5 if it was seeded. Topics not yet touched get a 0.25 curiosity
  bonus.
- Within a topic, questions come in catalog (editorial) order.

**The LLM seam.** `services/intelligence/narrator.ts` defines `TakeNarrator`.
Its input is the take profile only, so money and identity data are kept out by
the types. Today a template writes the paragraph. The production version runs
an LLM on our backend inside the firewall: no securities, no numbers.

**Market odds on the reveal.**
- For a spread, the market odds are cost ÷ max payout, a price read straight
  from the market.
- For a long option, which has no cap, they're the model's chance the bet
  profits, and they're labelled as such.
- Bets are priced against the question: the earliest expiration allowed is
  the resolution date plus 30 days.

## The product, piece by piece

### 1. Resolvable questions and the horizon guard (build first)

Every specialist ranked this first. It's also a compliance control.

- **Data model:** every question carries a resolution spec: the source,
  metric, threshold, exact timestamp, revision rule and when it resolves N/A.
  Users see a plain headline, then "How this resolves", which expands to the
  full rules. Example: *"Resolves YES if IMF PortWatch's 7-day average of
  Hormuz transits reaches 80% of the 2025 average on any day by Jun 30, 2027."*
- **Prefer data sources over judgement calls:** PortWatch, the FOMC target
  range, METR's AI time-horizon measurements, official statistics.
- **Horizon guard:** a bet's planned close date must fall at least 30 days
  after its question resolves. This is enforced in
  `src/data/__tests__/integrity.test.ts` and again at pricing time. Write
  question deadlines to fit the listed expirations, not the other way round.
- **No bet that fits?** The question is **call-only**, a first-class state
  like today's "No bet on this side".
- **The pipeline at scale:** news → an LLM drafts the question and spec → a
  second "rules lawyer" LLM pass tries to break it → automatic checks
  (expirations, open interest, bid/ask width) → human approval → humans
  resolve, with a public log and an appeal window. **An LLM never resolves a
  question.**

### 2. Call → Reveal

- **The call:** tap Yes or No, then set your confidence in one tap. Chips
  (Lean 60% · Likely 75% · Sure 90%) come preselected, and a slider is
  available to refine. That keeps first-session friction low and still
  produces a probability to score.
- **The reveal:** after "Lock it in", the card flips. It shows your number,
  the crowd histogram (hidden until about 50 real calls), and the market's
  odds for the bet linked to this question, labelled as such. "You vs. market:
  +24 pts." Never "edge".
- **Express:** if your number is above the bet's break-even odds, show "Ways
  to express this view". Every user on that side sees the same bets, in a
  fixed order, unsized. Otherwise show "No bet: the market already charges
  more than you think it's worth."

### 3. The Thesis Tree, an LLM decision tree inside a firewall

What it does:
1. **Restate:** the user's belief ("the Gulf stays a mess") becomes a claim
   that can resolve. The user confirms or edits it.
2. **Branch:** up to three "which means…" steps. The LLM proposes world steps;
   the links from world to market come from a curated, compliance-reviewed
   **mechanism library** (e.g. *disruption → war-risk insurance premiums →
   tanker day-rates*). A mini-map grows a node per step, and tapping a node
   rewinds and branches.
3. **Put numbers on it:** the user sets a probability on each step with coarse
   sliders. Code multiplies the chain live: *"Your chain: 16.5% · Market-implied:
   11%."* The moment the product drops below a step the user felt sure about
   is the lesson.
4. **Steelman:** the strongest case against. One tap turns it into kill
   criteria.
5. **Leaves:** every catalog bet that matches the final mechanism, grouped
   under the step it depends on, ordered by expiry, with the opposite side next
   to it. Identical for every user who reaches that mechanism.
6. **Checkpoints:** each world step also becomes a short-dated, data-resolved
   question (*"PortWatch 7-day average on Jan 31, 2027 below 80% of 2025?"*).
   That's what fills the weeks between bet and expiry.

The firewall:

| The LLM may | Plain code must own | Never |
| --- | --- | --- |
| Restate beliefs as resolvable claims | Mapping mechanisms to catalog bets | The LLM names a ticker, strike or size |
| Propose world steps; pick mechanism-library links | Every number: prices, odds, multiples, the product of the user's own probabilities | The LLM says "should" or produces any number |
| Write the steelman; draft kill criteria for the user to accept | Ordering, filtering, sizing and the "no bet" rule | KYC or account data in a prompt |
| Explain structures; summarize news with sources | Rendering catalog bets by pointer | LLM-written investment opinions ("the less crowded trade") |

The magic moves from *picking* to *reasoning*:
- the mechanism ("you said insurance is the choke point, not supply: that's a
  different bet from 'oil goes up'")
- the steelman
- the conjunction math

Human-reviewed catalog copy can carry trade-specific insight, identical for
everyone. Every LLM output shown to a user is logged and supervised like any
other communication. If the company later registers as an adviser (see the
Barbell Account below), the LLM may tailor the shortlist and sizing, but
numbers still come from code.

### 4. The Ticket: one object from bet screen to share card

The bet screen becomes the Ticket, and the same object is the confirmation,
the portfolio row and the share card.

**Above the fold:**
- **The promise:** *"Pays $600 if Frontline closes above $32 on May 21, 2027.
  Today it's $22. It needs +45% in 7 months."*
- **The headline row:** **You can lose all $128 · pays $600 · 4.7×**
- **Break-even odds:** *"Pays off for you if the chance is above 21%"*. This
  is the natural (executable) debit ÷ width, model-free and tradeable.
  Next to it: *"Market's estimate: 19%"* (mid ÷ width), with the gap
  explained as trading cost.
- **The bridge:** Event → Mechanism → Price, with the ways to be right and
  still lose (already priced in, happens after expiry, the stock moves for
  other reasons).
- **Longshot warning:** shown wherever the market prices the outcome below 15%:
  *"Longshots lose money on average."*

**Below the fold:**
- **Your why:** starts empty, needs one sentence, with suggestion chips.
- **Kill criteria.**
- **Exit plan:** standing instructions chosen at entry, with defaults showing:
  take profit at 90% of max, close N days before expiry, close before
  ex-dividend if a short call is at risk.
- **Under the hood:** legs, mid and natural prices, the model ladder
  (skew-aware, labelled as a model) and the price timestamp.

**Sticky footer:** *"Buy 1 · $128 (paper) · leaves $372 this month."*

**Rules:**
- The 3x filter, the multiple and paper fills all use **executable**
  prices.
- Bets that fail a liquidity gate (open interest; (natural − mid) ÷ mid under
  15%) are hidden.

**At resolution** the Ticket gets two stamps: **the call** (Called it / Missed)
and **the bet** (Paid / Expired). *"Called the event. Missed the trade."* is
explained, not hidden.

### 5. The Sunday Check: what fills the months between bet and expiry

One weekly surface merges the designer's Thesis Health, the growth marketer's
Thesis Pulse and the prediction-market specialist's checkpoints:
- **Checkpoint results** from the past week.
- **Signposts for your open theses:** holding, weakening or broken. They're
  driven by data-resolved checkpoints first and cited LLM news summaries
  second.
- **Distance meters:** *"$24 → needs $32 · 186 days left."*
- **New questions:** 2–3, including short-dated ones (Fed, CPI, earnings,
  launches).
- **A three-way check-in per thesis:** *still believe / less sure / I'm out*.
  Marking your own thesis broken earns **Honest exit**, whether or not you
  trade.

**Notification policy** (all four agree):

| | |
| --- | --- |
| **Scheduled** | One a week (the Sunday Check), opt-in by theme |
| **Event-driven** | When a call or checkpoint you made resolves, or a kill criterion you wrote fires on a position you hold |
| **Operational** | Expiry, assignment, ex-dividend and autopilot messages: always sent, not counted toward the cap |
| **Cap** | Non-operational pushes capped at 2 a week, with quiet hours 9pm–8am |
| **Never** | Price moves, tickers you don't hold, "trade now", streak guilt, bet suggestions after a loss. Deep links go to the thesis, never the order ticket |
| **Records** | Every notification archived |

### 6. The game: seasons, Vintages, leagues

- **Scoring engine:** described in the next section.
- **Vintage (12 months):** your bets that year are its shots. The portfolio is
  a **night sky**: open bets glow dim, weakening ones flicker, expired ones
  fade, and a star goes supernova when *the call* resolves right (never on
  dollars).
  - The point: a healthy sky is mostly dark with one blaze. This is the answer
    to the product's hardest emotional problem, losing 8 of 10 bets.
  - Naming: not "Fund" or "LP", which imply a pooled vehicle.
- **Seasons (quarterly):** leagues reset. **Private leagues** of 5–20 friends.
  Public divisions only after 20 resolved forecasts, so luck doesn't top the
  board.
- **Conviction calls:** 5 per season, scored 3×. Not purchasable, no cash
  value. They teach position sizing without money.
- **Streaks:** weekly Sunday Check completion only, with one freeze. Never
  daily, never for trades.
- **Badges:** five, all derived from the score, not from hits, so nothing
  rewards spamming longshots. Examples: *Calibrated* (a score threshold),
  *Honest exit* (marking your thesis broken; not counted or ranked), *Called
  it early* (forecast-only, gated on a positive relative score).
- **Vintage letter:** at the end of the year the LLM writes the prose and code
  supplies every number. *"Your 70% tech calls hit 40%: you're overconfident
  there."* The shareable version shows calibration and best call, never
  returns.
- **No prizes of value.** That drifts into sweepstakes and gambling law.

## Scoring spec

- **Personal display:** Brier score, plus a calibration chart.
- **League score:** relative log score per question:
  `ln(p_user[outcome]) − ln(p_baseline[outcome])`.
  - User probabilities clipped to 1–99%, baseline to 2–98%.
  - Time-averaged over the question's open window, with equal weight per
    question.
  - At least 10 resolutions to rank.
- **Baseline, where an option prices the claim:** the mid-implied probability,
  passed through a **tail-bias recalibration curve** backtested on historical
  option chains. Options overprice tails, so raw implied odds would reward
  lowballing longshots. The curve is published and fixed, and never shown as
  "the true odds".
- **Baseline where no option prices the claim:** a licensed prediction-market
  price where one exists, otherwise the blind-crowd median at the time of the
  call.
- **Rule for cards:** never put a number on a card that prices a different
  claim than the user made. A tanker-stock probability is not a Hormuz
  probability.

## Business model and scale

| | Free | Membership (~$9–10/mo) |
| --- | --- | --- |
| Calls, reveal, public record, Called It cards | ✓ | ✓ |
| Private leagues, seasons, Vintage night sky | ✓ | ✓ |
| Paper bets | ✓ | ✓ |
| Thesis Tree | 3 a month | Unlimited |
| Thesis Pulse on your positions, deep calibration analytics | | ✓ |
| Real-money bets with autopilot | | ✓ |

**Revenue rules:**
- No payment for order flow. At about $0.35–0.56 a contract, it pays you for
  more trading.
- That makes a strong, true marketing line available: *"Moonshot earns nothing
  from your trades."* The broker's Rule 606 disclosures still apply.

**Unit economics** (fintech's estimates):
- Data is mostly fixed, about $3–6k a month for a vendor business plan plus a
  delayed display license. Real-time per-user OPRA fees are avoided by never
  displaying real-time quotes: the order uses a max-debit limit.
- The broker partner costs about $1–3 per funded account. LLM costs are under
  $0.50 per user.
- At ~70% margin and 4% monthly churn, LTV is about $175, so **CAC must stay
  under about $60**. Growth has to be organic.

**The killer metric is survival after the first loss.** Most bets expire
worthless and wins arrive 12–24 months out. Measure the share of users still
active 30 days after their first bet expires worthless.

**Money sequencing:**
1. Paper "Season 0" on licensed delayed data with realistic fills.
2. Real money with long options (Level 2).
3. Spreads after Level 3 approval.

Throughout: the catalog filters to each user's approved level, budget and
liquidity, and says so ("At $250/mo, 6 of 17 fit").
- **Budgets:** $250 / $500 (default) / $1,000 a month, with the 30% per-bet
  cap. Below $250, users play free calls and paper.
- **Timing:** budget increases take effect next month; decreases are instant.
  Never upsell a bigger budget to unlock bets.
- **Funding:** deposits settle before they can fund options.
- **Margin:** ask Alpaca whether spreads need a margin agreement, and disclose
  it if so.
- **The application:** never coach answers on the options application.

**Operations at 100k users:**
- Prices computed on the server and recorded.
- Every price, odds figure and LLM output shown to a user stored in WORM
  archives.
- A registered principal approving 5–10 new feed items a day.
- Licensed support during expiry weeks.
- Caps on the firm's share of open interest per strike, and staggered
  expiries (later dates only, so the horizon guard holds).

**At 1M users:** correlated theses become firm risk. One AI drawdown hits most
users at once and becomes the headline. Publish aggregate outcomes.

**Event contracts:** not in year one. Kalshi and Polymarket odds may appear
as reference only, under their data licenses. If added later, they'd be a
separate account through Alpaca's FCM: economic and financial contracts only,
likely with NFA registration, and no sports, elections or war.

**The long game, the Barbell Account (phase 3):**
- The safe sleeve sits in a Treasury or cash sweep. Moonshots are funded
  from the yield plus a top-up, capped as a share of the safe balance.
- Registering as an internet adviser makes LLM personalization and sizing
  legal under a fiduciary duty.
- Sequence it after product-market fit (roughly 50k forecasters).

## Name and positioning

- **Rename before any public launch.** A memecoin app called "Moonshot" hit #1
  in App Store Finance in 2025, which brings search collisions, trademark risk
  and the wrong association.
- **Lead candidate: Barbell** (all four agree, pending trademark and App Store
  search). It owns the philosophy, implies the safe side, and grows into the
  Barbell Account. The designer flags it may read gym-adjacent, so test it.
- **"Moonshots"** stays as the noun for the bets.
- **Positioning:** "the other end of the barbell", not "anti-index-fund". People
  who own index funds and have strong takes are the target, not the enemy.
- **One-liners to test:**
  - *"Keep your index fund. Put your takes here."*
  - *"Make the call. See the market's odds. Bet small only when you disagree."*
- **Ads:** keep "beat Wall Street" out of paid ads (it reads as a promise of
  outperformance). Use "vs. the market".
- **First 10,000 users:**
  - Polymarket, Kalshi, Manifold and Metaculus users
  - Finance and tech circles on X
  - Macro, tech and geopolitics Substack readers
  - Founders and VC people who think in power laws

  Not WallStreetBets. Seed 100 hand-picked "founding forecasters" whose
  records go public at launch.

## Red lines (consolidated)

**Numbers and honesty**
- No made-up numbers anywhere outsiders can see. (The fake crowd split is
  gone; the crowd shows only once there are real calls.)
- Never call risk-neutral odds "the chance". Never present a stock-move
  probability as the probability of the event.
- Never show mid price as the cost. Never market a multiple without its odds
  and "you can lose all of it".

**Trading and rewards**
- No P&L or return leaderboards, no trade streaks, no celebrations on orders,
  no random rewards, no "win it back", and no buy timers.
- No dollar profits, percentage returns or "users made X" in cards, ads or
  creator posts. Paper results are hypothetical performance and never
  marketed.
- No referral rewards in cash, stock or contracts. No influencer deals paid
  per account. No copy-trading.

**The LLM**
- It never names a security, strike or size, never produces a number, never
  resolves a question, and never sees KYC data.

**Products and features**
- No payouts on questions, pooled or fractional contracts, or peer-to-peer
  wagers. Those need separate licenses.
- No sportsbook look: no moneyline odds, flashing tickers or jargon in the
  first viewport.
- The record never pushes betting. No "you've shown edge, now bet" prompts.

## Calls I made where they still disagreed

| Question | Positions | Decision |
| --- | --- | --- |
| Which odds headline the bet? | Designer: break-even; Prediction markets: break-even plus market estimate; Fintech: mid ÷ width as "market odds" | Break-even (natural ÷ width) as the headline, market estimate (mid ÷ width) beside it, and the gap explained as trading cost. Satisfies all three. |
| Slider or tap? | Designer: slider; Growth: tap first | Tap a side, then confidence chips preselected at 75%, with a slider to refine. |
| "Fund I" or "Vintage"? | Designer/Growth: Fund I; Fintech: "Fund" implies a pooled vehicle | **Vintage**: compliance wins, same emotional frame. |
| Upsell trigger | Growth: show "act on it" after proven disagreement; Fintech: that's a gamified unlock that pushes betting | No record-based prompts to bet. "Ways to express this view" appears equally for everyone whose number clears break-even. Membership upsells are about features (Pulse, unlimited trees). |
| How many matched bets? | Fintech: all, unranked; Growth: cap at 3–5 | All matches, the same for every user, grouped by mechanism and ordered by expiry. Curate the catalog to 2–4 per mechanism so it never becomes a menu. |
| "Early" badge | Growth: right when the market said under 25%; Prediction markets/Fintech: rewards longshots | Forecast-only "Called it early", gated on a positive relative score. Never on bets. |
| Budget floor | $250 (Prediction markets, Fintech) vs. $300 (Growth) | $250 / $500 / $1,000; default $500. |

## Metrics

| Metric | Target | Why |
| --- | --- | --- |
| New users making 3+ calls in their first session | 40% | Activation of the core loop |
| Resolution disputes per 100 resolutions | under 1 | Trust in the scoring engine |
| Resolutions per weekly active user per week | 1 or more | The dead zone is filled |
| Weekly Sunday Check completion (users with an open thesis) | 50% | Retention between bet and expiry |
| D30 retention among users with a resolved call | 25%+ | Fintech baseline is about 5–12% |
| Still active 30 days after the first bet expires worthless | track; set after beta | The killer metric |
| Card-driven K-factor | 0.3+ | Word of mouth |
| Bets with a user-written why and kill criteria | 70% | Thesis-driven, not impulse |
| Buyers who can answer "most you can lose? what has to happen?" | 90%+ | Comprehension; compliance evidence |
| Free → paid within 90 days of eligibility | 8–10% | The business |
| Firewall violations in sampled LLM review | 0 | Compliance |
| **Guardrail:** trades per user | flat while engagement rises | The story for regulators and press |

## Roadmap

**Done**
- Removed the fake crowd split. `EventQuestion` has a resolution spec, and
  all 11 questions resolve on named sources.
- Horizon guard in the integrity test and at pricing time. Sides with no bet
  say so.
- The cold start (see above): topics, quick calls, reveal, take profile,
  terms, ways to express.
- Copy fixes: "Wrong: lose what you paid", "Expect most to expire worthless.
  Size them so that's fine."

**Now: prototype changes (small, no backend)**
- Persist calls and positions on the device. Today they're lost on reload.
- The confidence slider (the chips stay as the default).
- Executable pricing: natural vs. mid in the domain, executable 3x filter,
  break-even headline, liquidity gate, paper fills at natural.
- Bet screen restructured into the Ticket (promise, headline row, bridge,
  longshot warning, exit plan; legs under the hood).
- "Your why" starts empty. Drop the $100 budget.

**Next: the game loop (needs persistence)**
- Call → Reveal with local scoring (Brier, calibration chart).
- Checkpoint questions and the Sunday Check.
- The Called It card (question-level share image).
- Vintages and the night sky.

**Then: the smart layer (needs a backend and an LLM API)**
- The Thesis Tree with the mechanism library and firewall.
- The question pipeline (LLM draft → rules-lawyer pass → human approval).
- WORM logging of every LLM output.

**Later**
- Accounts, the real crowd, challenge links and private leagues.
- Settlement and resolution operations.
- Autopilot.
- Licensed data and real money (Level 2, then Level 3).
- The Barbell Account.

## Decisions for the founder

1. **Rename.** Barbell or another candidate. Commission trademark and App Store
   searches.
2. **Commit to forecasting-first**, with membership revenue and no payment for
   order flow.
3. **Engage securities counsel** before real money, on:
   - the LLM firewall
   - options communications (Rule 2220) and the disclosure document
   - Alpaca margin and Level 3 terms
   - notification policy
   - the adviser path
4. **Pick the first build slice.** The "Now" list fits in the current
   prototype.
