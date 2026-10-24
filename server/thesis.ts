/// <reference types="node" />
import type Anthropic from '@anthropic-ai/sdk';

import { CATEGORY_ORDER } from '../src/domain/questionSelector';
import { THESIS_DRAFT_SCHEMA, toThesisTree, validateDraft, type LinkResolver, type ThesisDraft } from '../src/domain/thesisDraft';
import type { EventQuestion, Mechanism, ThesisTree } from '../src/domain/types';

/**
 * Drafts a thesis tree from a belief in the user's words, with Claude, inside
 * the firewall in src/domain/thesisDraft.ts:
 *
 * 1. Draft: the model writes the reasoning as structured output. It reaches
 *    bets only by naming mechanisms from the library, and the prompt forbids
 *    prices, securities and advice.
 * 2. Review: a second call acts as fact checker and rules lawyer. Cases it
 *    disputes are dropped; what it flags is kept with the tree.
 * 3. Validate: code checks the firewall and the catalog. If the draft fails,
 *    the problems go back to the model once.
 *
 * Every model output is handed to `audit` so it can be logged.
 */

export const DRAFT_MODEL = 'claude-opus-5-5';

const EMOJI: Record<string, string> = { tech: '🤖', energy: '⚡', geopolitics: '🌍', macro: '💵', health: '🧬', space: '🚀' };

/** The slice of the SDK client this module uses, so tests can stub it. */
export interface DraftClient {
  messages: {
    create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message>;
  };
}

export interface DraftCatalog {
  questions: Pick<EventQuestion, 'id' | 'question' | 'resolution'>[];
  mechanisms: Pick<Mechanism, 'id' | 'label' | 'description'>[];
  /** Tickers and company names the draft may not mention. */
  securities: string[];
  /** Mechanism id -> the bets it leads to (domain/catalysts.ts#createLinkResolver). */
  linksFor: LinkResolver;
}

export interface DraftOptions {
  now?: () => Date;
  /** Receives every model output, for the audit log. */
  audit?: (record: { stage: 'draft' | 'retry' | 'review'; belief: string; output: unknown; usage: Anthropic.Usage }) => void;
}

export class DraftError extends Error {
  constructor(
    message: string,
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = 'DraftError';
  }
}

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    cases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          verdict: { type: 'string', enum: ['supported', 'disputed', 'unsure'] },
          note: { type: 'string' },
        },
        required: ['label', 'verdict', 'note'],
        additionalProperties: false,
      },
    },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['cases', 'notes'],
  additionalProperties: false,
} as const;

interface Review {
  cases: { label: string; verdict: 'supported' | 'disputed' | 'unsure'; note: string }[];
  notes: string[];
}

/** Stable across requests so the prefix caches; the belief goes in the user turn. */
export function draftSystemPrompt(catalog: DraftCatalog): string {
  const mechanisms = catalog.mechanisms.map((m) => `- ${m.id}: ${m.label}. ${m.description}`).join('\n');
  const questions = catalog.questions
    .map((q) => `- ${q.id}: ${q.question} (resolves ${q.resolution.resolvesOn} on ${q.resolution.source})`)
    .join('\n');
  return `You help someone reason about a belief about the world from first principles. You write the reasoning; you never pick investments.

Turn their belief into a thesis tree:
- "belief": the belief restated as one claim that will clearly be true or false by a date ("settledBy").
- "title" (two or three words), "hook" (the belief as a short question), "category" (one of ${CATEGORY_ORDER.join(', ')}).
- "outsideView": a reference class, as a question ("When X was predicted, did it happen within N years?"), and 4 to 8 real past cases that belong to it, a mix of ones that happened and ones that didn't. Each case needs a one-line note of what actually happened and a "source" a reader can check (a publication, dataset or URL). Only include cases you are confident are real. If you are not sure a case is real, leave it out.
- "premises": 2 to 4 parts the belief depends on, such that if every part holds, the belief holds. For each: the first-principles case it holds ("why") and the strongest case against it ("against"), both in good faith.
- "premortem": 2 to 4 stories told from after "settledBy", each explaining how the belief turned out wrong. Each names the premise it breaks ("breaks") and an observable early warning ("signal").
- "ifTrue" and "ifFalse": 1 to 3 "which means…" steps each, with up to 2 follow-on steps in "next". Each step has a "because" (the mechanism, why it follows from the step before), an "against", and a "thenWhat": the response the step provokes that could undo it (competitors pile in, supply catches up, regulators act). "thenWhat" is required on any step that names mechanisms.
- A step reaches the market only through "mechanisms": ids from the library below. Name a mechanism when the step would set it in motion. Use [] when none fits. Never invent a mechanism id.
- Where a feed question below tests a claim, set its "check" to the question id and the side ("yes" or "no") that would mean the claim holds. Otherwise null.

Rules that code will enforce:
- No prices, percentages, multiples or odds anywhere. No "$", "%", "3x", "40 percent". Years and counts in case notes are fine.
- Never name a security, ticker, company stock, fund or index. Describe the world, not the trade.
- Never use the word "should". No advice, no opinions on what to buy.
- Write plainly, for a smart reader who isn't a specialist. Short sentences.
- Ids: short lowercase slugs, unique across the whole draft.

Mechanism library:
${mechanisms}

Feed questions:
${questions}`;
}

const REVIEW_SYSTEM = `You are the fact checker and rules lawyer for a thesis tree someone drafted. You will be given the draft as JSON.

For every case in outsideView.cases, give a verdict:
- "supported": you are confident the case is real and the note describes what happened accurately.
- "disputed": the case is not real, or the note gets the outcome wrong.
- "unsure": you can't say either way.
Be strict: a case that drives a number must be right.

In "notes", list anything else a careful editor would flag: a premise that isn't needed for the belief, parts that don't add up to the belief, a step that doesn't follow from the step before, or anything that reads as investment advice. Keep each note to one sentence. Use [] if there is nothing to flag.`;

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

function parsed<T>(message: Anthropic.Message, what: string): T {
  if (message.stop_reason === 'refusal') throw new DraftError(`The model declined to ${what}.`);
  if (message.stop_reason === 'max_tokens') throw new DraftError(`The ${what} was cut off.`);
  try {
    return JSON.parse(textOf(message)) as T;
  } catch {
    throw new DraftError(`The ${what} was not valid JSON.`);
  }
}

export async function draftThesis(
  client: DraftClient,
  belief: string,
  catalog: DraftCatalog,
  options: DraftOptions = {},
): Promise<ThesisTree> {
  const { now = () => new Date(), audit = () => {} } = options;
  const prompt = belief.trim();
  if (prompt.length < 10) throw new DraftError('Say a bit more about what you believe.');
  if (prompt.length > 500) throw new DraftError('Keep the belief under 500 characters.');

  const ctx = {
    mechanismIds: new Set(catalog.mechanisms.map((m) => m.id)),
    questionIds: new Set(catalog.questions.map((q) => q.id)),
    securities: catalog.securities,
  };
  const system = draftSystemPrompt(catalog);
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: `My belief: ${prompt}` }];

  const ask = async (stage: 'draft' | 'retry'): Promise<ThesisDraft | string[]> => {
    const message = await client.messages.create({
      model: DRAFT_MODEL,
      max_tokens: 16000,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages,
      output_config: { effort: 'high', format: { type: 'json_schema', schema: THESIS_DRAFT_SCHEMA } },
    });
    const draft = parsed<unknown>(message, 'draft');
    audit({ stage, belief: prompt, output: draft, usage: message.usage });
    const result = validateDraft(draft, ctx);
    if (result.ok) return result.draft;
    messages.push(
      { role: 'assistant', content: JSON.stringify(draft) },
      { role: 'user', content: `That draft breaks these rules. Fix every one and return the whole draft again:\n- ${result.problems.join('\n- ')}` },
    );
    return result.problems;
  };

  let draft = await ask('draft');
  if (Array.isArray(draft)) draft = await ask('retry');
  if (Array.isArray(draft)) throw new DraftError('The draft broke the rules twice.', draft);

  const reviewMessage = await client.messages.create({
    model: DRAFT_MODEL,
    max_tokens: 8000,
    system: REVIEW_SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(draft) }],
    output_config: { effort: 'high', format: { type: 'json_schema', schema: REVIEW_SCHEMA } },
  });
  const review = parsed<Review>(reviewMessage, 'review');
  audit({ stage: 'review', belief: prompt, output: review, usage: reviewMessage.usage });

  const disputed = new Set(review.cases.filter((c) => c.verdict === 'disputed').map((c) => c.label));
  const cases = draft.outsideView.cases.filter((c) => !disputed.has(c.label));
  if (cases.length < 3) throw new DraftError('Too few of the past cases held up to review.', [...disputed]);

  const draftedAt = now().toISOString();
  return toThesisTree(
    { ...draft, outsideView: { ...draft.outsideView, cases } },
    {
      id: `draft-${draftedAt.replace(/\D/g, '').slice(0, 14)}`,
      emoji: EMOJI[draft.category] ?? '💡',
      provenance: {
        kind: 'drafted',
        prompt,
        model: DRAFT_MODEL,
        draftedAt,
        review: { droppedCases: disputed.size, notes: review.notes },
      },
      linksFor: catalog.linksFor,
    },
  );
}
