import { createSampleProvider } from '../sample';
import { PREDICTION_SAMPLES } from '@/data/predictionSamples';
import { PREDICTION_SNAPSHOTS } from '@/data/predictionSnapshots';
import { EVENTS } from '@/data/events';

const now = new Date('2026-10-24T15:00:00.000Z');
const question = (id: string) => EVENTS.find((e) => e.id === id)!;

describe('sample prediction-market provider', () => {
  const provider = createSampleProvider(() => now);

  it('serves captured snapshots, dated when they were taken, where a question has them', async () => {
    const quotes = await provider.getQuotes(question('hormuz-transits-2027'));
    expect(quotes.map((q) => [q.venue, q.yes, q.basis, q.asOf.slice(0, 10), q.match ?? 'same'])).toEqual(
      PREDICTION_SNAPSHOTS['hormuz-transits-2027'].map((s) => [s.venue, s.yes, 'snapshot', s.capturedOn, s.match ?? 'same']),
    );
  });

  it('falls back to made-up samples, dated now, elsewhere', async () => {
    const id = EVENTS.map((e) => e.id).find((qid) => !PREDICTION_SNAPSHOTS[qid] && PREDICTION_SAMPLES[qid])!;
    const quotes = await provider.getQuotes(question(id));
    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes.every((q) => q.basis === 'sample' && q.asOf === now.toISOString())).toBe(true);
  });
});
