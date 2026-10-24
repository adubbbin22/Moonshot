import { marketData, type MarketDataProvider } from './marketData';
import { minExpirationDate, priceStrategy, type PricedStrategy } from '@/domain/strategy';
import type { Bet } from '@/domain/types';

/**
 * Prices bets against the configured market data provider. Results are cached
 * per bet for a few minutes so lists and detail screens share one fetch.
 */

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; promise: Promise<PricedStrategy> }>();

export function priceBet(
  bet: Bet,
  provider: MarketDataProvider = marketData,
  now: Date = new Date(),
): Promise<PricedStrategy> {
  const key = `${provider.id}:${bet.id}`;
  const hit = cache.get(key);
  if (hit && now.getTime() - hit.at < TTL_MS) return hit.promise;

  const { strategy } = bet;
  const promise = provider
    .getChain(strategy.underlying, { minExpiration: minExpirationDate(strategy.minDays, now) })
    .then((chain) => priceStrategy(strategy, chain, now));
  promise.catch(() => cache.delete(key));
  cache.set(key, { at: now.getTime(), promise });
  return promise;
}

export function clearPriceCache() {
  cache.clear();
}

export { marketData };
