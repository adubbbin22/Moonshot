import type { CompanySnapshot } from '@/domain/types';

/**
 * Where company information and financials come from. Like market data, the
 * app never calls a vendor itself: snapshots come from our backend, or are
 * samples. Undefined means the source knows nothing about the symbol.
 */
export interface FundamentalsProvider {
  readonly id: 'sample' | 'proxy' | 'off';
  readonly label: string;
  getCompany(symbol: string): Promise<CompanySnapshot | undefined>;
}
