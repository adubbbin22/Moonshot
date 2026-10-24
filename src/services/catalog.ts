import { BETS } from '@/data/bets';
import { EVENTS } from '@/data/events';
import { MECHANISMS } from '@/data/mechanisms';
import { THESES } from '@/data/theses';
import { UNDERLYINGS } from '@/data/underlyings';
import { createLinkResolver } from '@/domain/catalysts';
import { ladder, parseShapeId, shapedBet } from '@/domain/structures';
import { resolveMechanisms, type LinkResolver } from '@/domain/thesisDraft';
import type { Bet, EventQuestion, Mechanism, ThesisTree, UnderlyingProfile } from '@/domain/types';

/**
 * Read-only content: the event feed, thesis trees, the mechanism library,
 * the underlying profiles (what each security is and what moves it) and bets.
 *
 * Backed by bundled sample data for now. When the backend exists, swap these
 * for API calls behind a cache (e.g. TanStack Query) and keep the screens on
 * the same function names.
 */

const betsById = new Map(BETS.map((b) => [b.id, b]));
const eventsById = new Map(EVENTS.map((e) => [e.id, e]));
const underlyingsBySymbol = new Map(UNDERLYINGS.map((u) => [u.symbol, u]));
// Trees reach bets only through mechanisms → catalysts → direction; resolve once here.
const linksFor: LinkResolver = createLinkResolver(MECHANISMS, UNDERLYINGS, BETS);
const theses = THESES.map((t) => resolveMechanisms(t, linksFor));
const thesesById = new Map(theses.map((t) => [t.id, t]));

export const catalog = {
  listEvents: (): EventQuestion[] => EVENTS,
  getEvent: (id: string): EventQuestion | undefined => eventsById.get(id),
  listTheses: (): ThesisTree[] => theses,
  getThesis: (id: string): ThesisTree | undefined => thesesById.get(id),
  listMechanisms: (): Mechanism[] => MECHANISMS,
  /** The bets a mechanism leads to, through the catalysts it names. */
  mechanismLinks: linksFor,
  listUnderlyings: (): UnderlyingProfile[] => UNDERLYINGS,
  getUnderlying: (symbol: string): UnderlyingProfile | undefined => underlyingsBySymbol.get(symbol),
  /** Base templates only; each has a ladder of shapes (see ladderFor). */
  listBets: (): Bet[] => BETS,
  /** A base bet, or one of its shapes by id ("oil-calls~aggressive"). */
  getBet: (id: string): Bet | undefined => {
    const base = betsById.get(id);
    if (base) return base;
    const { baseId, shape } = parseShapeId(id);
    const root = betsById.get(baseId);
    return root && shape ? shapedBet(root, shape) : undefined;
  },
  /** Every shape of a bet's idea, the base first. */
  ladderFor: (bet: Bet): Bet[] => {
    const base = bet.shape ? betsById.get(bet.shape.baseId) : bet;
    return base ? ladder(base) : [bet];
  },
};
