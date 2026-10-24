/// <reference types="node" />
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import type { ChainSnapshot } from '../src/domain/types';

/**
 * Minimal market data server speaking the protocol the app's proxy provider
 * expects (src/services/marketData/proxy.ts):
 *
 *   GET /chains/{underlying}?minExpiration=YYYY-MM-DD  ->  ChainSnapshot JSON
 *   GET /health                                        ->  { ok: true }
 *
 * Chains are cached so a screen full of bets doesn't hammer the upstream.
 */

export type ChainLoader = (underlying: string, minExpiration: string) => Promise<ChainSnapshot>;

export interface ServerOptions {
  cacheTtlMs?: number;
  log?: (message: string) => void;
}

const SYMBOL = /^[A-Z][A-Z.]{0,5}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    // The app may run in a browser on another port (Expo web), so allow any origin.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
  });
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

export function createMarketDataServer(loadChain: ChainLoader, options: ServerOptions = {}) {
  const { cacheTtlMs = 5 * 60 * 1000, log = () => {} } = options;
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

  async function handle(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'OPTIONS') return send(res, 204, null);
    if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

    const url = new URL(req.url ?? '/', 'http://localhost');
    if (url.pathname === '/health') return send(res, 200, { ok: true });

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
