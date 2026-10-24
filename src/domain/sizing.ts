import { positionCost } from './portfolio';
import type { Position, Profile } from './types';

/**
 * Position sizing guardrails. Moonshot is the risky end of a barbell: users
 * set a monthly amount they can afford to lose, and no single bet may take
 * more than a fixed share of it.
 */

/**
 * Options trade in whole contracts (100 shares each), so the smallest bet is
 * one contract. Budgets start higher than a fractional-share app would need.
 */
export const BUDGET_OPTIONS = [100, 250, 500, 1000];
export const MAX_CONTRACTS = 10;

/** Taleb's barbell: most money very safe, a small slice in convex bets. */
export const DEFAULT_MOONSHOT_SHARE = 0.1;

export function maxStakePerBet(profile: Profile): number {
  return Math.floor(profile.monthlyBudget * profile.maxPerBetPct);
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function spentThisMonth(positions: Position[], now: Date): number {
  return positions
    .filter((p) => sameMonth(new Date(p.placedAt), now))
    .reduce((sum, p) => sum + positionCost(p), 0);
}

export function remainingBudget(profile: Profile, positions: Position[], now: Date): number {
  return Math.max(0, profile.monthlyBudget - spentThisMonth(positions, now));
}

/** Largest stake allowed right now: the per-bet cap or what's left this month. */
export function stakeCeiling(profile: Profile, positions: Position[], now: Date): number {
  return Math.min(maxStakePerBet(profile), remainingBudget(profile, positions, now));
}

export type StakeCheck = { ok: true } | { ok: false; reason: string };

export function checkStake(
  stake: number,
  profile: Profile,
  positions: Position[],
  now: Date,
): StakeCheck {
  if (!Number.isFinite(stake) || stake <= 0) {
    return { ok: false, reason: 'Pick how many contracts to buy.' };
  }
  const cap = maxStakePerBet(profile);
  if (stake > cap) {
    return {
      ok: false,
      reason: `That's over your $${cap} per-bet limit. Small bets, many shots.`,
    };
  }
  const remaining = remainingBudget(profile, positions, now);
  if (stake > remaining) {
    return {
      ok: false,
      reason: `You have $${remaining} left in this month's moonshot budget.`,
    };
  }
  return { ok: true };
}

/** Contract counts the user can pick, limited by the per-bet cap and what's left this month. */
export function contractOptions(
  costPerContract: number,
  profile: Profile,
  positions: Position[],
  now: Date,
): number[] {
  if (!(costPerContract > 0)) return [];
  const affordable = Math.floor(stakeCeiling(profile, positions, now) / costPerContract);
  return Array.from({ length: Math.min(affordable, MAX_CONTRACTS) }, (_, i) => i + 1);
}

export function barbellSplit(totalSavings: number, moonshotShare = DEFAULT_MOONSHOT_SHARE) {
  const moonshot = Math.round(totalSavings * moonshotShare);
  return { safe: totalSavings - moonshot, moonshot };
}
