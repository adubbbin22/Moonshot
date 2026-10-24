import { createAlpacaProvider } from '../alpaca';
import { formatOccSymbol, parseOccSymbol } from '../occ';
import { createProxyProvider } from '../proxy';
import { createSyntheticProvider, listedExpirations, syntheticChain } from '../synthetic';
import { MarketDataError } from '../types';

const now = new Date('2026-10-24T15:00:00.000Z');

describe('OCC symbols', () => {
  it('parses and formats round trip', () => {
    const parts = parseOccSymbol('NVDA270115C00202500');
    expect(parts).toEqual({ root: 'NVDA', expiration: '2027-01-15', type: 'call', strike: 202.5 });
    expect(formatOccSymbol(parts!)).toBe('NVDA270115C00202500');
  });

  it('accepts vendor prefixes and rejects garbage', () => {
    expect(parseOccSymbol('O:SPY240722P00553000')?.type).toBe('put');
    expect(parseOccSymbol('NOT-A-SYMBOL')).toBeNull();
  });
});

describe('synthetic provider', () => {
  it('lists monthly third-Friday expirations', () => {
    expect(listedExpirations(now).slice(0, 3)).toEqual(['2026-11-20', '2026-12-18', '2027-01-15']);
  });

  it('returns the first expiration on or after the minimum', async () => {
    const provider = createSyntheticProvider(() => now);
    const chain = await provider.getChain('NVDA', { minExpiration: '2027-12-20' });
    expect(chain.expiration).toBe('2028-01-21');
    expect(chain.spot).toBe(180);
    expect(provider.realtime).toBe(false);
  });

  it('produces sane two-sided quotes', () => {
    const chain = syntheticChain('NVDA', '2028-01-21', now);
    expect(chain.contracts.length).toBeGreaterThan(50);
    for (const c of chain.contracts) {
      expect(c.bid).not.toBeNull();
      expect(c.ask!).toBeGreaterThan(c.bid!);
      expect(parseOccSymbol(c.symbol)).toMatchObject({ strike: c.strike, type: c.type });
    }
  });

  it('refuses unknown underlyings', async () => {
    await expect(createSyntheticProvider(() => now).getChain('NOPE', { minExpiration: '2027-01-01' })).rejects.toThrow(
      MarketDataError,
    );
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('Alpaca provider', () => {
  const page1 = {
    snapshots: {
      NVDA280121C00235000: {
        latestQuote: { bp: 3.1, ap: 3.3, t: '2026-10-24T14:59:00Z' },
        latestTrade: { p: 3.2 },
        impliedVolatility: 0.47,
      },
      NVDA280121C00240000: { latestQuote: { bp: 0, ap: 2.2 }, latestTrade: { p: 2.0 } },
    },
    next_page_token: 'abc',
  };
  const page2 = {
    snapshots: {
      NVDA280317C00235000: { latestQuote: { bp: 4, ap: 4.4 } },
      NVDA280121P00150000: { latestQuote: { bp: 5, ap: 5.4 } },
    },
    next_page_token: null,
  };

  function fakeFetch() {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const impl = jest.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, headers: init?.headers as Record<string, string> });
      if (url.includes('/v2/stocks/NVDA/trades/latest')) {
        return jsonResponse({ symbol: 'NVDA', trade: { p: 181.25, t: '2026-10-24T15:00:00Z' } });
      }
      return jsonResponse(url.includes('page_token=abc') ? page2 : page1);
    });
    return { impl: impl as unknown as typeof fetch, calls };
  }

  it('fetches spot, pages through the chain, and keeps only the nearest expiration', async () => {
    const { impl, calls } = fakeFetch();
    const provider = createAlpacaProvider({ keyId: 'key', secretKey: 'secret', fetchImpl: impl });
    const chain = await provider.getChain('nvda', { minExpiration: '2027-12-20' });

    expect(chain.spot).toBe(181.25);
    expect(chain.expiration).toBe('2028-01-21');
    expect(chain.contracts.map((c) => c.symbol).sort()).toEqual([
      'NVDA280121C00235000',
      'NVDA280121C00240000',
      'NVDA280121P00150000',
    ]);
    const bought = chain.contracts.find((c) => c.strike === 235)!;
    expect(bought).toMatchObject({ bid: 3.1, ask: 3.3, last: 3.2, iv: 0.47, type: 'call' });
    expect(chain.contracts.find((c) => c.strike === 240)).toMatchObject({ bid: null, iv: null });

    expect(calls).toHaveLength(3);
    expect(calls[0].headers).toMatchObject({ 'APCA-API-KEY-ID': 'key', 'APCA-API-SECRET-KEY': 'secret' });
    expect(calls[1].url).toContain('feed=indicative');
    expect(calls[1].url).toContain('expiration_date_gte=2027-12-20');
    expect(provider.realtime).toBe(false);
  });

  it('surfaces HTTP errors', async () => {
    const impl = (async () => jsonResponse({ message: 'forbidden' }, 403)) as unknown as typeof fetch;
    const provider = createAlpacaProvider({ keyId: 'k', secretKey: 's', fetchImpl: impl });
    await expect(provider.getChain('NVDA', { minExpiration: '2027-12-20' })).rejects.toThrow(/Alpaca 403/);
  });
});

describe('proxy provider', () => {
  it('requests chains from our backend', async () => {
    const body = { underlying: 'NVDA', spot: 1, asOf: '', expiration: '2028-01-21', contracts: [] };
    const impl = jest.fn(async () => jsonResponse(body));
    const provider = createProxyProvider('https://api.example.com/', impl as unknown as typeof fetch);
    await expect(provider.getChain('NVDA', { minExpiration: '2027-12-20' })).resolves.toEqual(body);
    expect(impl).toHaveBeenCalledWith(
      'https://api.example.com/chains/NVDA?minExpiration=2027-12-20',
      expect.anything(),
    );
  });
});
