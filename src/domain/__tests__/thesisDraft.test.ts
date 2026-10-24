import { resolveMechanisms, THESIS_DRAFT_SCHEMA, toThesisTree, validateDraft, type ThesisDraft } from '../thesisDraft';
import { allSteps } from '../thesisTree';
import type { Mechanism } from '../types';

const mechanisms: Mechanism[] = [
  {
    id: 'robotaxi-rollout',
    label: 'Robotaxis spread',
    description: 'Driverless rides go on sale in more cities.',
    bets: [{ betId: 'robotaxi-calls', why: 'Pays if the operator rerates.' }],
  },
  {
    id: 'auto-insurers-squeezed',
    label: 'Insurers lose premiums',
    description: 'Fewer human drivers means fewer policies.',
    bets: [
      { betId: 'insurer-puts', why: 'Pays if insurers fall.' },
      { betId: 'robotaxi-calls', why: 'Also pays here.' },
    ],
  },
];

const ctx = {
  mechanismIds: new Set(mechanisms.map((m) => m.id)),
  questionIds: new Set(['robotaxi-cities-2028']),
  securities: ['TSLA', 'Tesla', 'Lockheed Martin'],
};

const draft: ThesisDraft = {
  title: 'Robotaxis',
  hook: 'Do robotaxis go mainstream?',
  category: 'tech',
  belief: 'By the end of 2028, driverless taxis run in ten US cities.',
  settledBy: 'the end of 2028',
  outsideView: {
    question: 'When a transport technology was promised within three years, did it arrive?',
    cases: [
      { label: 'Segway, 2001', happened: false, note: 'Stayed niche.', source: 'Wired, 2015' },
      { label: 'Ride-hailing, 2012', happened: true, note: 'In most US cities within three years.', source: 'Company filings' },
      { label: 'Hyperloop, 2013', happened: false, note: 'No passenger line was built.', source: 'The Verge, 2023' },
    ],
  },
  premises: [
    { id: 'tech-works', claim: 'The driving works without a safety driver', why: 'Rides already run in a few cities.', against: 'Edge cases keep appearing.', check: { questionId: 'robotaxi-cities-2028', side: 'yes' } },
    { id: 'regulators', claim: 'Regulators allow it city by city', why: 'Several states have passed permits.', against: 'One bad crash can freeze approvals.', check: null },
  ],
  premortem: [
    { id: 'crash', story: 'A fatal crash froze permits nationwide.', breaks: 'regulators', signal: 'A state suspends an operating permit' },
    { id: 'weather', story: 'The cars never handled snow.', breaks: 'tech-works', signal: 'No launches in cold-weather cities' },
  ],
  ifTrue: [
    {
      id: 'rollout',
      claim: 'Operators expand fast',
      because: 'Each new city reuses the same software.',
      against: 'Mapping and permits are slow.',
      thenWhat: 'Rivals and cities push back on pricing.',
      mechanisms: ['robotaxi-rollout'],
      check: null,
      next: [
        {
          id: 'insurers',
          claim: 'Personal auto insurance shrinks',
          because: 'Fewer people own cars in cities with cheap rides.',
          against: 'Car ownership is sticky.',
          thenWhat: 'Insurers move into fleet coverage.',
          mechanisms: ['auto-insurers-squeezed'],
          check: null,
        },
      ],
    },
  ],
  ifFalse: [
    { id: 'stall', claim: 'Rollouts stall', because: 'Costs stay high.', against: 'Costs fall with scale.', thenWhat: null, mechanisms: [], check: null, next: [] },
  ],
};

describe('validateDraft', () => {
  it('accepts a draft that stays inside the firewall', () => {
    const result = validateDraft(draft, ctx);
    expect(result).toEqual({ ok: true, draft });
  });

  it('rejects prices, percentages, multiples, "should" and securities anywhere in the text', () => {
    const bad = structuredClone(draft);
    bad.premises[0].why = 'The stock could rise 40% and pay 3x.';
    bad.ifTrue[0].because = 'Tesla and TSLA should win.';
    bad.outsideView.cases[0].note = 'Cost $5,000.';
    const result = validateDraft(bad, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toEqual(
      expect.arrayContaining([
        expect.stringContaining('premises[0].why: contains a price'),
        expect.stringContaining('ifTrue[0].because: says "should"'),
        expect.stringContaining('ifTrue[0].because: names a security (TSLA)'),
        expect.stringContaining('ifTrue[0].because: names a security (Tesla)'),
        expect.stringContaining('outsideView.cases[0].note: contains a price'),
      ]),
    );
  });

  it('matches tickers exactly and names in any case', () => {
    const bad = structuredClone(draft);
    bad.belief = 'lockheed martin wins';
    bad.hook = 'A tesla for the road?';
    bad.title = 'Tsla'; // not the ticker
    const result = validateDraft(bad, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toEqual([
      'hook: names a security (Tesla)',
      'belief: names a security (Lockheed Martin)',
    ]);
  });

  it('rejects unknown mechanisms and questions, and a mechanism step without "then what?"', () => {
    const bad = structuredClone(draft);
    bad.ifTrue[0].mechanisms = ['moon-base'];
    bad.ifTrue[0].thenWhat = null;
    bad.premises[0].check = { questionId: 'nope', side: 'yes' };
    const result = validateDraft(bad, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toEqual([
      'premises[0].check: unknown question "nope"',
      'ifTrue[0].mechanisms: unknown mechanism "moon-base"',
      'ifTrue[0].thenWhat: required when a step names mechanisms',
    ]);
  });

  it('requires enough cases with sources, enough parts, stories that break real parts, and unique ids', () => {
    const bad = structuredClone(draft);
    bad.outsideView.cases = bad.outsideView.cases.slice(0, 2);
    bad.outsideView.cases[1].source = '';
    bad.premises = [bad.premises[0]];
    bad.premortem[1].breaks = 'regulators';
    bad.premortem[1].id = 'crash';
    const result = validateDraft(bad, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toEqual([
      'outsideView.cases: needs at least 3',
      'outsideView.cases[1].source: missing (every case needs one)',
      'premises: needs at least 2',
      'premortem[0].breaks: must name a premise id',
      'premortem[1].id: id "crash" already used by premortem[0].id',
      'premortem[1].breaks: must name a premise id',
    ]);
  });

  it('reports malformed input instead of throwing', () => {
    expect(validateDraft('nope', ctx)).toEqual({ ok: false, problems: ['draft: not an object'] });
    const result = validateDraft({ premises: 'x', ifTrue: [{}] }, ctx);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.problems).toEqual(expect.arrayContaining(['title: missing', 'premises: missing', 'ifTrue[0].id: missing']));
  });
});

describe('toThesisTree', () => {
  const byId = new Map(mechanisms.map((m) => [m.id, m]));
  const provenance = { kind: 'drafted' as const, prompt: 'robotaxis', model: 'test', draftedAt: '2026-10-24T00:00:00Z' };

  it('keeps the tree shape, resolves mechanisms to bets and drops nulls', () => {
    const tree = toThesisTree(draft, { id: 'draft-1', emoji: '🤖', provenance, mechanisms: byId });
    expect(tree.provenance).toEqual(provenance);
    expect(tree.premises[0].check).toEqual({ questionId: 'robotaxi-cities-2028', side: 'yes' });
    expect('check' in tree.premises[1]).toBe(false);
    const [rollout] = tree.ifTrue;
    expect(rollout.bets?.map((b) => b.betId)).toEqual(['robotaxi-calls']);
    expect(rollout.next?.[0].bets?.map((b) => b.betId)).toEqual(['insurer-puts', 'robotaxi-calls']);
    expect('next' in tree.ifFalse[0]).toBe(false);
    expect('thenWhat' in tree.ifFalse[0]).toBe(false);
    expect(allSteps(tree).map((s) => s.id)).toEqual(['rollout', 'insurers', 'stall']);
  });

  it('dedupes a bet two mechanisms share', () => {
    const tree = resolveMechanisms(
      { ...toThesisTree(draft, { id: 'd', emoji: '🤖', provenance, mechanisms: byId }), ifTrue: [{ id: 'x', claim: 'c', because: 'b', against: 'a', mechanisms: ['robotaxi-rollout', 'auto-insurers-squeezed'] }] },
      byId,
    );
    expect(tree.ifTrue[0].bets?.map((b) => b.betId)).toEqual(['robotaxi-calls', 'insurer-puts']);
  });
});

describe('THESIS_DRAFT_SCHEMA', () => {
  it('requires every field and forbids extras, so the model fills the whole shape', () => {
    const walk = (schema: Record<string, unknown>) => {
      if (schema.type === 'object') {
        const props = schema.properties as Record<string, Record<string, unknown>>;
        expect(schema.additionalProperties).toBe(false);
        expect(schema.required).toEqual(Object.keys(props));
        Object.values(props).forEach(walk);
      }
      if (schema.type === 'array') walk(schema.items as Record<string, unknown>);
      if (Array.isArray(schema.anyOf)) (schema.anyOf as Record<string, unknown>[]).forEach(walk);
    };
    walk(THESIS_DRAFT_SCHEMA);
  });
});
