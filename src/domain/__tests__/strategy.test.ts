import {
  isAsymmetric,
  minExpirationDate,
  payoffPoints,
  priceStrategy,
  StrategyError,
  usablePrice,
} from '../strategy';
import type { ChainSnapshot, OptionContract, StrategyTemplate } from '../types';

const now = new Date('2026-10-24T15:00:00.000Z');

function contract(type: 'call' | 'put', strike: number, bid: number, ask: number, iv: number | null = 0.4): OptionContract {
  return { symbol: `TEST${type[0]}${strike}`, type, strike, expiration: '2027-10-15', bid, ask, last: null, iv };
}

const chain: ChainSnapshot = {
  underlying: 'TEST',
  spot: 100,
  asOf: now.toISOString(),
  expiration: '2027-10-15',
  contracts: [
    contract('call', 100, 15.5, 16.5),
    contract('call', 120, 7.8, 8.2),
    contract('call', 125, 6.3, 6.7),
    contract('call', 130, 5.1, 5.5),
    contract('call', 140, 3.3, 3.7),
    contract('put', 80, 4.8, 5.2),
    contract('put', 70, 2.3, 2.7),
  ],
};

const callSpread: StrategyTemplate = {
  underlying: 'TEST',
  underlyingName: 'Test',
  kind: 'call_debit_spread',
  buyStrike: 1.21,
  sellStrike: 1.4,
  minDays: 300,
};

describe('usablePrice', () => {
  it('uses the mid of a two-sided market, else the last trade, else nothing', () => {
    expect(usablePrice(contract('call', 100, 1, 2))).toBe(1.5);
    expect(usablePrice({ ...contract('call', 100, 0, 2), last: 1.2 })).toBe(1.2);
    expect(usablePrice({ ...contract('call', 100, 0, 0), last: null })).toBeNull();
  });
});

describe('priceStrategy', () => {
  it('snaps template strikes to listed strikes and prices the spread at mid', () => {
    const priced = priceStrategy(callSpread, chain, now);
    expect(priced.legs.map((l) => [l.action, l.strike])).toEqual([
      ['buy', 120],
      ['sell', 140],
    ]);
    expect(priced.debit).toBeCloseTo(4.5);
    expect(priced.costPerContract).toBeCloseTo(450);
    expect(priced.maxValuePerContract).toBe(2000);
    expect(priced.payoffMultiple).toBeCloseTo(2000 / 450);
    expect(priced.breakeven).toBeCloseTo(124.5);
    expect(priced.daysToExpiry).toBe(356);
  });

  it('builds an outcome ladder whose probabilities sum to 1', () => {
    const priced = priceStrategy(callSpread, chain, now);
    expect(priced.outcomes.map((o) => o.label)).toEqual(['Lose it all', 'Get some back', 'Profit', 'Max payout']);
    expect(priced.outcomes.reduce((s, o) => s + o.probability, 0)).toBeCloseTo(1, 10);
    expect(priced.outcomes[3]).toMatchObject({ lower: 140, upper: null, valueFrom: 2000, valueTo: 2000 });
    expect(priced.probProfit).toBeCloseTo(
      priced.outcomes[2].probability + priced.outcomes[3].probability,
      10,
    );
  });

  it('labels the upside of an uncapped long call as tripling', () => {
    const priced = priceStrategy({ ...callSpread, kind: 'long_call', sellStrike: undefined }, chain, now);
    expect(priced.maxValuePerContract).toBeNull();
    expect(priced.payoffMultiple).toBeNull();
    const top = priced.outcomes[3];
    expect(top).toMatchObject({ label: 'Triple or more', upper: null, valueTo: null });
    // Triple: value = 3 x $800 cost, reached at 120 + 24.
    expect(top.lower).toBeCloseTo(144);
  });

  it('mirrors the ladder for bearish put spreads', () => {
    const priced = priceStrategy(
      { ...callSpread, kind: 'put_debit_spread', buyStrike: 0.8, sellStrike: 0.7 },
      chain,
      now,
    );
    expect(priced.legs.map((l) => l.strike)).toEqual([80, 70]);
    expect(priced.breakeven).toBeCloseTo(77.5);
    expect(priced.outcomes[0]).toMatchObject({ label: 'Lose it all', lower: 80, upper: null });
    expect(priced.outcomes[3]).toMatchObject({ label: 'Max payout', lower: null, upper: 70 });
    expect(priced.outcomes.reduce((s, o) => s + o.probability, 0)).toBeCloseTo(1, 10);
  });

  it('infers volatility from the price when the provider gives none', () => {
    const noIv = { ...chain, contracts: chain.contracts.map((c) => ({ ...c, iv: null })) };
    expect(priceStrategy(callSpread, noIv, now).vol).toBeGreaterThan(0.1);
  });

  it('explains why a template cannot be priced', () => {
    const empty = { ...chain, contracts: [] };
    expect(() => priceStrategy(callSpread, empty, now)).toThrow(StrategyError);
    const expired = new Date('2027-11-01T00:00:00.000Z');
    expect(() => priceStrategy(callSpread, chain, expired)).toThrow(/expired/);
  });
});

describe('asymmetry and payoff curve', () => {
  it('requires at least a 3x payoff, and treats uncapped as asymmetric', () => {
    expect(isAsymmetric({ payoffMultiple: 4.4 })).toBe(true);
    expect(isAsymmetric({ payoffMultiple: 2 })).toBe(false);
    expect(isAsymmetric({ payoffMultiple: null })).toBe(true);
  });

  it('samples P&L at every kink across the range', () => {
    const priced = priceStrategy(callSpread, chain, now);
    const points = payoffPoints(priced, 60, 200);
    expect(points.map((p) => p.price)).toEqual([60, 120, 124.5, 140, 200]);
    expect(points[0].pnl).toBeCloseTo(-450);
    expect(points[2].pnl).toBeCloseTo(0);
    expect(points[4].pnl).toBeCloseTo(1550);
  });

  it('computes the minimum expiration date', () => {
    expect(minExpirationDate(30, now)).toBe('2026-11-23');
  });
});
