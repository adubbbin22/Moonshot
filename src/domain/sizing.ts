import type { Position, Profile } from './types';

/**
 * Position sizing guardrails. Moonshot is the risky end of a barbell: users
 * set a monthly amount they can afford to lose, and no single bet may take
 * more than a fixed share of it.
 */

export const MIN_STAKE = 5;
export const STAKE_PRESETS = [5, 10, 25, 50, 100, 250, 500];
export const BUDGET_OPTIONS = [25, 50, 100, 250, 500];

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
    .reduce((sum, p) => sum + p.stake, 0);
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
  if (!Number.isFinite(stake) || stake < MIN_STAKE) {
    return { ok: false, reason: `Minimum bet is $${MIN_STAKE}.` };
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

/** Preset stake chips the user can tap, limited to what's allowed right now. */
export function stakeOptions(profile: Profile, positions: Position[], now: Date): number[] {
  const ceiling = stakeCeiling(profile, positions, now);
  if (ceiling < MIN_STAKE) return [];
  const options = STAKE_PRESETS.filter((p) => p <= ceiling);
  if (!options.includes(ceiling) && options.length < 4) options.push(ceiling);
  return options;
}

export function barbellSplit(totalSavings: number, moonshotShare = DEFAULT_MOONSHOT_SHARE) {
  const moonshot = Math.round(totalSavings * moonshotShare);
  return { safe: totalSavings - moonshot, moonshot };
}
