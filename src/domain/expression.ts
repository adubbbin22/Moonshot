import { outlivesQuestion } from './horizon';
import { isAsymmetric, type PricedStrategy } from './strategy';
import type { TakeView } from './takeProfile';
import type { Bet, EventQuestion } from './types';

/**
 * "Ways to express this view": the bets that pay if a user's call is right.
 *
 * Deterministic on purpose. Every user who holds the same view sees the same
 * bets in the same order; nothing here is ranked by who the user is. Budget
 * and the horizon guard filter, they never rank.
 */

export type ExpressionStatus = 'ok' | 'too-short' | 'not-asymmetric' | 'over-limit';

export function classifyExpression(
  priced: Pick<PricedStrategy, 'expiration' | 'payoffMultiple' | 'costPerContract'>,
  context: { resolvesOn?: string; ceiling: number },
): ExpressionStatus {
  if (context.resolvesOn && !outlivesQuestion(priced.expiration, context.resolvesOn)) return 'too-short';
  if (!isAsymmetric(priced)) return 'not-asymmetric';
  if (priced.costPerContract > context.ceiling) return 'over-limit';
  return 'ok';
}

export interface ViewWithBets {
  view: TakeView;
  question: EventQuestion;
  bets: Bet[];
  /** Why this side leads to these bets (or why there's no bet). */
  rationale: string;
}

export function viewsWithBets(
  views: TakeView[],
  getQuestion: (id: string) => EventQuestion | undefined,
  getBet: (id: string) => Bet | undefined,
): ViewWithBets[] {
  return views.flatMap((view) => {
    const question = getQuestion(view.questionId);
    const outcome = question?.outcomes.find((o) => o.side === view.side);
    if (!question || !outcome) return [];
    const bets = outcome.betIds.flatMap((id) => getBet(id) ?? []);
    return [{ view, question, bets, rationale: outcome.rationale }];
  });
}

/** Fixed display order within a view: soonest expiration first, then catalog id. */
export function byExpiration<T extends { bet: Bet; priced: Pick<PricedStrategy, 'expiration'> }>(a: T, b: T): number {
  return a.priced.expiration.localeCompare(b.priced.expiration) || a.bet.id.localeCompare(b.bet.id);
}
