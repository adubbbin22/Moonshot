import {
  builtBelief,
  carriedBelief,
  EMPTY_WORK,
  killCriteria,
  outsideViewRate,
  withCallRatings,
  type OutsideViewRate,
  type Ratings,
} from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { useAppDispatch, useAppState } from '@/state/store';

export interface ThesisWorkState {
  gut?: number;
  /** The user's ratings, with gaps filled from their calls on checking questions. */
  ratings: Ratings;
  /** Claims whose rating came from a call rather than from this tree. */
  fromCalls: Set<string>;
  /** How past cases like this went. */
  outside: OutsideViewRate;
  /** The belief built from its parts, once every part has a rating. */
  parts?: number;
  /** The number the chains start from: the parts, or the parts blended with the outside view. */
  belief?: number;
  blend: boolean;
  /** Step id -> chance its effect outlasts the response it provokes. */
  lasts: Ratings;
  /** Pre-mortem stories marked as plausible. */
  marked: string[];
  /** Warning signs from the marked stories. */
  killCriteria: string[];
  setGut: (probability: number) => void;
  rate: (claimId: string, probability: number) => void;
  rateLasts: (stepId: string, probability: number) => void;
  toggleFailure: (storyId: string) => void;
  setBlend: (blend: boolean) => void;
  reset: () => void;
}

/** The current user's reasoning on one thesis tree. */
export function useThesisWork(tree: ThesisTree): ThesisWorkState {
  const { thesisWork, calls } = useAppState();
  const dispatch = useAppDispatch();
  const work = thesisWork[tree.id] ?? EMPTY_WORK;
  const { ratings, fromCalls } = withCallRatings(tree, work.ratings, calls);
  const blend = work.blend ?? false;
  const thesisId = tree.id;

  return {
    gut: work.gut,
    ratings,
    fromCalls,
    outside: outsideViewRate(tree.outsideView),
    parts: builtBelief(tree, ratings),
    belief: carriedBelief(tree, ratings, blend),
    blend,
    lasts: work.lasts,
    marked: work.marked,
    killCriteria: killCriteria(tree, work.marked),
    setGut: (probability) => dispatch({ type: 'setGut', thesisId, probability }),
    rate: (claimId, probability) => dispatch({ type: 'rateClaim', thesisId, claimId, probability }),
    rateLasts: (stepId, probability) => dispatch({ type: 'rateLasts', thesisId, stepId, probability }),
    toggleFailure: (storyId) => dispatch({ type: 'toggleFailure', thesisId, storyId }),
    setBlend: (value) => dispatch({ type: 'setBlend', thesisId, blend: value }),
    reset: () => dispatch({ type: 'resetThesis', thesisId }),
  };
}
