/**
 * @jest-environment node
 */
import type Anthropic from '@anthropic-ai/sdk';

import { draftProfile, ProfileDraftError, profileSystemPrompt, type ProfileClient } from '../profile';
import { EVENTS } from '@/data/events';
import type { ProfileDraft } from '@/domain/catalysts';

const catalog = { questions: EVENTS };
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

function stubClient(...replies: Anthropic.Message[]) {
  const calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
  const client: ProfileClient = {
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

const draft: ProfileDraft = {
  symbol: 'AMD',
  name: 'Advanced Micro Devices',
  kind: 'stock',
  whatItIs: 'Designs processors and AI accelerators, and sells them to PC makers, cloud companies and game consoles.',
  movesOn: 'Whether it wins AI accelerator orders from the leader, and the PC cycle.',
  catalysts: [
    {
      id: 'ai-share',
      label: 'It wins AI accelerator share',
      direction: 'up',
      kind: 'competition',
      timing: 'over-quarters',
      why: 'Cloud companies want a second supplier of AI chips. Each order it wins is revenue the leader had, at prices set by scarcity.',
      watch: ['Named cloud customers for its accelerators', 'Data-center revenue growth'],
      checks: [{ questionId: 'nvda-growth-2027', side: 'yes' }],
    },
    {
      id: 'pc-cycle',
      label: 'PC demand turns down',
      direction: 'down',
      kind: 'demand',
      timing: 'over-quarters',
      why: 'A large part of its revenue is processors for PCs. When PC sales fall, so do orders, and inventory builds.',
      watch: ['PC shipment reports', 'Inventory rising at distributors'],
      checks: [],
    },
    {
      id: 'export-controls',
      label: 'Export rules tighten',
      direction: 'down',
      kind: 'policy',
      timing: 'on-the-news',
      why: 'Rules limiting chip sales to China close off a market overnight.',
      watch: ['New export rules'],
      checks: [],
    },
  ],
  risks: ['Depends on one foundry for its most advanced chips', 'Competes with a far larger rival on both fronts'],
};

describe('draftProfile', () => {
  it('drafts, validates and returns a profile with provenance', async () => {
    const { client, calls } = stubClient(reply(draft));
    const profile = await draftProfile(client, 'amd', catalog, { now: () => new Date('2026-10-24T12:00:00Z') });
    expect(profile.symbol).toBe('AMD');
    expect(profile.provenance).toEqual({ kind: 'drafted', prompt: 'AMD', model: 'claude-opus-5-5', draftedAt: '2026-10-24T12:00:00.000Z' });
    expect(profile.catalysts[0].checks).toEqual([{ questionId: 'nvda-growth-2027', side: 'yes' }]);
    expect('checks' in profile.catalysts[1]).toBe(false);
    expect(calls[0].output_config).toMatchObject({ format: { type: 'json_schema' } });
    expect(calls[0].messages).toEqual([{ role: 'user', content: 'Symbol: AMD' }]);
  });

  it('hands rule breaks back once, then gives up', async () => {
    const bad = structuredClone(draft);
    bad.movesOn = 'You should buy before it hits 200.';
    bad.catalysts = bad.catalysts.filter((c) => c.direction === 'up');
    const { client, calls } = stubClient(reply(bad), reply(draft));
    const profile = await draftProfile(client, 'AMD', catalog);
    expect(profile.movesOn).toBe(draft.movesOn);
    expect(calls).toHaveLength(2);
    expect(calls[1].messages[2].content).toContain('movesOn: reads as advice');
    expect(calls[1].messages[2].content).toContain('one that moves the price up and one that moves it down');

    await expect(draftProfile(stubClient(reply(bad), reply(bad)).client, 'AMD', catalog)).rejects.toMatchObject({
      name: 'ProfileDraftError',
      problems: expect.arrayContaining(['movesOn: reads as advice']),
    });
  });

  it('rejects bad symbols before calling the model, and fails clearly on refusals', async () => {
    const { client, calls } = stubClient();
    await expect(draftProfile(client, 'not a ticker', catalog)).rejects.toThrow('Give a ticker symbol');
    expect(calls).toHaveLength(0);
    await expect(draftProfile(stubClient(reply({}, 'refusal')).client, 'AMD', catalog)).rejects.toBeInstanceOf(ProfileDraftError);
  });

  it('puts every question in the prompt and states the rules', () => {
    const prompt = profileSystemPrompt(catalog);
    for (const q of EVENTS) expect(prompt).toContain(`- ${q.id}: `);
    expect(prompt).toMatch(/at least one that pushes it up and one that pushes it down/);
    expect(prompt).toMatch(/No advice/);
    expect(prompt).toMatch(/No prices, percentages, multiples/);
  });
});
