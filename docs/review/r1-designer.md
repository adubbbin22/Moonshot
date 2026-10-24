# Round 1: Designer memo

## Verdict on the current app

- **The thinking is ahead of the feel.** The convexity curve, kill criteria and "No obvious asymmetric bet on this side" are good, honest product moments. The screens themselves read like a nicely typeset spreadsheet: every surface is the same bordered card, there's a lot of text, and four accent colors each mean something different. The tokens say the brand is "night sky", but nothing on screen looks like one.
- **The headline number is missing.** The brand is asymmetry, but the multiple (5.2×) appears nowhere. The payout is described three ways ("Pays up to $600", "Best: +$485", "Max payout $600"). Odds are also shown two ways (23% to profit, 11% to max out), sitting next to a made-up 42/58 crowd split. Nobody can tell which percentage means what.
- **The bet screen opens with the mechanics.** Legs and mid prices sit above the plain-English promise. The screen never says "FRO needs +45% in 210 days". The buy button is about four screens down. The contract "picker" has one chip, and the ladder gives two of its four rows to slivers under 5%.
- **The user's "why" isn't really theirs.** "Your why" comes pre-filled with our rationale, and the portfolio then quotes it back as the user's thesis. The crowd numbers are invented. Both undercut the honesty the brand stands on.
- **Nothing happens after you buy.** "You're in." is a blank page and the portfolio is static. Bets resolve in 200–455 days, about 80% of them will lose, and nothing gives people a reason to come back next week.

## Lens by lens

**1. A unique take.** What works: getting from a belief to a bet with kill criteria really is new. What's missing is the sharpest angle: option prices *are* a prediction market. The core idea should be "your odds vs. the market's odds", where your edge is your belief. Proposal: make that comparison the main interaction (see #1).

**2. Word of mouth.** There are no screenshot moments yet. Proposal: build four of them. The Reveal (you vs. crowd vs. market), the Ticket, the "Called it" receipt, and the end-of-season Fund letter.

**3. Viable at scale.** Feed questions and themes are written by hand. The UI should be fixed components fed by data, so LLM-drafted questions (each with a visible resolution criterion) drop straight in. Long-dated options can't drive weekly engagement. Split free, unlimited **Calls**, which resolve fast and are the game, from budgeted **Bets**, which are how you act on a call. Design the bet catalog to degrade gracefully for users approved for long options only (Level 2).

**4. Make people feel smart.** Today the thesis builder is a quiz with a fill-in-the-blanks output that reads like a horoscope ("The trend is strong enough to push through the bumps"). Missing: second-order reasoning, a steelman of the other side, the user's own odds, and calibration feedback. Proposal: the Thesis Tree (#3).

**5. Gamified.** There's none today, which is the right call for the money path. Proposal: reward thinking, not spending. That means a calibration score, streaks for making calls, an "Honest exit" mark when you act on your own kill criterion, and seasons.

## Top 5 proposals, ranked

**1. Call → Reveal → Express** (M). Lenses 1, 2, 4, 5.
- **What the user sees:** one question per feed card with a "How likely?" slider from 0 to 100. The crowd is hidden.
- **The reveal:** after "Lock it in", the card flips to show your 70%, a crowd histogram, and the odds implied by the bet's price. Headline: "You're 45 points more confident than the market. Here's a 1-in-4 shot that pays 4.3×."
- **Two exits:** "See the bet" or "Just log the call".
- **Why it works:** the reveal is the reward, much like Wordle's stats screen. Every call is calibration data and turns the crowd into something real.
- **Risks:** the market prices "FRO above $32", not "Hormuz stays shut", so label it "market odds for this bet". Cold start: show only market odds until there are about 50 real calls.

**2. One-glance bet screen** (S). Lenses 4, 1, 3. Top to bottom:
- **The promise in one sentence:** "Pays $600 if Frontline closes above $32 on May 21, 2027. Today it's $22. It needs +45% in 7 months."
- **The headline row:** **$116 → $600 · 5.2× · 1-in-9 shot.**
- **A payoff scrubber:** drag along the price axis and watch the value change. For narrow spreads, collapse the ladder to "hits / partial / misses".
- **What has to be true** and **you're wrong if**.
- **"Your why":** starts empty, needs at least one sentence, with suggestion chips.
- **A sticky footer:** "Buy 1 · $116 (paper) · leaves $384 this month", with a stepper.
- **"Under the hood":** legs, mid prices and price timestamp go here.
- **Risk:** the fintech expert needs to define what disclosure must sit above the fold.

**3. Thesis Tree, the LLM decision tree** (L). Lenses 4, 1, 2, 5.
- **Start:** "What do you think happens?" Free text or seed chips.
- **Restate:** the LLM turns it into a claim that can resolve ("By June 2027, Gulf transits are still 20% below 2025"). The user confirms or edits it.
- **Branch:** a "which means…" path. Each step offers three generated chips plus "something else". A mini-map at the top grows a node per answer, and tapping any node rewinds and branches from there.
- **Two "smart" moments.** *Obvious vs. non-obvious trade:* "Most people would bet on oil. You said insurance is the choke point, so tanker owners are the less crowded way to bet on this." *Steelman:* the best case against you, which becomes your kill criteria in one tap.
- **Leaves:** vetted catalog bets with market odds. The shareable artifact is "My Hormuz thesis map".
- **Visual grammar:** your words in white, Moonshot's reasoning in violet, market facts in monospace with a source.
- **Constraints:** 3–5 steps maximum, and chips should stream in under 1.5 seconds.
- **Risks:** personalized advice, hallucination, and the flow feeling like homework.

**4. Tickets and receipts** (M; needs settlement). Lenses 2, 5.
- **The ticket:** every bet becomes one. It shows the multiple, your call in your own words, the target ("FRO > $32"), an expiry countdown and the timestamp.
- **Placement:** the ticket slides into your rack with a light haptic and no confetti. "Share your call" leaves out dollar amounts by default.
- **Resolution:** the ticket gets stamped **CALLED IT · 214 days early** or **MISSED**, with your original why quoted. That timestamped receipt is the strongest word-of-mouth piece in the product.
- **Risk:** communications rules on performance claims. Shares show the call and the multiple, not P&L.

**5. Thesis health, not price** (M–L). Lenses 5, 4, 3.
- **Signposts:** each position's "has to be true" items carry a status (holding, weakening, broken) from an LLM news monitor, with sources.
- **Distance meter:** "$24 → needs $32 · 186 days left".
- **Weekly Thesis Check:** one notification, three cards: "still believe / less sure / I'm out".
- **Kill-criterion prompt:** "You said you'd be wrong if insurance normalized. It just fell 30%. Close for $41 or hold?" Honoring it earns an Honest Exit mark.
- **Risks:** the LLM misreading news (always show sources; the user decides) and notification fatigue (capped at weekly).

## One big swing: "Fund I", the night sky

Every user runs a 12-month micro venture fund, with a set number of shots, one budget and a vintage year.
- **The portfolio is a night sky.** Each bet is a star, clustered by thesis. Open bets glow dim, weakening ones flicker, expired ones fade, and a hit goes supernova and lights up its constellation.
- **The power law becomes visible.** A healthy sky is mostly dark with one blaze.
- **Season's end:** an LLM writes an LP letter from your journals. For example: "Fund I returned 1.8×, carried by one Hormuz call. Your 70% tech calls hit 30%: you're overconfident there." It comes with a calibration chart and a Wrapped-style share card.
- **Friends** compare funds on calibration and best call, never on returns.
- **Why it matters:** this solves the product's hardest emotional problem, losing 8 of 10 bets, by making that the expected shape of a good fund. It serves all five lenses.

## Red lines from my discipline

- **No fake social proof.** Pull the crowd bar until the numbers are real, and never seed numbers.
- **Reward thinking, never spending.**
  - No streaks, XP, sounds or confetti tied to placing or sizing bets.
  - No "hot streak" nudges and no "win it back" prompts after a loss.
  - No buy timers and no random or loot-box bet reveals.
- **No leaderboards by return or P&L.** Calibration and "called it" counts only.
- **Never put words in the user's mouth.** LLM drafts are labeled and must be explicitly accepted.
- **The LLM never states a price, probability or payout.** Those come from the market data layer and are styled differently.
- **No push notifications on price moves.** Only signals, resolutions and the weekly check.
- **Never market a multiple without its odds.** Always "a 1-in-9 shot at 5×", never "turn $100 into $600".
- **No sportsbook look.** No moneyline odds, flashing red/green or live tickers.
- **No jargon in the first viewport,** and no greeks or implied volatility anywhere in the consumer UI.
- **Yes/no and gain/loss must never share hues.** A "No" on Hormuz is a bullish bet.
