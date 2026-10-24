import { useEffect, useState } from 'react';

import { buildTakeProfile } from '@/domain/takeProfile';
import { catalog } from '@/services/catalog';
import { narrator } from '@/services/intelligence/narrator';
import { useAppState } from '@/state/store';

/** Plain-English summary of the user's take profile from the narrator service. */
export function useNarrative(): string | null {
  const { calls, skips, seedTopics } = useAppState();
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const profile = buildTakeProfile(calls, skips, seedTopics, catalog.listEvents());
    narrator.describe(profile).then(
      (description) => !cancelled && setText(description),
      () => !cancelled && setText(null),
    );
    return () => {
      cancelled = true;
    };
  }, [calls, skips, seedTopics]);

  return text;
}
