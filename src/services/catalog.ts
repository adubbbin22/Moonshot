import { BETS } from '@/data/bets';
import { EVENTS } from '@/data/events';
import { THESES } from '@/data/theses';
import type { Bet, EventQuestion, ThesisTree } from '@/domain/types';

/**
 * Read-only content: the event feed, thesis trees and bets.
 *
 * Backed by bundled sample data for now. When the backend exists, swap these
 * for API calls behind a cache (e.g. TanStack Query) and keep the screens on
 * the same function names.
 */

const betsById = new Map(BETS.map((b) => [b.id, b]));
const eventsById = new Map(EVENTS.map((e) => [e.id, e]));
const thesesById = new Map(THESES.map((t) => [t.id, t]));

export const catalog = {
  listEvents: (): EventQuestion[] => EVENTS,
  getEvent: (id: string): EventQuestion | undefined => eventsById.get(id),
  listTheses: (): ThesisTree[] => THESES,
  getThesis: (id: string): ThesisTree | undefined => thesesById.get(id),
  listBets: (): Bet[] => BETS,
  getBet: (id: string): Bet | undefined => betsById.get(id),
};
