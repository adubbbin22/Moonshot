import { BETS } from '../bets';
import { EVENTS } from '../events';
import { MECHANISMS } from '../mechanisms';
import { THESES } from '../theses';
import { UNDERLYINGS } from '../underlyings';
import { betsExpressing, createLinkResolver } from '@/domain/catalysts';
import { ladder } from '@/domain/structures';
import { earliestExpiration, outlivesQuestion } from '@/domain/horizon';
import { isSpread } from '@/domain/options';
import { CATEGORY_ORDER } from '@/domain/questionSelector';
import { isAsymmetric, minExpirationDate, priceStrategy } from '@/domain/strategy';
import { resolveMechanisms } from '@/domain/thesisDraft';
import { allClaims, allSteps } from '@/domain/thesisTree';
import { listedExpirations, SYNTHETIC_UNDERLYINGS, syntheticChain } from '@/services/marketData/synthetic';

/**
 * Guards for content authors: catches broken references and bets that stop
 * being asymmetric before they reach the app.
 */

const betIds = new Set(BETS.map((b) => b.id));
const eventIds = new Set(EVENTS.map((e) => e.id));
const mechanismIds = new Set(MECHANISMS.map((m) => m.id));
const underlyingsBySymbol = new Map(UNDERLYINGS.map((u) => [u.symbol, u]));
const linksFor = createLinkResolver(MECHANISMS, UNDERLYINGS, BETS);
// Prices, strikes, odds and multiples come from code, never from copy.
const PRICE_LIKE = /[$%]|\d+(\.\d+)?x\b|\d+(\.\d+)?\s*(times|percent)\b/i;
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
    expect(allSteps({ ifTrue: tree.ifTrue, ifFalse: [] }).some((s) => (s.mechanisms ?? []).length > 0)).toBe(true);
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s argues both sides of every claim', (_id, tree) => {
    for (const claim of allClaims(tree)) {
      const reason = 'why' in claim ? claim.why : claim.because;
      expect(reason.trim()).not.toBe('');
      expect(claim.against.trim()).not.toBe('');
    }
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s reaches bets only through mechanisms that exist', (_id, tree) => {
    for (const step of allSteps(tree)) {
      expect(step.bets).toBeUndefined();
      for (const m of step.mechanisms ?? []) expect(mechanismIds.has(m)).toBe(true);
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

  it.each(THESES.map((t) => [t.id, t] as const))('%s asks "then what?" on every step with mechanisms', (_id, tree) => {
    const missing = allSteps(tree)
      .filter((s) => (s.mechanisms ?? []).length > 0 && !s.thenWhat?.trim())
      .map((s) => s.id);
    expect(missing).toEqual([]);
  });

  it.each(THESES.map((t) => [t.id, t] as const))('%s leads to at least one bet once mechanisms resolve', (_id, tree) => {
    const resolved = resolveMechanisms(tree, linksFor);
    expect(allSteps(resolved).some((s) => (s.bets ?? []).length > 0)).toBe(true);
  });

  it('use every mechanism in the library', () => {
    const used = new Set(THESES.flatMap((t) => allSteps(t).flatMap((s) => s.mechanisms ?? [])));
    expect(MECHANISMS.map((m) => m.id).filter((id) => !used.has(id))).toEqual([]);
  });
});

describe('shapes', () => {
  it.each(BETS.map((b) => [b.id, b] as const))('%s prices in every shape, and its own shape stays asymmetric', (_id, bet) => {
    for (const shaped of ladder(bet)) {
      const { strategy } = shaped;
      const min = minExpirationDate(strategy.minDays, now);
      const expiration = listedExpirations(now).find((d) => d >= min)!;
      const priced = priceStrategy(strategy, syntheticChain(strategy.underlying, expiration, now), now);
      expect(priced.costPerContract).toBeGreaterThan(0);
      if (shaped.id === bet.id) expect(isAsymmetric(priced)).toBe(true);
    }
  });
});

describe('mechanisms', () => {
  it('have unique ids', () => {
    expect(duplicates(MECHANISMS.map((m) => m.id))).toEqual([]);
  });

  it.each(MECHANISMS.map((m) => [m.id, m] as const))('%s describes the world and points at catalysts that exist and lead to bets', (_id, mechanism) => {
    expect(mechanism.label.trim()).not.toBe('');
    expect(mechanism.description.trim()).not.toBe('');
    expect(mechanism.description).not.toMatch(PRICE_LIKE);
    expect(mechanism.catalysts.length).toBeGreaterThan(0);
    for (const ref of mechanism.catalysts) {
      const catalyst = underlyingsBySymbol.get(ref.symbol)?.catalysts.find((c) => c.id === ref.catalyst);
      expect(catalyst).toBeDefined();
      expect(betsExpressing(BETS, ref.symbol, catalyst!.direction).length).toBeGreaterThan(0);
    }
    expect(linksFor(mechanism.id).length).toBeGreaterThan(0);
  });

  it('give every bet in the catalog a line of reasoning', () => {
    const reachable = new Set(MECHANISMS.flatMap((m) => linksFor(m.id).map((b) => b.betId)));
    expect(BETS.map((b) => b.id).filter((id) => !reachable.has(id))).toEqual([]);
  });
});

describe('underlying profiles', () => {
  it('have unique symbols and cover every bet’s underlying', () => {
    expect(duplicates(UNDERLYINGS.map((u) => u.symbol))).toEqual([]);
    const missing = BETS.map((b) => b.strategy.underlying).filter((s) => !underlyingsBySymbol.has(s));
    expect([...new Set(missing)]).toEqual([]);
  });

  it.each(UNDERLYINGS.map((u) => [u.symbol, u] as const))('%s says what it is and what moves it, with no prices or advice', (_symbol, profile) => {
    expect(profile.name.trim()).not.toBe('');
    for (const text of [profile.whatItIs, profile.movesOn, ...profile.risks]) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toMatch(PRICE_LIKE);
      expect(text).not.toMatch(/\bshould\b/i);
    }
    expect(profile.risks.length).toBeGreaterThanOrEqual(2);
  });

  it.each(UNDERLYINGS.map((u) => [u.symbol, u] as const))('%s has a catalyst map that runs both ways, each with a why, signals and real questions', (_symbol, profile) => {
    expect(profile.catalysts.length).toBeGreaterThanOrEqual(3);
    expect(duplicates(profile.catalysts.map((c) => c.id))).toEqual([]);
    expect(new Set(profile.catalysts.map((c) => c.direction))).toEqual(new Set(['up', 'down']));
    for (const catalyst of profile.catalysts) {
      expect(catalyst.label.trim()).not.toBe('');
      expect(catalyst.why.trim()).not.toBe('');
      expect(catalyst.why).not.toMatch(PRICE_LIKE);
      expect(catalyst.why).not.toMatch(/\bshould\b/i);
      expect(catalyst.watch.length).toBeGreaterThan(0);
      for (const check of catalyst.checks ?? []) expect(eventIds.has(check.questionId)).toBe(true);
    }
  });

  it.each(UNDERLYINGS.map((u) => [u.symbol, u] as const))('%s has at least one bet riding one of its catalysts', (symbol, profile) => {
    expect(profile.catalysts.some((c) => betsExpressing(BETS, symbol, c.direction).length > 0)).toBe(true);
  });
});
