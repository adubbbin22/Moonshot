import type { Call, Category } from '@/domain/types';

/**
 * Calls seeded by the "skip setup" testing shortcut: a spread of topics,
 * each on a side that leads to bets, so the takes screen, the question
 * screens and the bet ladder have something to show straight away.
 */

export const DEMO_TOPICS: Category[] = ['geopolitics', 'tech', 'macro', 'energy'];

const DEMO_VIEWS: Omit<Call, 'madeAt'>[] = [
  { questionId: 'hormuz-transits-2027', side: 'yes', probability: 0.9 },
  { questionId: 'ai-time-horizon-2027', side: 'yes', probability: 0.85 },
  { questionId: 'fed-below-3-2027', side: 'yes', probability: 0.75 },
  { questionId: 'smr-grid-2028', side: 'yes', probability: 0.8 },
];

export function demoCalls(now: Date): Call[] {
  return DEMO_VIEWS.map((view, i) => ({ ...view, madeAt: new Date(now.getTime() - (DEMO_VIEWS.length - i) * 60_000).toISOString() }));
}
