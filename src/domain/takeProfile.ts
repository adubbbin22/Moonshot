import { conviction } from './calls';
import type { Call, Category, EventQuestion, Side } from './types';

/**
 * The take profile: what we learn about a user from their calls. It drives
 * which questions they see and which of their views lead to bets. It holds
 * no financial or identity data, so it is safe to hand to an LLM narrator.
 */

export interface TopicAffinity {
  category: Category;
  calls: number;
  skips: number;
  seeded: boolean;
  score: number;
}

export interface TakeView {
  questionId: string;
  side: Side;
  probability: number;
  conviction: number;
  /** Short stance for this side, e.g. "Disruption drags on". */
  stance: string;
  madeAt: string;
}

export type CallStyle = 'measured' | 'confident' | 'bold';

export interface TakeProfile {
  totalCalls: number;
  totalSkips: number;
  /** Topics with any signal, strongest first. */
  topics: TopicAffinity[];
  /** One view per called question, strongest conviction first. */
  views: TakeView[];
  strongest?: TakeView;
  style?: CallStyle;
}

/** Interest score per topic: calls count for, skips count against, picked topics get a nudge. */
export function topicScore(calls: number, skips: number, seeded: boolean): number {
  return calls - 0.75 * skips + (seeded ? 0.5 : 0);
}

export function callStyle(calls: Call[]): CallStyle | undefined {
  if (calls.length === 0) return undefined;
  const average = calls.reduce((sum, c) => sum + c.probability, 0) / calls.length;
  if (average < 0.68) return 'measured';
  if (average < 0.83) return 'confident';
  return 'bold';
}

export function buildTakeProfile(
  calls: Call[],
  skips: string[],
  seedTopics: Category[],
  questions: EventQuestion[],
): TakeProfile {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const counts = new Map<Category, { calls: number; skips: number }>();
  const bump = (category: Category, key: 'calls' | 'skips') => {
    const entry = counts.get(category) ?? { calls: 0, skips: 0 };
    entry[key] += 1;
    counts.set(category, entry);
  };

  const views: TakeView[] = [];
  for (const call of calls) {
    const question = byId.get(call.questionId);
    if (!question) continue;
    bump(question.category, 'calls');
    const outcome = question.outcomes.find((o) => o.side === call.side);
    views.push({
      questionId: call.questionId,
      side: call.side,
      probability: call.probability,
      conviction: conviction(call),
      stance: outcome?.label ?? (call.side === 'yes' ? 'Yes' : 'No'),
      madeAt: call.madeAt,
    });
  }
  for (const id of skips) {
    const question = byId.get(id);
    if (question) bump(question.category, 'skips');
  }

  const categories = new Set<Category>([...counts.keys(), ...seedTopics]);
  const topics = [...categories]
    .map((category) => {
      const { calls: c, skips: s } = counts.get(category) ?? { calls: 0, skips: 0 };
      const seeded = seedTopics.includes(category);
      return { category, calls: c, skips: s, seeded, score: topicScore(c, s, seeded) };
    })
    .sort((a, b) => b.score - a.score || b.calls - a.calls);

  views.sort((a, b) => b.conviction - a.conviction || b.madeAt.localeCompare(a.madeAt));
  const counted = calls.filter((c) => byId.has(c.questionId));

  return {
    totalCalls: counted.length,
    totalSkips: skips.filter((id) => byId.has(id)).length,
    topics,
    views,
    strongest: views[0],
    style: callStyle(counted),
  };
}
