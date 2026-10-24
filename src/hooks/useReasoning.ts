import {
  betChain,
  carriedBelief,
  EMPTY_WORK,
  findStep,
  killCriteria,
  reasoningLines,
  withCallRatings,
  type ReasoningLine,
  type StepPath,
} from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { formatPercent } from '@/lib/format';
import { useThesis } from '@/hooks/useThesis';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';

export interface Reasoning {
  tree: ThesisTree;
  path: StepPath;
  lines: ReasoningLine[];
  /** The user's chance for this bet's chain, through "then what?". */
  chain?: number;
  /** Why this bet pays if the step it hangs off comes true. */
  why?: string;
  /** Warning signs from the user's pre-mortem on this thesis. */
  killCriteria: string[];
  /** The chain in one sentence, for the "your why" field. */
  text: string;
}

const trimPeriod = (s: string) => s.replace(/\.$/, '');
/** Lowercases a leading capital unless it starts an acronym ("AI", "US"). */
const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

function reasoningText(lines: ReasoningLine[], chain?: number): string {
  const [first, ...rest] = lines;
  if (!first) return '';
  const steps = rest.filter((l) => l.kind === 'step');
  const start = `${first.kind === 'belief' ? 'I think' : 'I doubt that'} ${lowerFirst(trimPeriod(first.claim))}`;
  const sentence = [start, ...steps.map((s) => lowerFirst(trimPeriod(s.claim)))].join(', which means ');
  return chain === undefined ? `${sentence}.` : `${sentence}. My chain: ${formatPercent(chain)}.`;
}

/** The user's line of reasoning from a thesis tree down to a bet, if they came from one. */
export function useReasoning(betId: string, thesisId?: string, stepId?: string): Reasoning | undefined {
  const { thesisWork, calls } = useAppState();
  const tree = useThesis(thesisId);
  const path = tree && stepId ? findStep(tree, stepId) : undefined;
  if (!tree || !stepId || !path) return undefined;

  const work = thesisWork[tree.id] ?? EMPTY_WORK;
  const { ratings } = withCallRatings(tree, work.ratings, calls);
  const belief = carriedBelief(tree, ratings, work.blend);
  const lines = reasoningLines(tree, ratings, stepId, { belief, lasts: work.lasts });
  const chain = betChain(tree, ratings, work.lasts, stepId, belief);
  return {
    tree,
    path,
    lines,
    chain,
    // Steps link base ideas; a shape of one shares its why.
    why: path.steps.at(-1)?.bets?.find((b) => b.betId === (catalog.getBet(betId)?.shape?.baseId ?? betId))?.why,
    killCriteria: killCriteria(tree, work.marked),
    text: reasoningText(lines, chain),
  };
}
