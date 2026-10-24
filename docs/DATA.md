# Options market data: where it comes from

_Researched October 2026. Vendor prices and exchange fees change often; the
figures below come from vendor pages and third-party guides, so confirm them
with each vendor before signing anything._

## Short answer

| Stage | Prices from | Execution | What it costs |
| --- | --- | --- | --- |
| **Now: prototype** | Built-in synthetic chains (default), or your own free Alpaca account in dev builds | Paper broker | $0 |
| **Demo** | Yahoo Finance through the local demo server (`npm run market-data`, `EXPO_PUBLIC_MARKET_DATA=yahoo`) | Paper broker | $0, demo only (see below) |
| **Private beta: paper trading with real users** | Our backend proxy + a vendor plan licensed for in-app display. Delayed data is fine | Paper broker | Vendor business plan (quote needed) plus a possible OPRA vendor fee |
| **Live trading** | Delayed data for browsing; a real-time quote only on the order ticket | Alpaca Broker API (supports spreads for end users) | Above, plus real-time OPRA fees (about $1.25 per user per month) unless the broker's partner terms cover it |

The key design choice: **browse on delayed data, trade on real-time.**
Moonshot bets run for months, so a quote that's 15 minutes old is fine for
showing ideas, payoffs and odds. Delayed OPRA data has no per-user exchange
fees. Real-time data is only needed at the moment of placing an order, and
the broker uses its own real-time data to fill the order anyway.

## What the app needs

- **Underlying price** for each ticker.
- **Option chains**: for each expiration, every strike's bid, ask, last trade
  and implied volatility. This drives strike selection, cost, payoff and the
  odds implied by option prices.
- **A real-time quote at order time**, to set a sensible limit price.
- Later: **historical chains**, to show how an idea would have done (track
  record, backtests) and to settle paper positions at expiry.

The code needs one thing from a vendor: `getChain(underlying, minExpiration)`
returning a `ChainSnapshot` (`src/services/marketData/types.ts`). Anything
that can produce that plugs in.

## Licensing (the part that actually costs money)

All US listed options quotes come from **OPRA** (Options Price Reporting
Authority). Showing OPRA data to users in an app makes us a redistributor:

- **Real-time:** a per-user fee for non-professional users ($1.25 per user per
  month for the first 75,000, falling to $0.60 above 500,000), plus a
  redistributor license (about $1,500 per month, or about $650 for
  query-only/snapshot access).
  [OPRA fee schedule](https://cdn.opraplan.com/documents/OPRA_Fee_Schedule.pdf),
  [SEC filing](https://www.sec.gov/files/rules/sro/nms/2025/34-104267-ex1.pdf),
  [Theta Data guide (May 2026)](https://thetadata.net/articles/2026-05-29-opra-fee-guide-for-options-market-data)
- **Delayed (older than 15 minutes):** no per-user fees. Sources disagree on
  whether a vendor/redistributor fee still applies: Theta Data says none,
  MarketData.app says the $1,500/month fee still applies, and Intrinio quotes
  about $600–650/month for external display. **Confirm with OPRA or the
  vendor.**
  [MarketData.app](https://www.marketdata.app/education/options/opra-fees/),
  [Intrinio](https://intrinio.com/options/options-15-minutes-delayed)
- **Personal plans can't power an app.** Vendors' individual plans are for
  the subscriber's own use. Massive (formerly Polygon.io), for example, says
  any app other people can see, including testers, needs a Business plan.
  [Massive knowledge base](https://massive.com/knowledge-base/article/which-plan-do-i-need-to-show-massive-data-in-my-app)

Two practical consequences:

1. Fetching must go through **our backend**, never straight from the app with
   our vendor key. That protects the key, lets us cache (one chain request
   serves every user), and gives us the per-user records OPRA reporting
   needs.
2. The **paid plan you use to develop is not the plan you launch on.**

## Providers

| Provider | Good for | Options data | Notes |
| --- | --- | --- | --- |
| **[Alpaca](https://docs.alpaca.markets/us/reference/optionchain)** | Dev data **and** the likely execution partner | Chain snapshots with bid/ask, IV and greeks. Free "indicative" feed; real-time OPRA on a paid plan | Broker API supports options Levels 1–3 for end users, and Level 3 includes call and put spreads ([docs](https://docs.alpaca.markets/us/docs/options-trading-overview), [levels](https://alpaca.markets/support/what-option-levels-or-tiers-do-you-provide)). Multi-leg orders are supported. An Alpaca staff forum post says only data older than 15 minutes can be displayed without restrictions ([forum](https://forum.alpaca.markets/t/data-source-for-option-historical-bars/17704)). **Ask their partner team** whether Broker API partners can show market data to end users. |
| **[Massive](https://massive.com/options)** (formerly Polygon.io) | Production display data | Snapshots, greeks, IV, history | Individual plans $0 / $29 / $79 / $199 a month (personal use only). In-app display needs Options Business, which is priced by sales. For reference, Stocks Business is $2,499/month, and startups get a discount ([pricing summary](https://algodataindex.com/vendors/massive/), [redistribution](https://massive.com/knowledge-base/article/how-can-i-redistribute-massives-market-data)). |
| **[ThetaData](https://docs.thetadata.us/Articles/Getting-Started/Subscriptions.html)** | Historical chains, backtests, cheap real-time | Tick-level history back to 2012 on top tiers, greeks | Options tiers about $40–$160/month ([comparison](https://www.quantvps.com/blog/options-data-api)). Ask about redistribution terms. |
| **[Databento](https://databento.com/datasets/OPRA.PILLAR)** | Infrastructure-grade raw OPRA feed | Full OPRA tick data, live and historical | Acts as vendor of record and passes through exchange licensing ([licensing](https://help.databento.com/en/articles/8914894-licensing-and-live-data)). More engineering: we'd build chains and IV ourselves. |
| **[ORATS](https://orats.com/data-api)** | High-quality smoothed IV and greeks | Live and historical, analytics-focused | Live API about $299/month direct, or $99/month through Tradier ([Tradier](https://brokerage.tradier.com/platforms/orats)). Useful if odds quality becomes a differentiator. |
| **Tradier** | Alternative execution partner with built-in data | Chains and quotes for partners | An embedded brokerage API for partner apps. Terms are partner-dependent. |
| **[Intrinio](https://intrinio.com/options/options-15-minutes-delayed)** | Delayed data with display licensing | 15-minute delayed options | Lists an OPRA external-display fee of about $650/month. |

## Recommendation

1. **Today:** keep synthetic as the default. To see real-shaped chains,
   create a free Alpaca account, put the keys in `.env.local` (see
   `.env.example`) with `EXPO_PUBLIC_MARKET_DATA=alpaca`, and run a dev build.
   This is for your own testing only: the keys get compiled into that build.
2. **Before anyone else sees it:** stand up the proxy (`GET
   /chains/{underlying}?minExpiration=YYYY-MM-DD` returning a `ChainSnapshot`;
   `src/services/marketData/proxy.ts` is the client). Put the Alpaca adapter
   (or a Massive one) behind it, cache chains for a few minutes, and switch
   the app to `EXPO_PUBLIC_MARKET_DATA=proxy`.
3. **Pick the launch vendor from two conversations:**
   - **Alpaca partner team:** can Broker API partners display delayed and
     real-time options data to end users, and what does it cost? If yes, one
     vendor covers data and execution.
   - **Massive sales:** an Options Business quote for delayed display to N
     users, plus real-time snapshots on the order ticket only.
4. **Live trading:** Alpaca Broker API with Level 3 approval for spreads.
   Send multi-leg limit orders at mid (`src/services/broker.ts` already
   models them).

## Why not Yahoo Finance or Robinhood?

Both are fine for **your own research on your own machine**. Neither can
power an app that other people use.

- **Yahoo Finance** has free, delayed option chains, but there's no official
  API. Libraries like yfinance call unofficial endpoints that need a
  cookie+crumb handshake and break without notice. Yahoo's terms prohibit
  automated collection and using its data to build a data feed. Yahoo
  rate-limits and blocks data-center IPs, which is exactly where our backend
  would run (users report blocks lasting 48 hours or more). And it gives us
  no license to show exchange data to users.
  [Yahoo ToS](https://legal.yahoo.com/us/en/frontier/terms/otos/index.html),
  [yfinance docs](https://ranaroussi.github.io/yfinance/),
  [rate-limit report](https://github.com/TauricResearch/TradingAgents/issues/1425)
- **Robinhood** has an official MCP server for its Agentic Trading beta
  (`agent.robinhood.com/mcp/trading`). It lets an AI assistant act on **your
  own** account through OAuth: positions, equity quotes, watchlists, and
  orders in a dedicated agent account. It is not a market data feed: data
  you see as a Robinhood customer isn't licensed for redistribution to our
  users. Options support is still in flux (sources from mid and late 2026
  disagree). There is no official equities or options data API. Community
  MCPs that expose option chains with greeks wrap the unofficial
  `robin_stocks` API, which Robinhood doesn't sanction and which risks your
  account.
  [Robinhood: open to agents](https://robinhood.com/newsroom/robinhood-is-now-open-to-agents/),
  [setup](https://robinhood.com/us/en/support/articles/agentic-trading-overview/),
  [review](https://sentisense.ai/blog/robinhood-agentic-trading-mcp-review/)

Where they do help: connect the Robinhood MCP to Claude to research ideas
and sanity-check prices for your own decisions, or use yfinance in a local
notebook to explore chains.

### The Yahoo demo setup

For demos we accept Yahoo's limits, and the app still never talks to Yahoo
directly:

```
app (EXPO_PUBLIC_MARKET_DATA=yahoo) ──GET /chains/NVDA?minExpiration=…──► server/ (your laptop)
                                                                            └─► yahoo-finance2 ─► Yahoo
```

- `server/` speaks the same `/chains` protocol as the production backend, so
  the market version swaps the data source behind the server, not the app.
- [`yahoo-finance2`](https://www.npmjs.com/package/yahoo-finance2) handles
  Yahoo's cookie and crumb session. `server/yahoo.ts` maps its output to a
  `ChainSnapshot`. Zero bids and asks become "no quote", and implausible
  implied volatilities are dropped so the app infers one from the price.
- If no expiration is listed as far out as a bet wants, the server uses the
  furthest one, and the bet screen shows the real expiry.
- Chains are cached for 5 minutes to stay under Yahoo's rate limits.
- Run it on your own machine during US market hours, and keep it to demos.

## Company information and financials

The stock and bet screens show what a company does and how it is doing
(sales, margins, cash and debt, multiples, next earnings) or what a fund
holds. This is reference data, not a price feed, and it changes quarterly.

- **Now:** rounded sample figures in `src/data/companySamples.ts`, labelled
  "sample" on every screen (`EXPO_PUBLIC_FUNDAMENTALS=sample`, the default).
- **Demo:** the demo server's `GET /company/{symbol}` maps Yahoo Finance's
  quote summary (`server/fundamentals.ts`). Same caveats as the chains:
  unofficial endpoints, terms that don't cover an app, blocked data-center
  IPs. Your laptop, for demos.
- **Beta:** the protocol stays the same and the source behind the server
  changes. Candidates: **SEC EDGAR** (free, official XBRL "company facts"
  for every US filer; needs mapping and has no ETF holdings or estimates),
  and fundamentals vendors such as **Massive**, **Intrinio** or **Financial
  Modeling Prep**, which add earnings dates, ETF holdings and tidy trailing
  figures under a business license. Fundamentals are cheap next to OPRA:
  the data moves slowly, so one fetch a day per symbol, cached, serves
  everyone.

What the app needs from a vendor is `getCompany(symbol)` returning a
`CompanySnapshot` (`src/domain/types.ts`): a description and location, the
trailing-twelve-month figures and the next earnings date for a company, or
expense ratio, net assets and top holdings for a fund.

## Questions to ask every vendor

- Can we display your options data in a consumer app? Delayed? Real-time?
- Is there a snapshot/query-only option, so real-time is fetched only on the
  order ticket?
- Who pays OPRA fees and files OPRA reports: you or us?
- Do snapshots include bid/ask and IV for far out-of-the-money and long-dated
  (LEAPS) contracts? Moonshot lives there.
- Rate limits and caching rules: can one cached chain serve many users?
- Historical chain depth, for track records and settling paper bets.
