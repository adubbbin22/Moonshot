import type { Bet, Position, Scenario } from './types';

const EPSILON = 1e-6;

/** Returns human-readable problems with a scenario set, or [] if valid. */
export function validateScenarios(scenarios: Scenario[]): string[] {
  const errors: string[] = [];
  if (scenarios.length === 0) {
    errors.push('A bet needs at least one scenario.');
    return errors;
  }
  for (const s of scenarios) {
    if (s.probability < 0 || s.probability > 1) {
      errors.push(`"${s.label}" has probability ${s.probability}; expected 0..1.`);
    }
    if (s.multiple < 0) {
      errors.push(`"${s.label}" has multiple ${s.multiple}; a long-only bet cannot lose more than its stake.`);
    }
  }
  const total = scenarios.reduce((sum, s) => sum + s.probability, 0);
  if (Math.abs(total - 1) > EPSILON) {
    errors.push(`Scenario probabilities sum to ${total.toFixed(3)}; expected 1.`);
  }
  return errors;
}

/** Probability-weighted value of $1 staked. Above 1 means positive expectancy. */
export function expectedMultiple(scenarios: Scenario[]): number {
  return scenarios.reduce((sum, s) => sum + s.probability * s.multiple, 0);
}

export function bestMultiple(scenarios: Scenario[]): number {
  return scenarios.reduce((max, s) => Math.max(max, s.multiple), 0);
}

/** Chance of getting back less than you put in. */
export function lossProbability(scenarios: Scenario[]): number {
  return scenarios.filter((s) => s.multiple < 1).reduce((sum, s) => sum + s.probability, 0);
}

/**
 * Upside per $1 at risk in the best case. Downside is capped at the stake,
 * so a bet whose best case is 10x has 9:1 asymmetry.
 */
export function asymmetryRatio(scenarios: Scenario[]): number {
  return Math.max(0, bestMultiple(scenarios) - 1);
}

export interface OutcomeRow {
  label: string;
  probability: number;
  /** What the stake is worth in this scenario. */
  value: number;
  /** Gain or loss versus the stake. */
  pnl: number;
}

export function outcomeTable(stake: number, scenarios: Scenario[]): OutcomeRow[] {
  return scenarios.map((s) => ({
    label: s.label,
    probability: s.probability,
    value: stake * s.multiple,
    pnl: stake * s.multiple - stake,
  }));
}

export interface PortfolioSummary {
  /** Most you can lose: the sum of every open stake. */
  totalAtRisk: number;
  /** Value if only your single best-upside bet hits and everything else goes to zero. */
  oneHitValue: number;
  openCount: number;
}

/**
 * Power-law view of a portfolio: assume most bets go to zero and ask what one
 * winner would be worth.
 */
export function summarizePortfolio(
  positions: Position[],
  getBet: (betId: string) => Bet | undefined,
): PortfolioSummary {
  let totalAtRisk = 0;
  let oneHitValue = 0;
  let openCount = 0;

  for (const position of positions) {
    if (position.status !== 'open') continue;
    const bet = getBet(position.betId);
    if (!bet) continue;
    openCount += 1;
    totalAtRisk += position.stake;
    oneHitValue = Math.max(oneHitValue, position.stake * bestMultiple(bet.scenarios));
  }

  return { totalAtRisk, oneHitValue, openCount };
}
