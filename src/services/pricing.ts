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
 */

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; promise: Promise<PricedStrategy> }>();

export interface PriceOptions {
  question?: EventQuestion;
  provider?: MarketDataProvider;
  now?: Date;
}

export function priceBet(bet: Bet, options: PriceOptions = {}): Promise<PricedStrategy> {
  const { question, provider = marketData, now = new Date() } = options;
  const { strategy } = bet;
  const minExpiration = earliestExpiration(strategy.minDays, now, question?.resolution.resolvesOn);

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
