import { asymmetryRatio } from './payoff';
import type { Bet, Theme, ThesisOption } from './types';

/** Maps step id -> chosen option id. */
export type ThesisAnswers = Record<string, string>;

export interface BuiltThesis {
  statement: string;
  tags: string[];
  answerIds: string[];
  /** True once every step in the theme has an answer. */
  complete: boolean;
}

export function selectedOptions(theme: Theme, answers: ThesisAnswers): ThesisOption[] {
  return theme.steps.flatMap((step) => {
    const option = step.options.find((o) => o.id === answers[step.id]);
    return option ? [option] : [];
  });
}

/** Turns a user's answers into a one-paragraph thesis they can save and revisit. */
export function buildThesis(theme: Theme, answers: ThesisAnswers): BuiltThesis {
  const options = selectedOptions(theme, answers);
  return {
    statement: options.map((o) => o.fragment).join(' '),
    tags: [...new Set(options.flatMap((o) => o.tags))],
    answerIds: options.map((o) => o.id),
    complete: options.length === theme.steps.length,
  };
}

export interface BetMatch {
  bet: Bet;
  /** How many of the thesis tags this bet shares. */
  score: number;
}

/**
 * Ranks bets by how many thesis tags they share, breaking ties by asymmetry.
 * Bets that share no tags are dropped: we only show bets that follow from
 * what the user said they believe.
 */
export function matchBets(tags: string[], bets: Bet[], limit = 3): BetMatch[] {
  const wanted = new Set(tags);
  return bets
    .map((bet) => ({ bet, score: bet.tags.filter((t) => wanted.has(t)).length }))
    .filter((m) => m.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || asymmetryRatio(b.bet.scenarios) - asymmetryRatio(a.bet.scenarios),
    )
    .slice(0, limit);
}
