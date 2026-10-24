import { useEffect, useState } from 'react';

import type { CompanySnapshot } from '@/domain/types';
import { fundamentals } from '@/services/fundamentals';

export type CompanyState =
  | { status: 'loading' }
  | { status: 'ready'; company: CompanySnapshot | undefined }
  | { status: 'error'; message: string };

/** Company information and financials for a symbol, from the configured source. */
export function useCompany(symbol: string | undefined): CompanyState {
  const key = symbol ?? '';
  const [result, setResult] = useState<{ key: string; state: CompanyState } | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    fundamentals
      .getCompany(symbol)
      .then((company) => !cancelled && setResult({ key, state: { status: 'ready', company } }))
      .catch((error: unknown) => {
        if (!cancelled) setResult({ key, state: { status: 'error', message: error instanceof Error ? error.message : String(error) } });
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, key]);

  if (!symbol) return { status: 'ready', company: undefined };
  if (result?.key !== key) return { status: 'loading' };
  return result.state;
}
