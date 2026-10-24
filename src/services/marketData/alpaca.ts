import { parseOccSymbol } from './occ';
import { MarketDataError, type ChainRequest, type MarketDataProvider } from './types';
import type { OptionContract } from '@/domain/types';

/**
 * Alpaca Market Data adapter (https://docs.alpaca.markets).
 *
 * - `indicative` feed: free with any Alpaca account. Real OPRA data with
 *   delayed trades and modified quotes, for development only.
 * - `opra` feed: real-time, needs a paid Alpaca data subscription.
 *
 * Keys must never ship in a production app bundle. In production this code
 * runs behind our own backend proxy (see docs/DATA.md).
 */

export interface AlpacaConfig {
  keyId: string;
  secretKey: string;
  feed?: 'indicative' | 'opra';
  baseUrl?: string;
  /** How far past the minimum expiration to search for the next listed one. */
  windowDays?: number;
  fetchImpl?: typeof fetch;
}

interface AlpacaOptionSnapshot {
  latestQuote?: { bp?: number; ap?: number; t?: string };
  latestTrade?: { p?: number; t?: string };
  impliedVolatility?: number;
}

interface AlpacaChainPage {
  snapshots?: Record<string, AlpacaOptionSnapshot>;
  next_page_token?: string | null;
}

interface AlpacaLatestTrade {
  trade?: { p?: number; t?: string };
}

const MAX_PAGES = 10;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const positive = (x: number | undefined): number | null => (x !== undefined && x > 0 ? x : null);

export function createAlpacaProvider(config: AlpacaConfig): MarketDataProvider {
  const {
    keyId,
    secretKey,
    feed = 'indicative',
    baseUrl = 'https://data.alpaca.markets',
    windowDays = 120,
    fetchImpl = fetch,
  } = config;

  async function get<T>(path: string, params: Record<string, string | number>): Promise<T> {
    const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const response = await fetchImpl(`${baseUrl}${path}?${query}`, {
      headers: { 'APCA-API-KEY-ID': keyId, 'APCA-API-SECRET-KEY': secretKey, Accept: 'application/json' },
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new MarketDataError(`Alpaca ${response.status} for ${path}: ${body.slice(0, 200)}`);
    }
    return (await response.json()) as T;
  }

  return {
    id: `alpaca-${feed}`,
    label: feed === 'opra' ? 'Alpaca · OPRA real-time' : 'Alpaca · indicative (dev only)',
    realtime: feed === 'opra',

    async getChain(underlying: string, { minExpiration }: ChainRequest) {
      const symbol = underlying.toUpperCase();
      const latest = await get<AlpacaLatestTrade>(`/v2/stocks/${symbol}/trades/latest`, { feed: 'iex' });
      const spot = latest.trade?.p;
      if (!spot) throw new MarketDataError(`No latest trade for ${symbol}.`);

      const snapshots: Record<string, AlpacaOptionSnapshot> = {};
      let pageToken: string | null | undefined;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const body = await get<AlpacaChainPage>(`/v1beta1/options/snapshots/${symbol}`, {
          feed,
          expiration_date_gte: minExpiration,
          expiration_date_lte: addDays(minExpiration, windowDays),
          strike_price_gte: Math.floor(spot * 0.4),
          strike_price_lte: Math.ceil(spot * 2.5),
          limit: 1000,
          ...(pageToken ? { page_token: pageToken } : {}),
        });
        Object.assign(snapshots, body.snapshots ?? {});
        pageToken = body.next_page_token;
        if (!pageToken) break;
      }

      const contracts: OptionContract[] = Object.entries(snapshots).flatMap(([occ, snap]) => {
        const parts = parseOccSymbol(occ);
        if (!parts) return [];
        return [
          {
            symbol: occ,
            type: parts.type,
            strike: parts.strike,
            expiration: parts.expiration,
            bid: positive(snap.latestQuote?.bp),
            ask: positive(snap.latestQuote?.ap),
            last: positive(snap.latestTrade?.p),
            iv: positive(snap.impliedVolatility),
          },
        ];
      });

      const expiration = contracts
        .map((c) => c.expiration)
        .filter((d) => d >= minExpiration)
        .sort()[0];
      if (!expiration) {
        throw new MarketDataError(`No ${symbol} options listed between ${minExpiration} and +${windowDays} days.`);
      }

      return {
        underlying: symbol,
        spot,
        asOf: latest.trade?.t ?? new Date().toISOString(),
        expiration,
        contracts: contracts.filter((c) => c.expiration === expiration),
      };
    },
  };
}
