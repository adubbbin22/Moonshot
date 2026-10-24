import type { TakeProfile, TakeView } from '@/domain/takeProfile';
import type { Category } from '@/domain/types';

/**
 * Turns a take profile into a sentence or two of plain English.
 *
 * This is the first seam for the LLM layer in docs/STRATEGY.md. The input is
 * the take profile only: no money, identity or account data, by type. The
 * production narrator runs on our backend (an LLM writing prose) and follows
 * the firewall: it never names a security and never produces a number. Any
 * numbers on screen come from code.
 */
export interface TakeNarrator {
  readonly id: string;
  describe(profile: TakeProfile): Promise<string>;
}

const TOPIC_PHRASES: Record<Category, string> = {
  tech: 'tech',
  energy: 'energy',
  geopolitics: 'geopolitics',
  macro: 'interest rates',
  health: 'biotech',
  space: 'space',
};

/** "a", "a and b", "a, b and c" */
function joinList(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

const STYLE_SENTENCES = {
  bold: 'You make bold calls. That works if you turn out right as often as you say you will.',
  confident: 'You call it with confidence but leave room to be wrong.',
  measured: 'You hedge your calls. If your leans come true about as often as you say, that’s a strength.',
} as const;

const quote = (view: TakeView) => `“${view.stance}”`;

/** Deterministic stand-in for the LLM narrator. Works offline. */
export const templateNarrator: TakeNarrator = {
  id: 'template',
  async describe(profile) {
    const [first, second] = profile.views;
    if (!first) return 'Make a few calls and we’ll sketch your take profile.';

    const sentences: string[] = [];
    // Describe what the user actually called; interest scores (which count skips) are for picking questions.
    const most = Math.max(0, ...profile.topics.map((t) => t.calls));
    const leaders = profile.topics.filter((t) => most > 0 && t.calls === most).map((t) => TOPIC_PHRASES[t.category]);
    if (leaders.length > 1) sentences.push(`Your takes are spread across ${joinList(leaders)}.`);
    else if (leaders.length === 1) sentences.push(`Most of your takes are about ${leaders[0]}.`);
    sentences.push(`Your strongest take is ${quote(first)}.`);
    if (second) sentences.push(`You also lean ${quote(second)}.`);
    if (profile.style) sentences.push(STYLE_SENTENCES[profile.style]);
    return sentences.join(' ');
  },
};

export const narrator: TakeNarrator = templateNarrator;
