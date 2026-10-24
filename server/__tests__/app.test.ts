/**
 * @jest-environment node
 */
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';

import { createMarketDataServer, type ChainLoader } from '../app';
import type { ChainSnapshot } from '@/domain/types';

const chain: ChainSnapshot = {
  underlying: 'NVDA',
  spot: 181.25,
  asOf: '2026-10-23T20:00:00.000Z',
  expiration: '2027-12-17',
  contracts: [],
  source: 'test',
};

function get(port: number, path: string, method = 'GET'): Promise<{ status: number; headers: Record<string, unknown>; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function start(loader: ChainLoader) {
  const server = createMarketDataServer(loader);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, port: (server.address() as AddressInfo).port };
}

describe('market data server', () => {
  it('serves chains with CORS headers and caches repeat requests', async () => {
    const loader = jest.fn(async () => chain);
    const { server, port } = await start(loader);
    try {
      const first = await get(port, '/chains/nvda?minExpiration=2027-12-01');
      expect(first.status).toBe(200);
      expect(first.body).toEqual(chain);
      expect(first.headers['access-control-allow-origin']).toBe('*');
      await get(port, '/chains/NVDA?minExpiration=2027-12-01');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(loader).toHaveBeenCalledWith('NVDA', '2027-12-01');
    } finally {
      server.close();
    }
  });

  it('rejects bad input, reports upstream failures, and answers health and preflight', async () => {
    const loader = jest.fn(async () => {
      throw new Error('Too Many Requests');
    });
    const { server, port } = await start(loader);
    try {
      expect((await get(port, '/chains/NVDA')).status).toBe(400);
      expect((await get(port, '/chains/not%20a%20symbol?minExpiration=2027-12-01')).status).toBe(400);
      expect(await get(port, '/chains/NVDA?minExpiration=2027-12-01')).toMatchObject({
        status: 502,
        body: { error: 'Too Many Requests' },
      });
      // Failures aren't cached.
      await get(port, '/chains/NVDA?minExpiration=2027-12-01');
      expect(loader).toHaveBeenCalledTimes(2);
      expect((await get(port, '/health')).body).toEqual({ ok: true, thesisDrafter: false });
      expect((await get(port, '/chains/NVDA', 'OPTIONS')).status).toBe(204);
      expect((await get(port, '/nope')).status).toBe(404);
    } finally {
      server.close();
    }
  });
});

describe('thesis drafting route', () => {
  const tree = { id: 'draft-1', title: 'T' };

  function post(port: number, body: string): Promise<{ status: number; body: unknown }> {
    return new Promise((resolve, reject) => {
      const req = request(
        { host: '127.0.0.1', port, path: '/thesis/draft', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data ? JSON.parse(data) : null }));
        },
      );
      req.on('error', reject);
      req.end(body);
    });
  }

  it('says so when no drafter is configured', async () => {
    const { server, port } = await start(async () => chain);
    expect((await get(port, '/health')).body).toEqual({ ok: true, thesisDrafter: false });
    expect((await post(port, '{"belief":"x"}')).status).toBe(503);
    server.close();
  });

  it('drafts a tree, and reports rule breaks and bad bodies', async () => {
    const draftThesis = jest.fn(async (belief: string) => {
      if (belief === 'bad') throw Object.assign(new Error('The draft broke the rules twice.'), { problems: ['premises[0].why: names a security (NVDA)'] });
      return tree as never;
    });
    const server = createMarketDataServer(async () => chain, { draftThesis });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;

    expect((await get(port, '/health')).body).toEqual({ ok: true, thesisDrafter: true });
    expect(await post(port, '{"belief":"AI agents take over support"}')).toEqual({ status: 200, body: { tree } });
    expect(draftThesis).toHaveBeenCalledWith('AI agents take over support');
    expect(await post(port, '{"belief":"bad"}')).toEqual({
      status: 422,
      body: { error: 'The draft broke the rules twice.', problems: ['premises[0].why: names a security (NVDA)'] },
    });
    expect((await post(port, '{"nope":1}')).status).toBe(400);
    expect((await post(port, 'not json')).status).toBe(400);
    expect((await get(port, '/thesis/draft')).status).toBe(405);
    server.close();
  });

  it('serves prediction-market odds and market search', async () => {
    const quotes = [{ venue: 'kalshi', id: 'X', title: 'X', url: '', yes: 0.6, asOf: 't', basis: 'live' }];
    const server = createMarketDataServer(async () => chain, {
      oddsFor: async (id) => (id === 'known' ? (quotes as never) : undefined),
      searchMarkets: async (q) => [{ venue: 'polymarket', id: q, title: q, url: '' }],
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    expect(await get(port, '/odds/known')).toMatchObject({ status: 200, body: { quotes } });
    expect((await get(port, '/odds/unknown')).status).toBe(404);
    expect(await get(port, '/odds/search?q=hormuz')).toMatchObject({ status: 200, body: { markets: [{ id: 'hormuz' }] } });
    expect((await get(port, '/odds/search')).status).toBe(400);
    server.close();

    const bare = await start(async () => chain);
    expect((await get(bare.port, '/odds/known')).status).toBe(503);
    bare.server.close();
  });

  it('drafts a profile for editors on its own route', async () => {
    const profile = { symbol: 'AMD', name: 'AMD' };
    const draftProfile = jest.fn(async () => profile as never);
    const server = createMarketDataServer(async () => chain, { draftProfile });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    const req = (body: string) =>
      new Promise<{ status: number; body: unknown }>((resolve, reject) => {
        const r = request({ host: '127.0.0.1', port, path: '/underlyings/draft', method: 'POST' }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data ? JSON.parse(data) : null }));
        });
        r.on('error', reject);
        r.end(body);
      });
    expect(await req('{"symbol":"AMD"}')).toEqual({ status: 200, body: { profile } });
    expect(draftProfile).toHaveBeenCalledWith('AMD');
    expect((await req('{"belief":"x"}')).status).toBe(400);
    expect((await post(port, '{"belief":"x"}')).status).toBe(503);
    server.close();
  });
});

describe('company information', () => {
  async function startWith(options: Parameters<typeof createMarketDataServer>[1]) {
    const server = createMarketDataServer(async () => chain, options);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    return { server, port: (server.address() as AddressInfo).port };
  }
  const snapshot = {
    symbol: 'NVDA',
    name: 'NVIDIA',
    asOf: '2026-10-24T15:00:00.000Z',
    basis: 'live' as const,
    source: 'test',
    about: { description: 'Chips.' },
  };

  it('serves a snapshot, validates the symbol and reports upstream failures', async () => {
    const companyFor = jest.fn(async (symbol: string) => {
      if (symbol === 'BAD') throw new Error('upstream down');
      return snapshot;
    });
    const { server, port } = await startWith({ companyFor });
    try {
      const ok = await get(port, '/company/nvda');
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({ company: snapshot });
      expect(companyFor).toHaveBeenCalledWith('NVDA');
      expect((await get(port, '/company/not-a-symbol')).status).toBe(400);
      expect((await get(port, '/company/BAD')).status).toBe(502);
    } finally {
      server.close();
    }
  });

  it('answers 503 when no source is configured', async () => {
    const { server, port } = await startWith({});
    try {
      expect((await get(port, '/company/NVDA')).status).toBe(503);
    } finally {
      server.close();
    }
  });
});
