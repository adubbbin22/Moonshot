# Round 1: Growth marketer memo

## Verdict on the current app

- **The product is honest and well made, but it has no loop.** Nothing leaves the app because there's no way to share, and nothing brings people back. The FRO bet expires in 210 days and the questions resolve in 2027–28. Between "You're in." and expiry, the app has nothing to say to the user.
- **The feed question is the best growth asset you have, and its crowd split is fake.** "Will Hormuz normalize?" is a debate, and debates spread. Prediction markets proved it: Kalshi traded $31.5B in June 2026 alone ([The Block](https://www.theblock.co/post/406983/kalshi-polymarket-volume-45-billion)), and event contracts are now Robinhood's #2 transaction revenue line ([BrokerChooser](https://brokerchooser.com/news/prediction-markets-become-robinhoods-second-largest-revenue-driver--0c37bdeb)). The 42/58 split, though, is made up. Fake social proof destroys trust fastest, and trust is what this brand sells.
- **The confirmation screen is a dead end.** It's the moment of highest intent, and it should be where the share card appears.
- **Two lines of copy won't survive compliance review.**
  - "Wrong: lose a little." The likely outcome is losing 100% of the stake: the FRO bet shows 23% market odds of profit, so 77% odds of no profit.
  - "You only need one to hit." This implies the portfolio math is sure to work out.
- **The name is already taken in your category.** A memecoin app called "Moonshot" hit #1 in App Store Finance with 1M daily users during the TRUMP coin launch ([Blockworks](https://blockworks.co/news/jupiter-majority-stake-moonshot)). That brings search collisions, trademark risk and exactly the wrong association. Rename before any public marketing.

## Lens by lens

**1. A unique take.**
- **Working:** options used as a prediction market, with a hard max loss and odds that come from the market rather than from us. That's genuinely new.
- **Missing:** "anti-index-fund" picks a fight with your best prospects. People who own index funds and also have strong opinions are the target, not the enemy.
- **Proposal:** position the app as the other end of the barbell.
  - One-line story: *"Keep your index fund. Put your takes here: small bets where the most you can lose is what you paid, and a record of whether you were right."*
  - Tagline: *"Have a take? Cap the downside."*
  - Rename shortlist: **Barbell**. It owns the philosophy and implies the safe side. Needs a trademark check.

**2. Word of mouth.**
- **Working:** the questions are naturally debatable.
- **Missing:** everything social.
- **Proposals:**
  - Called It cards (Top 5, #1).
  - A real crowd split: "You're with 31%."
  - Challenge links you can send to a friend.
- **News moments:**
  - Publish a human-approved "breaking question" within 60 minutes of a big event (a Fed surprise, a Gulf incident, a frontier AI model launch).
  - Pair it with a live chart: "options-market odds moved 18% → 34%." That chart is the object people repost, the way Polymarket odds became native to X ([TechCrunch](https://techcrunch.com/2025/06/06/x-names-polymarket-as-its-official-prediction-market-partner/)).
  - Resolution days are content days too: "Resolved YES. 31% of users called it."
- **The first 10,000 users are not WallStreetBets.** That crowd wants same-day (0DTE) options. A 3x minimum and budget caps will bore them, and they are your biggest compliance risk. Target people who have strong takes and also own an index fund. Find them here:
  - Polymarket, Kalshi, Manifold and Metaculus users.
  - Finance and tech circles on X.
  - Readers of macro, tech and geopolitics Substacks.
  - People near r/Bogleheads, and people learning on r/options.
  - Founders and VC people who already think in power laws.
- **Seeding:** hand-pick 100 "founding forecasters" whose records go public at launch.

**3. Viable at scale.**
- **Funnel:** real money is gated by identity checks (KYC) and options approval (Level 2 or 3), so the top of the funnel has to be free and instant: free calls, then paper bets, then real money. Paper isn't a limitation. It's the waitlist: call it "Season 0".
- **Marketing line:** a subscription model lets you say "we make nothing when you trade." It's true, rare, and the strongest compliant marketing line you'll have.
- **Question supply:** you need 30+ live questions with staggered resolution dates. An LLM drafts them and a human approves.
- **Metrics that prove product-market fit:**

| Metric | Target |
| --- | --- |
| Activation: 3+ calls with a written "why" in the first session | 40%+ |
| D30 retention for users who make calls | 25%+ (fintech baseline is roughly 5–12%, [Plotline](https://www.plotline.so/blog/retention-rates-mobile-apps-by-industry)) |
| Weekly actives / monthly actives | 40%+ |
| Resolutions per active user | 1+ per week |
| Return within 48h after a call resolves | Tracked: shows whether the record matters |
| Organic K-factor from cards | 0.3+ |
| Sean Ellis "very disappointed" among users with 1+ resolution | 40%+ |
| Paper to real money within 90 days of eligibility | 10%+ |

- **Guardrail to show regulators and press:** engagement goes up while trades per user stay flat.

**4. Smart.**
- **Working:** the odds ladder, kill criteria and the "your why" box.
- **Missing:** people feel smart when they're proven right and when they saw what others missed. The app offers neither.
- **Proposals:**
  - Score every call against the market's odds at the moment it was made: "you called it at 23%."
  - Before a bet is placed, an LLM plays devil's advocate. It writes the strongest case against the bet plus a tree of signposts that become your alerts. "My thesis survived the bear case" is itself shareable.

**5. Gamified.**
- **Working:** no confetti. Keep it that way.
- **Missing:** any feeling of a game.
- **Proposal:** gamify forecasting, never trading.
  - Treat the monthly budget as a fantasy-league salary cap: 3 shots a month, 30% max each.
  - Run quarterly seasons, with leagues ranked on calibration against market odds.
  - Award "Early" badges for being right when the market said under 25%.
  - Allow streaks only for weekly check-ins or free calls.
- **Why the line matters:** Robinhood paid Massachusetts $7.5M over confetti, scratch-ticket free stock and push notifications ([ThinkAdvisor](https://thinkadvisor.com/2024/01/18/robinhood-to-pay-7-5m-over-gamification-practices)). The SEC withdrew its proposed rule on digital engagement in 2025 ([Proskauer](https://www.proskauer.com/alert/sec-withdraws-fourteen-rule-proposals)), but that didn't stop the states.

## Top 5 proposals, ranked

**1. Called It cards** (M) · Lenses 2, 4, 5
- **What the user experiences:** after placing a bet, you get a card showing:
  - the question and your side
  - the date
  - "Options market odds: 23%"
  - one line of your why
  - the payoff shape

  There are no dollar amounts. When the question resolves, the card flips to "Called it Oct 24, 2026 at 23%" or a graceful "Missed."
- **Risks:**
  - Creep toward bragging about dollar gains.
  - If official accounts repost cards, the firm counts as having adopted them ([FINRA 17-18](https://www.finra.org/rules-guidance/notices/17-18)).
  - A question-to-ticker link that looks shaky invites ridicule once it's shared.

**2. Free calls plus Season 0 paper** (S–M) · Lenses 1, 2, 3, 5
- **What the user experiences:**
  - You pick yes or no on any question without creating an account, and your record starts immediately.
  - Paper bets are one tap deeper.
  - Real money unlocks later, and your record carries over.
- **Risk:** it becomes a free prediction game that never earns money. Watch the paper-to-real conversion rate.

**3. Real crowd, challenges and private leagues** (M) · Lenses 2, 5
- **What the user experiences:**
  - The feed shows "You're with 31%."
  - You can send a call to a friend, who picks a side on a web page without installing the app.
  - Groups of 5–20 run a season ranked on calibration.
- **Risks:**
  - Social pressure to bet bigger.
  - Never rank on dollars or trading volume.
  - Never pay referral bounties.

**4. Thesis Pulse** (M–L) · Lenses 2, 4, 5
- **What the user experiences:**
  - Each open shows how your theses moved, e.g. "odds of profit 23% → 27%".
  - It shows the signposts the LLM watched, with a source link: "Two insurers cut Gulf war-risk premiums. This counts against you."
  - A Sunday drop brings 3 new questions, including short-dated ones (Fed meetings, CPI, earnings, launches).
  - Notifications report what changed in the world, never what to trade.
- **Risks:**
  - LLM mistakes. Human review and cited sources mitigate them.
  - Notification fatigue.
  - Regulatory scrutiny of engagement features.

**5. Thesis authors plus an embeddable widget** (M) · Lenses 1, 2, 4
- **What the user experiences:**
  - Writers on Substack and X publish a question with its signposts.
  - Readers vote in an embedded widget.
  - Authors earn a public calibration record in the app.
- **Risk:** M1 Finance paid $850K over 1,700 influencers it didn't supervise ([FINRA](https://www.finra.org/media-center/newsreleases/2024/finra-fines-m1-finance-850000-violations-regarding-use-social-media)). The conditions:
  - Flat fees only.
  - Content pre-approved by a registered principal, plus Rule 2220 requirements for options communications.
  - All content archived.
  - No per-account bounties and no copy-trading.

## One big swing

**"Beat the market's odds": a public, portable forecasting record.**
- **How it works:** every call is stamped with the options-implied probability at the moment you made it. Your score is how far you beat those odds over time. It rewards being early and contrarian, which is the barbell idea exactly.
- **What it becomes:** your profile, your league rank, your credential as a creator and your share card. Think Strava for conviction.
- **Why it's unique:** no brokerage scores you against the market's own odds. No prediction market can either, because it *is* the odds.
- **Business effect:** money becomes optional, so the free tier can go on forever and real money is a natural upgrade.
- **Risk:** top forecasters become de facto advisers. "Following" someone means reading their theses, never copying their trades.

## Red lines from my discipline

- No made-up stats. Remove the fake crowd split before anyone outside the team sees it.
- No dollar profits, percentage returns or "users made X" on share cards, in ads or in creator posts.
- Paper results are hypothetical performance. Never market them.
- Official accounts don't repost users' wins without review by a registered principal.
- No referral rewards in cash, stock or free contracts.
- No influencer deals paid per account opened.
- No streaks, badges, leaderboards or notifications tied to placing trades or to how many trades someone makes.
- No "trade now" push notifications.
- No celebration animation when a bet is placed.
- Notifications are opt-in by theme.
- No downside-minimizing copy. Next to every upside figure, say plainly that you can lose 100% of the stake.
- No copy-trading and no "bet like @creator".
- No public launch under the name "Moonshot".
