import type { CompanyAbout, CompanyFinancials, FundFacts } from '@/domain/types';

/**
 * SAMPLE COMPANY INFORMATION AND FINANCIALS, for demos without a backend.
 * Rounded, approximate figures that are labelled "sample" wherever they
 * appear; nothing here is a live number. Real snapshots come from the
 * server (server/fundamentals.ts).
 */

export const SAMPLE_AS_OF = '2026-10-01';

export interface CompanySample {
  about: CompanyAbout;
  financials?: CompanyFinancials;
  fund?: FundFacts;
}

const usd = (f: Omit<CompanyFinancials, 'currency'>): CompanyFinancials => ({ currency: 'USD', ...f });

export const COMPANY_SAMPLES: Record<string, CompanySample> = {
  NVDA: {
    about: {
      description:
        'Designs the graphics processors and networking that run most AI training and inference, sold as full systems to cloud providers, model labs and enterprises. Manufacturing is outsourced to TSMC.',
      sector: 'Technology',
      industry: 'Semiconductors',
      headquarters: 'Santa Clara, California',
      employees: 42_000,
      website: 'https://www.nvidia.com',
    },
    financials: usd({
      marketCap: 4.4e12,
      enterpriseValue: 4.35e12,
      revenue: 2.4e11,
      revenueGrowth: 0.6,
      grossMargin: 0.73,
      operatingMargin: 0.62,
      profitMargin: 0.55,
      netIncome: 1.32e11,
      freeCashFlow: 1.1e11,
      cash: 6.5e10,
      debt: 8.5e9,
      trailingPe: 42,
      forwardPe: 30,
      priceToSales: 18,
      nextEarnings: '2026-11-18',
      nextEarningsEstimated: true,
    }),
  },
  CEG: {
    about: {
      description:
        'The largest nuclear fleet in the United States, plus hydro, wind and solar, selling power to utilities, businesses and data centers under long-term contracts.',
      sector: 'Utilities',
      industry: 'Independent power producers',
      headquarters: 'Baltimore, Maryland',
      employees: 14_000,
      website: 'https://www.constellationenergy.com',
    },
    financials: usd({
      marketCap: 1.05e11,
      enterpriseValue: 1.1e11,
      revenue: 2.45e10,
      revenueGrowth: 0.06,
      grossMargin: 0.28,
      operatingMargin: 0.17,
      profitMargin: 0.14,
      netIncome: 3.4e9,
      freeCashFlow: 1.2e9,
      cash: 3.0e9,
      debt: 9.0e9,
      trailingPe: 31,
      forwardPe: 27,
      priceToSales: 4.3,
      nextEarnings: '2026-11-05',
      nextEarningsEstimated: true,
    }),
  },
  OKLO: {
    about: {
      description:
        'Developing small fast-neutron reactors it plans to own and operate, selling the electricity to data centers and industrial sites. No reactor is running yet; the first is in licensing and construction.',
      sector: 'Utilities',
      industry: 'Advanced nuclear',
      headquarters: 'Santa Clara, California',
      employees: 150,
      website: 'https://www.oklo.com',
    },
    financials: usd({
      marketCap: 1.2e10,
      enterpriseValue: 1.15e10,
      revenue: 0,
      netIncome: -1.1e8,
      freeCashFlow: -9.0e7,
      cash: 6.5e8,
      debt: 0,
      nextEarnings: '2026-11-10',
      nextEarningsEstimated: true,
    }),
  },
  EQT: {
    about: {
      description:
        'The largest natural gas producer in the United States, drilling in the Appalachian Marcellus and Utica shales and owning the pipelines that move its gas to market.',
      sector: 'Energy',
      industry: 'Oil and gas exploration and production',
      headquarters: 'Pittsburgh, Pennsylvania',
      employees: 1_200,
      website: 'https://www.eqt.com',
    },
    financials: usd({
      marketCap: 3.6e10,
      enterpriseValue: 4.4e10,
      revenue: 7.8e9,
      revenueGrowth: 0.32,
      grossMargin: 0.55,
      operatingMargin: 0.36,
      profitMargin: 0.26,
      netIncome: 2.0e9,
      freeCashFlow: 2.1e9,
      cash: 4.0e8,
      debt: 8.2e9,
      trailingPe: 18,
      forwardPe: 12,
      priceToSales: 4.6,
      nextEarnings: '2026-10-28',
      nextEarningsEstimated: true,
    }),
  },
  TSLA: {
    about: {
      description:
        'Makes electric cars, batteries and solar, and is spending heavily on self-driving software, a robotaxi service and the Optimus humanoid robot. Most revenue still comes from selling vehicles.',
      sector: 'Consumer cyclical',
      industry: 'Auto manufacturers',
      headquarters: 'Austin, Texas',
      employees: 125_000,
      website: 'https://www.tesla.com',
    },
    financials: usd({
      marketCap: 1.35e12,
      enterpriseValue: 1.32e12,
      revenue: 9.6e10,
      revenueGrowth: -0.02,
      grossMargin: 0.17,
      operatingMargin: 0.06,
      profitMargin: 0.06,
      netIncome: 5.5e9,
      freeCashFlow: 3.0e9,
      cash: 3.8e10,
      debt: 8.0e9,
      trailingPe: 240,
      forwardPe: 160,
      priceToSales: 14,
      nextEarnings: '2027-01-27',
      nextEarningsEstimated: true,
    }),
  },
  FRO: {
    about: {
      description:
        'One of the largest crude oil tanker owners, running a fleet of very large and Suezmax tankers that earn whatever the spot charter market pays. Earnings swing with tanker rates.',
      sector: 'Energy',
      industry: 'Crude oil tankers',
      headquarters: 'Limassol, Cyprus',
      website: 'https://www.frontlineplc.cy',
    },
    financials: usd({
      marketCap: 5.2e9,
      enterpriseValue: 8.5e9,
      revenue: 1.9e9,
      revenueGrowth: 0.05,
      grossMargin: 0.45,
      operatingMargin: 0.33,
      profitMargin: 0.26,
      netIncome: 5.0e8,
      freeCashFlow: 6.0e8,
      cash: 5.0e8,
      debt: 3.6e9,
      trailingPe: 10,
      forwardPe: 8,
      priceToSales: 2.7,
      nextEarnings: '2026-11-24',
      nextEarningsEstimated: true,
    }),
  },
  LMT: {
    about: {
      description:
        'The largest defense contractor: fighter jets (F-35), missiles and air defense, helicopters and space systems, sold mostly to the US government and allied militaries on multi-year programs.',
      sector: 'Industrials',
      industry: 'Aerospace and defense',
      headquarters: 'Bethesda, Maryland',
      employees: 121_000,
      website: 'https://www.lockheedmartin.com',
    },
    financials: usd({
      marketCap: 1.1e11,
      enterpriseValue: 1.3e11,
      revenue: 7.3e10,
      revenueGrowth: 0.03,
      grossMargin: 0.1,
      operatingMargin: 0.08,
      profitMargin: 0.06,
      netIncome: 4.5e9,
      freeCashFlow: 5.0e9,
      cash: 2.5e9,
      debt: 2.0e10,
      trailingPe: 24,
      forwardPe: 17,
      priceToSales: 1.5,
      nextEarnings: '2027-01-26',
      nextEarningsEstimated: true,
    }),
  },
  ASTS: {
    about: {
      description:
        'Building a constellation of large satellites meant to connect ordinary phones directly from space, in partnership with mobile carriers. Still launching the network; revenue is minimal so far.',
      sector: 'Communication services',
      industry: 'Satellite telecom',
      headquarters: 'Midland, Texas',
      employees: 650,
      website: 'https://ast-science.com',
    },
    financials: usd({
      marketCap: 1.6e10,
      enterpriseValue: 1.6e10,
      revenue: 1.5e7,
      netIncome: -4.5e8,
      freeCashFlow: -7.0e8,
      cash: 1.1e9,
      debt: 1.0e9,
      nextEarnings: '2026-11-12',
      nextEarningsEstimated: true,
    }),
  },
  RKLB: {
    about: {
      description:
        'Launches small satellites on its Electron rocket, builds spacecraft and components for other operators, and is developing the larger Neutron rocket to compete for bigger payloads.',
      sector: 'Industrials',
      industry: 'Aerospace and defense',
      headquarters: 'Long Beach, California',
      employees: 2_600,
      website: 'https://www.rocketlabcorp.com',
    },
    financials: usd({
      marketCap: 2.6e10,
      enterpriseValue: 2.6e10,
      revenue: 6.5e8,
      revenueGrowth: 0.45,
      grossMargin: 0.3,
      operatingMargin: -0.3,
      profitMargin: -0.32,
      netIncome: -2.1e8,
      freeCashFlow: -1.6e8,
      cash: 7.5e8,
      debt: 5.0e8,
      priceToSales: 40,
      nextEarnings: '2026-11-11',
      nextEarningsEstimated: true,
    }),
  },
  SMH: {
    about: {
      description:
        'An index fund of the largest chip designers, foundries and equipment makers listed in the US. Heavily weighted to its biggest names, so it moves with NVIDIA and TSMC more than with the rest.',
      sector: 'Technology',
      industry: 'Semiconductors',
      website: 'https://www.vaneck.com',
    },
    fund: {
      family: 'VanEck',
      category: 'Technology',
      expenseRatio: 0.0035,
      netAssets: 3.2e10,
      topHoldings: [
        { symbol: 'NVDA', name: 'NVIDIA', weight: 0.2 },
        { symbol: 'TSM', name: 'Taiwan Semiconductor', weight: 0.11 },
        { symbol: 'AVGO', name: 'Broadcom', weight: 0.08 },
        { symbol: 'AMD', name: 'Advanced Micro Devices', weight: 0.05 },
        { symbol: 'ASML', name: 'ASML', weight: 0.05 },
        { symbol: 'LRCX', name: 'Lam Research', weight: 0.04 },
        { symbol: 'AMAT', name: 'Applied Materials', weight: 0.04 },
        { symbol: 'MU', name: 'Micron', weight: 0.04 },
      ],
    },
  },
  URA: {
    about: {
      description:
        'An index fund of uranium miners, physical uranium trusts and nuclear component makers worldwide. Tracks the uranium price and the mood on nuclear power more than any single company.',
      sector: 'Energy',
      industry: 'Uranium and nuclear',
      website: 'https://www.globalxetfs.com',
    },
    fund: {
      family: 'Global X',
      category: 'Natural resources',
      expenseRatio: 0.0069,
      netAssets: 5.5e9,
      topHoldings: [
        { symbol: 'CCJ', name: 'Cameco', weight: 0.22 },
        { symbol: 'U.UN', name: 'Sprott Physical Uranium Trust', weight: 0.1 },
        { symbol: 'NXE', name: 'NexGen Energy', weight: 0.07 },
        { symbol: 'OKLO', name: 'Oklo', weight: 0.06 },
        { symbol: 'PDN', name: 'Paladin Energy', weight: 0.05 },
        { symbol: 'UEC', name: 'Uranium Energy', weight: 0.05 },
        { symbol: 'KAP', name: 'Kazatomprom', weight: 0.04 },
        { symbol: 'DNN', name: 'Denison Mines', weight: 0.04 },
      ],
    },
  },
  QQQ: {
    about: {
      description:
        'Tracks the Nasdaq-100: the hundred largest non-financial companies on the Nasdaq, dominated by the big technology platforms and chipmakers. The standard way to own large-cap growth in one line.',
      sector: 'Diversified',
      industry: 'Large-cap growth index',
      website: 'https://www.invesco.com',
    },
    fund: {
      family: 'Invesco',
      category: 'Large growth',
      expenseRatio: 0.002,
      netAssets: 3.8e11,
      topHoldings: [
        { symbol: 'NVDA', name: 'NVIDIA', weight: 0.1 },
        { symbol: 'MSFT', name: 'Microsoft', weight: 0.08 },
        { symbol: 'AAPL', name: 'Apple', weight: 0.08 },
        { symbol: 'AMZN', name: 'Amazon', weight: 0.05 },
        { symbol: 'AVGO', name: 'Broadcom', weight: 0.05 },
        { symbol: 'META', name: 'Meta Platforms', weight: 0.04 },
        { symbol: 'TSLA', name: 'Tesla', weight: 0.03 },
        { symbol: 'GOOGL', name: 'Alphabet', weight: 0.03 },
      ],
    },
  },
  USO: {
    about: {
      description:
        'Holds near-term crude oil futures rather than oil itself, so it follows the spot price over days but drifts from it over months as contracts are rolled. The usual way to trade oil with options.',
      sector: 'Commodities',
      industry: 'Crude oil futures',
      website: 'https://www.uscfinvestments.com',
    },
    fund: {
      family: 'USCF',
      category: 'Commodities focused',
      expenseRatio: 0.007,
      netAssets: 1.0e9,
      holds: 'Front-month WTI crude oil futures, rolled each month, with Treasury bills as collateral.',
      topHoldings: [],
    },
  },
  JETS: {
    about: {
      description:
        'An index fund of airlines, weighted toward the four big US carriers, with aircraft makers, airports and foreign airlines in smaller amounts. Fuel prices and travel demand drive it.',
      sector: 'Industrials',
      industry: 'Airlines',
      website: 'https://www.usglobaletfs.com',
    },
    fund: {
      family: 'U.S. Global Investors',
      category: 'Industrials',
      expenseRatio: 0.006,
      netAssets: 9.0e8,
      topHoldings: [
        { symbol: 'DAL', name: 'Delta Air Lines', weight: 0.11 },
        { symbol: 'UAL', name: 'United Airlines', weight: 0.11 },
        { symbol: 'AAL', name: 'American Airlines', weight: 0.1 },
        { symbol: 'LUV', name: 'Southwest Airlines', weight: 0.1 },
        { symbol: 'ALK', name: 'Alaska Air', weight: 0.03 },
        { symbol: 'JBLU', name: 'JetBlue', weight: 0.03 },
        { symbol: 'SKYW', name: 'SkyWest', weight: 0.03 },
        { symbol: 'RYAAY', name: 'Ryanair', weight: 0.02 },
      ],
    },
  },
  GLD: {
    about: {
      description:
        'Owns gold bullion in vaults; each share is a claim on a small fraction of an ounce. It tracks the gold price closely, less a small annual fee, with no mining-company risk.',
      sector: 'Commodities',
      industry: 'Physical gold',
      website: 'https://www.spdrgoldshares.com',
    },
    fund: {
      family: 'State Street (SPDR)',
      category: 'Precious metals',
      expenseRatio: 0.004,
      netAssets: 1.1e11,
      holds: 'Allocated gold bars held in London vaults.',
      topHoldings: [],
    },
  },
  IWM: {
    about: {
      description:
        'Tracks the Russell 2000, roughly two thousand small US companies. No single stock matters much; it moves on interest rates, the domestic economy and investors’ appetite for risk.',
      sector: 'Diversified',
      industry: 'Small-cap index',
      website: 'https://www.ishares.com',
    },
    fund: {
      family: 'iShares (BlackRock)',
      category: 'Small blend',
      expenseRatio: 0.0019,
      netAssets: 7.0e10,
      holds: 'About two thousand small-cap US stocks; the largest is well under one percent of the fund.',
      topHoldings: [],
    },
  },
  XBI: {
    about: {
      description:
        'An equal-weight fund of US biotech companies, so small and mid-sized drug developers count as much as the giants. It rises and falls with drug approvals, trial results, takeovers and interest rates.',
      sector: 'Health care',
      industry: 'Biotechnology',
      website: 'https://www.ssga.com',
    },
    fund: {
      family: 'State Street (SPDR)',
      category: 'Health',
      expenseRatio: 0.0035,
      netAssets: 7.5e9,
      holds: 'Roughly equal weights across the biotech names in the S&P Total Market Index, rebalanced quarterly.',
      topHoldings: [],
    },
  },
};
