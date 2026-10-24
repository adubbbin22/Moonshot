import {
  blackScholes,
  daysToExpiry,
  impliedVolatility,
  normCdf,
  probabilityAbove,
  probabilityBetween,
  yearsToExpiry,
} from '../pricing';

describe('normCdf', () => {
  it('matches standard normal values', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 7);
    expect(normCdf(1.96)).toBeCloseTo(0.975, 4);
    expect(normCdf(-1.96)).toBeCloseTo(0.025, 4);
  });
});

describe('blackScholes', () => {
  // Textbook case: S=100, K=100, T=1, vol=20%, r=5%.
  const inputs = { spot: 100, strike: 100, t: 1, vol: 0.2, rate: 0.05 };

  it('prices calls and puts', () => {
    expect(blackScholes('call', inputs)).toBeCloseTo(10.4506, 3);
    expect(blackScholes('put', inputs)).toBeCloseTo(5.5735, 3);
  });

  it('satisfies put-call parity', () => {
    const parity = inputs.spot - inputs.strike * Math.exp(-inputs.rate * inputs.t);
    expect(blackScholes('call', inputs) - blackScholes('put', inputs)).toBeCloseTo(parity, 6);
  });

  it('falls back to intrinsic value at expiry', () => {
    expect(blackScholes('call', { ...inputs, spot: 120, t: 0 })).toBe(20);
    expect(blackScholes('put', { ...inputs, spot: 120, t: 0 })).toBe(0);
  });
});

describe('impliedVolatility', () => {
  it('recovers the volatility used to price an option', () => {
    const price = blackScholes('call', { spot: 180, strike: 235, t: 1.2, vol: 0.47 });
    expect(impliedVolatility('call', price, { spot: 180, strike: 235, t: 1.2 })).toBeCloseTo(0.47, 4);
  });

  it('returns null for impossible prices', () => {
    expect(impliedVolatility('call', 0, { spot: 100, strike: 100, t: 1 })).toBeNull();
    expect(impliedVolatility('call', 150, { spot: 100, strike: 100, t: 1 })).toBeNull();
  });
});

describe('probabilities', () => {
  const base = { spot: 100, t: 1, vol: 0.2, rate: 0.05 };

  it('uses N(d2) for the chance of finishing above a strike', () => {
    // d2 = (0.05 - 0.02) / 0.2 = 0.15
    expect(probabilityAbove({ ...base, strike: 100 })).toBeCloseTo(normCdf(0.15), 10);
  });

  it('splits into ranges that sum to 1', () => {
    const total =
      probabilityBetween(0, 90, base) + probabilityBetween(90, 110, base) + probabilityBetween(110, null, base);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe('time to expiry', () => {
  it('measures to the 4pm New York close', () => {
    const now = new Date('2026-10-24T21:00:00.000Z');
    expect(daysToExpiry('2027-10-24', now)).toBe(365);
    expect(yearsToExpiry('2026-10-23', now)).toBe(0);
  });
});
