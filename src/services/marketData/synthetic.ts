import { formatOccSymbol } from './occ';
import { MarketDataError, type ChainRequest, type MarketDataProvider } from './types';
import { blackScholes, yearsToExpiry } from '@/domain/pricing';
import type { ChainSnapshot, OptionContract } from '@/domain/types';

/**
 * Deterministic, made-up option chains priced with Black-Scholes. Lets the
 * app run with no API keys. Spots and volatilities are rough, round numbers:
 * NOT real prices.
 */
export const SYNTHETIC_UNDERLYINGS: Record<string, { spot: number; vol: number }> = {
  NVDA: { spot: 180, vol: 0.45 },
  SMH: { spot: 300, vol: 0.35 },
  CEG: { spot: 300, vol: 0.45 },
  OKLO: { spot: 80, vol: 0.9 },
  URA: { spot: 40, vol: 0.4 },
  EQT: { spot: 55, vol: 0.38 },
  TSLA: { spot: 400, vol: 0.6 },
  QQQ: { spot: 600, vol: 0.2 },
  FRO: { spot: 22, vol: 0.45 },
  USO: { spot: 75, vol: 0.35 },
  JETS: { spot: 25, vol: 0.35 },
  LMT: { spot: 480, vol: 0.25 },
  GLD: { spot: 380, vol: 0.2 },
  IWM: { spot: 240, vol: 0.22 },
  XBI: { spot: 100, vol: 0.32 },
  ASTS: { spot: 60, vol: 0.95 },
  RKLB: { spot: 55, vol: 0.85 },
};

const MIN_PRICE = 0.05;

function thirdFriday(year: number, month: number): string {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (5 - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + offset + 14)).toISOString().slice(0, 10);
}

/** Monthly expirations (third Friday) for the next three years. */
export function listedExpirations(now: Date): string[] {
  const out: string[] = [];
  for (let i = 0; i < 36; i += 1) {
    const year = now.getUTCFullYear() + Math.floor((now.getUTCMonth() + i) / 12);
    const month = (now.getUTCMonth() + i) % 12;
    const date = thirdFriday(year, month);
    if (yearsToExpiry(date, now) > 0) out.push(date);
  }
  return out;
}

function strikeStep(spot: number): number {
  if (spot < 25) return 1;
  if (spot < 100) return 2.5;
  if (spot < 500) return 5;
  return 10;
}

const cents = (x: number) => Math.round(x * 100) / 100;

/** Simple skew: lower strikes trade at higher implied volatility. */
function skewedVol(baseVol: number, spot: number, strike: number): number {
  const vol = baseVol * (1 - 0.25 * Math.log(strike / spot));
  return Math.min(baseVol * 1.8, Math.max(baseVol * 0.6, vol));
}

export function syntheticChain(underlying: string, expiration: string, now: Date): ChainSnapshot {
  const params = SYNTHETIC_UNDERLYINGS[underlying];
  if (!params) throw new MarketDataError(`No synthetic data for ${underlying}.`);
  const { spot, vol } = params;
  const t = yearsToExpiry(expiration, now);
  const step = strikeStep(spot);

  const contracts: OptionContract[] = [];
  for (let strike = Math.ceil((spot * 0.4) / step) * step; strike <= spot * 2.5; strike += step) {
    const iv = skewedVol(vol, spot, strike);
    for (const type of ['call', 'put'] as const) {
      const mid = blackScholes(type, { spot, strike, t, vol: iv });
      if (mid < MIN_PRICE) continue;
      const half = Math.max(0.02, mid * 0.04);
      contracts.push({
        symbol: formatOccSymbol({ root: underlying, expiration, type, strike }),
        type,
        strike,
        expiration,
        bid: cents(Math.max(0.01, mid - half)),
        ask: cents(mid + half),
        last: cents(mid),
        iv,
      });
    }
  }
  return { underlying, spot, asOf: now.toISOString(), expiration, contracts };
}

export function createSyntheticProvider(clock: () => Date = () => new Date()): MarketDataProvider {
  return {
    id: 'synthetic',
    label: 'Synthetic prices (not real)',
    realtime: false,
    async getChain(underlying: string, { minExpiration }: ChainRequest) {
      const now = clock();
      const expiration = listedExpirations(now).find((d) => d >= minExpiration);
      if (!expiration) throw new MarketDataError(`No expiration on or after ${minExpiration}.`);
      return syntheticChain(underlying, expiration, now);
    },
  };
}
