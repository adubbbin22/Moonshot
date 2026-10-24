import { initialState, reducer } from '../store';
import { makePosition } from '@/test/fixtures';

const position = makePosition({ source: { type: 'event', eventId: 'ai-week-long-task-2027', side: 'yes' } });

describe('reducer', () => {
  it('starts un-onboarded with a default budget', () => {
    expect(initialState.profile).toEqual({
      onboarded: false,
      monthlyBudget: 500,
      maxPerBetPct: 0.3,
    });
  });

  it('completes onboarding with the chosen budget and disclaimer timestamp', () => {
    const state = reducer(initialState, {
      type: 'completeOnboarding',
      monthlyBudget: 250,
      acceptedAt: '2026-10-23T00:00:00.000Z',
    });
    expect(state.profile).toMatchObject({
      onboarded: true,
      monthlyBudget: 250,
      acceptedDisclaimerAt: '2026-10-23T00:00:00.000Z',
    });
  });

  it('adds new positions first', () => {
    const first = reducer(initialState, { type: 'addPosition', position });
    const second = reducer(first, { type: 'addPosition', position: { ...position, id: 'p2' } });
    expect(second.positions.map((p) => p.id)).toEqual(['p2', 'p1']);
  });

  it('resets to the initial state', () => {
    const dirty = reducer(initialState, { type: 'addPosition', position });
    expect(reducer(dirty, { type: 'reset' })).toBe(initialState);
  });
});

describe('calls', () => {
  const call = (questionId: string, probability = 0.75) => ({
    questionId,
    side: 'yes' as const,
    probability,
    madeAt: '2026-10-24T10:00:00Z',
  });

  it('records seed topics, calls and skips', () => {
    let state = reducer(initialState, { type: 'setSeedTopics', topics: ['tech', 'space'] });
    state = reducer(state, { type: 'makeCall', call: call('a') });
    state = reducer(state, { type: 'skipQuestion', questionId: 'b' });
    state = reducer(state, { type: 'skipQuestion', questionId: 'b' });
    expect(state.seedTopics).toEqual(['tech', 'space']);
    expect(state.calls.map((c) => c.questionId)).toEqual(['a']);
    expect(state.skips).toEqual(['b']);
  });

  it('keeps one call per question and un-skips a question once it is called', () => {
    let state = reducer(initialState, { type: 'skipQuestion', questionId: 'a' });
    state = reducer(state, { type: 'makeCall', call: call('a', 0.6) });
    state = reducer(state, { type: 'makeCall', call: call('a', 0.9) });
    expect(state.calls).toEqual([call('a', 0.9)]);
    expect(state.skips).toEqual([]);
  });

  it('remembers where to land after onboarding until cleared', () => {
    let state = reducer(initialState, {
      type: 'completeOnboarding',
      monthlyBudget: 500,
      acceptedAt: '2026-10-24T10:00:00Z',
      landing: 'takes',
    });
    expect(state.pendingLanding).toBe('takes');
    state = reducer(state, { type: 'clearLanding' });
    expect(state.pendingLanding).toBeUndefined();
  });
});

describe('thesis work', () => {
  it('records the gut number and ratings per thesis, replacing earlier ratings', () => {
    let state = reducer(initialState, { type: 'setGut', thesisId: 'ai', probability: 0.7 });
    state = reducer(state, { type: 'rateClaim', thesisId: 'ai', claimId: 'better', probability: 0.5 });
    state = reducer(state, { type: 'rateClaim', thesisId: 'ai', claimId: 'better', probability: 0.9 });
    state = reducer(state, { type: 'rateClaim', thesisId: 'energy', claimId: 'demand', probability: 0.3 });
    expect(state.thesisWork).toEqual({
      ai: { gut: 0.7, ratings: { better: 0.9 }, lasts: {}, marked: [] },
      energy: { ratings: { demand: 0.3 }, lasts: {}, marked: [] },
    });
  });

  it('starts a thesis over without touching the others', () => {
    let state = reducer(initialState, { type: 'rateClaim', thesisId: 'ai', claimId: 'better', probability: 0.9 });
    state = reducer(state, { type: 'rateClaim', thesisId: 'energy', claimId: 'demand', probability: 0.3 });
    state = reducer(state, { type: 'resetThesis', thesisId: 'ai' });
    expect(state.thesisWork).toEqual({ energy: { ratings: { demand: 0.3 }, lasts: {}, marked: [] } });
  });

  it('records the thinking tools: then-what ratings, pre-mortem marks and the blend choice', () => {
    let state = reducer(initialState, { type: 'rateLasts', thesisId: 'ai', stepId: 'compute', probability: 0.5 });
    state = reducer(state, { type: 'toggleFailure', thesisId: 'ai', storyId: 'stall' });
    state = reducer(state, { type: 'toggleFailure', thesisId: 'ai', storyId: 'pricey' });
    state = reducer(state, { type: 'toggleFailure', thesisId: 'ai', storyId: 'stall' });
    state = reducer(state, { type: 'setBlend', thesisId: 'ai', blend: true });
    expect(state.thesisWork.ai).toEqual({ ratings: {}, lasts: { compute: 0.5 }, marked: ['pricey'], blend: true });
  });
});
