import type { EventQuestion, PredictionQuote } from '@/domain/types';

/**
 * Where prediction-market odds come from. Like market data, the app never
 * calls a venue itself: quotes come from our backend, or are samples.
 */
export interface PredictionMarketProvider {
  readonly id: 'sample' | 'proxy' | 'off';
  readonly label: string;
  getQuotes(question: EventQuestion): Promise<PredictionQuote[]>;
}
