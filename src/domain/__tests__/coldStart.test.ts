import { conviction, probabilityOfYes } from '../calls';
import { byExpiration, classifyExpression, viewsWithBets } from '../expression';
import { addDays, earliestExpiration, outlivesQuestion } from '../horizon';
import { nextQuestion, type SelectorState } from '../questionSelector';
import { impliedOdds } from '../strategy';
import { buildTakeProfile, callStyle } from '../takeProfile';
import type { Call, Side } from '../types';
import { makeBet, makeQuestion } from '@/test/fixtures';

const questions = [
  makeQuestion('t1', 'tech'),
  makeQuestion('t2', 'tech'),
  makeQuestion('t3', 'tech'),
  makeQuestion('e1', 'energy'),
  makeQuestion('e2', 'energy'),
  makeQuestion('g1', 'geopolitics'),
  makeQuestion('m1', 'macro'),
  makeQuestion('h1', 'health'),
  makeQuestion('s1', 'space'),
];

function call(questionId: string, side: Side = 'yes', probability = 0.75, madeAt = '2026-10-24T10:00:00Z'): Call {
  return { questionId, side, probability, madeAt };
}

const empty: SelectorState = { calls: [], skips: [], seedTopics: [] };

describe('calls', () => {
  it('converts a call into the probability of YES', () => {
    expect(probabilityOfYes({ side: 'yes', probability: 0.9 })).toBeCloseTo(0.9);
    expect(probabilityOfYes({ side: 'no', probability: 0.9 })).toBeCloseTo(0.1);
  });

  it('measures conviction as distance from a coin flip', () => {
    expect(conviction({ probability: 0.5 })).toBe(0);
    expect(conviction({ probability: 0.75 })).toBeCloseTo(0.5);
    expect(conviction({ probability: 0.9 })).toBeCloseTo(0.8);
  });
});

describe('nextQuestion', () => {
  it('covers every topic once when the user picked none', () => {
    const order: string[] = [];
    const state: SelectorState = { calls: [], skips: [], seedTopics: [] };
    for (let i = 0; i < 6; i += 1) {
      const q = nextQuestion(questions, state)!;
      order.push(q.category);
      state.calls.push({ questionId: q.id });
    }
    expect(order).toEqual(['tech', 'energy', 'geopolitics', 'macro', 'health', 'space']);
  });

  it('covers picked topics first', () => {
    const state: SelectorState = { calls: [], skips: [], seedTopics: ['space', 'energy'] };
    expect(nextQuestion(questions, state)!.id).toBe('e1');
    state.calls.push({ questionId: 'e1' });
    expect(nextQuestion(questions, state)!.id).toBe('s1');
  });

  it('then leans toward topics the user engages with and away from skipped ones', () => {
    const state: SelectorState = {
      calls: [{ questionId: 't1' }, { questionId: 't2' }, { questionId: 'e1' }],
      skips: ['g1', 'm1', 'h1', 's1'],
      seedTopics: [],
    };
    // Tech has 2 calls, energy 1, the rest were skipped: stay with tech.
    expect(nextQuestion(questions, state)!.id).toBe('t3');
    state.calls.push({ questionId: 't3' });
    // Tech is exhausted; energy beats the skipped topics.
    expect(nextQuestion(questions, state)!.id).toBe('e2');
  });

  it('returns nothing when every question has been seen', () => {
    const state: SelectorState = { ...empty, calls: questions.map((q) => ({ questionId: q.id })) };
    expect(nextQuestion(questions, state)).toBeUndefined();
  });
});

describe('buildTakeProfile', () => {
  it('ranks views by conviction and topics by engagement', () => {
    const profile = buildTakeProfile(
      [call('t1', 'yes', 0.75), call('e1', 'no', 0.9), call('t2', 'yes', 0.6)],
      ['g1'],
      ['space'],
      questions,
    );
    expect(profile.totalCalls).toBe(3);
    expect(profile.totalSkips).toBe(1);
    expect(profile.views.map((v) => v.questionId)).toEqual(['e1', 't1', 't2']);
    expect(profile.strongest).toMatchObject({ questionId: 'e1', side: 'no', stance: 'e1 no' });
    expect(profile.topics.map((t) => [t.category, t.score])).toEqual([
      ['tech', 2],
      ['energy', 1],
      ['space', 0.5],
      ['geopolitics', -0.75],
    ]);
  });

  it('ignores calls on unknown questions and handles an empty start', () => {
    const profile = buildTakeProfile([call('gone')], [], [], questions);
    expect(profile).toMatchObject({ totalCalls: 0, views: [], strongest: undefined, style: undefined });
  });

  it('describes the user’s calling style', () => {
    expect(callStyle([call('a', 'yes', 0.6), call('b', 'yes', 0.6)])).toBe('measured');
    expect(callStyle([call('a', 'yes', 0.75)])).toBe('confident');
    expect(callStyle([call('a', 'yes', 0.9), call('b', 'no', 0.9)])).toBe('bold');
  });
});

describe('horizon guard', () => {
  const now = new Date('2026-10-24T15:00:00Z');

  it('pushes the earliest expiration past the question plus a buffer', () => {
    expect(addDays('2027-06-30', 30)).toBe('2027-07-30');
    expect(earliestExpiration(200, now)).toBe('2027-05-12');
    expect(earliestExpiration(200, now, '2027-06-30')).toBe('2027-07-30');
    expect(earliestExpiration(420, now, '2027-06-30')).toBe('2027-12-18');
  });

  it('checks whether a bet outlives its question', () => {
    expect(outlivesQuestion('2027-08-20', '2027-06-30')).toBe(true);
    expect(outlivesQuestion('2027-07-16', '2027-06-30')).toBe(false);
  });
});

describe('ways to express', () => {
  const priced = { expiration: '2028-01-21', payoffMultiple: 4, costPerContract: 120 };
  const context = { resolvesOn: '2027-12-15', ceiling: 150 };

  it('classifies bets by the horizon guard, asymmetry and budget', () => {
    expect(classifyExpression(priced, context)).toBe('ok');
    expect(classifyExpression({ ...priced, expiration: '2027-12-17' }, context)).toBe('too-short');
    expect(classifyExpression({ ...priced, payoffMultiple: 2 }, context)).toBe('not-asymmetric');
    expect(classifyExpression({ ...priced, costPerContract: 200 }, context)).toBe('over-limit');
  });

  it('skips the horizon check for bets not tied to a question', () => {
    expect(classifyExpression({ ...priced, expiration: '2027-12-17' }, { ceiling: context.ceiling })).toBe('ok');
  });

  it('maps views to the bets on their side, and keeps sides without bets', () => {
    const bets = new Map([['t1-yes-bet', makeBet('t1-yes-bet')]]);
    const views = buildTakeProfile([call('t1', 'yes'), call('e1', 'no')], [], [], questions).views;
    const result = viewsWithBets(views, (id) => questions.find((q) => q.id === id), (id) => bets.get(id));
    expect(result.map((r) => [r.question.id, r.bets.map((b) => b.id)])).toEqual([
      ['t1', ['t1-yes-bet']],
      ['e1', []],
    ]);
    expect(result[1].rationale).toBe('No rationale');
  });

  it('orders bets within a view by expiration, then id', () => {
    const item = (id: string, expiration: string) => ({ bet: makeBet(id), priced: { expiration } });
    const sorted = [item('b', '2028-01-21'), item('a', '2028-01-21'), item('c', '2027-12-17')].sort(byExpiration);
    expect(sorted.map((i) => i.bet.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('impliedOdds', () => {
  it('reads a spread’s odds straight off its price', () => {
    expect(
      impliedOdds({ kind: 'call_debit_spread', costPerContract: 116, maxValuePerContract: 600, probProfit: 0.23 }),
    ).toEqual({ value: 116 / 600, basis: 'price' });
  });

  it('falls back to the model for long options', () => {
    expect(
      impliedOdds({ kind: 'long_call', costPerContract: 200, maxValuePerContract: null, probProfit: 0.06 }),
    ).toEqual({ value: 0.06, basis: 'model' });
  });
});
