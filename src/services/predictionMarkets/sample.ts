import type { PredictionMarketProvider } from './types';
import { PREDICTION_SAMPLES } from '@/data/predictionSamples';
import { PREDICTION_SNAPSHOTS } from '@/data/predictionSnapshots';

/**
 * Odds without a backend. Where a real quote was captured for a question
 * (data/predictionSnapshots.ts) it is served as a snapshot with the date it
 * was taken; otherwise made-up samples, labelled as such on every screen.
 */
export function createSampleProvider(now: () => Date = () => new Date()): PredictionMarketProvider {
  return {
    id: 'sample',
    label: 'Snapshots and sample odds (not live)',
    async getQuotes(question) {
      const snapshots = PREDICTION_SNAPSHOTS[question.id];
      if (snapshots && snapshots.length > 0) {
        return snapshots.map(({ capturedOn, ...q }) => ({ ...q, asOf: `${capturedOn}T12:00:00.000Z`, basis: 'snapshot' as const }));
      }
      const asOf = now().toISOString();
      return (PREDICTION_SAMPLES[question.id] ?? []).map((q) => ({ ...q, asOf, basis: 'sample' as const }));
    },
  };
}
