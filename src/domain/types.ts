/**
 * Core domain model for Moonshot.
 *
 * The product rule everything here encodes: every bet has a capped downside
 * (you can lose at most what you put in) and an open-ended upside. No
 * leverage, no shorting, no margin.
 */

export type Category = 'tech' | 'energy' | 'geopolitics' | 'macro' | 'health' | 'space';

/** Long-only instruments. Max loss is always the amount staked. */
export type InstrumentKind = 'stock' | 'etf' | 'call_option' | 'put_option';

export interface Instrument {
  kind: InstrumentKind;
  /** Underlying ticker, e.g. "NVDA". */
  symbol: string;
  name: string;
  /** Options only: plain-English strike, e.g. "~30% above today's price". */
  strikeDescription?: string;
  /** Options only: plain-English expiry, e.g. "Jan 2028". */
  expiry?: string;
}

/**
 * One possible outcome at the bet's horizon.
 * `multiple` is what $1 staked becomes: 0 = total loss, 1 = break-even, 10 = 10x.
 */
export interface Scenario {
  label: string;
  probability: number;
  multiple: number;
}

export interface Bet {
  id: string;
  title: string;
  /** One-line, consumer-friendly pitch. */
  pitch: string;
  instrument: Instrument;
  /** When the bet resolves or expires, e.g. "Jan 2028". */
  horizon: string;
  /** Illustrative outcome distribution. Probabilities must sum to 1. */
  scenarios: Scenario[];
  /** What the world has to look like for this bet to pay off. */
  whatHasToBeTrue: string[];
  /** Signals that would tell you the thesis is wrong. */
  killCriteria: string[];
  category: Category;
  /** Used by the thesis engine to match bets to a user's answers. */
  tags: string[];
}

export type Side = 'yes' | 'no';

export interface EventOutcome {
  side: Side;
  /** Short framing of this side, e.g. "Shipping normalizes". */
  label: string;
  /** Why this side leads to the linked bets. */
  rationale: string;
  betIds: string[];
}

/** A yes/no question about the world tied to current events. */
export interface EventQuestion {
  id: string;
  question: string;
  /** Short summary of the news behind the question. */
  context: string;
  category: Category;
  resolvesBy: string;
  /** Share of Moonshot users who answered "yes", 0..1. */
  crowdYes: number;
  outcomes: [EventOutcome, EventOutcome];
}

export interface ThesisOption {
  id: string;
  label: string;
  tags: string[];
  /** Sentence this answer adds to the generated thesis. */
  fragment: string;
}

export interface ThesisStep {
  id: string;
  prompt: string;
  options: ThesisOption[];
}

/** A guided path from a big question ("Do you believe in AI?") to bets. */
export interface Theme {
  id: string;
  title: string;
  hook: string;
  emoji: string;
  category: Category;
  steps: ThesisStep[];
}

export type PositionSource =
  | { type: 'event'; eventId: string; side: Side }
  | { type: 'thesis'; themeId: string }
  | { type: 'direct' };

export interface Position {
  id: string;
  betId: string;
  stake: number;
  placedAt: string;
  /** The user's own "why" for the bet, in their words. */
  thesis: string;
  source: PositionSource;
  status: 'open' | 'closed';
}

export interface SavedThesis {
  id: string;
  themeId: string;
  statement: string;
  answerIds: string[];
  createdAt: string;
}

export interface Profile {
  onboarded: boolean;
  /** Money the user is willing to lose on moonshots each month. */
  monthlyBudget: number;
  /** Largest share of the monthly budget allowed in one bet, 0..1. */
  maxPerBetPct: number;
  acceptedDisclaimerAt?: string;
}
