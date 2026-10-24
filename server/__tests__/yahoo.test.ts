import { createYahooChainSource, pickExpiration, toIsoDate, YAHOO_SOURCE, type YahooOptionsResult } from '../yahoo';

const unix = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 1000;

function result(expiration: string, overrides: Partial<YahooOptionsResult> = {}): YahooOptionsResult {
  return {
    expirationDates: [new Date('2026-11-20T00:00:00Z'), new Date('2027-12-17T00:00:00Z'), new Date('2028-01-21T00:00:00Z')],
    quote: { regularMarketPrice: 181.25, regularMarketTime: new Date('2026-10-23T20:00:00Z') },
    options: [
      {
        expirationDate: new Date(`${expiration}T00:00:00Z`),
        calls: [
          { contractSymbol: `NVDA${expiration.slice(2).replace(/-/g, '')}C00235000`, strike: 235, bid: 3.1, ask: 3.3, lastPrice: 3.2, impliedVolatility: 0.47 },
          { contractSymbol: `NVDA${expiration.slice(2).replace(/-/g, '')}C00240000`, strike: 240, bid: 0, ask: 0, lastPrice: 2.05, impliedVolatility: 0.00001 },
        ],
        puts: [
          { contractSymbol: `NVDA${expiration.slice(2).replace(/-/g, '')}P00150000`, strike: 150, bid: 5, ask: 5.4, impliedVolatility: 0.52 },
        ],
      },
    ],
    ...overrides,
  };
}

describe('dates', () => {
  it('reads Date objects and Unix seconds', () => {
    expect(toIsoDate(new Date('2028-01-21T00:00:00Z'))).toBe('2028-01-21');
    expect(toIsoDate(unix('2028-01-21'))).toBe('2028-01-21');
  });

  it('picks the first expiration on or after the minimum, else the furthest', () => {
    const listed = ['2028-01-21', '2026-11-20', '2027-12-17'];
    expect(pickExpiration(listed, '2027-12-01')).toBe('2027-12-17');
    expect(pickExpiration(listed, '2027-12-17')).toBe('2027-12-17');
    expect(pickExpiration(listed, '2029-06-01')).toBe('2028-01-21');
    expect(pickExpiration([], '2027-01-01')).toBeUndefined();
  });
});

describe('createYahooChainSource', () => {
  it('lists expirations, fetches the chosen one, and maps contracts', async () => {
    const fetchOptions = jest.fn(async (_symbol: string, date?: Date) =>
      result(date ? date.toISOString().slice(0, 10) : '2026-11-20'),
    );
    const chain = await createYahooChainSource(fetchOptions)('nvda', '2027-12-01');

    expect(fetchOptions).toHaveBeenCalledTimes(2);
    expect(fetchOptions.mock.calls[1]).toEqual(['NVDA', new Date('2027-12-17T00:00:00.000Z')]);
    expect(chain).toMatchObject({
      underlying: 'NVDA',
      spot: 181.25,
      expiration: '2027-12-17',
      asOf: '2026-10-23T20:00:00.000Z',
      source: YAHOO_SOURCE,
    });
    expect(chain.contracts).toEqual([
      { symbol: 'NVDA271217C00235000', type: 'call', strike: 235, expiration: '2027-12-17', bid: 3.1, ask: 3.3, last: 3.2, iv: 0.47 },
      // Zero quotes (market closed) become null, and a junk IV is dropped so the app infers one from price.
      { symbol: 'NVDA271217C00240000', type: 'call', strike: 240, expiration: '2027-12-17', bid: null, ask: null, last: 2.05, iv: null },
      { symbol: 'NVDA271217P00150000', type: 'put', strike: 150, expiration: '2027-12-17', bid: 5, ask: 5.4, last: null, iv: 0.52 },
    ]);
  });

  it('reuses the first response when the nearest expiration is the one we want', async () => {
    const fetchOptions = jest.fn(async () => result('2026-11-20'));
    const chain = await createYahooChainSource(fetchOptions)('NVDA', '2026-11-01');
    expect(fetchOptions).toHaveBeenCalledTimes(1);
    expect(chain.expiration).toBe('2026-11-20');
  });

  it('explains missing data', async () => {
    const noPrice = jest.fn(async () => result('2026-11-20', { quote: {} }));
    await expect(createYahooChainSource(noPrice)('NVDA', '2026-11-01')).rejects.toThrow(/no price/);

    const noOptions = jest.fn(async () => result('2026-11-20', { expirationDates: [], options: [] }));
    await expect(createYahooChainSource(noOptions)('ZZZZ', '2026-11-01')).rejects.toThrow(/no options/);
  });
});
