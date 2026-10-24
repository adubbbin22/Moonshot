/// <reference types="node" />
import type Anthropic from '@anthropic-ai/sdk';

import { PROFILE_DRAFT_SCHEMA, toProfile, validateProfileDraft, type ProfileDraft } from '../src/domain/catalysts';
import type { EventQuestion, UnderlyingProfile } from '../src/domain/types';

/**
 * Drafts the framework for a security with Claude: what it is, and the
 * catalyst map of what moves it. This is the one place the model is meant
 * to name the company, because the company is the subject. It still writes
 * no numbers, no price targets and no advice; code checks that
 * (src/domain/catalysts.ts#validateProfileDraft), and a person approves the
 * draft before it enters src/data/underlyings.ts.
 *
 * Every model output is handed to `audit` so it can be logged.
 */

export const PROFILE_MODEL = 'claude-opus-5-5';

const SYMBOL = /^[A-Z][A-Z.]{0,5}$/;

export interface ProfileClient {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
}

export interface ProfileCatalog {
  questions: Pick<EventQuestion, 'id' | 'question' | 'resolution'>[];
}

export interface ProfileOptions {
  now?: () => Date;
  audit?: (record: { stage: 'draft' | 'retry'; symbol: string; output: unknown; usage: Anthropic.Usage }) => void;
}

export class ProfileDraftError extends Error {
  constructor(
    message: string,
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = 'ProfileDraftError';
  }
}

/** Stable across requests so the prefix caches; the symbol goes in the user turn. */
export function profileSystemPrompt(catalog: ProfileCatalog): string {
  const questions = catalog.questions
    .map((q) => `- ${q.id}: ${q.question} (resolves ${q.resolution.resolvesOn} on ${q.resolution.source})`)
    .join('\n');
  return `You write the framework for a security: what it is, and the map of what moves its price. You describe the world and the business; you never give investment advice.

Given a ticker symbol, fill in:
- "symbol": the symbol exactly as given. "name": the company or fund name. "kind": stock, etf, or commodity (a fund that holds a commodity or its futures).
- "whatItIs": one or two sentences for someone who has never heard of it: what it sells or holds, and to whom.
- "movesOn": one line on what the price mostly responds to.
- "catalysts": 3 to 6 things that move the price. Cover both directions: at least one that pushes it up and one that pushes it down. A map with only reasons to go up is a pitch, not a framework. For each:
  - "id": a short lowercase slug, unique within the map.
  - "label": a few words, as a headline ("Export rules tighten").
  - "direction": "up" or "down": what happens to the price if this fires.
  - "kind": demand, pricing, costs, rates, policy, event, competition, or sentiment.
  - "timing": "on-the-news" if the price moves when the news lands, "over-quarters" if it shows up as results come in.
  - "why": the chain from the event to the price: through revenue, margins, the multiple investors pay, or flows. One to three short sentences.
  - "watch": one to three observable signs that it is firing: a report, a filing, a number that gets published.
  - "checks": feed questions from the list below that test this catalyst, with the side ("yes" or "no") that means it fires. Use [] if none fits.
- "risks": 2 to 4 ways to lose even if the world goes your way: concentration, dilution, a single supplier, accounting, leadership.

Rules that code will enforce:
- No prices, percentages, multiples, valuations or odds anywhere. No "$", "%", "20x", "40 percent". Years and plain counts are fine.
- No advice. Never say "should", "buy", "sell", or give a price target. Describe what moves the price, not what to do.
- Plain language, short sentences, for a smart reader who is not a specialist.

Feed questions:
${questions}`;
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

function parsed(message: Anthropic.Message): unknown {
  if (message.stop_reason === 'refusal') throw new ProfileDraftError('The model declined to draft this profile.');
  if (message.stop_reason === 'max_tokens') throw new ProfileDraftError('The profile draft was cut off.');
  try {
    return JSON.parse(textOf(message));
  } catch {
    throw new ProfileDraftError('The profile draft was not valid JSON.');
  }
}

export async function draftProfile(
  client: ProfileClient,
  symbol: string,
  catalog: ProfileCatalog,
  options: ProfileOptions = {},
): Promise<UnderlyingProfile> {
  const { now = () => new Date(), audit = () => {} } = options;
  const ticker = symbol.trim().toUpperCase();
  if (!SYMBOL.test(ticker)) throw new ProfileDraftError('Give a ticker symbol, like NVDA.');

  const ctx = { symbol: ticker, questionIds: new Set(catalog.questions.map((q) => q.id)) };
  const system = profileSystemPrompt(catalog);
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: `Symbol: ${ticker}` }];

  const ask = async (stage: 'draft' | 'retry'): Promise<ProfileDraft | string[]> => {
    const message = await client.messages.create({
      model: PROFILE_MODEL,
      max_tokens: 8000,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      output_config: { effort: 'high', format: { type: 'json_schema', schema: PROFILE_DRAFT_SCHEMA } },
    });
    const draft = parsed(message);
    audit({ stage, symbol: ticker, output: draft, usage: message.usage });
    const result = validateProfileDraft(draft, ctx);
    if (result.ok) return result.draft;
    messages.push(
      { role: 'assistant', content: JSON.stringify(draft) },
      { role: 'user', content: `That draft breaks these rules. Fix every one and return the whole draft again:\n- ${result.problems.join('\n- ')}` },
    );
    return result.problems;
  };

  let draft = await ask('draft');
  if (Array.isArray(draft)) draft = await ask('retry');
  if (Array.isArray(draft)) throw new ProfileDraftError('The profile draft broke the rules twice.', draft);

  return toProfile(draft, { kind: 'drafted', prompt: ticker, model: PROFILE_MODEL, draftedAt: now().toISOString() });
}
