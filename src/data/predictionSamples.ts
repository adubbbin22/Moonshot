import type { PredictionMarketRef, PredictionVenue } from '@/domain/types';

/**
 * SAMPLE PREDICTION-MARKET QUOTES, for demos without a backend. Every number
 * here is made up and is labelled "sample" wherever it appears. Real quotes
 * come from the server (server/predictionMarkets.ts) for the markets listed
 * on each question.
 */
export interface SampleQuote extends PredictionMarketRef {
  yes: number;
}

const sample = (venue: PredictionVenue, questionId: string, title: string, yes: number): SampleQuote => ({
  venue,
  id: `sample-${venue}-${questionId}`,
  title,
  url: venue === 'kalshi' ? 'https://kalshi.com' : 'https://polymarket.com',
  yes,
});

export const PREDICTION_SAMPLES: Record<string, SampleQuote[]> = {
  'hormuz-transits-2027': [
    sample('kalshi', 'hormuz-transits-2027', 'Hormuz shipping back to 80% of normal by June 30, 2027?', 0.58),
    sample('polymarket', 'hormuz-transits-2027', 'Strait of Hormuz traffic recovers by mid-2027?', 0.55),
  ],
  'ai-time-horizon-2027': [
    sample('kalshi', 'ai-time-horizon-2027', 'METR 50% time horizon ≥ 40 hours by end of 2027?', 0.62),
    sample('polymarket', 'ai-time-horizon-2027', 'AI completes week-long tasks (METR) before 2028?', 0.67),
  ],
  'fed-below-3-2027': [
    sample('kalshi', 'fed-below-3-2027', 'Fed funds upper bound below 3.00% by Dec 2027?', 0.44),
    sample('polymarket', 'fed-below-3-2027', 'Fed rate under 3% by end of 2027?', 0.41),
  ],
  'brent-100-2027': [
    sample('kalshi', 'brent-100-2027', 'Brent monthly average above $100 in any month of 2027?', 0.23),
    sample('polymarket', 'brent-100-2027', 'Oil above $100 in 2027?', 0.27),
  ],
  'smr-grid-2028': [
    sample('kalshi', 'smr-grid-2028', 'US small modular reactor delivers grid power by end of 2028?', 0.31),
    sample('polymarket', 'smr-grid-2028', 'SMR connected to a US grid before 2029?', 0.29),
  ],
  'fda-novel-drugs-2027': [
    sample('kalshi', 'fda-novel-drugs-2027', 'FDA approves 55+ novel drugs in 2027?', 0.49),
    sample('polymarket', 'fda-novel-drugs-2027', 'FDA novel drug approvals ≥ 55 in 2027?', 0.52),
  ],
  'asts-satellites-2027': [
    sample('kalshi', 'asts-satellites-2027', 'AST SpaceMobile 60 satellites in orbit by end of 2027?', 0.38),
    sample('polymarket', 'asts-satellites-2027', 'AST SpaceMobile reaches 60 satellites before 2028?', 0.35),
  ],
  'nvda-growth-2027': [
    sample('kalshi', 'nvda-growth-2027', 'NVIDIA data-center revenue growth ≥ 40% YoY in Q3 FY2028?', 0.46),
    sample('polymarket', 'nvda-growth-2027', 'NVIDIA still growing 40%+ in late 2027?', 0.5),
  ],
  'gold-higher-2027': [
    sample('kalshi', 'gold-higher-2027', 'Gold higher on Dec 1, 2027 than Dec 1, 2026?', 0.61),
    sample('polymarket', 'gold-higher-2027', 'Gold up over the year to Dec 2027?', 0.6),
  ],
  'optimus-1000-2027': [
    sample('kalshi', 'optimus-1000-2027', 'Tesla reports 1,000 Optimus robots built by end of 2027?', 0.42),
    sample('polymarket', 'optimus-1000-2027', 'Tesla builds 1,000 Optimus units before 2028?', 0.48),
  ],
  'nato-spending-2027': [
    sample('kalshi', 'nato-spending-2027', '10+ NATO allies at 3.5% of GDP on defense in 2027?', 0.36),
    sample('polymarket', 'nato-spending-2027', 'Ten NATO members hit 3.5% defense spending in 2027?', 0.33),
  ],
};
