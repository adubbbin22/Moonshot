import { BETS } from '../bets';
import { EVENTS } from '../events';
import { THEMES } from '../themes';
import { validateScenarios } from '@/domain/payoff';

/**
 * Guards for content authors: catches broken references and malformed odds
 * before they reach the app.
 */

const betIds = new Set(BETS.map((b) => b.id));
const betTags = new Set(BETS.flatMap((b) => b.tags));

function duplicates(ids: string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}

describe('bets', () => {
  it('have unique ids', () => {
    expect(duplicates(BETS.map((b) => b.id))).toEqual([]);
  });

  it.each(BETS.map((b) => [b.id, b] as const))('%s has valid scenarios', (_id, bet) => {
    expect(validateScenarios(bet.scenarios)).toEqual([]);
  });

  it.each(BETS.map((b) => [b.id, b] as const))('%s explains how it could be wrong', (_id, bet) => {
    expect(bet.whatHasToBeTrue.length).toBeGreaterThan(0);
    expect(bet.killCriteria.length).toBeGreaterThan(0);
  });

  it('only use option fields on options', () => {
    for (const bet of BETS) {
      const isOption = bet.instrument.kind === 'call_option' || bet.instrument.kind === 'put_option';
      expect([bet.id, Boolean(bet.instrument.expiry)]).toEqual([bet.id, isOption]);
    }
  });
});

describe('events', () => {
  it('have unique ids', () => {
    expect(duplicates(EVENTS.map((e) => e.id))).toEqual([]);
  });

  it('have one yes and one no outcome', () => {
    for (const event of EVENTS) {
      expect(event.outcomes.map((o) => o.side).sort()).toEqual(['no', 'yes']);
    }
  });

  it('only reference bets that exist', () => {
    const missing = EVENTS.flatMap((e) => e.outcomes.flatMap((o) => o.betIds)).filter(
      (id) => !betIds.has(id),
    );
    expect(missing).toEqual([]);
  });

  it('have crowd sentiment between 0 and 1', () => {
    for (const event of EVENTS) {
      expect(event.crowdYes).toBeGreaterThanOrEqual(0);
      expect(event.crowdYes).toBeLessThanOrEqual(1);
    }
  });
});

describe('themes', () => {
  it('have unique ids', () => {
    expect(duplicates(THEMES.map((t) => t.id))).toEqual([]);
  });

  it('only use tags that match at least one bet, so every answer leads somewhere', () => {
    const orphanTags = THEMES.flatMap((t) =>
      t.steps.flatMap((s) => s.options.flatMap((o) => o.tags)),
    ).filter((tag) => !betTags.has(tag));
    expect(orphanTags).toEqual([]);
  });

  it('have unique step and option ids within each theme', () => {
    for (const theme of THEMES) {
      expect(duplicates(theme.steps.map((s) => s.id))).toEqual([]);
      for (const step of theme.steps) {
        expect(duplicates(step.options.map((o) => o.id))).toEqual([]);
      }
    }
  });
});
