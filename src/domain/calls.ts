import type { Call } from './types';

/**
 * One-tap confidence levels for a call. Tapping a side then a level keeps the
 * first session fast and still gives a probability we can score later.
 */
export const CONFIDENCE_PRESETS = [
  { id: 'lean', label: 'Lean', probability: 0.6 },
  { id: 'likely', label: 'Likely', probability: 0.75 },
  { id: 'sure', label: 'Sure', probability: 0.9 },
] as const;

export const DEFAULT_CONFIDENCE = 0.75;

/** The call expressed as the probability of YES, for scoring against outcomes. */
export function probabilityOfYes(call: Pick<Call, 'side' | 'probability'>): number {
  return call.side === 'yes' ? call.probability : 1 - call.probability;
}

/** How far from a coin flip the call is: 0 at 50%, 1 at 100%. */
export function conviction(call: Pick<Call, 'probability'>): number {
  return Math.max(0, Math.min(1, (call.probability - 0.5) * 2));
}
