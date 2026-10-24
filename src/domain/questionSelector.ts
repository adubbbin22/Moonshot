import { topicScore } from './takeProfile';
import type { Call, Category, EventQuestion } from './types';

/**
 * Picks the next question for a new user's call deck. Deterministic, so it
 * can be tested and reasoned about.
 *
 * 1. Coverage: one question from each picked topic (or every topic if the
 *    user picked none), so we learn something about each.
 * 2. Exploit: then lean toward topics the user engages with. Calls raise a
 *    topic, skips lower it, untouched topics get a small curiosity bonus.
 *
 * Within a topic, questions are taken in catalog order (editorial priority).
 */

export const CATEGORY_ORDER: Category[] = ['tech', 'energy', 'geopolitics', 'macro', 'health', 'space'];

export interface SelectorState {
  calls: Pick<Call, 'questionId'>[];
  skips: string[];
  seedTopics: Category[];
}

const CURIOSITY_BONUS = 0.25;

export function nextQuestion(questions: EventQuestion[], state: SelectorState): EventQuestion | undefined {
  const seen = new Set([...state.calls.map((c) => c.questionId), ...state.skips]);
  const candidates = questions.filter((q) => !seen.has(q.id));
  if (candidates.length === 0) return undefined;

  const byId = new Map(questions.map((q) => [q.id, q]));
  const tally = new Map<Category, { calls: number; skips: number }>();
  const add = (id: string, key: 'calls' | 'skips') => {
    const category = byId.get(id)?.category;
    if (!category) return;
    const entry = tally.get(category) ?? { calls: 0, skips: 0 };
    entry[key] += 1;
    tally.set(category, entry);
  };
  state.calls.forEach((c) => add(c.questionId, 'calls'));
  state.skips.forEach((id) => add(id, 'skips'));

  const firstIn = (category: Category) => candidates.find((q) => q.category === category);
  const interactions = (category: Category) => {
    const t = tally.get(category);
    return t ? t.calls + t.skips : 0;
  };

  const coverage = state.seedTopics.length > 0
    ? CATEGORY_ORDER.filter((c) => state.seedTopics.includes(c))
    : CATEGORY_ORDER;
  for (const category of coverage) {
    const question = firstIn(category);
    if (question && interactions(category) === 0) return question;
  }

  const scored = CATEGORY_ORDER.filter((c) => firstIn(c)).map((category, order) => {
    const { calls = 0, skips = 0 } = tally.get(category) ?? {};
    const score =
      topicScore(calls, skips, state.seedTopics.includes(category)) +
      (interactions(category) === 0 ? CURIOSITY_BONUS : 0);
    return { category, score, interactions: interactions(category), order };
  });
  scored.sort((a, b) => b.score - a.score || a.interactions - b.interactions || a.order - b.order);
  return firstIn(scored[0].category);
}
