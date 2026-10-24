import { useEffect, useState } from 'react';

import type { PricedStrategy } from '@/domain/strategy';
import type { Bet } from '@/domain/types';
import { priceBet } from '@/services/pricing';

export type PricedBetState =
  | { status: 'loading' }
  | { status: 'ready'; priced: PricedStrategy }
  | { status: 'error'; message: string };

/** Live pricing for a bet from the configured market data provider. */
export function usePricedBet(bet: Bet | undefined): PricedBetState {
  // Results are tagged with the bet they belong to, so switching bets shows
  // "loading" instead of the previous bet's prices.
  const [result, setResult] = useState<{ betId: string; state: PricedBetState } | null>(null);

  useEffect(() => {
    if (!bet) return;
    let cancelled = false;
    priceBet(bet)
      .then((priced) => {
        if (!cancelled) setResult({ betId: bet.id, state: { status: 'ready', priced } });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!cancelled) setResult({ betId: bet.id, state: { status: 'error', message } });
      });
    return () => {
      cancelled = true;
    };
  }, [bet]);

  if (!bet || result?.betId !== bet.id) return { status: 'loading' };
  return result.state;
}
