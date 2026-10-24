/// <reference types="node" />
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import Anthropic from '@anthropic-ai/sdk';

import { draftProfile } from './profile';
import { EVENTS } from '../src/data/events';

/**
 * Drafts the framework for one or more securities and writes each to
 * server/drafts/{SYMBOL}.json for a person to review. Nothing here reaches
 * the app: approved drafts are pasted into src/data/underlyings.ts, where
 * the integrity tests hold them to the same rules.
 *
 *   npm run draft-profile -- NVDA AMD
 *
 * Needs model credentials (ANTHROPIC_API_KEY, or `ant auth login`).
 */

const symbols = process.argv.slice(2);
if (symbols.length === 0) {
  console.error('Usage: npm run draft-profile -- SYMBOL [SYMBOL...]');
  process.exit(1);
}

const draftsDir = join(__dirname, 'drafts');
const logsDir = join(__dirname, 'logs');
mkdirSync(draftsDir, { recursive: true });
mkdirSync(logsDir, { recursive: true });
const client = new Anthropic();

(async () => {
  for (const symbol of symbols) {
    try {
      const profile = await draftProfile(client, symbol, { questions: EVENTS }, {
        audit: (record) =>
          appendFileSync(join(logsDir, 'profile-drafts.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`),
      });
      const path = join(draftsDir, `${profile.symbol}.json`);
      writeFileSync(path, `${JSON.stringify(profile, null, 2)}\n`);
      console.log(`${profile.symbol} · ${profile.name} → ${path}`);
      for (const c of profile.catalysts) console.log(`  ${c.direction === 'up' ? '▲' : '▼'} ${c.label} (${c.kind}, ${c.timing})`);
    } catch (error) {
      const problems = (error as { problems?: string[] }).problems ?? [];
      console.error(`${symbol}: ${error instanceof Error ? error.message : String(error)}`);
      for (const p of problems) console.error(`  - ${p}`);
      process.exitCode = 1;
    }
  }
})();
