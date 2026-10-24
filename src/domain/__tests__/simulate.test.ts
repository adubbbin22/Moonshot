import { inverseNormCdf, mulberry32, repeatBet, simulate, type SimPosition } from '../simulate';
import { normCdf, probabilityAbove } from '../pricing';

// A long call: spot 100, strike 120, paid 5 → breakeven 125.
const longCall: SimPosition = {
  legs: [{ action: 'buy', type: 'call', strike: 120, price: 5 }],
  contracts: 1,
  spot: 100,
  vol: 0.4,
  t: 1,
  bullish: true,
  breakeven: 125,
};
// A put spread: buy 80 put at 4, sell 70 put at 1.5 → cost 2.5, max 10, breakeven 77.5.
const putSpread: SimPosition = {
  legs: [
    { action: 'buy', type: 'put', strike: 80, price: 4 },
    { action: 'sell', type: 'put', strike: 70, price: 1.5 },
  ],
  contracts: 2,
  spot: 100,
  vol: 0.35,
  t: 0.75,
  bullish: false,
  breakeven: 77.5,
};

describe('random numbers', () => {
  it('is deterministic for a seed and inverts the normal CDF', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    for (const p of [0.001, 0.1, 0.5, 0.9, 0.999]) expect(normCdf(inverseNormCdf(p))).toBeCloseTo(p, 4);
  });
});

describe('simulate', () => {
  it('reproduces the market’s odds in market mode', () => {
    const analytic = probabilityAbove({ spot: 100, strike: 125, t: 1, vol: 0.4 });
    const sim = simulate([longCall], { trials: 20000, seed: 7, odds: 'market' });
    expect(sim.pProfit).toBeCloseTo(analytic, 1);
    expect(Math.abs(sim.pProfit - analytic)).toBeLessThan(0.02);
    expect(sim.totalCost).toBe(500);
    expect(sim.worst).toBe(-500);
    expect(sim.pLoseAll).toBeGreaterThan(0.5); // a far-out call usually expires worthless
    expect(sim.buckets.reduce((n, b) => n + b.count, 0)).toBe(20000);
  });

  it('lands past breakeven as often as you say in yours mode', () => {
    const sim = simulate([{ ...longCall, yourOdds: 0.5 }], { trials: 20000, seed: 7, odds: 'yours' });
    expect(Math.abs(sim.pProfit - 0.5)).toBeLessThan(0.02);
    const bearish = simulate([{ ...putSpread, yourOdds: 0.6 }], { trials: 20000, seed: 3, odds: 'yours' });
    expect(Math.abs(bearish.pProfit - 0.6)).toBeLessThan(0.02);
  });

  it('falls back to market odds for positions without a view, and sums positions', () => {
    const together = simulate([longCall, putSpread], { trials: 5000, seed: 11, odds: 'yours' });
    expect(together.totalCost).toBe(500 + 2 * 250);
    expect(together.worst).toBe(-1000);
    expect(together.best).toBeGreaterThan(0);
    expect(together.p10).toBeLessThanOrEqual(together.median);
    expect(together.median).toBeLessThanOrEqual(together.p90);
  });

  it('caps a spread at its max value', () => {
    const sim = simulate([putSpread], { trials: 5000, seed: 5, odds: 'market' });
    expect(sim.best).toBeCloseTo(2 * (1000 - 250), 6);
  });
});

describe('repeatBet', () => {
  it('is a binomial on hits with the bet’s multiple', () => {
    const run = repeatBet({ probability: 0.25, multiple: 4, cost: 100, n: 10 });
    expect(run.expectedHits).toBeCloseTo(2.5);
    expect(run.expectedPnl).toBeCloseTo(0); // fair odds: 0.25 × 4 = 1
    expect(run.pNoHit).toBeCloseTo(0.75 ** 10);
    expect(run.outcomes.reduce((s, o) => s + o.probability, 0)).toBeCloseTo(1);
    expect(run.outcomes[3]).toEqual({ hits: 3, probability: expect.closeTo(0.2503, 3), pnl: 200 });
    // Three hits or more is needed to come out ahead at 4x.
    expect(run.pProfit).toBeCloseTo(run.outcomes.filter((o) => o.hits >= 3).reduce((s, o) => s + o.probability, 0));
  });

  it('shows the edge when your odds beat the price', () => {
    expect(repeatBet({ probability: 0.4, multiple: 4, cost: 100, n: 10 }).expectedPnl).toBeCloseTo(600);
  });
});
