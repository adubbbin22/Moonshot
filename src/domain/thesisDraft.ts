import { CATEGORY_ORDER } from './questionSelector';
import type {
  Category,
  ClaimCheck,
  Mechanism,
  ThesisPremise,
  ThesisProvenance,
  ThesisStep,
  ThesisTree,
} from './types';

/**
 * The firewall between an LLM and a thesis tree.
 *
 * An LLM may draft the reasoning: the belief, its parts, past cases, failure
 * stories, "which means…" steps and "then what?". It reaches bets only by
 * naming mechanisms from the curated library, and it never writes a price,
 * a percentage, a multiple, a security or the word "should". Every number
 * the user sees still comes from code and their own ratings.
 *
 * `THESIS_DRAFT_SCHEMA` is what the model must fill in; `validateDraft`
 * checks the result against the rules above and the catalog; `toThesisTree`
 * turns a valid draft into the same shape as a curated tree.
 */

export interface DraftCase {
  label: string;
  happened: boolean;
  note: string;
  /** Where a reader can check it: a publication, dataset or URL. */
  source: string;
}

export interface DraftCheck {
  questionId: string;
  side: 'yes' | 'no';
}

export interface DraftPremise {
  id: string;
  claim: string;
  why: string;
  against: string;
  check: DraftCheck | null;
}

export interface DraftStory {
  id: string;
  story: string;
  breaks: string;
  signal: string;
}

export interface DraftLeafStep {
  id: string;
  claim: string;
  because: string;
  against: string;
  /** The response this step provokes. Required when the step names mechanisms. */
  thenWhat: string | null;
  mechanisms: string[];
  check: DraftCheck | null;
}

export interface DraftStep extends DraftLeafStep {
  next: DraftLeafStep[];
}

export interface ThesisDraft {
  title: string;
  hook: string;
  category: Category;
  belief: string;
  settledBy: string;
  outsideView: { question: string; cases: DraftCase[] };
  premises: DraftPremise[];
  premortem: DraftStory[];
  ifTrue: DraftStep[];
  ifFalse: DraftStep[];
}

const str = { type: 'string' } as const;
const nullable = (schema: object) => ({ anyOf: [schema, { type: 'null' }] });
const obj = (properties: Record<string, object>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const CHECK_SCHEMA = obj({ questionId: str, side: { type: 'string', enum: ['yes', 'no'] } });

const LEAF_STEP_PROPERTIES = {
  id: str,
  claim: str,
  because: str,
  against: str,
  thenWhat: nullable(str),
  mechanisms: { type: 'array', items: str },
  check: nullable(CHECK_SCHEMA),
};

/** JSON Schema for `ThesisDraft`, for the model's structured output. Two levels of steps, no recursion. */
export const THESIS_DRAFT_SCHEMA = obj({
  title: str,
  hook: str,
  category: { type: 'string', enum: [...CATEGORY_ORDER] },
  belief: str,
  settledBy: str,
  outsideView: obj({
    question: str,
    cases: { type: 'array', items: obj({ label: str, happened: { type: 'boolean' }, note: str, source: str }) },
  }),
  premises: { type: 'array', items: obj({ id: str, claim: str, why: str, against: str, check: nullable(CHECK_SCHEMA) }) },
  premortem: { type: 'array', items: obj({ id: str, story: str, breaks: str, signal: str }) },
  ifTrue: { type: 'array', items: obj({ ...LEAF_STEP_PROPERTIES, next: { type: 'array', items: obj(LEAF_STEP_PROPERTIES) } }) },
  ifFalse: { type: 'array', items: obj({ ...LEAF_STEP_PROPERTIES, next: { type: 'array', items: obj(LEAF_STEP_PROPERTIES) } }) },
});

export interface DraftContext {
  mechanismIds: Set<string>;
  questionIds: Set<string>;
  /** Tickers and company names the draft may not mention. */
  securities: string[];
}

export type DraftValidation = { ok: true; draft: ThesisDraft } | { ok: false; problems: string[] };

/** Prices, percentages and multiples: numbers the firewall reserves for code. */
const PRICE_LIKE = /[$%]|\b\d+(\.\d+)?x\b|\b\d+(\.\d+)?\s*(percent|times)\b/i;
const SHOULD = /\bshould\b/i;
const MIN_CASES = 3;
const MIN_PREMISES = 2;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/**
 * Checks a draft's shape, the rules above, and that every mechanism and
 * question it names exists. Returns every problem found, not just the first,
 * so they can be handed back to the model for one more try.
 */
export function validateDraft(input: unknown, ctx: DraftContext): DraftValidation {
  const problems: string[] = [];
  const securityPatterns = ctx.securities.map((s) => ({
    name: s,
    // Tickers are short and upper-case: match them exactly. Names match in any case.
    re: new RegExp(`\\b${escapeRegex(s)}\\b`, /^[A-Z.]{1,6}$/.test(s) ? '' : 'i'),
  }));

  const text = (value: unknown, path: string, required = true): string | null => {
    if (typeof value !== 'string' || (required && value.trim() === '')) {
      problems.push(`${path}: ${required ? 'missing' : 'must be text'}`);
      return null;
    }
    if (PRICE_LIKE.test(value)) problems.push(`${path}: contains a price, percentage or multiple (numbers come from code)`);
    if (SHOULD.test(value)) problems.push(`${path}: says "should" (no advice)`);
    for (const { name, re } of securityPatterns) {
      if (re.test(value)) problems.push(`${path}: names a security (${name})`);
    }
    return value;
  };

  const check = (value: unknown, path: string) => {
    if (value === null || value === undefined) return;
    if (!isRecord(value) || typeof value.questionId !== 'string' || (value.side !== 'yes' && value.side !== 'no')) {
      problems.push(`${path}: malformed check`);
      return;
    }
    if (!ctx.questionIds.has(value.questionId)) problems.push(`${path}: unknown question "${value.questionId}"`);
  };

  const list = (value: unknown, path: string, min: number): unknown[] => {
    if (!Array.isArray(value)) {
      problems.push(`${path}: missing`);
      return [];
    }
    if (value.length < min) problems.push(`${path}: needs at least ${min}`);
    return value;
  };

  if (!isRecord(input)) return { ok: false, problems: ['draft: not an object'] };
  const d = input;
  const ids = new Map<string, string>();
  const id = (value: unknown, path: string): string | null => {
    const v = text(value, path);
    if (v === null) return null;
    if (ids.has(v)) problems.push(`${path}: id "${v}" already used by ${ids.get(v)}`);
    ids.set(v, path);
    return v;
  };

  for (const field of ['title', 'hook', 'belief', 'settledBy'] as const) text(d[field], field);
  if (!CATEGORY_ORDER.includes(d.category as Category)) problems.push(`category: must be one of ${CATEGORY_ORDER.join(', ')}`);

  const view = isRecord(d.outsideView) ? d.outsideView : {};
  text(view.question, 'outsideView.question');
  list(view.cases, 'outsideView.cases', MIN_CASES).forEach((c, i) => {
    const path = `outsideView.cases[${i}]`;
    if (!isRecord(c)) return problems.push(`${path}: malformed`);
    text(c.label, `${path}.label`);
    text(c.note, `${path}.note`);
    if (typeof c.source !== 'string' || c.source.trim() === '') problems.push(`${path}.source: missing (every case needs one)`);
    if (typeof c.happened !== 'boolean') problems.push(`${path}.happened: must be true or false`);
  });

  const premiseIds = new Set<string>();
  list(d.premises, 'premises', MIN_PREMISES).forEach((p, i) => {
    const path = `premises[${i}]`;
    if (!isRecord(p)) return problems.push(`${path}: malformed`);
    const pid = id(p.id, `${path}.id`);
    if (pid) premiseIds.add(pid);
    text(p.claim, `${path}.claim`);
    text(p.why, `${path}.why`);
    text(p.against, `${path}.against`);
    check(p.check, `${path}.check`);
  });

  list(d.premortem, 'premortem', MIN_PREMISES).forEach((f, i) => {
    const path = `premortem[${i}]`;
    if (!isRecord(f)) return problems.push(`${path}: malformed`);
    id(f.id, `${path}.id`);
    text(f.story, `${path}.story`);
    text(f.signal, `${path}.signal`);
    if (typeof f.breaks !== 'string' || !premiseIds.has(f.breaks)) problems.push(`${path}.breaks: must name a premise id`);
  });

  const step = (s: unknown, path: string, depth: number) => {
    if (!isRecord(s)) return problems.push(`${path}: malformed`);
    id(s.id, `${path}.id`);
    text(s.claim, `${path}.claim`);
    text(s.because, `${path}.because`);
    text(s.against, `${path}.against`);
    check(s.check, `${path}.check`);
    const mechanisms = Array.isArray(s.mechanisms) ? s.mechanisms : [];
    if (!Array.isArray(s.mechanisms)) problems.push(`${path}.mechanisms: missing (use [] for none)`);
    for (const m of mechanisms) {
      if (typeof m !== 'string' || !ctx.mechanismIds.has(m)) problems.push(`${path}.mechanisms: unknown mechanism "${String(m)}"`);
    }
    if (s.thenWhat !== null && s.thenWhat !== undefined) text(s.thenWhat, `${path}.thenWhat`);
    else if (mechanisms.length > 0) problems.push(`${path}.thenWhat: required when a step names mechanisms`);
    if (depth === 0 && s.next !== undefined && s.next !== null) {
      list(s.next, `${path}.next`, 0).forEach((n, j) => step(n, `${path}.next[${j}]`, 1));
    }
  };
  list(d.ifTrue, 'ifTrue', 1).forEach((s, i) => step(s, `ifTrue[${i}]`, 0));
  list(d.ifFalse, 'ifFalse', 1).forEach((s, i) => step(s, `ifFalse[${i}]`, 0));

  return problems.length > 0 ? { ok: false, problems } : { ok: true, draft: d as unknown as ThesisDraft };
}

/** Fills each step's bets from the mechanisms it names. Content never sets bets directly. */
export function resolveMechanisms(tree: ThesisTree, byId: Map<string, Mechanism>): ThesisTree {
  const resolve = (steps: ThesisStep[]): ThesisStep[] =>
    steps.map((step) => {
      const seen = new Set<string>();
      const bets = (step.mechanisms ?? [])
        .flatMap((m) => byId.get(m)?.bets ?? [])
        .filter((b) => !seen.has(b.betId) && seen.add(b.betId));
      return { ...step, bets, ...(step.next ? { next: resolve(step.next) } : {}) };
    });
  return { ...tree, ifTrue: resolve(tree.ifTrue), ifFalse: resolve(tree.ifFalse) };
}

export interface DraftToTreeOptions {
  id: string;
  emoji: string;
  provenance: ThesisProvenance;
  mechanisms: Map<string, Mechanism>;
}

/** A validated draft as a thesis tree, with bets resolved and nulls dropped. */
export function toThesisTree(draft: ThesisDraft, { id, emoji, provenance, mechanisms }: DraftToTreeOptions): ThesisTree {
  const checkOf = (c: DraftCheck | null): { check?: ClaimCheck } => (c ? { check: c } : {});
  const step = (s: DraftLeafStep | DraftStep): ThesisStep => ({
    id: s.id,
    claim: s.claim,
    because: s.because,
    against: s.against,
    ...checkOf(s.check),
    ...(s.thenWhat ? { thenWhat: s.thenWhat } : {}),
    mechanisms: s.mechanisms,
    ...('next' in s && s.next.length > 0 ? { next: s.next.map(step) } : {}),
  });
  const premises: ThesisPremise[] = draft.premises.map((p) => ({
    id: p.id,
    claim: p.claim,
    why: p.why,
    against: p.against,
    ...checkOf(p.check),
  }));
  return resolveMechanisms(
    {
      id,
      provenance,
      title: draft.title,
      hook: draft.hook,
      emoji,
      category: draft.category,
      belief: draft.belief,
      settledBy: draft.settledBy,
      outsideView: draft.outsideView,
      premises,
      premortem: draft.premortem,
      ifTrue: draft.ifTrue.map(step),
      ifFalse: draft.ifFalse.map(step),
    },
    mechanisms,
  );
}
