import {
  allSteps,
  builtBelief,
  chainProbability,
  findStep,
  gutCheck,
  leaningBranch,
  reasoningLines,
  treeBetIds,
  treesCheckedBy,
  weakestLink,
  withCallRatings,
} from '../thesisTree';
import type { ThesisTree } from '../types';

const tree: ThesisTree = {
  id: 'ai',
  title: 'AI',
  hook: 'Do you believe in AI?',
  emoji: '🤖',
  category: 'tech',
  belief: 'AI does real work',
  premises: [
    { id: 'better', claim: 'Models get better', why: 'w', against: 'a', check: { questionId: 'q-better', side: 'yes' } },
    { id: 'cheap', claim: 'It gets cheap', why: 'w', against: 'a' },
    { id: 'adopt', claim: 'Companies adopt it', why: 'w', against: 'a' },
  ],
  ifTrue: [
    {
      id: 'compute',
      claim: 'More compute',
      because: 'b',
      against: 'a',
      bets: [{ betId: 'nvda', why: 'chips' }],
      next: [
        {
          id: 'power',
          claim: 'Power is the bottleneck',
          because: 'b',
          against: 'a',
          check: { questionId: 'q-power', side: 'no' },
          bets: [
            { betId: 'ceg', why: 'power' },
            { betId: 'nvda', why: 'again' },
          ],
        },
      ],
    },
  ],
  ifFalse: [{ id: 'bust', claim: 'Spending outruns returns', because: 'b', against: 'a', bets: [{ betId: 'qqq', why: 'puts' }] }],
};

const rated = { better: 0.9, cheap: 0.7, adopt: 0.5 };

describe('builtBelief', () => {
  it('waits until every part is rated', () => {
    expect(builtBelief(tree, { better: 0.9, cheap: 0.7 })).toBeUndefined();
  });

  it('multiplies the parts', () => {
    expect(builtBelief(tree, rated)).toBeCloseTo(0.315);
  });
});

describe('weakestLink', () => {
  it('is the lowest-rated part', () => {
    expect(weakestLink(tree, rated)?.id).toBe('adopt');
  });

  it('keeps the earlier part on a tie and ignores unrated ones', () => {
    expect(weakestLink(tree, { better: 0.5, adopt: 0.5 })?.id).toBe('better');
    expect(weakestLink(tree, {})).toBeUndefined();
  });
});

describe('gutCheck', () => {
  it('calls out a big gap either way', () => {
    expect(gutCheck(0.7, 0.315)).toBe('lower');
    expect(gutCheck(0.3, 0.5)).toBe('higher');
    expect(gutCheck(0.7, 0.63)).toBe('close');
  });
});

describe('leaningBranch', () => {
  it('starts with what follows if true at even odds or better', () => {
    expect(leaningBranch(0.5)).toBe('ifTrue');
    expect(leaningBranch(0.315)).toBe('ifFalse');
  });
});

describe('findStep', () => {
  it('returns the path from the top-level step', () => {
    const path = findStep(tree, 'power');
    expect(path?.branch).toBe('ifTrue');
    expect(path?.steps.map((s) => s.id)).toEqual(['compute', 'power']);
  });

  it('finds steps on the false branch and nothing for unknown ids', () => {
    expect(findStep(tree, 'bust')?.branch).toBe('ifFalse');
    expect(findStep(tree, 'nope')).toBeUndefined();
  });
});

describe('chainProbability', () => {
  it('multiplies the belief by every step on the way', () => {
    expect(chainProbability(tree, { ...rated, compute: 0.8, power: 0.5 }, 'power')).toBeCloseTo(0.315 * 0.8 * 0.5);
  });

  it('starts the false branch from the belief failing', () => {
    expect(chainProbability(tree, { ...rated, bust: 0.6 }, 'bust')).toBeCloseTo((1 - 0.315) * 0.6);
  });

  it('is undefined while any link is unrated', () => {
    expect(chainProbability(tree, { ...rated, power: 0.5 }, 'power')).toBeUndefined();
    expect(chainProbability(tree, { compute: 0.8 }, 'compute')).toBeUndefined();
  });
});

describe('withCallRatings', () => {
  it('fills unrated claims from calls on their checking questions', () => {
    const calls = [
      { questionId: 'q-better', side: 'yes' as const, probability: 0.75 },
      { questionId: 'q-power', side: 'yes' as const, probability: 0.6 },
    ];
    const { ratings, fromCalls } = withCallRatings(tree, {}, calls);
    expect(ratings.better).toBeCloseTo(0.75);
    // The power claim is the NO side of its question.
    expect(ratings.power).toBeCloseTo(0.4);
    expect([...fromCalls].sort()).toEqual(['better', 'power']);
  });

  it('never overrides a rating the user gave', () => {
    const { ratings, fromCalls } = withCallRatings(tree, { better: 0.3 }, [
      { questionId: 'q-better', side: 'yes', probability: 0.9 },
    ]);
    expect(ratings.better).toBe(0.3);
    expect(fromCalls.size).toBe(0);
  });
});

describe('tree helpers', () => {
  it('walks every step depth first, true branch first', () => {
    expect(allSteps(tree).map((s) => s.id)).toEqual(['compute', 'power', 'bust']);
  });

  it('lists each bet once', () => {
    expect(treeBetIds(tree)).toEqual(['nvda', 'ceg', 'qqq']);
  });

  it('finds trees by the questions that check them', () => {
    expect(treesCheckedBy([tree], 'q-power')).toEqual([tree]);
    expect(treesCheckedBy([tree], 'other')).toEqual([]);
  });
});

describe('reasoningLines', () => {
  it('runs from the belief to the step with each rating', () => {
    expect(reasoningLines(tree, { ...rated, compute: 0.8 }, 'power')).toEqual([
      { kind: 'belief', claim: 'AI does real work', probability: expect.closeTo(0.315) },
      { kind: 'step', claim: 'More compute', probability: 0.8 },
      { kind: 'step', claim: 'Power is the bottleneck', probability: undefined },
    ]);
  });

  it('starts from the belief failing on the false branch', () => {
    const [first] = reasoningLines(tree, rated, 'bust');
    expect(first.kind).toBe('not-belief');
    expect(first.probability).toBeCloseTo(0.685);
  });
});
