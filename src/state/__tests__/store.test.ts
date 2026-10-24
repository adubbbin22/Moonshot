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
