import { useEffect, useState } from 'react';

import { laterExpirationFloors } from '@/domain/expiry';
import type { PricedStrategy } from '@/domain/strategy';
import type { Bet, EventQuestion } from '@/domain/types';
import { priceBet } from '@/services/pricing';

export interface ExpirationsState {
  /** The bet priced on each expiration it can be taken at, earliest first. The first is the default. */
  options: PricedStrategy[];
  loading: boolean;
}

/**
 * The same bet on later expirations. Starting from the default (the earliest
 * the horizon guard allows), asks the market for the next listed expiration
 * and a couple further out, each priced in full. Earlier expirations are
 * never offered: they would end before the bet's horizon or the question.
 */
export function useExpirations(bet: Bet | undefined, question: EventQuestion | undefined, first: PricedStrategy | undefined): ExpirationsState {
  const key = bet && first ? `${bet.id}:${question?.id ?? ''}:${first.expiration}` : '';
  const [result, setResult] = useState<{ key: string; later: PricedStrategy[] } | null>(null);

  useEffect(() => {
    if (!bet || !first) return;
    let cancelled = false;
    (async () => {
      const later: PricedStrategy[] = [];
      for (const floor of laterExpirationFloors(first.expiration)) {
        const last = later[later.length - 1]?.expiration ?? first.expiration;
        if (floor <= last) continue; // this floor is already covered by what we have
        try {
          const priced = await priceBet(bet, { question, minExpiration: floor });
          if (priced.expiration <= last) break; // the market has nothing later
          later.push(priced);
        } catch {
          break;
        }
      }
      if (!cancelled) setResult({ key, later });
    })();
    return () => {
      cancelled = true;
    };
  }, [bet, question, first, key]);

  if (!first) return { options: [], loading: false };
  if (result?.key !== key) return { options: [first], loading: true };
  return { options: [first, ...result.later], loading: false };
}
