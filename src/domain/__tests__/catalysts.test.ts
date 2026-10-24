import {
  betDirection,
  betsExpressing,
  catalystsAgainst,
  catalystsCheckedBy,
  catalystsRidden,
  createLinkResolver,
  mechanismLinks,
  PROFILE_DRAFT_SCHEMA,
  toProfile,
  validateProfileDraft,
  type ProfileDraft,
} from '../catalysts';
import type { Bet, Mechanism, UnderlyingProfile } from '../types';
import { makeBet } from '@/test/fixtures';

const bet = (id: string, underlying: string, kind: Bet['strategy']['kind']): Bet => ({
  ...makeBet(id),
  strategy: { ...makeBet(id).strategy, underlying, kind, ...(kind.includes('spread') ? { sellStrike: 1.3 } : {}) },
});

const bets = [
  bet('acme-calls', 'ACME', 'call_debit_spread'),
  bet('acme-puts', 'ACME', 'put_debit_spread'),
  bet('acme-long', 'ACME', 'long_call'),
  bet('beta-calls', 'BETA', 'long_call'),
];

const acme: UnderlyingProfile = {
  symbol: 'ACME',
  name: 'Acme',
  kind: 'stock',
  whatItIs: 'Makes anvils.',
  movesOn: 'Coyote demand.',
  catalysts: [
    { id: 'coyotes', label: 'More coyotes', direction: 'up', kind: 'demand', timing: 'over-quarters', why: 'More coyotes buy more anvils.', watch: ['Coyote census'], checks: [{ questionId: 'coyotes-2027', side: 'yes' }] },
    { id: 'tariffs', label: 'Steel tariffs', direction: 'down', kind: 'costs', timing: 'on-the-news', why: 'Steel costs more, margins shrink.', watch: ['Tariff announcements'] },
  ],
  risks: ['One customer', 'Old factory'],
};
const beta: UnderlyingProfile = {
  ...acme,
  symbol: 'BETA',
  name: 'Beta',
  catalysts: [{ id: 'coyotes', label: 'More coyotes', direction: 'up', kind: 'demand', timing: 'over-quarters', why: 'Sells coyote traps.', watch: ['Trap sales'] }],
};
const profiles = new Map([
  ['ACME', acme],
  ['BETA', beta],
]);

describe('directions and expression', () => {
  it('reads a bet’s direction from its structure', () => {
    expect(betDirection(bets[0])).toBe('up');
    expect(betDirection(bets[1])).toBe('down');
    expect(betDirection(bets[2])).toBe('up');
  });

  it('finds the bets that express a direction on a symbol, in catalog order', () => {
    expect(betsExpressing(bets, 'ACME', 'up').map((b) => b.id)).toEqual(['acme-calls', 'acme-long']);
    expect(betsExpressing(bets, 'ACME', 'down').map((b) => b.id)).toEqual(['acme-puts']);
    expect(betsExpressing(bets, 'NOPE', 'up')).toEqual([]);
  });

  it('tells a bet which catalysts it rides and which it bets against', () => {
    expect(catalystsRidden(bets[0], acme).map((c) => c.id)).toEqual(['coyotes']);
    expect(catalystsAgainst(bets[0], acme).map((c) => c.id)).toEqual(['tariffs']);
    expect(catalystsRidden(bets[1], acme).map((c) => c.id)).toEqual(['tariffs']);
    expect(catalystsRidden(bets[0], undefined)).toEqual([]);
  });
});

describe('mechanisms to bets', () => {
  const mechanism: Mechanism = {
    id: 'coyote-boom',
    label: 'Coyote boom',
    description: 'Coyotes multiply.',
    catalysts: [
      { symbol: 'ACME', catalyst: 'coyotes' },
      { symbol: 'BETA', catalyst: 'coyotes' },
      { symbol: 'ACME', catalyst: 'nope' },
      { symbol: 'ZZZ', catalyst: 'coyotes' },
    ],
  };

  it('follows each catalyst to the bets in its direction, with the catalyst’s why, skipping unknowns', () => {
    expect(mechanismLinks(mechanism, profiles, bets)).toEqual([
      { betId: 'acme-calls', why: 'More coyotes buy more anvils.' },
      { betId: 'acme-long', why: 'More coyotes buy more anvils.' },
      { betId: 'beta-calls', why: 'Sells coyote traps.' },
    ]);
  });

  it('dedupes a bet reached twice and resolves unknown mechanisms to nothing', () => {
    const twice: Mechanism = { ...mechanism, catalysts: [{ symbol: 'ACME', catalyst: 'coyotes' }, { symbol: 'ACME', catalyst: 'coyotes' }] };
    const linksFor = createLinkResolver([twice], [acme, beta], bets);
    expect(linksFor('coyote-boom').map((l) => l.betId)).toEqual(['acme-calls', 'acme-long']);
    expect(linksFor('unknown')).toEqual([]);
  });

  it('finds the catalysts a question tests', () => {
    expect(catalystsCheckedBy([acme, beta], 'coyotes-2027').map((m) => `${m.profile.symbol}:${m.catalyst.id}`)).toEqual(['ACME:coyotes']);
    expect(catalystsCheckedBy([acme, beta], 'other')).toEqual([]);
  });
});

describe('validateProfileDraft', () => {
  const ctx = { symbol: 'ACME', questionIds: new Set(['coyotes-2027']) };
  const draft: ProfileDraft = {
    symbol: 'ACME',
    name: 'Acme Corporation',
    kind: 'stock',
    whatItIs: 'Makes anvils and rocket skates.',
    movesOn: 'Coyote demand and steel prices.',
    catalysts: [
      { id: 'coyotes', label: 'More coyotes', direction: 'up', kind: 'demand', timing: 'over-quarters', why: 'More coyotes buy more anvils.', watch: ['Coyote census'], checks: [{ questionId: 'coyotes-2027', side: 'yes' }] },
      { id: 'tariffs', label: 'Steel tariffs', direction: 'down', kind: 'costs', timing: 'on-the-news', why: 'Steel costs more.', watch: ['Tariff news'], checks: [] },
      { id: 'skates', label: 'Rocket skates catch on', direction: 'up', kind: 'event', timing: 'on-the-news', why: 'A new product line.', watch: ['Skate orders'], checks: [] },
    ],
    risks: ['One customer', 'Old factory'],
  };

  it('accepts a good draft and turns it into a profile', () => {
    expect(validateProfileDraft(draft, ctx)).toEqual({ ok: true, draft });
    const provenance = { kind: 'drafted' as const, prompt: 'ACME', model: 'test', draftedAt: '2026-10-24T00:00:00Z' };
    const profile = toProfile(draft, provenance);
    expect(profile.provenance).toEqual(provenance);
    expect(profile.catalysts[0].checks).toEqual([{ questionId: 'coyotes-2027', side: 'yes' }]);
    expect('checks' in profile.catalysts[1]).toBe(false);
  });

  it('rejects the wrong symbol, numbers, advice, one-directional maps and unknown questions', () => {
    const bad = structuredClone(draft);
    bad.symbol = 'ACMF';
    bad.whatItIs = 'Trades at 20x earnings.';
    bad.movesOn = 'You should buy it before the price target of 50.';
    bad.catalysts = bad.catalysts.filter((c) => c.direction === 'up');
    bad.catalysts[0].checks = [{ questionId: 'nope', side: 'yes' }];
    bad.catalysts[1].id = 'coyotes';
    bad.risks = ['Only one'];
    const result = validateProfileDraft(bad, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toEqual([
      'symbol: expected ACME',
      'whatItIs: contains a price, percentage or multiple (numbers come from code)',
      'movesOn: reads as advice',
      'catalysts: needs at least 3',
      'catalysts[0].checks[0]: unknown question "nope"',
      'catalysts[1].id: "coyotes" already used',
      'catalysts: needs at least one that moves the price up and one that moves it down',
      'risks: needs at least 2',
    ]);
  });

  it('reports malformed input instead of throwing', () => {
    expect(validateProfileDraft(null, ctx)).toEqual({ ok: false, problems: ['draft: not an object'] });
    const result = validateProfileDraft({ symbol: 'ACME', catalysts: [{}] }, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toEqual(expect.arrayContaining(['name: missing', 'catalysts[0].direction: must be up or down', 'risks: missing']));
  });

  it('has a schema that requires every field and forbids extras', () => {
    const walk = (schema: Record<string, unknown>) => {
      if (schema.type === 'object') {
        const props = schema.properties as Record<string, Record<string, unknown>>;
        expect(schema.additionalProperties).toBe(false);
        expect(schema.required).toEqual(Object.keys(props));
        Object.values(props).forEach(walk);
      }
      if (schema.type === 'array') walk(schema.items as Record<string, unknown>);
    };
    walk(PROFILE_DRAFT_SCHEMA);
  });
});
