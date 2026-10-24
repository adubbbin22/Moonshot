import { probabilityOfYes } from './calls';
import type { Call, ClaimCheck, ThesisPremise, ThesisStep, ThesisTree } from './types';

/**
 * First-principles reasoning, as arithmetic the user can check.
 *
 * A belief is broken into the parts it depends on. The user rates each part
 * assuming the ones above it hold, so multiplying them gives the chance of
 * the whole belief (the chain rule, so no independence assumption). Each
 * "which means…" step is then rated assuming the step before it, and the
 * chain to any step is the product along the path. Plain code owns every
 * number here; content only supplies the claims.
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
export function chainProbability(tree: ThesisTree, ratings: Ratings, stepId: string): number | undefined {
  const belief = builtBelief(tree, ratings);
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
  kind: 'belief' | 'not-belief' | 'step';
  claim: string;
  /** This line's own rating (for the belief: built from its parts). */
  probability?: number;
}

/** The user's reasoning from the belief down to a step, one line per link. */
export function reasoningLines(tree: ThesisTree, ratings: Ratings, stepId: string): ReasoningLine[] {
  const path = findStep(tree, stepId);
  if (!path) return [];
  const belief = builtBelief(tree, ratings);
  const first: ReasoningLine = {
    kind: path.branch === 'ifTrue' ? 'belief' : 'not-belief',
    claim: tree.belief,
    probability: belief === undefined ? undefined : branchProbability(belief, path.branch),
  };
  return [first, ...path.steps.map((s): ReasoningLine => ({ kind: 'step', claim: s.claim, probability: ratings[s.id] }))];
}
