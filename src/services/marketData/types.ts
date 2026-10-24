import type { ChainSnapshot } from '@/domain/types';

export interface ChainRequest {
  /** Return the first listed expiration on or after this date (YYYY-MM-DD). */
  minExpiration: string;
}

/**
 * Anything that can return an option chain. The app only talks to this
 * interface, so switching vendors (or moving fetching to a backend proxy)
 * does not touch screens or domain logic.
 */
export interface MarketDataProvider {
  readonly id: string;
  /** Shown next to prices so users know where they came from. */
  readonly label: string;
  /** False for synthetic, indicative or 15-minute delayed data. */
  readonly realtime: boolean;
  getChain(underlying: string, request: ChainRequest): Promise<ChainSnapshot>;
}

export class MarketDataError extends Error {}
