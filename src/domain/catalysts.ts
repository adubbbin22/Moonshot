import { isBullish } from './options';
import type {
  Bet,
  Catalyst,
  CatalystKind,
  CatalystTiming,
  ClaimCheck,
  Direction,
  DraftProvenance,
  Mechanism,
  ThesisBetLink,
  UnderlyingProfile,
} from './types';

/**
 * The framework for a security: its catalyst map, and how catalysts turn
 * into bets.
 *
 * A bet is a direction on a symbol over a horizon. A catalyst has a
 * direction. So the bets that express a catalyst are derived, never
 * hand-linked: every bullish bet on the symbol expresses every "up"
 * catalyst. A mechanism (something happening in the world) names catalysts,
 * and code follows them to bets. That's the whole chain from a belief to a
 * trade, and no step of it names a security by hand except the catalyst
 * map itself, which people approve.
 */

export const CATALYST_KINDS: CatalystKind[] = ['demand', 'pricing', 'costs', 'rates', 'policy', 'event', 'competition', 'sentiment'];
export const CATALYST_TIMINGS: CatalystTiming[] = ['on-the-news', 'over-quarters'];

export function betDirection(bet: Pick<Bet, 'strategy'>): Direction {
  return isBullish(bet.strategy.kind) ? 'up' : 'down';
}

/** The bets that pay if a security moves this way, in catalog order. */
export function betsExpressing(bets: Bet[], symbol: string, direction: Direction): Bet[] {
  return bets.filter((b) => b.strategy.underlying === symbol && betDirection(b) === direction);
}

/** The catalysts a bet rides: those on its symbol in its direction. */
export function catalystsRidden(bet: Bet, profile: UnderlyingProfile | undefined): Catalyst[] {
  if (!profile) return [];
  const direction = betDirection(bet);
  return profile.catalysts.filter((c) => c.direction === direction);
}

/** The catalysts that run the other way: what the bet is betting against. */
export function catalystsAgainst(bet: Bet, profile: UnderlyingProfile | undefined): Catalyst[] {
  if (!profile) return [];
  const direction = betDirection(bet);
  return profile.catalysts.filter((c) => c.direction !== direction);
}

/** The bets a mechanism leads to, each with the catalyst's why. Deduped, in mechanism then catalog order. */
export function mechanismLinks(
  mechanism: Mechanism,
  profiles: Map<string, UnderlyingProfile>,
  bets: Bet[],
): ThesisBetLink[] {
  const seen = new Set<string>();
  const links: ThesisBetLink[] = [];
  for (const ref of mechanism.catalysts) {
    const catalyst = profiles.get(ref.symbol)?.catalysts.find((c) => c.id === ref.catalyst);
    if (!catalyst) continue;
    for (const bet of betsExpressing(bets, ref.symbol, catalyst.direction)) {
      if (seen.has(bet.id)) continue;
      seen.add(bet.id);
      links.push({ betId: bet.id, why: catalyst.why });
    }
  }
  return links;
}

/** Mechanism id -> bet links, for resolving thesis trees. Unknown ids resolve to nothing. */
export function createLinkResolver(
  mechanisms: Mechanism[],
  profiles: UnderlyingProfile[],
  bets: Bet[],
): (mechanismId: string) => ThesisBetLink[] {
  const bySymbol = new Map(profiles.map((p) => [p.symbol, p]));
  const links = new Map(mechanisms.map((m) => [m.id, mechanismLinks(m, bySymbol, bets)]));
  return (id) => links.get(id) ?? [];
}

export interface CatalystMatch {
  profile: UnderlyingProfile;
  catalyst: Catalyst;
}

/** Catalysts a feed question tests, so a call can point at the stocks it moves. */
export function catalystsCheckedBy(profiles: UnderlyingProfile[], questionId: string): CatalystMatch[] {
  return profiles.flatMap((profile) =>
    profile.catalysts
      .filter((catalyst) => catalyst.checks?.some((c) => c.questionId === questionId))
      .map((catalyst) => ({ profile, catalyst })),
  );
}

/* ---------- Drafted profiles ---------- */

/**
 * An LLM may draft the catalyst map for a symbol. This is the one place the
 * model is meant to name the company: the subject is the security. It still
 * writes no numbers, no price targets and no advice, and a person approves
 * the draft before it enters the library.
 */
export interface ProfileDraft {
  symbol: string;
  name: string;
  kind: UnderlyingProfile['kind'];
  whatItIs: string;
  movesOn: string;
  catalysts: {
    id: string;
    label: string;
    direction: Direction;
    kind: CatalystKind;
    timing: CatalystTiming;
    why: string;
    watch: string[];
    checks: ClaimCheck[];
  }[];
  risks: string[];
}

const str = { type: 'string' } as const;
const strings = { type: 'array', items: str } as const;
const obj = (properties: Record<string, object>) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

/** JSON Schema for `ProfileDraft`, for the model's structured output. */
export const PROFILE_DRAFT_SCHEMA = obj({
  symbol: str,
  name: str,
  kind: { type: 'string', enum: ['stock', 'etf', 'commodity'] },
  whatItIs: str,
  movesOn: str,
  catalysts: {
    type: 'array',
    items: obj({
      id: str,
      label: str,
      direction: { type: 'string', enum: ['up', 'down'] },
      kind: { type: 'string', enum: CATALYST_KINDS },
      timing: { type: 'string', enum: CATALYST_TIMINGS },
      why: str,
      watch: strings,
      checks: { type: 'array', items: obj({ questionId: str, side: { type: 'string', enum: ['yes', 'no'] } }) },
    }),
  },
  risks: strings,
});

export interface ProfileDraftContext {
  /** The symbol that was asked for; the draft must be about it. */
  symbol: string;
  questionIds: Set<string>;
}

export type ProfileValidation = { ok: true; draft: ProfileDraft } | { ok: false; problems: string[] };

const PRICE_LIKE = /[$%]|\b\d+(\.\d+)?x\b|\b\d+(\.\d+)?\s*(percent|times)\b/i;
const ADVICE = /\bshould\b|\bprice target\b|\btarget price\b|\b(buy|sell|short)\s+(it|the stock|the shares|calls|puts)\b/i;
const MIN_CATALYSTS = 3;
const MIN_RISKS = 2;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

/** Checks a drafted profile's shape and rules: no numbers, no advice, both directions covered, real questions. */
export function validateProfileDraft(input: unknown, ctx: ProfileDraftContext): ProfileValidation {
  const problems: string[] = [];
  const text = (value: unknown, path: string): string | null => {
    if (typeof value !== 'string' || value.trim() === '') {
      problems.push(`${path}: missing`);
      return null;
    }
    if (PRICE_LIKE.test(value)) problems.push(`${path}: contains a price, percentage or multiple (numbers come from code)`);
    if (ADVICE.test(value)) problems.push(`${path}: reads as advice`);
    return value;
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
  if (d.symbol !== ctx.symbol) problems.push(`symbol: expected ${ctx.symbol}`);
  text(d.name, 'name');
  if (!['stock', 'etf', 'commodity'].includes(d.kind as string)) problems.push('kind: must be stock, etf or commodity');
  text(d.whatItIs, 'whatItIs');
  text(d.movesOn, 'movesOn');

  const ids = new Set<string>();
  const directions = new Set<string>();
  list(d.catalysts, 'catalysts', MIN_CATALYSTS).forEach((c, i) => {
    const path = `catalysts[${i}]`;
    if (!isRecord(c)) return problems.push(`${path}: malformed`);
    const id = text(c.id, `${path}.id`);
    if (id !== null) {
      if (ids.has(id)) problems.push(`${path}.id: "${id}" already used`);
      ids.add(id);
    }
    text(c.label, `${path}.label`);
    if (c.direction !== 'up' && c.direction !== 'down') problems.push(`${path}.direction: must be up or down`);
    else directions.add(c.direction);
    if (!CATALYST_KINDS.includes(c.kind as CatalystKind)) problems.push(`${path}.kind: must be one of ${CATALYST_KINDS.join(', ')}`);
    if (!CATALYST_TIMINGS.includes(c.timing as CatalystTiming)) problems.push(`${path}.timing: must be on-the-news or over-quarters`);
    text(c.why, `${path}.why`);
    list(c.watch, `${path}.watch`, 1).forEach((w, j) => text(w, `${path}.watch[${j}]`));
    list(c.checks, `${path}.checks`, 0).forEach((check, j) => {
      if (!isRecord(check) || typeof check.questionId !== 'string' || (check.side !== 'yes' && check.side !== 'no')) {
        return problems.push(`${path}.checks[${j}]: malformed`);
      }
      if (!ctx.questionIds.has(check.questionId)) problems.push(`${path}.checks[${j}]: unknown question "${check.questionId}"`);
    });
  });
  if (directions.size === 1) problems.push('catalysts: needs at least one that moves the price up and one that moves it down');
  list(d.risks, 'risks', MIN_RISKS).forEach((r, i) => text(r, `risks[${i}]`));

  return problems.length > 0 ? { ok: false, problems } : { ok: true, draft: d as unknown as ProfileDraft };
}

/** A validated draft as a profile, with empty check lists dropped. */
export function toProfile(draft: ProfileDraft, provenance: DraftProvenance): UnderlyingProfile {
  return {
    symbol: draft.symbol,
    name: draft.name,
    kind: draft.kind,
    whatItIs: draft.whatItIs,
    movesOn: draft.movesOn,
    catalysts: draft.catalysts.map(({ checks, ...c }) => ({ ...c, ...(checks.length > 0 ? { checks } : {}) })),
    risks: draft.risks,
    provenance,
  };
}
