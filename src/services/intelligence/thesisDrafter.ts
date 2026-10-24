import { DRAFT_FIXTURE } from '@/data/draftFixture';
import { toThesisTree, validateDraft } from '@/domain/thesisDraft';
import type { ThesisTree } from '@/domain/types';
import { catalog } from '@/services/catalog';
import { demoServerUrl } from '@/services/demoServer';
import { CATEGORY_EMOJI } from '@/theme/categories';

/**
 * Drafts a thesis tree from a belief in the user's own words.
 *
 * The LLM never runs in the app. The production path is our backend
 * (server/thesis.ts shows the shape): it holds the model credentials, runs
 * the draft and review passes, enforces the firewall in
 * src/domain/thesisDraft.ts, and logs every model output. The app receives a
 * finished tree, the same shape as a curated one, with provenance attached.
 */
export interface ThesisDrafter {
  readonly id: 'off' | 'fixture' | 'proxy';
  readonly label: string;
  draft(belief: string): Promise<ThesisTree>;
}

export class DrafterError extends Error {
  constructor(
    message: string,
    readonly problems: string[] = [],
  ) {
    super(message);
    this.name = 'DrafterError';
  }
}

/** The default: drafting isn't available, so the screens don't offer it. */
export const offDrafter: ThesisDrafter = {
  id: 'off',
  label: 'Off',
  async draft() {
    throw new DrafterError('Thesis drafting is turned off in this build.');
  },
};

/** Our backend: POST {baseUrl}/thesis/draft { belief } → { tree }. */
export function createProxyDrafter(baseUrl: string, fetchImpl: typeof fetch = fetch): ThesisDrafter {
  return {
    id: 'proxy',
    label: 'Moonshot',
    async draft(belief) {
      const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/thesis/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ belief }),
      });
      const body = (await response.json().catch(() => null)) as { tree?: ThesisTree; error?: string; problems?: string[] } | null;
      if (!response.ok || !body?.tree) {
        throw new DrafterError(body?.error ?? `Drafting failed (${response.status}).`, body?.problems ?? []);
      }
      return body.tree;
    },
  };
}

/**
 * Demo and tests: a canned draft, run through the same validation as a real
 * one. It shows the sample tree whatever belief is typed.
 */
export function createFixtureDrafter(delayMs = 1200, now: () => Date = () => new Date()): ThesisDrafter {
  return {
    id: 'fixture',
    label: 'Sample (demo)',
    async draft(belief) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const result = validateDraft(DRAFT_FIXTURE, {
        mechanismIds: new Set(catalog.listMechanisms().map((m) => m.id)),
        questionIds: new Set(catalog.listEvents().map((q) => q.id)),
        securities: catalog.listBets().flatMap((b) => [b.strategy.underlying, b.strategy.underlyingName]),
      });
      if (!result.ok) throw new DrafterError('The sample draft is invalid.', result.problems);
      const draftedAt = now().toISOString();
      return toThesisTree(result.draft, {
        id: `draft-fixture-${draftedAt.replace(/\D/g, '').slice(0, 14)}`,
        emoji: CATEGORY_EMOJI[result.draft.category],
        provenance: { kind: 'drafted', prompt: belief.trim(), model: 'fixture', draftedAt },
        mechanisms: catalog.mechanismsById(),
      });
    },
  };
}

/**
 * Picks the drafter from EXPO_PUBLIC_INTELLIGENCE (see .env.example):
 * - "off" (default): the screens don't offer drafting.
 * - "fixture": the canned draft, for demos without a backend.
 * - "proxy": our backend at EXPO_PUBLIC_INTELLIGENCE_URL, or the local demo server.
 */
function createDrafter(): ThesisDrafter {
  const choice = process.env.EXPO_PUBLIC_INTELLIGENCE ?? 'off';
  if (choice === 'fixture') return createFixtureDrafter();
  if (choice === 'proxy') return createProxyDrafter(process.env.EXPO_PUBLIC_INTELLIGENCE_URL || demoServerUrl());
  return offDrafter;
}

export const thesisDrafter: ThesisDrafter = createDrafter();
