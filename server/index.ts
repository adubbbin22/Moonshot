/// <reference types="node" />
import { appendFileSync, mkdirSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';

import Anthropic from '@anthropic-ai/sdk';
import YahooFinance from 'yahoo-finance2';

import { createMarketDataServer } from './app';
import { createCompanySource, SUMMARY_MODULES } from './fundamentals';
import { createOddsSource, searchPolymarket } from './predictionMarkets';
import { draftProfile } from './profile';
import { draftThesis } from './thesis';
import { createYahooChainSource, type YahooOptionsResult } from './yahoo';
import { BETS } from '../src/data/bets';
import { EVENTS } from '../src/data/events';
import { MECHANISMS } from '../src/data/mechanisms';
import { UNDERLYINGS } from '../src/data/underlyings';
import { createLinkResolver } from '../src/domain/catalysts';

/**
 * Demo server: market data from Yahoo Finance, and thesis drafting with Claude.
 *
 *   npm run market-data
 *
 * Run it on your own machine (Yahoo blocks most cloud IPs) and start the app
 * with EXPO_PUBLIC_MARKET_DATA=yahoo. Not for production: see docs/DATA.md.
 *
 * Thesis drafting turns on when the Anthropic SDK finds credentials
 * (ANTHROPIC_API_KEY, or a profile from `ant auth login`); start the app with
 * EXPO_PUBLIC_INTELLIGENCE=proxy. Every model output is appended to
 * server/logs/*.jsonl, the audit log the firewall calls for. Drafting the
 * framework for a new symbol is for editors: see draft-profile.ts.
 */

const port = Number(process.env.PORT ?? 8787);
const log = (message: string) => console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
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

const hasModelCredentials = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_PROFILE);
const auditDir = join(__dirname, 'logs');
const draftCatalog = {
  questions: EVENTS,
  mechanisms: MECHANISMS,
  securities: BETS.flatMap((b) => [b.strategy.underlying, b.strategy.underlyingName]),
  linksFor: createLinkResolver(MECHANISMS, UNDERLYINGS, BETS),
};
let anthropic: Anthropic | undefined;
const eventsById = new Map(EVENTS.map((e) => [e.id, e]));
const oddsSource = createOddsSource((url, init) => fetch(url, init), { log });
const companyFor = createCompanySource((symbol) => yahooFinance.quoteSummary(symbol, { modules: [...SUMMARY_MODULES] }));

const audit = (file: string) => (record: object) => {
  mkdirSync(auditDir, { recursive: true });
  appendFileSync(join(auditDir, file), `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`);
};

const server = createMarketDataServer(loadChain, {
  log,
  draftThesis: hasModelCredentials
    ? (belief) => {
        anthropic ??= new Anthropic();
        return draftThesis(anthropic, belief, draftCatalog, { audit: audit('thesis-drafts.jsonl') });
      }
    : undefined,
  draftProfile: hasModelCredentials
    ? (symbol) => {
        anthropic ??= new Anthropic();
        return draftProfile(anthropic, symbol, { questions: EVENTS }, { audit: audit('profile-drafts.jsonl') });
      }
    : undefined,
  oddsFor: async (questionId) => {
    const question = eventsById.get(questionId);
    return question ? oddsSource(question) : undefined;
  },
  searchMarkets: (q) => searchPolymarket(q, (url, init) => fetch(url, init)),
  companyFor,
});

server.listen(port, '0.0.0.0', () => {
  const lanAddresses = Object.values(networkInterfaces())
    .flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal)
    .map((a) => `http://${a!.address}:${port}`);
  console.log(`Moonshot demo market data (Yahoo Finance) on http://localhost:${port}`);
  if (lanAddresses.length > 0) console.log(`On your network: ${lanAddresses.join(', ')}`);
  console.log(`Try: http://localhost:${port}/chains/NVDA?minExpiration=2027-12-01`);
  console.log('Company information: GET /company/{SYMBOL} (Yahoo Finance quote summary). Start the app with EXPO_PUBLIC_FUNDAMENTALS=proxy.');
  console.log('Prediction-market odds: GET /odds/{questionId} for questions with `markets` in src/data/events.ts; find Polymarket slugs with /odds/search?q=…');
  console.log(
    hasModelCredentials
      ? 'Drafting: on (POST /thesis/draft, POST /underlyings/draft). Start the app with EXPO_PUBLIC_INTELLIGENCE=proxy.'
      : 'Thesis drafting: off. Set ANTHROPIC_API_KEY (or run `ant auth login`) to turn it on.',
  );
});
