/**
 * @jest-environment node
 */
import { createOddsSource, fetchKalshi, fetchPolymarket, searchPolymarket, type FetchLike } from '../predictionMarkets';

function stubFetch(routes: Record<string, unknown | (() => unknown)>): FetchLike & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (url: string) => {
    calls.push(url);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) return { ok: false, status: 404, json: async () => ({}) };
    const value = routes[key];
    return { ok: true, status: 200, json: async () => (typeof value === 'function' ? (value as () => unknown)() : value) };
  }) as FetchLike & { calls: string[] };
  fn.calls = calls;
  return fn;
}

const gamma = [{ question: 'Will X happen by 2027?', slug: 'x-by-2027', outcomes: '["Yes","No"]', outcomePrices: '["0.71","0.29"]' }];
const kalshi = { market: { title: 'X by 2027?', yes_bid: 64, yes_ask: 68, last_price: 65 } };

describe('venue fetchers', () => {
  it('reads Polymarket’s JSON-encoded outcome prices', async () => {
    const fetchImpl = stubFetch({ 'gamma-api.polymarket.com/markets?slug=x-by-2027': gamma });
    expect(await fetchPolymarket('x-by-2027', fetchImpl)).toEqual({ yes: 0.71, title: 'Will X happen by 2027?' });
  });

  it('reads Kalshi’s cents and uses the mid of the book, else the last trade', async () => {
    const fetchImpl = stubFetch({ '/markets/X-2027': kalshi });
    expect(await fetchKalshi('X-2027', fetchImpl)).toEqual({ yes: 0.66, title: 'X by 2027?' });
    const oneSided = stubFetch({ '/markets/X-2027': { market: { title: 'X', yes_bid: 0, yes_ask: 99, last_price: 40 } } });
    expect((await fetchKalshi('X-2027', oneSided)).yes).toBe(0.4);
  });

  it('fails clearly on unknown markets', async () => {
    await expect(fetchPolymarket('nope', stubFetch({ 'slug=nope': [] }))).rejects.toThrow('no market with slug nope');
    await expect(fetchKalshi('NOPE', stubFetch({}))).rejects.toThrow('404');
  });
});

describe('createOddsSource', () => {
  const question = {
    id: 'x-2027',
    markets: [
      { venue: 'polymarket' as const, id: 'x-by-2027', title: 'X', url: 'https://polymarket.com/event/x' },
      { venue: 'kalshi' as const, id: 'X-2027', title: 'X', url: 'https://kalshi.com/markets/X-2027' },
      { venue: 'kalshi' as const, id: 'MISSING', title: 'M', url: '' },
    ],
  };

  it('quotes every mapped market, drops failures, labels live, and caches', async () => {
    const fetchImpl = stubFetch({ 'slug=x-by-2027': gamma, '/markets/X-2027': kalshi });
    let t = 0;
    const log: string[] = [];
    const oddsFor = createOddsSource(fetchImpl, { now: () => new Date(t), cacheTtlMs: 1000, log: (m) => log.push(m) });

    const quotes = await oddsFor(question);
    expect(quotes.map((q) => [q.venue, q.yes, q.title, q.basis])).toEqual([
      ['polymarket', 0.71, 'Will X happen by 2027?', 'live'],
      ['kalshi', 0.66, 'X by 2027?', 'live'],
    ]);
    expect(log).toEqual([expect.stringContaining('kalshi:MISSING failed')]);

    t = 500;
    await oddsFor(question);
    expect(fetchImpl.calls.filter((u) => u.includes('x-by-2027'))).toHaveLength(1); // served from cache
    t = 2000;
    await oddsFor(question);
    expect(fetchImpl.calls.filter((u) => u.includes('x-by-2027'))).toHaveLength(2); // refreshed
  });

  it('returns nothing for a question with no markets', async () => {
    expect(await createOddsSource(stubFetch({}))({ id: 'q', markets: undefined })).toEqual([]);
  });
});

describe('searchPolymarket', () => {
  it('turns search results into market refs', async () => {
    const fetchImpl = stubFetch({
      'public-search': { events: [{ slug: 'hormuz', title: 'Hormuz', markets: [{ slug: 'hormuz-open-2027', question: 'Hormuz open by 2027?' }, { question: 'no slug' }] }] },
    });
    expect(await searchPolymarket('Hormuz', fetchImpl)).toEqual([
      { venue: 'polymarket', id: 'hormuz-open-2027', title: 'Hormuz open by 2027?', url: 'https://polymarket.com/event/hormuz' },
    ]);
  });
});
