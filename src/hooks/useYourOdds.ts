import { betChain, carriedBelief, EMPTY_WORK, withCallRatings } from '@/domain/thesisTree';
import type { Position } from '@/domain/types';
import { useTheses } from '@/hooks/useThesis';
import { useAppState } from '@/state/store';

/**
 * The user's own chance that a position pays, from wherever it came from:
 * their call on the question (for the side they bet), or their chain through
 * a thesis tree. Nothing for a bet taken directly. Labelled as such wherever
 * it's shown: a call is about the event, and the stock still has to follow.
 */
export function useYourOdds(): (position: Position) => { odds: number; label: string } | undefined {
  const { calls, thesisWork } = useAppState();
  const trees = useTheses();

  return (position) => {
    const { source } = position;
    if (source.type === 'event') {
      const call = calls.find((c) => c.questionId === source.eventId);
      if (!call) return undefined;
      const odds = call.side === source.side ? call.probability : 1 - call.probability;
      return { odds, label: 'your call' };
    }
    if (source.type === 'thesis') {
      const tree = trees.find((t) => t.id === source.thesisId);
      if (!tree) return undefined;
      const work = thesisWork[tree.id] ?? EMPTY_WORK;
      const { ratings } = withCallRatings(tree, work.ratings, calls);
      const chain = betChain(tree, ratings, work.lasts, source.stepId, carriedBelief(tree, ratings, work.blend));
      return chain === undefined ? undefined : { odds: chain, label: 'your chain' };
    }
    return undefined;
  };
}
