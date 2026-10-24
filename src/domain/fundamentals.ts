import type { CompanyFinancials } from './types';

/**
 * Reading a company's figures for someone who doesn't read balance sheets:
 * a few plain-English flags, derived from the numbers, never typed in.
 */

/** Below this, trailing revenue counts as "pre-revenue". */
export const PRE_REVENUE_BELOW = 1_000_000;
export const FAST_GROWTH = 0.4;
export const RICH_FORWARD_PE = 50;

/** Years of cash left at the current burn; undefined when the company isn't burning cash or the figures are missing. */
export function runwayYears(f: Pick<CompanyFinancials, 'cash' | 'freeCashFlow'>): number | undefined {
  if (f.cash === undefined || f.freeCashFlow === undefined || f.freeCashFlow >= 0) return undefined;
  return f.cash / -f.freeCashFlow;
}

export function financialNotes(f: CompanyFinancials): string[] {
  const notes: string[] = [];

  if (f.revenue !== undefined && f.revenue < PRE_REVENUE_BELOW) {
    notes.push('Pre-revenue: the price is all expectation.');
  } else if (f.revenueGrowth !== undefined) {
    if (f.revenueGrowth >= FAST_GROWTH) notes.push('Growing fast: sales well above a year ago.');
    else if (f.revenueGrowth < 0) notes.push('Shrinking: sales below a year ago.');
  }

  if (f.netIncome !== undefined && f.netIncome < 0) notes.push('Not yet profitable.');

  const runway = runwayYears(f);
  if (runway !== undefined) {
    notes.push(
      runway < 1.5
        ? 'Burning cash with roughly a year of runway: expect it to raise money.'
        : `Burning cash, with about ${Math.round(runway)} years of runway at the current rate.`,
    );
  } else if (f.cash !== undefined && f.debt !== undefined) {
    notes.push(f.cash >= f.debt ? 'Net cash: more cash than debt.' : 'Carries more debt than cash.');
  }

  if (f.forwardPe !== undefined && f.forwardPe > RICH_FORWARD_PE) {
    notes.push('Priced for growth: the market pays a high multiple of next year’s earnings.');
  }

  return notes;
}
