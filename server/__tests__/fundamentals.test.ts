/**
 * @jest-environment node
 */
import { createCompanySource, toCompanySnapshot, type YahooSummary } from '../fundamentals';

const now = new Date('2026-10-24T15:00:00.000Z');

const stock: YahooSummary = {
  price: { longName: 'NVIDIA Corporation', quoteType: 'EQUITY', marketCap: 4.4e12, currency: 'USD' },
  assetProfile: {
    longBusinessSummary: 'Designs chips.',
    sector: 'Technology',
    industry: 'Semiconductors',
    city: 'Santa Clara',
    state: 'CA',
    country: 'United States',
    fullTimeEmployees: 42000,
    website: 'https://www.nvidia.com',
  },
  financialData: {
    totalRevenue: 2.4e11,
    revenueGrowth: 0.6,
    grossMargins: 0.73,
    operatingMargins: 0.62,
    profitMargins: 0.55,
    freeCashflow: 1.1e11,
    totalCash: 6.5e10,
    totalDebt: 8.5e9,
    financialCurrency: 'USD',
  },
  defaultKeyStatistics: { enterpriseValue: 4.35e12, forwardPE: 30, netIncomeToCommon: 1.32e11 },
  summaryDetail: { trailingPE: 42, priceToSalesTrailing12Months: 18 },
  calendarEvents: { earnings: { earningsDate: [new Date('2026-11-18T21:00:00.000Z')], isEarningsDateEstimate: true } },
};

const fund: YahooSummary = {
  price: { longName: 'VanEck Semiconductor ETF', quoteType: 'ETF', currency: 'USD' },
  assetProfile: { longBusinessSummary: 'Chips.' },
  fundProfile: { family: 'VanEck', categoryName: 'Technology', feesExpensesInvestment: { annualReportExpenseRatio: 0.0035 } },
  defaultKeyStatistics: { totalAssets: 3.2e10 },
  topHoldings: {
    holdings: [
      { symbol: 'NVDA', holdingName: 'NVIDIA Corp', holdingPercent: 0.2 },
      { holdingName: 'no symbol', holdingPercent: 0.1 },
    ],
  },
};

describe('toCompanySnapshot', () => {
  it('maps a company’s profile and financials', () => {
    const snapshot = toCompanySnapshot('NVDA', stock, now);
    expect(snapshot).toMatchObject({
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      basis: 'live',
      asOf: now.toISOString(),
      about: { description: 'Designs chips.', sector: 'Technology', headquarters: 'Santa Clara, CA', employees: 42000, website: 'https://www.nvidia.com' },
      financials: {
        currency: 'USD',
        marketCap: 4.4e12,
        enterpriseValue: 4.35e12,
        revenue: 2.4e11,
        revenueGrowth: 0.6,
        operatingMargin: 0.62,
        netIncome: 1.32e11,
        freeCashFlow: 1.1e11,
        cash: 6.5e10,
        debt: 8.5e9,
        trailingPe: 42,
        forwardPe: 30,
        priceToSales: 18,
        nextEarnings: '2026-11-18',
        nextEarningsEstimated: true,
      },
    });
    expect(snapshot.fund).toBeUndefined();
  });

  it('maps a fund and skips holdings without a symbol', () => {
    const snapshot = toCompanySnapshot('SMH', fund, now);
    expect(snapshot.financials).toBeUndefined();
    expect(snapshot.fund).toEqual({
      family: 'VanEck',
      category: 'Technology',
      expenseRatio: 0.0035,
      netAssets: 3.2e10,
      topHoldings: [{ symbol: 'NVDA', name: 'NVIDIA Corp', weight: 0.2 }],
    });
  });

  it('treats missing and zero figures as unknown', () => {
    const snapshot = toCompanySnapshot('X', { price: { quoteType: 'EQUITY', marketCap: 0 } }, now);
    expect(snapshot.name).toBe('X');
    expect(snapshot.about.headquarters).toBeUndefined();
    expect(snapshot.financials?.marketCap).toBeUndefined();
    expect(snapshot.financials?.nextEarnings).toBeUndefined();
    expect(snapshot.financials?.currency).toBe('USD');
  });
});

describe('createCompanySource', () => {
  it('caches per symbol for a while and drops failures from the cache', async () => {
    let t = 0;
    const fetchSummary = jest.fn(async (symbol: string) => {
      if (symbol === 'BAD') throw new Error('nope');
      return stock;
    });
    const companyFor = createCompanySource(fetchSummary, { cacheTtlMs: 1000, now: () => new Date(t) });

    await companyFor('nvda');
    await companyFor('NVDA');
    expect(fetchSummary).toHaveBeenCalledTimes(1);
    expect(fetchSummary).toHaveBeenCalledWith('NVDA');
    t = 2000;
    await companyFor('NVDA');
    expect(fetchSummary).toHaveBeenCalledTimes(2);

    await expect(companyFor('BAD')).rejects.toThrow('nope');
    await expect(companyFor('BAD')).rejects.toThrow('nope');
    expect(fetchSummary).toHaveBeenCalledTimes(4);
  });
});
