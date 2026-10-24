import type { Position } from './types';

export interface PortfolioSummary {
  /** Most you can lose: everything paid for open positions. */
  totalAtRisk: number;
  /** Value at expiry if only your single biggest capped payout hits and everything else goes to zero. */
  oneHitValue: number;
  /** True if any open position has uncapped upside (a long call). */
  hasUncapped: boolean;
  openCount: number;
}

export function positionCost(position: Position): number {
  return position.costPerContract * position.contracts;
}

export function positionMaxValue(position: Position): number | null {
  return position.maxValuePerContract === null ? null : position.maxValuePerContract * position.contracts;
}

/**
 * Power-law view of a portfolio: assume most bets go to zero and ask what one
 * winner would be worth.
 */
export function summarizePortfolio(positions: Position[]): PortfolioSummary {
  const open = positions.filter((p) => p.status === 'open');
  return {
    totalAtRisk: open.reduce((sum, p) => sum + positionCost(p), 0),
    oneHitValue: open.reduce((max, p) => Math.max(max, positionMaxValue(p) ?? 0), 0),
    hasUncapped: open.some((p) => p.maxValuePerContract === null),
    openCount: open.length,
  };
}
