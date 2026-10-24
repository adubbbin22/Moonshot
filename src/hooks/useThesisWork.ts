import { builtBelief, withCallRatings, type Ratings, type ThesisWork } from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { useAppDispatch, useAppState } from '@/state/store';

const EMPTY: ThesisWork = { ratings: {} };

export interface ThesisWorkState {
  gut?: number;
  /** The user's ratings, with gaps filled from their calls on checking questions. */
  ratings: Ratings;
  /** Claims whose rating came from a call rather than from this tree. */
  fromCalls: Set<string>;
  /** The belief built from its parts, once every part has a rating. */
  belief?: number;
  setGut: (probability: number) => void;
  rate: (claimId: string, probability: number) => void;
  reset: () => void;
}

/** The current user's reasoning on one thesis tree. */
export function useThesisWork(tree: ThesisTree): ThesisWorkState {
  const { thesisWork, calls } = useAppState();
  const dispatch = useAppDispatch();
  const work = thesisWork[tree.id] ?? EMPTY;
  const { ratings, fromCalls } = withCallRatings(tree, work.ratings, calls);

  return {
    gut: work.gut,
    ratings,
    fromCalls,
    belief: builtBelief(tree, ratings),
    setGut: (probability) => dispatch({ type: 'setGut', thesisId: tree.id, probability }),
    rate: (claimId, probability) => dispatch({ type: 'rateClaim', thesisId: tree.id, claimId, probability }),
    reset: () => dispatch({ type: 'resetThesis', thesisId: tree.id }),
  };
}
