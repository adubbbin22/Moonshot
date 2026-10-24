/// <reference types="node" />
import { networkInterfaces } from 'node:os';

import YahooFinance from 'yahoo-finance2';

import { createMarketDataServer } from './app';
import { createYahooChainSource, type YahooOptionsResult } from './yahoo';

/**
 * Demo market data server backed by Yahoo Finance.
 *
 *   npm run market-data
 *
 * Run it on your own machine (Yahoo blocks most cloud IPs) and start the app
 * with EXPO_PUBLIC_MARKET_DATA=yahoo. Not for production: see docs/DATA.md.
 */

const port = Number(process.env.PORT ?? 8787);
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const loadChain = createYahooChainSource(async (symbol, date) => {
  try {
    return (await yahooFinance.options(symbol, date ? { date } : {})) as YahooOptionsResult;
  } catch (error) {
    // Network failures surface as a bare "fetch failed"; say what actually broke.
    const cause = (error as { cause?: { code?: string; message?: string } }).cause;
    const detail = cause?.code ?? cause?.message ?? (error instanceof Error ? error.message : String(error));
    throw new Error(`Yahoo Finance request for ${symbol} failed (${detail}).`);
  }
});

const server = createMarketDataServer(loadChain, {
  log: (message) => console.log(`[${new Date().toLocaleTimeString()}] ${message}`),
});

server.listen(port, '0.0.0.0', () => {
  const lanAddresses = Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => `http://${a!.address}:${port}`);
  console.log(`Moonshot demo market data (Yahoo Finance) on http://localhost:${port}`);
  if (lanAddresses.length > 0) console.log(`On your network: ${lanAddresses.join(', ')}`);
  console.log(`Try: http://localhost:${port}/chains/NVDA?minExpiration=2027-12-01`);
});
