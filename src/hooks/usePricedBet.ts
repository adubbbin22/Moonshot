import { useEffect, useState } from 'react';

import type { PricedStrategy } from '@/domain/strategy';
import type { Bet, EventQuestion } from '@/domain/types';
import { catalog } from '@/services/catalog';
import { priceBet } from '@/services/pricing';

export type PricedBetState =
  | { status: 'loading' }
  | { status: 'ready'; priced: PricedStrategy }
  | { status: 'error'; message: string };

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/**
 * Live pricing for a bet from the configured market data provider. Pass the
 * question the bet is shown for, so it's priced past the question's resolution.
 */
export function usePricedBet(bet: Bet | undefined, question?: EventQuestion): PricedBetState {
  // Results are tagged with what they belong to, so switching bets shows
  // "loading" instead of the previous bet's prices.
  const key = bet ? `${bet.id}:${question?.id ?? ''}` : '';
  const [result, setResult] = useState<{ key: string; state: PricedBetState } | null>(null);

  useEffect(() => {
    if (!bet) return;
    let cancelled = false;
    priceBet(bet, { question })
      .then((priced) => !cancelled && setResult({ key, state: { status: 'ready', priced } }))
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key, state: { status: 'error', message: message(error) } });
      });
    return () => {
      cancelled = true;
    };
  }, [bet, question, key]);

  if (!bet || result?.key !== key) return { status: 'loading' };
  return result.state;
}

/**
 * Prices several catalog bets for one question; states come back in the same
 * order as `betIds`. Takes ids (not objects) so the effect only re-runs when
 * the set of bets actually changes.
 */
export function usePricedBets(betIds: string[], questionId?: string): PricedBetState[] {
  const idsKey = betIds.join(',');
  const key = `${idsKey}:${questionId ?? ''}`;
  const [result, setResult] = useState<{ key: string; states: PricedBetState[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const question = questionId ? catalog.getEvent(questionId) : undefined;
    const bets = idsKey ? idsKey.split(',').map((id) => catalog.getBet(id)) : [];
    Promise.all(
      bets.map((bet): Promise<PricedBetState> =>
        bet
          ? priceBet(bet, { question }).then(
              (priced): PricedBetState => ({ status: 'ready', priced }),
              (error: unknown): PricedBetState => ({ status: 'error', message: message(error) }),
            )
          : Promise.resolve({ status: 'error', message: 'Unknown bet.' }),
      ),
    ).then((states) => {
      if (!cancelled) setResult({ key: `${idsKey}:${questionId ?? ''}`, states });
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey, questionId]);

  if (result?.key !== key) return betIds.map(() => ({ status: 'loading' }));
  return result.states;
}
