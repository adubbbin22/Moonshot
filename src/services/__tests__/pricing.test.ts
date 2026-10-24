import { createSyntheticProvider } from '../marketData/synthetic';
import type { MarketDataProvider } from '../marketData/types';
import { clearPriceCache, priceBet } from '../pricing';
import { BETS } from '@/data/bets';
import { EVENTS } from '@/data/events';

const now = new Date('2026-10-24T15:00:00.000Z');

function spyProvider() {
  const inner = createSyntheticProvider(() => now);
  const requests: string[] = [];
  const provider: MarketDataProvider = {
    ...inner,
    getChain: (underlying, request) => {
      requests.push(request.minExpiration);
      return inner.getChain(underlying, request);
    },
  };
  return { provider, requests };
}

beforeEach(() => clearPriceCache());

describe('priceBet', () => {
  const tanker = BETS.find((b) => b.id === 'tanker-calls')!;
  const hormuz = EVENTS.find((e) => e.id === 'hormuz-transits-2027')!;

  it('uses the template’s own horizon when shown on its own', async () => {
    const { provider, requests } = spyProvider();
    const priced = await priceBet(tanker, { provider, now });
    expect(requests).toEqual(['2027-05-12']);
    expect(priced.expiration).toBe('2027-05-21');
  });

  it('pushes the expiration past the question when shown for one', async () => {
    const { provider, requests } = spyProvider();
    const priced = await priceBet(tanker, { provider, now, question: hormuz });
    expect(requests).toEqual(['2027-07-30']);
    expect(priced.expiration).toBe('2027-08-20');
  });

  it('caches per bet and horizon', async () => {
    const { provider, requests } = spyProvider();
    await priceBet(tanker, { provider, now, question: hormuz });
    await priceBet(tanker, { provider, now, question: hormuz });
    await priceBet(tanker, { provider, now });
    expect(requests).toHaveLength(2);
  });
});
