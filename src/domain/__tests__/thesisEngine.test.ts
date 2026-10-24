import { buildThesis, matchBets } from '../thesisEngine';
import type { Theme } from '../types';
import { makeBet } from '@/test/fixtures';

const theme: Theme = {
  id: 'ai',
  title: 'AI',
  hook: 'Do you believe in AI?',
  emoji: '🤖',
  category: 'tech',
  steps: [
    {
      id: 'scale',
      prompt: 'How big?',
      options: [
        { id: 'huge', label: 'Huge', tags: ['ai-bull'], fragment: 'AI is huge.' },
        { id: 'hype', label: 'Hype', tags: ['ai-bear'], fragment: 'AI is hype.' },
      ],
    },
    {
      id: 'winners',
      prompt: 'Who wins?',
      options: [
        { id: 'chips', label: 'Chips', tags: ['ai-compute', 'ai-bull'], fragment: 'Chips win.' },
        { id: 'power', label: 'Power', tags: ['ai-power'], fragment: 'Power wins.' },
      ],
    },
  ],
};

describe('buildThesis', () => {
  it('joins fragments in step order and dedupes tags', () => {
    const thesis = buildThesis(theme, { winners: 'chips', scale: 'huge' });
    expect(thesis.statement).toBe('AI is huge. Chips win.');
    expect(thesis.tags).toEqual(['ai-bull', 'ai-compute']);
    expect(thesis.answerIds).toEqual(['huge', 'chips']);
    expect(thesis.complete).toBe(true);
  });

  it('reports an incomplete thesis and ignores unknown answers', () => {
    const thesis = buildThesis(theme, { scale: 'hype', winners: 'not-an-option' });
    expect(thesis.statement).toBe('AI is hype.');
    expect(thesis.complete).toBe(false);
  });
});

describe('matchBets', () => {
  const bets = [
    makeBet('broad', ['ai-bull']),
    makeBet('chips', ['ai-bull', 'ai-compute']),
    makeBet('power', ['ai-power']),
    makeBet('moonshot', ['ai-bull']),
    makeBet('unrelated', ['gold']),
  ];

  it('ranks by tag overlap, keeps catalog order on ties, and drops non-matches', () => {
    const matches = matchBets(['ai-bull', 'ai-compute'], bets, 10);
    expect(matches.map((m) => m.bet.id)).toEqual(['chips', 'broad', 'moonshot']);
    expect(matches[0].score).toBe(2);
  });

  it('respects the limit', () => {
    expect(matchBets(['ai-bull'], bets, 1).map((m) => m.bet.id)).toEqual(['broad']);
  });

  it('returns nothing when no tags match', () => {
    expect(matchBets(['space'], bets)).toEqual([]);
  });
});
