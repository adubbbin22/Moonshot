import {
  chainProbability,
  findStep,
  reasoningLines,
  withCallRatings,
  type ReasoningLine,
  type StepPath,
} from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';

export interface Reasoning {
  tree: ThesisTree;
  path: StepPath;
  lines: ReasoningLine[];
  chain?: number;
  /** Why this bet pays if the step it hangs off comes true. */
  why?: string;
  /** The chain in one sentence, for the "your why" field. */
  text: string;
}

const trimPeriod = (s: string) => s.replace(/\.$/, '');
/** Lowercases a leading capital unless it starts an acronym ("AI", "US"). */
const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

function reasoningText(lines: ReasoningLine[], chain?: number): string {
  const [first, ...steps] = lines;
  if (!first) return '';
  const start = `${first.kind === 'belief' ? 'I think' : 'I doubt that'} ${lowerFirst(trimPeriod(first.claim))}`;
  const sentence = [start, ...steps.map((s) => lowerFirst(trimPeriod(s.claim)))].join(', which means ');
  return chain === undefined ? `${sentence}.` : `${sentence}. My chain: ${formatPercent(chain)}.`;
}

/** The user's line of reasoning from a thesis tree down to a bet, if they came from one. */
export function useReasoning(betId: string, thesisId?: string, stepId?: string): Reasoning | undefined {
  const { thesisWork, calls } = useAppState();
  const tree = thesisId ? catalog.getThesis(thesisId) : undefined;
  const path = tree && stepId ? findStep(tree, stepId) : undefined;
  if (!tree || !stepId || !path) return undefined;

  const { ratings } = withCallRatings(tree, thesisWork[tree.id]?.ratings ?? {}, calls);
  const lines = reasoningLines(tree, ratings, stepId);
  const chain = chainProbability(tree, ratings, stepId);
  return {
    tree,
    path,
    lines,
    chain,
    why: path.steps.at(-1)?.bets?.find((b) => b.betId === betId)?.why,
    text: reasoningText(lines, chain),
  };
}
