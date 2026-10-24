import { buildTakeProfile, type TakeProfile } from '@/domain/takeProfile';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';

/** The current user's take profile, derived from their calls and skips. */
export function useTakeProfile(): TakeProfile {
  const { calls, skips, seedTopics } = useAppState();
  return buildTakeProfile(calls, skips, seedTopics, catalog.listEvents());
}
