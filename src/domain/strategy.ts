import {
  isBullish,
  isSpread,
  optionTypeFor,
  pnlAtExpiry,
  structureMetrics,
  validateStructure,
  type Leg,
} from './options';
import {
  daysToExpiry,
  impliedVolatility,
  probabilityAbove,
  probabilityBetween,
  yearsToExpiry,
} from './pricing';
import type { ChainSnapshot, OptionContract, StrategyTemplate, StructureKind } from './types';

/** A bet must be able to return at least this multiple of its cost to count as asymmetric. */
export const MIN_PAYOFF_MULTIPLE = 3;

/** For uncapped long options, the "big win" row is defined as tripling your money. */
const BIG_WIN_MULTIPLE = 3;

export interface PricedLeg extends Leg {
  symbol: string;
}

export interface OutcomeRow {
  label: string;
  /** Underlying price range at expiry; null means unbounded. */
  lower: number | null;
  upper: number | null;
  /** Options-implied (risk-neutral) probability of finishing in this range. */
  probability: number;
  /** Position value per contract across the range; null upper means uncapped. */
  valueFrom: number;
  valueTo: number | null;
}

export interface PricedStrategy {
  underlying: string;
  kind: StructureKind;
  expiration: string;
  daysToExpiry: number;
  spot: number;
  asOf: string;
  /** Data source reported by the chain, if any. */
  source?: string;
  legs: PricedLeg[];
  /** Per-share net debit. */
  debit: number;
  costPerContract: number;
  maxValuePerContract: number | null;
  breakeven: number;
  /** Max value / cost. Null when uncapped. */
  payoffMultiple: number | null;
  /** Volatility used for the odds below. */
  vol: number;
  /** Options-implied probability of finishing past breakeven. */
  probProfit: number;
  outcomes: OutcomeRow[];
}

export class StrategyError extends Error {}

/** Mid price if the market is two-sided, otherwise the last trade. */
export function usablePrice(c: OptionContract): number | null {
  if (c.bid !== null && c.ask !== null && c.bid > 0 && c.ask >= c.bid) return (c.bid + c.ask) / 2;
  if (c.last !== null && c.last > 0) return c.last;
  return null;
}

function nearest(contracts: OptionContract[], target: number): OptionContract | undefined {
  return contracts.reduce<OptionContract | undefined>(
    (best, c) => (!best || Math.abs(c.strike - target) < Math.abs(best.strike - target) ? c : best),
    undefined,
  );
}

function pickContracts(template: StrategyTemplate, chain: ChainSnapshot) {
  const type = optionTypeFor(template.kind);
  const candidates = chain.contracts
    .filter((c) => c.type === type && usablePrice(c) !== null)
    .sort((a, b) => a.strike - b.strike);
  if (candidates.length === 0) {
    throw new StrategyError(`No priced ${type}s for ${chain.underlying} on ${chain.expiration}.`);
  }

  const buy = nearest(candidates, chain.spot * template.buyStrike)!;
  if (!isSpread(template.kind)) return { buy };

  if (template.sellStrike === undefined) throw new StrategyError('A spread template needs a sell strike.');
  const beyond = candidates.filter((c) => (type === 'call' ? c.strike > buy.strike : c.strike < buy.strike));
  const sell = nearest(beyond, chain.spot * template.sellStrike);
  if (!sell) throw new StrategyError(`No strike beyond ${buy.strike} to sell for ${chain.underlying}.`);
  return { buy, sell };
}

function toLeg(c: OptionContract, action: Leg['action']): PricedLeg {
  return { action, type: c.type, strike: c.strike, price: usablePrice(c)!, symbol: c.symbol };
}

/** Volatility for the odds: provider IV on the bought leg, else implied from its price. */
function volFor(contract: OptionContract, price: number, spot: number, t: number): number {
  if (contract.iv !== null && contract.iv > 0) return contract.iv;
  const implied = impliedVolatility(contract.type, price, { spot, strike: contract.strike, t });
  if (implied === null) throw new StrategyError(`Can't infer volatility for ${contract.symbol}.`);
  return implied;
}

/**
 * Builds the outcome ladder: the ranges of prices at expiry that matter for
 * this structure, with the market-implied chance of each.
 */
export function outcomeLadder(
  kind: StructureKind,
  legs: Leg[],
  inputs: { spot: number; t: number; vol: number },
): OutcomeRow[] {
  const { costPerContract, maxValuePerContract, breakeven } = structureMetrics(kind, legs);
  const buy = legs.find((l) => l.action === 'buy')!;
  const sell = legs.find((l) => l.action === 'sell');
  const p = (lower: number | null, upper: number | null) =>
    probabilityBetween(lower ?? 0, upper, inputs);

  if (isBullish(kind)) {
    const bigWin = sell ? sell.strike : buy.strike + (BIG_WIN_MULTIPLE * costPerContract) / 100;
    return [
      { label: 'Lose it all', lower: null, upper: buy.strike, probability: p(null, buy.strike), valueFrom: 0, valueTo: 0 },
      { label: 'Get some back', lower: buy.strike, upper: breakeven, probability: p(buy.strike, breakeven), valueFrom: 0, valueTo: costPerContract },
      {
        label: 'Profit',
        lower: breakeven,
        upper: bigWin,
        probability: p(breakeven, bigWin),
        valueFrom: costPerContract,
        valueTo: sell ? maxValuePerContract : BIG_WIN_MULTIPLE * costPerContract,
      },
      {
        label: sell ? 'Max payout' : 'Triple or more',
        lower: bigWin,
        upper: null,
        probability: p(bigWin, null),
        valueFrom: sell ? maxValuePerContract! : BIG_WIN_MULTIPLE * costPerContract,
        valueTo: sell ? maxValuePerContract : null,
      },
    ];
  }

  const bigWin = sell ? sell.strike : buy.strike - (BIG_WIN_MULTIPLE * costPerContract) / 100;
  const rows: OutcomeRow[] = [
    { label: 'Lose it all', lower: buy.strike, upper: null, probability: p(buy.strike, null), valueFrom: 0, valueTo: 0 },
    { label: 'Get some back', lower: breakeven, upper: buy.strike, probability: p(breakeven, buy.strike), valueFrom: 0, valueTo: costPerContract },
  ];
  if (bigWin <= 0) {
    rows.push({ label: 'Profit', lower: null, upper: breakeven, probability: p(null, breakeven), valueFrom: costPerContract, valueTo: maxValuePerContract });
    return rows;
  }
  rows.push(
    {
      label: 'Profit',
      lower: bigWin,
      upper: breakeven,
      probability: p(bigWin, breakeven),
      valueFrom: costPerContract,
      valueTo: sell ? maxValuePerContract : BIG_WIN_MULTIPLE * costPerContract,
    },
    {
      label: sell ? 'Max payout' : 'Triple or more',
      lower: null,
      upper: bigWin,
      probability: p(null, bigWin),
      valueFrom: sell ? maxValuePerContract! : BIG_WIN_MULTIPLE * costPerContract,
      valueTo: maxValuePerContract,
    },
  );
  return rows;
}

/** Turns a template plus today's chain into a concrete, priced position for one contract. */
export function priceStrategy(template: StrategyTemplate, chain: ChainSnapshot, now: Date): PricedStrategy {
  const t = yearsToExpiry(chain.expiration, now);
  if (t <= 0) throw new StrategyError(`${chain.expiration} has already expired.`);

  const { buy, sell } = pickContracts(template, chain);
  const legs = [toLeg(buy, 'buy'), ...(sell ? [toLeg(sell, 'sell')] : [])];

  const problems = validateStructure(template.kind, legs);
  if (problems.length > 0) throw new StrategyError(problems.join(' '));

  const metrics = structureMetrics(template.kind, legs);
  const vol = volFor(buy, legs[0].price, chain.spot, t);
  const inputs = { spot: chain.spot, t, vol };
  const bullish = isBullish(template.kind);
  const aboveBreakeven = probabilityAbove({ ...inputs, strike: metrics.breakeven });

  return {
    underlying: chain.underlying,
    kind: template.kind,
    expiration: chain.expiration,
    daysToExpiry: daysToExpiry(chain.expiration, now),
    spot: chain.spot,
    asOf: chain.asOf,
    source: chain.source,
    legs,
    ...metrics,
    payoffMultiple:
      metrics.maxValuePerContract === null ? null : metrics.maxValuePerContract / metrics.costPerContract,
    vol,
    probProfit: bullish ? aboveBreakeven : 1 - aboveBreakeven,
    outcomes: outcomeLadder(template.kind, legs, inputs),
  };
}

/** Moonshot's core filter: can this bet return several times what it risks? */
export function isAsymmetric(priced: Pick<PricedStrategy, 'payoffMultiple'>): boolean {
  return priced.payoffMultiple === null || priced.payoffMultiple >= MIN_PAYOFF_MULTIPLE;
}

export interface PayoffPoint {
  price: number;
  pnl: number;
}

/** P&L per contract at expiry across a price range, sampled at every kink. */
export function payoffPoints(priced: PricedStrategy, lower: number, upper: number): PayoffPoint[] {
  const kinks = [...priced.legs.map((l) => l.strike), priced.breakeven];
  const prices = [lower, ...kinks.filter((k) => k > lower && k < upper), upper].sort((a, b) => a - b);
  return prices.map((price) => ({ price, pnl: pnlAtExpiry(priced.legs, price) }));
}

/** First expiration at least `minDays` after `now`, as YYYY-MM-DD. */
export function minExpirationDate(minDays: number, now: Date): string {
  const d = new Date(now.getTime() + minDays * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}
