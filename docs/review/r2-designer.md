# Round 2: Designer

## Endorse / challenge / merge

**Fintech**
- **Thesis compiler with firewall: endorse, merged into the Thesis Tree.** One challenge: an unranked flat list is a dead end. Keep every match unranked, but group them under the cause-and-effect step they depend on, in a fixed order (by expiry), with the opposite side shown next to each.
- **Executable truth: endorse fully.** It changes the headline from "$116 → $600 · 5.2×" to roughly "$128 → $600 · 4.7×" at the natural price. Show that number.
- **Lifecycle autopilot: endorse,** as a visible "Exit plan" card next to the kill criteria, with defaults showing.
- **Barbell Account: challenge for now.** Don't build v1 around a registration the company doesn't hold. Strong v3.

**Prediction markets**
- **Resolution spec plus horizon guard: strongest endorse.** On screen: a plain headline, then a "How this resolves" line that expands to the full rules.
- **Event → Mechanism → Price chain: endorse.** It becomes the top of the bet screen and the spine of the ticket.
- **Conditional tree: merge with the Thesis Tree.** At most three steps, coarse sliders, and a running product that updates live. The moment the product drops below the market's number is the magic.
- **Tail-bias warning: endorse,** on every bet the market prices below 15%.

**Growth**
- **Called It cards: merge with Tickets.** One object from entry to resolution.
- **Free calls plus Season 0: endorse.**
- **Challenge links: endorse.** A friend picks a side on the web without installing the app. That's the acquisition loop.
- **Thesis authors widget: defer.** Supervising influencers is heavy.
- **Rename and copy fixes: endorse.** "Wrong: lose a little" becomes "Wrong: lose it all. That's the plan: it's small."

## Positions

- **T1:** a forecasting game with money as the "conviction tier". Options price the consequences of events, which only options can do. Subscription revenue with no payment for order flow. Free: calls, record, crowd reveal, cards. Paid: Thesis Tree depth, Pulse, real-money bets, the season letter.
- **T2:** the LLM works on the world; code works on securities.
  - *The LLM may:* turn a belief into a claim that can resolve, pick steps from a curated library of cause-and-effect links, write the steelman, draft kill criteria, and output parameters.
  - *The LLM may not:* name a ticker, strike or size, say "should", or supply any number.
  - *Dropped:* "tanker owners are less crowded". The magic moves to the mechanism and to code-computed math ("Your chain multiplies to 16%; the market charges 26%").
- **T3:** the horizon guard is non-negotiable, and "Call only" becomes a first-class state. Event contracts are for reference odds only for now. Tickets get two stamps: "Called it" for the forecast and "Expired" for the bet.
- **T4:** one number per bet, the executable cost ÷ max payout, framed as "Pays off for you if the chance is above 26%". The model ladder moves under "Under the hood". Scoring runs internally against mid prices with the tail-bias adjustment.
- **T5:** merge everything into a **Sunday Check**: checkpoint results, signposts that moved (with sources), and 2–3 new short-dated questions.
  - One scheduled push a week, opt-in by theme.
  - Event pushes only when one of your calls resolves or one of your kill criteria fires.
  - Never price moves, never securities you don't hold.
  - Hard cap of 2 pushes a week, plus quiet hours.
- **T6:** drop $100 as a real-money budget. Default $500, shown as shots: "$500 ≈ 4 shots this month". Filter the catalog by budget and approval level, and keep free calls on every question as the fallback.
- **T7:** rename. Use growth's positioning ("Keep your index fund. Put your takes here."). Test "Barbell" (it reads gym-adjacent). The night-sky visual goes with the old name.
- **T8:** merge. "Beat the market's odds" is the identity, with Fund I as the season container. The Barbell Account comes later.
- **T9:** a slider into a void feels flat. Fix it with:
  - an opponent (you vs. Wall Street's odds)
  - fast resolution (checkpoint questions)
  - social stakes
  - scarcity: 5 conviction calls per season, scored 3×, not purchasable

  "Honest exit" is awarded for flagging that your own kill criterion fired, whether or not you trade. Streaks apply to the Sunday Check only.

## Final top 5

1. **Resolvable questions plus horizon guard.** Metric: resolutions settled without appeal, above 99%.
2. **Call → Reveal.** Metric: 3+ calls in the first session, 40%.
3. **Thesis Tree inside the firewall.** Metric: bets with a user-written or user-edited why and kill criteria, 70%.
4. **The Ticket.** One object across bet screen, confirmation, portfolio and share card, with two stamps at resolution. Metric: card-driven K-factor of at least 0.3.
5. **Sunday Check plus seasons and leagues** ranked on score relative to the market. Metric: week-4 retention of callers of at least 25%, with trades per user flat.

## What changed

- **Resolution is the base of the design, not plumbing.** The call and the bet need separate results.
- **The bet's number should be its break-even odds**, not "1-in-9" from the model ladder.
- **The LLM's magic is reasoning, not picking.**
