import { BETS } from '@/data/bets';
import { EVENTS } from '@/data/events';
import { MECHANISMS } from '@/data/mechanisms';
import { THESES } from '@/data/theses';
import { resolveMechanisms } from '@/domain/thesisDraft';
import type { Bet, EventQuestion, Mechanism, ThesisTree } from '@/domain/types';

/**
 * Read-only content: the event feed, thesis trees, the mechanism library and bets.
 *
 * Backed by bundled sample data for now. When the backend exists, swap these
 * for API calls behind a cache (e.g. TanStack Query) and keep the screens on
 * the same function names.
 */

const betsById = new Map(BETS.map((b) => [b.id, b]));
const eventsById = new Map(EVENTS.map((e) => [e.id, e]));
const mechanismsById = new Map(MECHANISMS.map((m) => [m.id, m]));
// Trees reach bets only through mechanisms; resolve them once here.
const theses = THESES.map((t) => resolveMechanisms(t, mechanismsById));
const thesesById = new Map(theses.map((t) => [t.id, t]));

export const catalog = {
  listEvents: (): EventQuestion[] => EVENTS,
  getEvent: (id: string): EventQuestion | undefined => eventsById.get(id),
  listTheses: (): ThesisTree[] => theses,
  getThesis: (id: string): ThesisTree | undefined => thesesById.get(id),
  listMechanisms: (): Mechanism[] => MECHANISMS,
  mechanismsById: (): Map<string, Mechanism> => mechanismsById,
  listBets: (): Bet[] => BETS,
  getBet: (id: string): Bet | undefined => betsById.get(id),
};
