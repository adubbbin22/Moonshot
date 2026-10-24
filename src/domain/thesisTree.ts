import { probabilityOfYes } from './calls';
import type { Call, ClaimCheck, OutsideView, ThesisPremise, ThesisStep, ThesisTree } from './types';

/**
 * First-principles reasoning, as arithmetic the user can check.
 *
 * A belief is broken into the parts it depends on. The user rates each part
 * assuming the ones above it hold, so multiplying them gives the chance of
 * the whole belief (the chain rule, so no independence assumption). Each
 * "which means…" step is then rated assuming the step before it, and the
 * chain to any step is the product along the path. Plain code owns every
 * number here; content only supplies the claims.
 *
 * Three thinking tools sit on top:
 * - Outside view: how past cases like this went, which the user can blend
 *   into the number every chain starts from.
 * - Pre-mortem: failure stories the user marks become their kill criteria.
 * - Then what?: the chance a step's effect outlasts the response it
 *   provokes multiplies into the chain for that step's bets.
 */

/** The ratings a user can give. Coarse on purpose: false precision isn't reasoning. */
export const LIKELIHOODS = [0.1, 0.3, 0.5, 0.7, 0.9] as const;

/** Gut and parts further apart than this get called out. */
export const GUT_GAP = 0.1;

/** Claim id (premise or step) -> probability, given everything above it. */
export type Ratings = Record<string, number>;

/** A user's work on one tree. */
export interface ThesisWork {
  /** Their gut number for the belief, before breaking it down. */
  gut?: number;
  ratings: Ratings;
  /** Step id -> chance the step's effect lasts until its bets expire, despite the response. */
  lasts: Ratings;
  /** Pre-mortem stories the user marked as plausible. */
  marked: string[];
  /** Carry forward the parts blended with the outside view, instead of the parts alone. */
  blend?: boolean;
}

export const EMPTY_WORK: ThesisWork = { ratings: {}, lasts: {}, marked: [] };

export interface OutsideViewRate {
  hits: number;
  total: number;
  /**
   * Laplace's rule of succession, (hits + 1) / (total + 2): with only a few
   * cases, the rate is pulled toward even odds instead of landing on 0% or 100%.
   */
  rate: number;
}

export function outsideViewRate(view: OutsideView): OutsideViewRate {
  const hits = view.cases.filter((c) => c.happened).length;
  const total = view.cases.length;
  return { hits, total, rate: (hits + 1) / (total + 2) };
}

export type Branch = 'ifTrue' | 'ifFalse';

/** Chance of the belief built from its parts, once every part is rated. */
export function builtBelief(tree: Pick<ThesisTree, 'premises'>, ratings: Ratings): number | undefined {
  let product = 1;
  for (const premise of tree.premises) {
    const p = ratings[premise.id];
    if (p === undefined) return undefined;
    product *= p;
  }
  return product;
}

/** The lowest-rated part, which caps the whole belief. Ties keep the earlier part. */
export function weakestLink(tree: Pick<ThesisTree, 'premises'>, ratings: Ratings): ThesisPremise | undefined {
  let weakest: ThesisPremise | undefined;
  for (const premise of tree.premises) {
    const p = ratings[premise.id];
    if (p !== undefined && (weakest === undefined || p < ratings[weakest.id])) weakest = premise;
  }
  return weakest;
}

/**
 * The number the chains start from: the parts, or halfway between the parts
 * and the outside view if the user chose to blend.
 */
export function carriedBelief(tree: ThesisTree, ratings: Ratings, blend = false): number | undefined {
  const parts = builtBelief(tree, ratings);
  if (parts === undefined || !blend) return parts;
  return (parts + outsideViewRate(tree.outsideView).rate) / 2;
}

/** How the parts compare with the gut number. */
export function gutCheck(gut: number, built: number): 'lower' | 'higher' | 'close' {
  if (built < gut - GUT_GAP) return 'lower';
  if (built > gut + GUT_GAP) return 'higher';
  return 'close';
}

/** The branch to show first: what follows if it's true, when you give it at least even odds. */
export function leaningBranch(belief: number): Branch {
  return belief >= 0.5 ? 'ifTrue' : 'ifFalse';
}

/** Chance that a branch's starting point holds: the belief, or the belief failing. */
export function branchProbability(belief: number, branch: Branch): number {
  return branch === 'ifTrue' ? belief : 1 - belief;
}

export interface StepPath {
  branch: Branch;
  /** From the top-level step down to (and including) the target. */
  steps: ThesisStep[];
}

function pathTo(steps: ThesisStep[], id: string): ThesisStep[] | undefined {
  for (const step of steps) {
    if (step.id === id) return [step];
    const rest = step.next ? pathTo(step.next, id) : undefined;
    if (rest) return [step, ...rest];
  }
  return undefined;
}

export function findStep(tree: ThesisTree, stepId: string): StepPath | undefined {
  for (const branch of ['ifTrue', 'ifFalse'] as const) {
    const steps = pathTo(tree[branch], stepId);
    if (steps) return { branch, steps };
  }
  return undefined;
}

/**
 * Chance the whole chain to a step holds: the belief (or its failure) times
 * every step on the way. Undefined until all of those are rated.
 */
export function chainProbability(
  tree: ThesisTree,
  ratings: Ratings,
  stepId: string,
  belief: number | undefined = builtBelief(tree, ratings),
): number | undefined {
  const path = findStep(tree, stepId);
  if (belief === undefined || !path) return undefined;
  let chain = branchProbability(belief, path.branch);
  for (const step of path.steps) {
    const p = ratings[step.id];
    if (p === undefined) return undefined;
    chain *= p;
  }
  return chain;
}

/**
 * Chance for the bets under a step: the chain to the step, times the chance
 * its effect lasts until the bets expire despite the response it provokes.
 * Undefined until that "then what?" is rated, for steps that have one.
 */
export function betChain(
  tree: ThesisTree,
  ratings: Ratings,
  lasts: Ratings,
  stepId: string,
  belief: number | undefined = builtBelief(tree, ratings),
): number | undefined {
  const chain = chainProbability(tree, ratings, stepId, belief);
  const step = findStep(tree, stepId)?.steps.at(-1);
  if (chain === undefined || !step?.thenWhat) return chain;
  const p = lasts[stepId];
  return p === undefined ? undefined : chain * p;
}

/** The warning signs from the pre-mortem stories the user marked, in story order. */
export function killCriteria(tree: Pick<ThesisTree, 'premortem'>, marked: string[]): string[] {
  return tree.premortem.filter((story) => marked.includes(story.id)).map((story) => story.signal);
}

/** Every "which means…" step in a tree, depth first, true branch before false. */
export function allSteps(tree: Pick<ThesisTree, 'ifTrue' | 'ifFalse'>): ThesisStep[] {
  const walk = (steps: ThesisStep[]): ThesisStep[] => steps.flatMap((s) => [s, ...walk(s.next ?? [])]);
  return [...walk(tree.ifTrue), ...walk(tree.ifFalse)];
}

/** Every rateable claim: the parts, then the steps. */
export function allClaims(tree: ThesisTree): (ThesisPremise | ThesisStep)[] {
  return [...tree.premises, ...allSteps(tree)];
}

/** Every bet a tree can lead to, without duplicates. */
export function treeBetIds(tree: ThesisTree): string[] {
  return [...new Set(allSteps(tree).flatMap((s) => (s.bets ?? []).map((b) => b.betId)))];
}

/** A call on a checking question, read as the chance the claim is true. */
export function claimProbabilityFromCall(call: Pick<Call, 'side' | 'probability'>, check: ClaimCheck): number {
  const yes = probabilityOfYes(call);
  return check.side === 'yes' ? yes : 1 - yes;
}

/**
 * Fills ratings the user hasn't given yet from their calls on the questions
 * that check each claim. A rating the user gave always wins.
 */
export function withCallRatings(
  tree: ThesisTree,
  ratings: Ratings,
  calls: Pick<Call, 'questionId' | 'side' | 'probability'>[],
): { ratings: Ratings; fromCalls: Set<string> } {
  const merged: Ratings = { ...ratings };
  const fromCalls = new Set<string>();
  for (const claim of allClaims(tree)) {
    if (merged[claim.id] !== undefined || !claim.check) continue;
    const { check } = claim;
    const call = calls.find((c) => c.questionId === check.questionId);
    if (!call) continue;
    merged[claim.id] = claimProbabilityFromCall(call, check);
    fromCalls.add(claim.id);
  }
  return { ratings: merged, fromCalls };
}

/** Trees with a claim that this question checks. */
export function treesCheckedBy(trees: ThesisTree[], questionId: string): ThesisTree[] {
  return trees.filter((tree) => allClaims(tree).some((c) => c.check?.questionId === questionId));
}

export interface ReasoningLine {
  kind: 'belief' | 'not-belief' | 'step' | 'lasts';
  /** The claim; for 'lasts', the response it has to outlast. */
  claim: string;
  /** This line's own rating (for the belief: the carried number). */
  probability?: number;
}

/**
 * The user's reasoning from the belief down to a step, one line per link.
 * Pass `lasts` to end with the step's "then what?" when it has one.
 */
export function reasoningLines(
  tree: ThesisTree,
  ratings: Ratings,
  stepId: string,
  options: { belief?: number; lasts?: Ratings } = {},
): ReasoningLine[] {
  const path = findStep(tree, stepId);
  if (!path) return [];
  const belief = 'belief' in options ? options.belief : builtBelief(tree, ratings);
  const first: ReasoningLine = {
    kind: path.branch === 'ifTrue' ? 'belief' : 'not-belief',
    claim: tree.belief,
    probability: belief === undefined ? undefined : branchProbability(belief, path.branch),
  };
  const steps = path.steps.map((s): ReasoningLine => ({ kind: 'step', claim: s.claim, probability: ratings[s.id] }));
  const target = path.steps[path.steps.length - 1];
  const lasts: ReasoningLine[] =
    options.lasts && target.thenWhat
      ? [{ kind: 'lasts', claim: target.thenWhat, probability: options.lasts[target.id] }]
      : [];
  return [first, ...steps, ...lasts];
}
