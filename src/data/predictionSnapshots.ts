import type { PredictionMarketRef } from '@/domain/types';

/**
 * REAL PREDICTION-MARKET QUOTES, CAPTURED BY HAND, for demos without a
 * backend. Each is a price read off a copy of the venue's own market page on
 * `capturedOn`; it is not live and will drift. Screens label these
 * "Snapshot · date". Live quotes come from the server for the markets listed
 * on each question.
 *
 * Where a venue doesn't list our exact question, the closest market is kept
 * with `match: 'related'` and a note on how it differs. Related quotes are
 * shown for reference only: they stay out of the crowd number and the
 * venue arbitrage, and the bet-vs-venue card says the odds aren't comparable.
 *
 * Captured October 2026 from search-engine copies of kalshi.com and
 * polymarket.com pages (the venues' APIs weren't reachable from the build
 * machine). Kalshi ids are the event tickers in the page URLs; confirm the
 * per-contract market tickers before wiring them into `markets` on a question.
 */
export interface SnapshotQuote extends PredictionMarketRef {
  /** Price of YES on the venue's market, as a fraction. */
  yes: number;
  /** YYYY-MM-DD the copy of the page was dated. */
  capturedOn: string;
}

export const PREDICTION_SNAPSHOTS: Record<string, SnapshotQuote[]> = {
  'hormuz-transits-2027': [
    {
      venue: 'kalshi',
      id: 'KXHORMUZNORM-26MAR17',
      title: 'When will traffic at the Strait of Hormuz return to normal? · Before Jul 1, 2027',
      url: 'https://kalshi.com/markets/kxhormuznorm/when-will-traffic-at-the-strait-of-hormuz-return-to-normal/kxhormuznorm-26mar17',
      yes: 0.49,
      capturedOn: '2026-09-28',
      note: 'Same deadline. Kalshi’s bar is a 7-day average above 60 transits; ours is 80% of the 2025 average.',
    },
    {
      venue: 'polymarket',
      id: 'strait-of-hormuz-traffic-returns-to-normal-by-december-31',
      title: 'Strait of Hormuz traffic returns to normal by December 31, 2026?',
      url: 'https://polymarket.com/event/strait-of-hormuz-traffic-returns-to-normal-by-december-31',
      yes: 0.19,
      capturedOn: '2026-10-05',
      match: 'related',
      note: 'Asks about December 31, 2026, six months before this question’s deadline.',
    },
  ],
  'fed-below-3-2027': [
    {
      venue: 'kalshi',
      id: 'KXFEDFUNDSYEAR-28JAN01',
      title: 'Fed funds rate at end of 2027 · at or below 4.25% (the lowest rung Kalshi lists)',
      url: 'https://kalshi.com/markets/kxfedfundsyear/fed-funds-rate-at-year-end/kxfedfundsyear-28jan01',
      yes: 0.36,
      capturedOn: '2026-10-16',
      match: 'related',
      note: 'Kalshi prices the year-end 2027 rate in rungs that stop at 4.25%. Below 3% isn’t listed, so the odds for this question are lower than this.',
    },
  ],
  'brent-100-2027': [
    {
      venue: 'kalshi',
      id: 'KXWTIDIRY-26DEC31H1430',
      title: 'WTI price at year end 2026? · $100 or above',
      url: 'https://kalshi.com/markets/kxwtidiry/wtidiry/kxwtidiry-26dec31h1430',
      yes: 0.42,
      capturedOn: '2026-10-23',
      match: 'related',
      note: 'WTI on December 31, 2026, not Brent’s monthly average during 2027. Brent usually trades a few dollars above WTI.',
    },
  ],
  'ai-time-horizon-2027': [
    {
      venue: 'kalshi',
      id: 'KXAGICO-COMP',
      title: 'When will any company achieve AGI? · Before Oct 1, 2027',
      url: 'https://kalshi.com/markets/kxagico/will-any-company-achieve-agi-before-date/kxagico-comp',
      yes: 0.42,
      capturedOn: '2026-10-17',
      match: 'related',
      note: 'AGI is a far higher bar than a week-long task horizon, so the odds for this question should sit well above this.',
    },
  ],
  'optimus-1000-2027': [
    {
      venue: 'kalshi',
      id: 'TESLAOPTIMUS-26DEC31',
      title: 'Tesla Optimus released this year (2026)?',
      url: 'https://kalshi.com/markets/kxteslaoptimus/tesla-optimus-sale/teslaoptimus-26dec31',
      yes: 0.04,
      capturedOn: '2026-10-24',
      match: 'related',
      note: 'Asks whether Optimus goes on sale in 2026, not whether Tesla builds 1,000 of them by the end of 2027.',
    },
  ],
};
