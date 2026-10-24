import { useEffect, useState } from 'react';

import type { EventQuestion, PredictionQuote } from '@/domain/types';
import { predictionMarkets } from '@/services/predictionMarkets';

export type PredictionQuotesState =
  | { status: 'loading' }
  | { status: 'ready'; quotes: PredictionQuote[] }
  | { status: 'error'; message: string };

/** Prediction-market quotes for a question, from the configured source. */
export function usePredictionQuotes(question: EventQuestion | undefined): PredictionQuotesState {
  const key = question?.id ?? '';
  const [result, setResult] = useState<{ key: string; state: PredictionQuotesState } | null>(null);

  useEffect(() => {
    if (!question) return;
    let cancelled = false;
    predictionMarkets
      .getQuotes(question)
      .then((quotes) => !cancelled && setResult({ key, state: { status: 'ready', quotes } }))
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key, state: { status: 'error', message: error instanceof Error ? error.message : String(error) } });
      });
    return () => {
      cancelled = true;
    };
  }, [question, key]);

  if (!question) return { status: 'ready', quotes: [] };
  if (result?.key !== key) return { status: 'loading' };
  return result.state;
}
