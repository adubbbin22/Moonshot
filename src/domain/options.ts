import { intrinsic } from './pricing';
import type { LegAction, OptionType, StructureKind } from './types';

/** Shares per US equity option contract. */
export const CONTRACT_MULTIPLIER = 100;

export interface Leg {
  action: LegAction;
  type: OptionType;
  strike: number;
  /** Per-share price paid (buy) or received (sell). */
  price: number;
}

/** Per-share value of the legs at expiry for a given underlying price. */
export function payoffAtExpiry(legs: Leg[], spotAtExpiry: number): number {
  return legs.reduce((sum, leg) => {
    const value = intrinsic(leg.type, spotAtExpiry, leg.strike);
    return sum + (leg.action === 'buy' ? value : -value);
  }, 0);
}

/** Per-share net cost. Positive means you pay (a debit). */
export function netDebit(legs: Leg[]): number {
  return legs.reduce((sum, leg) => sum + (leg.action === 'buy' ? leg.price : -leg.price), 0);
}

/** Profit or loss per contract at expiry. */
export function pnlAtExpiry(legs: Leg[], spotAtExpiry: number): number {
  return (payoffAtExpiry(legs, spotAtExpiry) - netDebit(legs)) * CONTRACT_MULTIPLIER;
}

export function isBullish(kind: StructureKind): boolean {
  return kind === 'long_call' || kind === 'call_debit_spread';
}

export function isSpread(kind: StructureKind): boolean {
  return kind === 'call_debit_spread' || kind === 'put_debit_spread';
}

export function optionTypeFor(kind: StructureKind): OptionType {
  return isBullish(kind) ? 'call' : 'put';
}

/**
 * Checks that legs really form the named structure and that it is a debit
 * with defined risk. Returns problems, or [] if valid.
 */
export function validateStructure(kind: StructureKind, legs: Leg[]): string[] {
  const type = optionTypeFor(kind);
  const errors: string[] = [];
  const buys = legs.filter((l) => l.action === 'buy');
  const sells = legs.filter((l) => l.action === 'sell');

  if (legs.some((l) => l.type !== type)) errors.push(`All legs of a ${kind} must be ${type}s.`);
  if (buys.length !== 1) errors.push('Exactly one option must be bought.');
  if (sells.length !== (isSpread(kind) ? 1 : 0)) {
    errors.push(isSpread(kind) ? 'A spread sells exactly one option.' : 'A long option sells nothing.');
  }
  if (errors.length > 0) return errors;

  const debit = netDebit(legs);
  if (!(debit > 0)) errors.push('Moonshot only allows debit structures: you pay up front.');

  if (isSpread(kind)) {
    const buy = buys[0];
    const sell = sells[0];
    const width = Math.abs(sell.strike - buy.strike);
    const ordered = type === 'call' ? sell.strike > buy.strike : sell.strike < buy.strike;
    if (!ordered) {
      errors.push(
        type === 'call'
          ? 'In a call spread the sold strike must be above the bought strike.'
          : 'In a put spread the sold strike must be below the bought strike.',
      );
    } else if (debit >= width) {
      errors.push('The spread costs as much as it can ever pay. There is no upside.');
    }
  }
  return errors;
}

export interface StructureMetrics {
  /** Per-share net debit. */
  debit: number;
  /** Cost per contract: also the most you can lose. */
  costPerContract: number;
  /** Most the position can be worth per contract at expiry, or null if uncapped. */
  maxValuePerContract: number | null;
  /** Underlying price at expiry where you get your money back. */
  breakeven: number;
}

/** Assumes legs already pass validateStructure. */
export function structureMetrics(kind: StructureKind, legs: Leg[]): StructureMetrics {
  const debit = netDebit(legs);
  const buy = legs.find((l) => l.action === 'buy')!;
  const sell = legs.find((l) => l.action === 'sell');
  const bullish = isBullish(kind);

  let maxValuePerShare: number | null;
  if (sell) maxValuePerShare = Math.abs(sell.strike - buy.strike);
  else maxValuePerShare = bullish ? null : buy.strike;

  return {
    debit,
    costPerContract: debit * CONTRACT_MULTIPLIER,
    maxValuePerContract: maxValuePerShare === null ? null : maxValuePerShare * CONTRACT_MULTIPLIER,
    breakeven: bullish ? buy.strike + debit : buy.strike - debit,
  };
}
