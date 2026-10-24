import {
  asymmetryRatio,
  bestMultiple,
  expectedMultiple,
  lossProbability,
  outcomeTable,
  summarizePortfolio,
  validateScenarios,
} from '../payoff';
import type { Bet, Position, Scenario } from '../types';

const powerLaw: Scenario[] = [
  { label: 'Thesis fails', probability: 0.6, multiple: 0 },
  { label: 'Partly right', probability: 0.3, multiple: 2 },
  { label: 'Moonshot', probability: 0.1, multiple: 12 },
];

function bet(id: string, scenarios: Scenario[]): Bet {
  return {
    id,
    title: id,
    pitch: '',
    instrument: { kind: 'stock', symbol: 'TEST', name: 'Test Co' },
    horizon: '2028',
    scenarios,
    whatHasToBeTrue: [],
    killCriteria: [],
    category: 'tech',
    tags: [],
  };
}

function position(betId: string, stake: number, status: Position['status'] = 'open'): Position {
  return {
    id: `${betId}-${stake}`,
    betId,
    stake,
    placedAt: '2026-10-01T00:00:00.000Z',
    thesis: '',
    source: { type: 'direct' },
    status,
  };
}

describe('validateScenarios', () => {
  it('accepts a well-formed distribution', () => {
    expect(validateScenarios(powerLaw)).toEqual([]);
  });

  it('rejects probabilities that do not sum to 1', () => {
    const errors = validateScenarios([{ label: 'a', probability: 0.5, multiple: 0 }]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/sum to 0.500/);
  });

  it('rejects negative multiples because downside is capped at the stake', () => {
    const errors = validateScenarios([{ label: 'a', probability: 1, multiple: -1 }]);
    expect(errors[0]).toMatch(/cannot lose more than its stake/);
  });

  it('rejects an empty set', () => {
    expect(validateScenarios([])).toEqual(['A bet needs at least one scenario.']);
  });
});

describe('scenario math', () => {
  it('computes expected multiple', () => {
    // 0.6*0 + 0.3*2 + 0.1*12 = 1.8
    expect(expectedMultiple(powerLaw)).toBeCloseTo(1.8);
  });

  it('finds the best case and the asymmetry it implies', () => {
    expect(bestMultiple(powerLaw)).toBe(12);
    expect(asymmetryRatio(powerLaw)).toBe(11);
  });

  it('sums the probability of getting back less than the stake', () => {
    expect(lossProbability(powerLaw)).toBeCloseTo(0.6);
  });

  it('turns a stake into per-scenario values', () => {
    expect(outcomeTable(25, powerLaw)).toEqual([
      { label: 'Thesis fails', probability: 0.6, value: 0, pnl: -25 },
      { label: 'Partly right', probability: 0.3, value: 50, pnl: 25 },
      { label: 'Moonshot', probability: 0.1, value: 300, pnl: 275 },
    ]);
  });
});

describe('summarizePortfolio', () => {
  const bets: Record<string, Bet> = {
    a: bet('a', powerLaw),
    b: bet('b', [
      { label: 'Zero', probability: 0.8, multiple: 0 },
      { label: 'Huge', probability: 0.2, multiple: 30 },
    ]),
  };

  it('caps total risk at the sum of open stakes and finds the one-hit value', () => {
    const summary = summarizePortfolio(
      [position('a', 25), position('b', 10), position('a', 100, 'closed')],
      (id) => bets[id],
    );
    expect(summary.openCount).toBe(2);
    expect(summary.totalAtRisk).toBe(35);
    // max(25*12, 10*30) = 300
    expect(summary.oneHitValue).toBe(300);
  });

  it('skips positions whose bet is unknown', () => {
    const summary = summarizePortfolio([position('missing', 50)], (id) => bets[id]);
    expect(summary).toEqual({ totalAtRisk: 0, oneHitValue: 0, openCount: 0 });
  });
});
