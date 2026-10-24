import type { Bet, Category, EventQuestion, Position } from '@/domain/types';

/** Test helpers. Not shipped in the app (nothing under src/app imports this). */

export function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: 'p1',
    betId: 'ai-compute-calls',
    underlying: 'NVDA',
    kind: 'call_debit_spread',
    expiration: '2028-01-21',
    legs: [
      { action: 'buy', type: 'call', strike: 235, symbol: 'NVDA280121C00235000' },
      { action: 'sell', type: 'call', strike: 240, symbol: 'NVDA280121C00240000' },
    ],
    contracts: 1,
    costPerContract: 100,
    maxValuePerContract: 500,
    breakeven: 236,
    placedAt: '2026-10-23T00:00:00.000Z',
    thesis: '',
    source: { type: 'direct' },
    status: 'open',
    ...overrides,
  };
}

export function makeBet(id: string, tags: string[]): Bet {
  return {
    id,
    title: id,
    pitch: '',
    strategy: {
      underlying: 'TEST',
      underlyingName: 'Test Co',
      kind: 'long_call',
      buyStrike: 1.2,
      minDays: 365,
    },
    whatHasToBeTrue: [],
    killCriteria: [],
    category: 'tech',
    tags,
  };
}

export function makeQuestion(
  id: string,
  category: Category,
  overrides: Partial<EventQuestion> = {},
): EventQuestion {
  return {
    id,
    question: `Question ${id}?`,
    context: '',
    category,
    resolution: { rule: 'Resolves YES if it happens.', source: 'Test source', resolvesOn: '2027-12-15' },
    outcomes: [
      { side: 'yes', label: `${id} yes`, rationale: 'Yes rationale', betIds: [`${id}-yes-bet`] },
      { side: 'no', label: `${id} no`, rationale: 'No rationale', betIds: [] },
    ],
    ...overrides,
  };
}
