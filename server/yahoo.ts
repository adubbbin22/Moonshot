import type { ChainSnapshot, OptionContract, OptionType } from '../src/domain/types';

/**
 * Turns Yahoo Finance option chains (as returned by the yahoo-finance2
 * library) into Moonshot's ChainSnapshot. DEMO ONLY: Yahoo has no official
 * API and its terms don't cover showing its data in an app (docs/DATA.md).
 *
 * The shapes below are the subset of yahoo-finance2's OptionsResult we read,
 * kept structural so this file doesn't depend on the library.
 */

type DateLike = Date | number | string;

export interface YahooContract {
  contractSymbol: string;
  strike: number;
  bid?: number;
  ask?: number;
  lastPrice?: number;
  impliedVolatility?: number;
}

export interface YahooOptionsResult {
  expirationDates: DateLike[];
  quote: { regularMarketPrice?: number; regularMarketTime?: DateLike };
  options: { expirationDate?: DateLike; calls: YahooContract[]; puts: YahooContract[] }[];
}

/** Fetches one chain; `date` picks the expiration (omitted = nearest). */
export type YahooOptionsFetcher = (symbol: string, date?: Date) => Promise<YahooOptionsResult>;

export const YAHOO_SOURCE = 'Yahoo Finance (delayed, demo only)';

/** Yahoo stamps expirations at 00:00 UTC on the expiration day. Numbers are Unix seconds. */
export function toIsoDate(value: DateLike): string {
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return date.toISOString().slice(0, 10);
}

/**
 * First listed expiration on or after the minimum. If nothing is listed that
 * far out (common for smaller names), fall back to the furthest one so the
 * demo still shows a priced bet; the bet screen shows the real expiry.
 */
export function pickExpiration(available: string[], minExpiration: string): string | undefined {
  const sorted = [...available].sort();
  return sorted.find((d) => d >= minExpiration) ?? sorted.at(-1);
}

const positive = (x: number | undefined): number | null => (x !== undefined && x > 0 ? x : null);

/** Yahoo's IV is unreliable when the market is closed; drop values no real option trades at. */
const saneVol = (x: number | undefined): number | null => (x !== undefined && x >= 0.01 && x <= 5 ? x : null);

function toContract(c: YahooContract, type: OptionType, expiration: string): OptionContract {
  return {
    symbol: c.contractSymbol,
    type,
    strike: c.strike,
    expiration,
    bid: positive(c.bid),
    ask: positive(c.ask),
    last: positive(c.lastPrice),
    iv: saneVol(c.impliedVolatility),
  };
}

export function toChainSnapshot(symbol: string, result: YahooOptionsResult, expiration: string): ChainSnapshot {
  const spot = result.quote.regularMarketPrice;
  if (!spot || spot <= 0) throw new Error(`Yahoo returned no price for ${symbol}.`);
  const chain = result.options[0];
  if (!chain) throw new Error(`Yahoo returned no options for ${symbol} on ${expiration}.`);
  return {
    underlying: symbol,
    spot,
    asOf: result.quote.regularMarketTime
      ? new Date(result.quote.regularMarketTime).toISOString()
      : new Date().toISOString(),
    expiration,
    contracts: [
      ...chain.calls.map((c) => toContract(c, 'call', expiration)),
      ...chain.puts.map((c) => toContract(c, 'put', expiration)),
    ],
    source: YAHOO_SOURCE,
  };
}

/**
 * Two calls per chain: one to list expirations (it also returns the nearest
 * chain), and one for the chosen expiration if it isn't the nearest.
 */
export function createYahooChainSource(fetchOptions: YahooOptionsFetcher) {
  return async function getChain(underlying: string, minExpiration: string): Promise<ChainSnapshot> {
    const symbol = underlying.toUpperCase();
    const first = await fetchOptions(symbol);
    const expirations = first.expirationDates.map(toIsoDate);
    const expiration = pickExpiration(expirations, minExpiration);
    if (!expiration) throw new Error(`Yahoo lists no options for ${symbol}.`);

    const firstExpiration = first.options[0]?.expirationDate;
    const alreadyHave = firstExpiration !== undefined && toIsoDate(firstExpiration) === expiration;
    const result = alreadyHave ? first : await fetchOptions(symbol, new Date(`${expiration}T00:00:00.000Z`));
    return toChainSnapshot(symbol, result, expiration);
  };
}
