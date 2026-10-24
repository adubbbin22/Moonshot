/// <reference types="node" />
import type { EventQuestion, PredictionMarketRef, PredictionQuote } from '../src/domain/types';

/**
 * Prediction-market quotes for the demo server, from the venues' public
 * market-data endpoints. The app never calls a venue; it asks us.
 *
 *   Polymarket: Gamma API, GET /markets?slug={slug}
 *   Kalshi:     trade API v2, GET /markets/{ticker}
 *
 * Written against the venues' documented responses; the shapes are checked
 * with fixtures in __tests__, and a venue that changes its API fails for
 * that venue only. Quotes are cached briefly so a screen doesn't hammer them.
 */

export const POLYMARKET_API = 'https://gamma-api.polymarket.com';
export const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

export type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

async function getJson(fetchImpl: FetchLike, url: string): Promise<unknown> {
  const response = await fetchImpl(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return response.json();
}

interface GammaMarket {
  question?: string;
  slug?: string;
  /** JSON-encoded arrays, e.g. '["Yes","No"]' and '["0.71","0.29"]'. */
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  closed?: boolean;
}

const asArray = (v: string | string[] | undefined): string[] => (typeof v === 'string' ? (JSON.parse(v) as string[]) : (v ?? []));

/** Polymarket's price of YES for a market slug. */
export async function fetchPolymarket(slug: string, fetchImpl: FetchLike): Promise<{ yes: number; title: string }> {
  const body = (await getJson(fetchImpl, `${POLYMARKET_API}/markets?slug=${encodeURIComponent(slug)}`)) as GammaMarket[] | GammaMarket;
  const market = Array.isArray(body) ? body[0] : body;
  if (!market) throw new Error(`Polymarket: no market with slug ${slug}`);
  const outcomes = asArray(market.outcomes);
  const prices = asArray(market.outcomePrices).map(Number);
  const yesIndex = outcomes.findIndex((o) => o.toLowerCase() === 'yes');
  const yes = prices[yesIndex === -1 ? 0 : yesIndex];
  if (!Number.isFinite(yes)) throw new Error(`Polymarket: no price for ${slug}`);
  return { yes, title: market.question ?? slug };
}

interface KalshiMarket {
  market?: { title?: string; yes_bid?: number; yes_ask?: number; last_price?: number };
}

/** Kalshi's price of YES for a market ticker, in cents on the wire. Mid of the book, else the last trade. */
export async function fetchKalshi(ticker: string, fetchImpl: FetchLike): Promise<{ yes: number; title: string }> {
  const body = (await getJson(fetchImpl, `${KALSHI_API}/markets/${encodeURIComponent(ticker)}`)) as KalshiMarket;
  const m = body.market;
  if (!m) throw new Error(`Kalshi: no market ${ticker}`);
  const twoSided = m.yes_bid !== undefined && m.yes_ask !== undefined && m.yes_bid > 0 && m.yes_ask >= m.yes_bid;
  const centsPrice = twoSided ? (m.yes_bid! + m.yes_ask!) / 2 : m.last_price;
  if (centsPrice === undefined || !Number.isFinite(centsPrice)) throw new Error(`Kalshi: no price for ${ticker}`);
  return { yes: centsPrice / 100, title: m.title ?? ticker };
}

export interface OddsSourceOptions {
  cacheTtlMs?: number;
  now?: () => Date;
  log?: (message: string) => void;
}

/** Quotes for every market listed on a question. A venue that fails is left out, not fatal. */
export function createOddsSource(fetchImpl: FetchLike, options: OddsSourceOptions = {}) {
  const { cacheTtlMs = 60 * 1000, now = () => new Date(), log = () => {} } = options;
  const cache = new Map<string, { at: number; quote: PredictionQuote }>();

  async function quoteFor(ref: PredictionMarketRef): Promise<PredictionQuote | undefined> {
    const key = `${ref.venue}:${ref.id}`;
    const hit = cache.get(key);
    if (hit && now().getTime() - hit.at < cacheTtlMs) return hit.quote;
    try {
      const { yes, title } = ref.venue === 'kalshi' ? await fetchKalshi(ref.id, fetchImpl) : await fetchPolymarket(ref.id, fetchImpl);
      const quote: PredictionQuote = { ...ref, title, yes, asOf: now().toISOString(), basis: 'live' };
      cache.set(key, { at: now().getTime(), quote });
      return quote;
    } catch (error) {
      log(`${key} failed: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  return async (question: Pick<EventQuestion, 'id' | 'markets'>): Promise<PredictionQuote[]> => {
    const quotes = await Promise.all((question.markets ?? []).map(quoteFor));
    return quotes.filter((q): q is PredictionQuote => q !== undefined);
  };
}

interface GammaSearch {
  events?: { slug?: string; title?: string; markets?: { slug?: string; question?: string }[] }[];
}

/**
 * Helps an editor find the Polymarket market for a question. Best effort:
 * Gamma's public search. Kalshi has no text search in its public API, so
 * find tickers on kalshi.com and paste them.
 */
export async function searchPolymarket(query: string, fetchImpl: FetchLike): Promise<PredictionMarketRef[]> {
  const body = (await getJson(fetchImpl, `${POLYMARKET_API}/public-search?q=${encodeURIComponent(query)}&limit_per_type=5`)) as GammaSearch;
  return (body.events ?? []).flatMap((event) =>
    (event.markets ?? []).flatMap((m) =>
      m.slug
        ? [{ venue: 'polymarket' as const, id: m.slug, title: m.question ?? event.title ?? m.slug, url: `https://polymarket.com/event/${event.slug ?? m.slug}` }]
        : [],
    ),
  );
}
