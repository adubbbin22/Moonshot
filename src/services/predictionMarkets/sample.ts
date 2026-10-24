import type { PredictionMarketProvider } from './types';
import { PREDICTION_SAMPLES } from '@/data/predictionSamples';

/** Made-up quotes for demos, labelled as such on every screen. */
export function createSampleProvider(now: () => Date = () => new Date()): PredictionMarketProvider {
  return {
    id: 'sample',
    label: 'Sample odds (not real)',
    async getQuotes(question) {
      const asOf = now().toISOString();
      return (PREDICTION_SAMPLES[question.id] ?? []).map((q) => ({ ...q, asOf, basis: 'sample' as const }));
    },
  };
}
