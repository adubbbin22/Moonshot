/**
 * @jest-environment node
 */
import type Anthropic from '@anthropic-ai/sdk';

import { DraftError, draftSystemPrompt, draftThesis, type DraftClient } from '../thesis';
import { BETS } from '@/data/bets';
import { DRAFT_FIXTURE } from '@/data/draftFixture';
import { EVENTS } from '@/data/events';
import { MECHANISMS } from '@/data/mechanisms';
import { allSteps } from '@/domain/thesisTree';

const catalog = {
  questions: EVENTS,
  mechanisms: MECHANISMS,
  securities: BETS.flatMap((b) => [b.strategy.underlying, b.strategy.underlyingName]),
};

const usage = { input_tokens: 1, output_tokens: 1 } as Anthropic.Usage;

function reply(body: unknown, stop_reason: Anthropic.Message['stop_reason'] = 'end_turn'): Anthropic.Message {
  return {
    id: 'msg',
    type: 'message',
    role: 'assistant',
    model: 'test',
    content: [{ type: 'text', text: JSON.stringify(body), citations: null }],
    stop_reason,
    stop_sequence: null,
    usage,
  } as Anthropic.Message;
}

/** A client that answers each call in turn and records the requests. */
function stubClient(...replies: Anthropic.Message[]) {
  const calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
  const client: DraftClient = {
    messages: {
      create: async (params) => {
        calls.push(params);
        const next = replies.shift();
        if (!next) throw new Error('No more stubbed replies');
        return next;
      },
    },
  };
  return { client, calls };
}

const allSupported = {
  cases: DRAFT_FIXTURE.outsideView.cases.map((c) => ({ label: c.label, verdict: 'supported', note: '' })),
  notes: [],
};

describe('draftThesis', () => {
  it('drafts, reviews, validates and returns a tree with provenance', async () => {
    const { client, calls } = stubClient(reply(DRAFT_FIXTURE), reply({ ...allSupported, notes: ['Part two is doing a lot of work.'] }));
    const tree = await draftThesis(client, 'AI will answer all my support tickets by 2028', catalog, {
      now: () => new Date('2026-10-24T12:00:00Z'),
    });

    expect(tree.id).toBe('draft-20261024120000');
    expect(tree.provenance).toEqual({
      kind: 'drafted',
      prompt: 'AI will answer all my support tickets by 2028',
      model: 'claude-opus-5-5',
      draftedAt: '2026-10-24T12:00:00.000Z',
      review: { droppedCases: 0, notes: ['Part two is doing a lot of work.'] },
    });
    expect(tree.emoji).toBe('🤖');
    expect(allSteps(tree).find((s) => s.id === 'inference-demand')?.bets?.map((b) => b.betId)).toEqual([
      'ai-compute-calls',
      'semis-basket',
    ]);

    // The draft call: structured output, cached system prompt, the belief in the user turn.
    const [draftCall, reviewCall] = calls;
    expect(draftCall.model).toBe('claude-opus-5-5');
    expect(draftCall.output_config).toMatchObject({ format: { type: 'json_schema' } });
    expect(draftCall.system).toEqual([expect.objectContaining({ cache_control: { type: 'ephemeral' } })]);
    expect(draftCall.messages).toEqual([{ role: 'user', content: 'My belief: AI will answer all my support tickets by 2028' }]);
    expect(reviewCall.messages[0].content).toBe(JSON.stringify(DRAFT_FIXTURE));
  });

  it('drops cases the review disputes', async () => {
    const review = {
      ...allSupported,
      cases: allSupported.cases.map((c, i) => (i === 0 ? { ...c, verdict: 'disputed', note: 'Teller counts fell.' } : c)),
    };
    const { client } = stubClient(reply(DRAFT_FIXTURE), reply(review));
    const tree = await draftThesis(client, 'AI agents take over support by 2028', catalog);
    expect(tree.outsideView.cases.map((c) => c.label)).not.toContain('ATMs and bank tellers, 1990s');
    expect(tree.outsideView.cases).toHaveLength(3);
    expect(tree.provenance?.review?.droppedCases).toBe(1);
  });

  it('hands rule breaks back to the model once, then gives up', async () => {
    const bad = structuredClone(DRAFT_FIXTURE);
    bad.premises[0].why = 'The chipmaker NVDA should rally 50%.';
    const { client, calls } = stubClient(reply(bad), reply(DRAFT_FIXTURE), reply(allSupported));
    const tree = await draftThesis(client, 'AI agents take over support by 2028', catalog);
    expect(tree.premises[0].why).toBe(DRAFT_FIXTURE.premises[0].why);
    expect(calls).toHaveLength(3);
    const retry = calls[1].messages;
    expect(retry).toHaveLength(3);
    expect(retry[2].content).toContain('premises[0].why: names a security (NVDA)');
    expect(retry[2].content).toContain('says "should"');

    const { client: stubborn } = stubClient(reply(bad), reply(bad));
    await expect(draftThesis(stubborn, 'AI agents take over support by 2028', catalog)).rejects.toMatchObject({
      name: 'DraftError',
      problems: expect.arrayContaining([expect.stringContaining('names a security (NVDA)')]),
    });
  });

  it('fails clearly on refusals, truncation and too few surviving cases', async () => {
    await expect(draftThesis(stubClient(reply({}, 'refusal')).client, 'AI agents take over support by 2028', catalog)).rejects.toThrow(
      'The model declined to draft.',
    );
    await expect(draftThesis(stubClient(reply({}, 'max_tokens')).client, 'AI agents take over support by 2028', catalog)).rejects.toThrow(
      'The draft was cut off.',
    );
    const allDisputed = { ...allSupported, cases: allSupported.cases.map((c) => ({ ...c, verdict: 'disputed' })) };
    await expect(
      draftThesis(stubClient(reply(DRAFT_FIXTURE), reply(allDisputed)).client, 'AI agents take over support by 2028', catalog),
    ).rejects.toBeInstanceOf(DraftError);
  });

  it('rejects beliefs that are too short or too long before calling the model', async () => {
    const { client, calls } = stubClient();
    await expect(draftThesis(client, 'AI wins', catalog)).rejects.toThrow('Say a bit more');
    await expect(draftThesis(client, 'x'.repeat(501), catalog)).rejects.toThrow('under 500');
    expect(calls).toHaveLength(0);
  });

  it('puts the whole library and every question in the system prompt, and forbids the firewall breaks', () => {
    const prompt = draftSystemPrompt(catalog);
    for (const m of MECHANISMS) expect(prompt).toContain(`- ${m.id}: `);
    for (const q of EVENTS) expect(prompt).toContain(`- ${q.id}: `);
    expect(prompt).toMatch(/Never name a security/);
    expect(prompt).toMatch(/Never use the word "should"/);
    expect(prompt).toMatch(/No prices, percentages, multiples or odds/);
  });
});
