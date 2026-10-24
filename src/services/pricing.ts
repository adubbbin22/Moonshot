import { marketData, type MarketDataProvider } from './marketData';
import { earliestExpiration } from '@/domain/horizon';
import { priceStrategy, type PricedStrategy } from '@/domain/strategy';
import type { Bet, EventQuestion } from '@/domain/types';

/**
 * Prices bets against the configured market data provider. Results are cached
 * per bet for a few minutes so lists and detail screens share one fetch.
 *
 * When a bet is shown for a question, pass the question: the bet is then
 * priced on an expiration that outlives the question (the horizon guard).
 * Pass `minExpiration` to price a later expiration than the earliest allowed;
 * it never pulls the expiration earlier than the guard.
 */

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; promise: Promise<PricedStrategy> }>();

export interface PriceOptions {
  question?: EventQuestion;
  /** YYYY-MM-DD. Price the first listed expiration on or after this date, if it's past the earliest allowed. */
  minExpiration?: string;
  provider?: MarketDataProvider;
  now?: Date;
}

export function priceBet(bet: Bet, options: PriceOptions = {}): Promise<PricedStrategy> {
  const { question, provider = marketData, now = new Date() } = options;
  const { strategy } = bet;
  const floor = earliestExpiration(strategy.minDays, now, question?.resolution.resolvesOn);
  const minExpiration = options.minExpiration && options.minExpiration > floor ? options.minExpiration : floor;

  const key = `${provider.id}:${bet.id}:${minExpiration}`;
  const hit = cache.get(key);
  if (hit && now.getTime() - hit.at < TTL_MS) return hit.promise;

  const promise = provider
    .getChain(strategy.underlying, { minExpiration })
    .then((chain) => priceStrategy(strategy, chain, now));
  promise.catch(() => cache.delete(key));
  cache.set(key, { at: now.getTime(), promise });
  return promise;
}

export function clearPriceCache() {
  cache.clear();
}

export { marketData };
