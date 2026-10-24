import { MarketDataError, type ChainRequest, type MarketDataProvider } from './types';
import type { ChainSnapshot } from '@/domain/types';

/**
 * Production path: the app asks our own backend for chains. The backend holds
 * the vendor keys and the data license, caches chains, and returns a
 * ChainSnapshot as JSON from GET {baseUrl}/chains/{underlying}?minExpiration=YYYY-MM-DD.
 */
export function createProxyProvider(baseUrl: string, fetchImpl: typeof fetch = fetch): MarketDataProvider {
  return {
    id: 'proxy',
    label: 'Moonshot market data (delayed)',
    realtime: false,
    async getChain(underlying: string, { minExpiration }: ChainRequest) {
      const url = `${baseUrl.replace(/\/$/, '')}/chains/${encodeURIComponent(underlying)}?minExpiration=${minExpiration}`;
      const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new MarketDataError(`Market data ${response.status} for ${underlying}.`);
      return (await response.json()) as ChainSnapshot;
    },
  };
}
