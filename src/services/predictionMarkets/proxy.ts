import type { PredictionMarketProvider } from './types';
import type { PredictionQuote } from '@/domain/types';

/** Our backend: GET {baseUrl}/odds/{questionId} → { quotes }. The demo server speaks this. */
export function createProxyProvider(baseUrl: string, fetchImpl: typeof fetch = fetch): PredictionMarketProvider {
  return {
    id: 'proxy',
    label: 'Kalshi and Polymarket',
    async getQuotes(question) {
      const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/odds/${encodeURIComponent(question.id)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Prediction-market odds ${response.status} for ${question.id}.`);
      const body = (await response.json()) as { quotes: PredictionQuote[] };
      return body.quotes;
    },
  };
}
