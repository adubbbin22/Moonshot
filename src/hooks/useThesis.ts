import type { ThesisTree } from '@/domain/types';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';

/** Every thesis the user can open: the curated trees, then the ones drafted from their own beliefs. */
export function useTheses(): ThesisTree[] {
  const { draftedTheses } = useAppState();
  return [...catalog.listTheses(), ...Object.values(draftedTheses)];
}

/** One thesis by id, curated or drafted. */
export function useThesis(id: string | undefined): ThesisTree | undefined {
  const { draftedTheses } = useAppState();
  if (!id) return undefined;
  return catalog.getThesis(id) ?? draftedTheses[id];
}
