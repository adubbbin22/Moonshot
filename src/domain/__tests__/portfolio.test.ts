import { summarizePortfolio } from '../portfolio';
import { makePosition } from '@/test/fixtures';

describe('summarizePortfolio', () => {
  it('sums open cost and finds the single biggest payout', () => {
    const summary = summarizePortfolio([
      makePosition({ id: 'a', costPerContract: 100, contracts: 2, maxValuePerContract: 500 }),
      makePosition({ id: 'b', costPerContract: 60, contracts: 1, maxValuePerContract: 250 }),
      makePosition({ id: 'c', costPerContract: 999, status: 'closed' }),
    ]);
    expect(summary).toEqual({ totalAtRisk: 260, oneHitValue: 1000, hasUncapped: false, openCount: 2 });
  });

  it('flags uncapped long calls', () => {
    const summary = summarizePortfolio([makePosition({ maxValuePerContract: null })]);
    expect(summary.hasUncapped).toBe(true);
    expect(summary.oneHitValue).toBe(0);
  });
});
