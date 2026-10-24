import {
  netDebit,
  payoffAtExpiry,
  pnlAtExpiry,
  structureMetrics,
  validateStructure,
  type Leg,
} from '../options';

const callSpread: Leg[] = [
  { action: 'buy', type: 'call', strike: 100, price: 4 },
  { action: 'sell', type: 'call', strike: 110, price: 1.5 },
];
const putSpread: Leg[] = [
  { action: 'buy', type: 'put', strike: 100, price: 3 },
  { action: 'sell', type: 'put', strike: 90, price: 1 },
];
const longCall: Leg[] = [{ action: 'buy', type: 'call', strike: 100, price: 5 }];
const longPut: Leg[] = [{ action: 'buy', type: 'put', strike: 50, price: 2 }];

describe('payoff math', () => {
  it('nets the debit across legs', () => {
    expect(netDebit(callSpread)).toBeCloseTo(2.5);
  });

  it('values a call spread at expiry', () => {
    expect(payoffAtExpiry(callSpread, 95)).toBe(0);
    expect(payoffAtExpiry(callSpread, 105)).toBe(5);
    expect(payoffAtExpiry(callSpread, 150)).toBe(10);
  });

  it('turns per-share payoff into per-contract P&L', () => {
    expect(pnlAtExpiry(callSpread, 95)).toBeCloseTo(-250);
    expect(pnlAtExpiry(callSpread, 150)).toBeCloseTo(750);
  });
});

describe('structureMetrics', () => {
  it('caps a call spread at its width', () => {
    expect(structureMetrics('call_debit_spread', callSpread)).toEqual({
      debit: 2.5,
      costPerContract: 250,
      maxValuePerContract: 1000,
      breakeven: 102.5,
    });
  });

  it('caps a put spread at its width with breakeven below the bought strike', () => {
    expect(structureMetrics('put_debit_spread', putSpread)).toMatchObject({
      costPerContract: 200,
      maxValuePerContract: 1000,
      breakeven: 98,
    });
  });

  it('leaves a long call uncapped', () => {
    expect(structureMetrics('long_call', longCall)).toMatchObject({
      maxValuePerContract: null,
      breakeven: 105,
    });
  });

  it('caps a long put at the strike (stock goes to zero)', () => {
    expect(structureMetrics('long_put', longPut)).toMatchObject({ maxValuePerContract: 5000, breakeven: 48 });
  });
});

describe('validateStructure', () => {
  it('accepts well-formed debit structures', () => {
    expect(validateStructure('call_debit_spread', callSpread)).toEqual([]);
    expect(validateStructure('put_debit_spread', putSpread)).toEqual([]);
    expect(validateStructure('long_call', longCall)).toEqual([]);
    expect(validateStructure('long_put', longPut)).toEqual([]);
  });

  it('rejects credit spreads: Moonshot never takes the short-convexity side', () => {
    const credit: Leg[] = [
      { action: 'sell', type: 'call', strike: 100, price: 4 },
      { action: 'buy', type: 'call', strike: 110, price: 1.5 },
    ];
    expect(validateStructure('call_debit_spread', credit).join(' ')).toMatch(/debit|sold strike/);
  });

  it('rejects inverted strikes', () => {
    const inverted: Leg[] = [
      { action: 'buy', type: 'call', strike: 110, price: 4 },
      { action: 'sell', type: 'call', strike: 100, price: 1 },
    ];
    expect(validateStructure('call_debit_spread', inverted)).toContain(
      'In a call spread the sold strike must be above the bought strike.',
    );
  });

  it('rejects a spread that costs its full width', () => {
    const noUpside: Leg[] = [
      { action: 'buy', type: 'call', strike: 100, price: 11 },
      { action: 'sell', type: 'call', strike: 110, price: 1 },
    ];
    expect(validateStructure('call_debit_spread', noUpside)).toContain(
      'The spread costs as much as it can ever pay. There is no upside.',
    );
  });

  it('rejects the wrong option type or leg count', () => {
    expect(validateStructure('long_call', longPut)).toContain('All legs of a long_call must be calls.');
    expect(validateStructure('long_call', callSpread)).toContain('A long option sells nothing.');
  });
});
