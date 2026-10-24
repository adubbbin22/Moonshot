import type { FundamentalsProvider } from './types';
import type { CompanySnapshot } from '@/domain/types';

/** Our backend: GET {baseUrl}/company/{symbol} → { company }. The demo server speaks this. */
export function createProxyProvider(baseUrl: string, fetchImpl: typeof fetch = fetch): FundamentalsProvider {
  return {
    id: 'proxy',
    label: 'Moonshot company data',
    async getCompany(symbol) {
      const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/company/${encodeURIComponent(symbol)}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.status === 404) return undefined;
      if (!response.ok) throw new Error(`Company data ${response.status} for ${symbol}.`);
      const body = (await response.json()) as { company: CompanySnapshot };
      return body.company;
    },
  };
}
