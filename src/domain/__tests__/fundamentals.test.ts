import { financialNotes, runwayYears } from '../fundamentals';

const base = { currency: 'USD' };

describe('financialNotes', () => {
  it('flags pre-revenue, losses and the runway', () => {
    expect(financialNotes({ ...base, revenue: 0, netIncome: -1.1e8, freeCashFlow: -9e7, cash: 6.5e8, debt: 0 })).toEqual([
      'Pre-revenue: the price is all expectation.',
      'Not yet profitable.',
      'Burning cash, with about 7 years of runway at the current rate.',
    ]);
  });

  it('flags fast growth, net cash, shrinking sales and a rich multiple', () => {
    expect(
      financialNotes({ ...base, revenue: 2.4e11, revenueGrowth: 0.6, netIncome: 1.3e11, freeCashFlow: 1.1e11, cash: 6.5e10, debt: 8.5e9, forwardPe: 30 }),
    ).toEqual(['Growing fast: sales well above a year ago.', 'Net cash: more cash than debt.']);
    expect(
      financialNotes({ ...base, revenue: 9.6e10, revenueGrowth: -0.02, netIncome: 5e9, freeCashFlow: 3e9, cash: 3.8e10, debt: 8e9, forwardPe: 160 }),
    ).toEqual([
      'Shrinking: sales below a year ago.',
      'Net cash: more cash than debt.',
      'Priced for growth: the market pays a high multiple of next year’s earnings.',
    ]);
    expect(financialNotes({ ...base, revenue: 7.3e10, revenueGrowth: 0.03, netIncome: 4.5e9, freeCashFlow: 5e9, cash: 2.5e9, debt: 2e10 })).toEqual([
      'Carries more debt than cash.',
    ]);
  });

  it('warns about a short runway and says nothing without figures', () => {
    expect(financialNotes({ ...base, netIncome: -4e8, freeCashFlow: -7e8, cash: 7e8 })).toEqual([
      'Not yet profitable.',
      'Burning cash with roughly a year of runway: expect it to raise money.',
    ]);
    expect(financialNotes(base)).toEqual([]);
  });

  it('computes runway only when cash is being burnt', () => {
    expect(runwayYears({ cash: 1e9, freeCashFlow: 5e8 })).toBeUndefined();
    expect(runwayYears({ cash: 1e9, freeCashFlow: -5e8 })).toBe(2);
    expect(runwayYears({ cash: 1e9 })).toBeUndefined();
  });
});
