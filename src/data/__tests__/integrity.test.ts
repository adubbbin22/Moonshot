import { BETS } from '../bets';
import { EVENTS } from '../events';
import { THEMES } from '../themes';
import { isSpread } from '@/domain/options';
import { isAsymmetric, minExpirationDate, priceStrategy } from '@/domain/strategy';
import { listedExpirations, SYNTHETIC_UNDERLYINGS, syntheticChain } from '@/services/marketData/synthetic';

/**
 * Guards for content authors: catches broken references and bets that stop
 * being asymmetric before they reach the app.
 */

const betIds = new Set(BETS.map((b) => b.id));
const betTags = new Set(BETS.flatMap((b) => b.tags));
const now = new Date('2026-10-24T15:00:00.000Z');

function duplicates(ids: string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) !== i);
}

describe('bets', () => {
  it('have unique ids', () => {
    expect(duplicates(BETS.map((b) => b.id))).toEqual([]);
  });

  it.each(BETS.map((b) => [b.id, b] as const))('%s explains how it could be wrong', (_id, bet) => {
    expect(bet.whatHasToBeTrue.length).toBeGreaterThan(0);
    expect(bet.killCriteria.length).toBeGreaterThan(0);
  });

  it.each(BETS.map((b) => [b.id, b] as const))('%s has a well-formed template', (_id, bet) => {
    const { strategy } = bet;
    expect(strategy.buyStrike).toBeGreaterThan(0);
    expect(strategy.minDays).toBeGreaterThanOrEqual(30);
    expect(strategy.sellStrike !== undefined).toBe(isSpread(strategy.kind));
    expect(SYNTHETIC_UNDERLYINGS[strategy.underlying]).toBeDefined();
  });

  it.each(BETS.map((b) => [b.id, b] as const))(
    '%s prices against synthetic data and is asymmetric',
    (_id, bet) => {
      const min = minExpirationDate(bet.strategy.minDays, now);
      const expiration = listedExpirations(now).find((d) => d >= min)!;
      const priced = priceStrategy(bet.strategy, syntheticChain(bet.strategy.underlying, expiration, now), now);
      expect(isAsymmetric(priced)).toBe(true);
      expect(priced.costPerContract).toBeLessThan(250);
    },
  );
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
