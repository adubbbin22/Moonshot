/// <reference types="node" />
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import type { ChainSnapshot, CompanySnapshot, PredictionMarketRef, PredictionQuote, ThesisTree, UnderlyingProfile } from '../src/domain/types';

/**
 * Minimal demo server speaking the protocols the app's proxy providers
 * expect (src/services/marketData/proxy.ts, src/services/intelligence/thesisDrafter.ts):
 *
 *   GET  /chains/{underlying}?minExpiration=YYYY-MM-DD  ->  ChainSnapshot JSON
 *   POST /thesis/draft  { belief }                       ->  { tree: ThesisTree }        (when a drafter is configured)
 *   POST /underlyings/draft  { symbol }                  ->  { profile: UnderlyingProfile }  (same; for editors, see draft-profile.ts)
 *   GET  /odds/{questionId}                              ->  { quotes: PredictionQuote[] }   (when an odds source is configured)
 *   GET  /odds/search?q=…                                ->  { markets: PredictionMarketRef[] }  (editors: find Polymarket slugs)
 *   GET  /company/{symbol}                               ->  { company: CompanySnapshot }    (when a company source is configured)
 *   GET  /health                                         ->  { ok: true, thesisDrafter: boolean }
 *
 * Chains are cached so a screen full of bets doesn't hammer the upstream.
 */

export type ChainLoader = (underlying: string, minExpiration: string) => Promise<ChainSnapshot>;
export type ThesisDrafter = (belief: string) => Promise<ThesisTree>;
export type ProfileDrafter = (symbol: string) => Promise<UnderlyingProfile>;
export type OddsSource = (questionId: string) => Promise<PredictionQuote[] | undefined>;
export type MarketSearch = (query: string) => Promise<PredictionMarketRef[]>;
export type CompanySource = (symbol: string) => Promise<CompanySnapshot>;

export interface ServerOptions {
  cacheTtlMs?: number;
  log?: (message: string) => void;
  /** Drafts a thesis tree from a belief. Absent when no model credentials are configured. */
  draftThesis?: ThesisDrafter;
  /** Drafts the catalyst map for a symbol, for editors to review. Absent when no model credentials are configured. */
  draftProfile?: ProfileDrafter;
  /** Prediction-market quotes for a question id; undefined for an unknown question. */
  oddsFor?: OddsSource;
  /** Finds prediction markets by text, for editors mapping questions. */
  searchMarkets?: MarketSearch;
  /** Company information and financials for a symbol. Absent when no source is configured. */
  companyFor?: CompanySource;
}

const MAX_BODY_BYTES = 4096;

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer | string) => {
      data += chunk;
      if (data.length > MAX_BODY_BYTES) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch {
        reject(new Error('Body is not JSON'));
      }
    });
    req.on('error', reject);
  });
}

const SYMBOL = /^[A-Z][A-Z.]{0,5}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    // The app may run in a browser on another port (Expo web), so allow any origin.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
  });
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

export function createMarketDataServer(loadChain: ChainLoader, options: ServerOptions = {}) {
  const { cacheTtlMs = 5 * 60 * 1000, log = () => {}, draftThesis, draftProfile, oddsFor, searchMarkets, companyFor } = options;
  const cache = new Map<string, { at: number; promise: Promise<ChainSnapshot> }>();

  function cachedChain(underlying: string, minExpiration: string): Promise<ChainSnapshot> {
    const key = `${underlying}:${minExpiration}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < cacheTtlMs) return hit.promise;
    const promise = loadChain(underlying, minExpiration);
    promise.catch(() => cache.delete(key));
    cache.set(key, { at: Date.now(), promise });
    return promise;
  }

  /** POST { [field]: string } → { [result]: await run(value) }, with rule breaks reported as 422. */
  async function handleDraft<T>(
    req: IncomingMessage,
    res: ServerResponse,
    field: string,
    result: string,
    run: ((value: string) => Promise<T>) | undefined,
  ) {
    if (!run) return send(res, 503, { error: 'Drafting is not configured on this server.' });
    let body: unknown;
    try {
      body = await readJson(req);
    } catch (error) {
      return send(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    const value = typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[field] : undefined;
    if (typeof value !== 'string') return send(res, 400, { error: `Expected { "${field}": "…" }` });
    try {
      const output = await run(value);
      log(`drafted ${field} "${value.slice(0, 60)}"`);
      return send(res, 200, { [result]: output });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const problems = (error as { problems?: string[] }).problems;
      log(`draft of ${field} "${value.slice(0, 60)}" failed: ${message}`);
      return send(res, 422, { error: message, ...(problems ? { problems } : {}) });
    }
  }

  async function handle(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'OPTIONS') return send(res, 204, null);
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/thesis/draft') {
      return req.method === 'POST' ? handleDraft(req, res, 'belief', 'tree', draftThesis) : send(res, 405, { error: 'Method not allowed' });
    }
    if (url.pathname === '/underlyings/draft') {
      return req.method === 'POST' ? handleDraft(req, res, 'symbol', 'profile', draftProfile) : send(res, 405, { error: 'Method not allowed' });
    }
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

    if (url.pathname === '/health') return send(res, 200, { ok: true, thesisDrafter: Boolean(draftThesis) });

    if (url.pathname === '/odds/search') {
      if (!searchMarkets) return send(res, 503, { error: 'Market search is not configured on this server.' });
      const q = url.searchParams.get('q')?.trim() ?? '';
      if (!q) return send(res, 400, { error: 'Expected /odds/search?q=…' });
      try {
        return send(res, 200, { markets: await searchMarkets(q) });
      } catch (error) {
        return send(res, 502, { error: error instanceof Error ? error.message : String(error) });
      }
    }
    const odds = /^\/odds\/([^/]+)$/.exec(url.pathname);
    if (odds) {
      if (!oddsFor) return send(res, 503, { error: 'Prediction-market odds are not configured on this server.' });
      const quotes = await oddsFor(decodeURIComponent(odds[1]));
      if (!quotes) return send(res, 404, { error: 'Unknown question' });
      return send(res, 200, { quotes });
    }

    const company = /^\/company\/([^/]+)$/.exec(url.pathname);
    if (company) {
      if (!companyFor) return send(res, 503, { error: 'Company information is not configured on this server.' });
      const symbol = decodeURIComponent(company[1]).toUpperCase();
      if (!SYMBOL.test(symbol)) return send(res, 400, { error: 'Expected /company/{SYMBOL}' });
      try {
        const snapshot = await companyFor(symbol);
        log(`${symbol} company snapshot`);
        return send(res, 200, { company: snapshot });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`${symbol} company failed: ${message}`);
        return send(res, 502, { error: message });
      }
    }

    const match = /^\/chains\/([^/]+)$/.exec(url.pathname);
    if (!match) return send(res, 404, { error: 'Not found' });

    const underlying = decodeURIComponent(match[1]).toUpperCase();
    const minExpiration = url.searchParams.get('minExpiration') ?? '';
    if (!SYMBOL.test(underlying) || !DATE.test(minExpiration)) {
      return send(res, 400, { error: 'Expected /chains/{SYMBOL}?minExpiration=YYYY-MM-DD' });
    }

    try {
      const chain = await cachedChain(underlying, minExpiration);
      log(`${underlying} ≥${minExpiration} → ${chain.expiration}, ${chain.contracts.length} contracts`);
      return send(res, 200, chain);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`${underlying} ≥${minExpiration} failed: ${message}`);
      return send(res, 502, { error: message });
    }
  }

  return createServer((req, res) => {
    handle(req, res).catch((error) => send(res, 500, { error: String(error) }));
  });
}
