import { BETS } from '../bets';
import { EVENTS } from '../events';
import { THESES } from '../theses';
import { earliestExpiration, outlivesQuestion } from '@/domain/horizon';
import { isSpread } from '@/domain/options';
import { CATEGORY_ORDER } from '@/domain/questionSelector';
import { isAsymmetric, minExpirationDate, priceStrategy } from '@/domain/strategy';
import { allClaims, allSteps, treeBetIds } from '@/domain/thesisTree';
import { listedExpirations, SYNTHETIC_UNDERLYINGS, syntheticChain } from '@/services/marketData/synthetic';

/**
 * Guards for content authors: catches broken references and bets that stop
 * being asymmetric before they reach the app.
 */

const betIds = new Set(BETS.map((b) => b.id));
const eventIds = new Set(EVENTS.map((e) => e.id));
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

  it.each(EVENTS.map((e) => [e.id, e] as const))('%s says exactly how it resolves', (_id, event) => {
    const { rule, source, resolvesOn } = event.resolution;
    expect(rule).toMatch(/^Resolves YES if /);
    expect(source.length).toBeGreaterThan(2);
    expect(resolvesOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(resolvesOn > now.toISOString().slice(0, 10)).toBe(true);
  });

  it('cover every topic, so new users can be asked about each', () => {
    expect(new Set(EVENTS.map((e) => e.category))).toEqual(new Set(CATEGORY_ORDER));
  });

  const linked = EVENTS.flatMap((e) =>
    e.outcomes.flatMap((o) => o.betIds.map((id) => [`${e.id} → ${id}`, e, BETS.find((b) => b.id === id)!] as const)),
  );

  it.each(linked)('%s outlives its question and stays asymmetric', (_label, event, bet) => {
    const min = earliestExpiration(bet.strategy.minDays, now, event.resolution.resolvesOn);
    const expiration = listedExpirations(now).find((d) => d >= min)!;
    const priced = priceStrategy(bet.strategy, syntheticChain(bet.strategy.underlying, expiration, now), now);
    expect(outlivesQuestion(priced.expiration, event.resolution.resolvesOn)).toBe(true);
    expect(isAsymmetric(priced)).toBe(true);
  });
});

describe('thesis trees', () => {
  it('have unique ids', () => {
    expect(duplicates(THESES.map((t) => t.id))).toEqual([]);
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s has unique claim ids', (_id, tree) => {
    expect(duplicates(allClaims(tree).map((c) => c.id))).toEqual([]);
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s breaks the belief down and follows both sides', (_id, tree) => {
    expect(tree.premises.length).toBeGreaterThanOrEqual(2);
    expect(tree.ifTrue.length).toBeGreaterThan(0);
    expect(tree.ifFalse.length).toBeGreaterThan(0);
    expect(allSteps({ ifTrue: tree.ifTrue, ifFalse: [] }).some((s) => (s.bets ?? []).length > 0)).toBe(true);
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s argues both sides of every claim', (_id, tree) => {
    for (const claim of allClaims(tree)) {
      const reason = 'why' in claim ? claim.why : claim.because;
      expect(reason.trim()).not.toBe('');
      expect(claim.against.trim()).not.toBe('');
    }
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s only links bets that exist, each with a why and no prices', (_id, tree) => {
    for (const step of allSteps(tree)) {
      for (const link of step.bets ?? []) {
        expect(betIds.has(link.betId)).toBe(true);
        expect(link.why.trim()).not.toBe('');
        // Prices, strikes, odds and multiples come from code, never from copy.
        expect(link.why).not.toMatch(/[$%]|\d+(\.\d+)?x\b|\d+(\.\d+)?\s*(times|percent)\b/i);
      }
    }
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s only checks claims against questions that exist', (_id, tree) => {
    for (const claim of allClaims(tree)) {
      if (claim.check) expect(eventIds.has(claim.check.questionId)).toBe(true);
    }
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s has an outside view to check the gut against', (_id, tree) => {
    expect(tree.settledBy.trim()).not.toBe('');
    expect(tree.outsideView.question.trim()).not.toBe('');
    expect(tree.outsideView.cases.length).toBeGreaterThanOrEqual(3);
    for (const c of tree.outsideView.cases) {
      expect(c.label.trim()).not.toBe('');
      expect(c.note.trim()).not.toBe('');
    }
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s has a pre-mortem whose stories break real parts', (_id, tree) => {
    const premiseIds = new Set(tree.premises.map((p) => p.id));
    expect(tree.premortem.length).toBeGreaterThanOrEqual(2);
    expect(duplicates(tree.premortem.map((f) => f.id))).toEqual([]);
    for (const story of tree.premortem) {
      expect(premiseIds.has(story.breaks)).toBe(true);
      expect(story.story.trim()).not.toBe('');
      expect(story.signal.trim()).not.toBe('');
    }
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s asks "then what?" on every step with bets', (_id, tree) => {
    const missing = allSteps(tree)
      .filter((s) => (s.bets ?? []).length > 0 && !s.thenWhat?.trim())
      .map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it('give every bet in the catalog a line of reasoning', () => {
    const reachable = new Set(THESES.flatMap(treeBetIds));
    expect(BETS.map((b) => b.id).filter((id) => !reachable.has(id))).toEqual([]);
  });
});
