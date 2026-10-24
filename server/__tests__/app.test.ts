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
      expect((await get(port, '/health')).body).toEqual({ ok: true });
      expect((await get(port, '/chains/NVDA', 'OPTIONS')).status).toBe(204);
      expect((await get(port, '/nope')).status).toBe(404);
    } finally {
      server.close();
    }
  });
});
