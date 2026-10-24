import { ladder, parseShapeId, shapedBet, shapeOf, shapeTemplate } from '../structures';
import { makeBet } from '@/test/fixtures';

const spreadBase = {
  ...makeBet('oil-calls'),
  strategy: { underlying: 'USO', underlyingName: 'Oil', kind: 'call_debit_spread' as const, buyStrike: 1.3, sellStrike: 1.34, minDays: 360 },
};
const putBase = {
  ...makeBet('qqq-puts'),
  strategy: { underlying: 'QQQ', underlyingName: 'Nasdaq', kind: 'put_debit_spread' as const, buyStrike: 0.8, sellStrike: 0.78, minDays: 360 },
};
const longBase = makeBet('asts-long'); // long_call at 1.2

describe('shapes', () => {
  it('reads a template’s own shape', () => {
    expect(shapeOf(spreadBase.strategy)).toBe('capped');
    expect(shapeOf(longBase.strategy)).toBe('uncapped');
  });

  it('derives the other shapes from the base’s direction, strike and width', () => {
    const uncapped = shapeTemplate(spreadBase.strategy, 'uncapped');
    expect(uncapped).toMatchObject({ kind: 'long_call', buyStrike: 1.3 });
    expect('sellStrike' in uncapped).toBe(false);
    expect(shapeTemplate(spreadBase.strategy, 'aggressive')).toMatchObject({ kind: 'call_debit_spread', buyStrike: 1.42, sellStrike: 1.46 });
    expect(shapeTemplate(putBase.strategy, 'aggressive')).toMatchObject({ kind: 'put_debit_spread', buyStrike: 0.68, sellStrike: 0.66 });
    expect(shapeTemplate(putBase.strategy, 'uncapped')).toMatchObject({ kind: 'long_put', buyStrike: 0.8 });
    // A long base gets a default width for its spreads.
    expect(shapeTemplate(longBase.strategy, 'capped')).toMatchObject({ kind: 'call_debit_spread', buyStrike: 1.2, sellStrike: 1.25 });
    expect(shapeTemplate(longBase.strategy, 'aggressive')).toMatchObject({ buyStrike: 1.32, sellStrike: 1.37, minDays: 365 });
  });

  it('keeps the base as its own shape and suffixes the others', () => {
    expect(shapedBet(spreadBase, 'capped')).toBe(spreadBase);
    const aggressive = shapedBet(spreadBase, 'aggressive');
    expect(aggressive.id).toBe('oil-calls~aggressive');
    expect(aggressive.shape).toEqual({ id: 'aggressive', baseId: 'oil-calls' });
    expect(aggressive.title).toBe(spreadBase.title);
    expect(ladder(spreadBase).map((b) => b.id)).toEqual(['oil-calls', 'oil-calls~aggressive', 'oil-calls~uncapped']);
    expect(ladder(longBase).map((b) => b.id)).toEqual(['asts-long', 'asts-long~capped', 'asts-long~aggressive']);
  });

  it('parses shape ids and leaves other ids alone', () => {
    expect(parseShapeId('oil-calls~aggressive')).toEqual({ baseId: 'oil-calls', shape: 'aggressive' });
    expect(parseShapeId('oil-calls')).toEqual({ baseId: 'oil-calls' });
    expect(parseShapeId('oil-calls~bogus')).toEqual({ baseId: 'oil-calls~bogus' });
  });
});
