import type { CompanySnapshot, FundHolding } from '../src/domain/types';

/**
 * Turns Yahoo Finance's quote summary (as returned by the yahoo-finance2
 * library) into Moonshot's CompanySnapshot. DEMO ONLY, like the chains:
 * Yahoo has no official API and its terms don't cover an app (docs/DATA.md).
 *
 * The shapes below are the subset of yahoo-finance2's QuoteSummaryResult we
 * read, kept structural so this file doesn't depend on the library.
 */

type DateLike = Date | number | string;

export const SUMMARY_MODULES = [
  'price',
  'assetProfile',
  'financialData',
  'defaultKeyStatistics',
  'summaryDetail',
  'calendarEvents',
  'fundProfile',
  'topHoldings',
] as const;

export interface YahooSummary {
  price?: { longName?: string | null; shortName?: string | null; quoteType?: string; marketCap?: number; currency?: string | null };
  assetProfile?: {
    longBusinessSummary?: string;
    sector?: string;
    industry?: string;
    city?: string;
    state?: string;
    country?: string;
    fullTimeEmployees?: number;
    website?: string;
  };
  financialData?: {
    totalRevenue?: number;
    revenueGrowth?: number;
    grossMargins?: number;
    operatingMargins?: number;
    profitMargins?: number;
    freeCashflow?: number;
    totalCash?: number;
    totalDebt?: number;
    financialCurrency?: string | null;
  };
  defaultKeyStatistics?: {
    enterpriseValue?: number;
    forwardPE?: number;
    netIncomeToCommon?: number;
    totalAssets?: number;
    annualReportExpenseRatio?: number;
  };
  summaryDetail?: { marketCap?: number; trailingPE?: number; forwardPE?: number; priceToSalesTrailing12Months?: number; totalAssets?: number };
  calendarEvents?: { earnings?: { earningsDate?: DateLike[]; isEarningsDateEstimate?: boolean } };
  fundProfile?: {
    family?: string | null;
    categoryName?: string | null;
    feesExpensesInvestment?: { annualReportExpenseRatio?: number; netExpRatio?: number };
  };
  topHoldings?: { holdings?: { symbol?: string; holdingName?: string; holdingPercent?: number }[] };
}

export type YahooSummaryFetcher = (symbol: string) => Promise<YahooSummary>;

const FUND_TYPES = new Set(['ETF', 'MUTUALFUND']);

function toIsoDate(value: DateLike): string {
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return date.toISOString().slice(0, 10);
}

/** Yahoo lists some figures as 0 when it has none; treat those as missing, since a real zero is rare and ambiguous. */
const positive = (n: number | undefined): number | undefined => (n !== undefined && Number.isFinite(n) && n > 0 ? n : undefined);
const finite = (n: number | undefined): number | undefined => (n !== undefined && Number.isFinite(n) ? n : undefined);

function headquarters(p: NonNullable<YahooSummary['assetProfile']>): string | undefined {
  const region = p.country === 'United States' ? p.state : p.country;
  return [p.city, region].filter(Boolean).join(', ') || undefined;
}

export function toCompanySnapshot(symbol: string, result: YahooSummary, now: Date): CompanySnapshot {
  const { price, assetProfile: profile, financialData: fin, defaultKeyStatistics: stats, summaryDetail: detail, calendarEvents, fundProfile, topHoldings } =
    result;
  const isFund = FUND_TYPES.has(price?.quoteType ?? '');
  const name = price?.longName || price?.shortName || symbol;

  const snapshot: CompanySnapshot = {
    symbol,
    name,
    asOf: now.toISOString(),
    basis: 'live',
    source: 'Yahoo Finance (demo only)',
    about: {
      description: profile?.longBusinessSummary ?? '',
      sector: profile?.sector,
      industry: profile?.industry,
      headquarters: profile ? headquarters(profile) : undefined,
      employees: positive(profile?.fullTimeEmployees),
      website: profile?.website,
    },
  };

  if (isFund) {
    const holdings: FundHolding[] = (topHoldings?.holdings ?? []).flatMap((h) =>
      h.symbol && h.holdingPercent !== undefined ? [{ symbol: h.symbol, name: h.holdingName ?? h.symbol, weight: h.holdingPercent }] : [],
    );
    snapshot.fund = {
      family: fundProfile?.family ?? undefined,
      category: fundProfile?.categoryName ?? undefined,
      expenseRatio: positive(fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio ?? fundProfile?.feesExpensesInvestment?.netExpRatio ?? stats?.annualReportExpenseRatio),
      netAssets: positive(stats?.totalAssets ?? detail?.totalAssets),
      topHoldings: holdings,
    };
    return snapshot;
  }

  const nextEarnings = calendarEvents?.earnings?.earningsDate?.[0];
  snapshot.financials = {
    currency: fin?.financialCurrency || price?.currency || 'USD',
    marketCap: positive(price?.marketCap ?? detail?.marketCap),
    enterpriseValue: positive(stats?.enterpriseValue),
    revenue: finite(fin?.totalRevenue),
    revenueGrowth: finite(fin?.revenueGrowth),
    grossMargin: finite(fin?.grossMargins),
    operatingMargin: finite(fin?.operatingMargins),
    profitMargin: finite(fin?.profitMargins),
    netIncome: finite(stats?.netIncomeToCommon),
    freeCashFlow: finite(fin?.freeCashflow),
    cash: finite(fin?.totalCash),
    debt: finite(fin?.totalDebt),
    trailingPe: positive(detail?.trailingPE),
    forwardPe: positive(detail?.forwardPE ?? stats?.forwardPE),
    priceToSales: positive(detail?.priceToSalesTrailing12Months),
    ...(nextEarnings !== undefined
      ? { nextEarnings: toIsoDate(nextEarnings), nextEarningsEstimated: calendarEvents?.earnings?.isEarningsDateEstimate ?? true }
      : {}),
  };
  return snapshot;
}

export interface CompanySourceOptions {
  cacheTtlMs?: number;
  now?: () => Date;
}

/** Snapshots by symbol, cached for a while: fundamentals change quarterly, not by the minute. */
export function createCompanySource(fetchSummary: YahooSummaryFetcher, options: CompanySourceOptions = {}) {
  const { cacheTtlMs = 60 * 60 * 1000, now = () => new Date() } = options;
  const cache = new Map<string, { at: number; promise: Promise<CompanySnapshot> }>();

  return function companyFor(symbol: string): Promise<CompanySnapshot> {
    const key = symbol.toUpperCase();
    const hit = cache.get(key);
    if (hit && now().getTime() - hit.at < cacheTtlMs) return hit.promise;
    const promise = fetchSummary(key).then((result) => toCompanySnapshot(key, result, now()));
    promise.catch(() => cache.delete(key));
    cache.set(key, { at: now().getTime(), promise });
    return promise;
  };
}
