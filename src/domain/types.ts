/**
 * Core domain model for Moonshot.
 *
 * Every bet is a long option or a debit option spread. The product rule all of
 * this encodes: you pay once up front, and that payment is the most you can
 * lose. No naked short options, no credit spreads, no margin.
 */

import type { OptionType } from './pricing';

export type { OptionType };

export type Category = 'tech' | 'energy' | 'geopolitics' | 'macro' | 'health' | 'space';

/**
 * Defined-risk, positive-convexity structures only.
 * - long_call / long_put: buy one option.
 * - call_debit_spread: buy a call, sell a higher-strike call (bullish, capped).
 * - put_debit_spread: buy a put, sell a lower-strike put (bearish, capped).
 */
export type StructureKind = 'long_call' | 'long_put' | 'call_debit_spread' | 'put_debit_spread';

/**
 * How to build a bet from whatever the option chain looks like today. Strikes
 * are expressed relative to the current price, so the same idea can be priced
 * against live data on any day.
 */
export interface StrategyTemplate {
  underlying: string;
  underlyingName: string;
  kind: StructureKind;
  /** Strike of the option you buy, as a multiple of spot (1.1 = 10% above today's price). */
  buyStrike: number;
  /** Spreads only: strike of the option you sell, as a multiple of spot. */
  sellStrike?: number;
  /** Use the first listed expiration at least this many days out. */
  minDays: number;
}

export interface Bet {
  id: string;
  title: string;
  /** One-line, consumer-friendly pitch. */
  pitch: string;
  strategy: StrategyTemplate;
  /** What the world has to look like for this bet to pay off. */
  whatHasToBeTrue: string[];
  /** Signals that would tell you the thesis is wrong. */
  killCriteria: string[];
  category: Category;
}

/** One listed option contract with its latest prices. */
export interface OptionContract {
  /** OCC symbol, e.g. "NVDA270115C00200000". */
  symbol: string;
  type: OptionType;
  strike: number;
  /** YYYY-MM-DD. */
  expiration: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  /** Annualized implied volatility from the provider, if it supplies one. */
  iv: number | null;
}

/** All contracts for one underlying and one expiration. */
export interface ChainSnapshot {
  underlying: string;
  spot: number;
  /** When the prices were observed (ISO). */
  asOf: string;
  expiration: string;
  contracts: OptionContract[];
  /** Where the prices came from, shown to users (e.g. "Yahoo Finance (delayed)"). */
  source?: string;
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

/**
 * How a question settles. Every question needs one: without a named source,
 * a threshold and a date there is no track record to keep.
 */
export interface Resolution {
  /** Plain-English rule, e.g. "Resolves YES if …". */
  rule: string;
  /** Named data source, e.g. "IMF PortWatch". */
  source: string;
  sourceUrl?: string;
  /** Last date the question can resolve (YYYY-MM-DD). */
  resolvesOn: string;
}

/** A yes/no question about the world tied to current events. */
export interface EventQuestion {
  id: string;
  question: string;
  /** Short summary of the news behind the question. */
  context: string;
  category: Category;
  resolution: Resolution;
  outcomes: [EventOutcome, EventOutcome];
}

/**
 * A user's forecast on a question: which side, and how likely they think
 * that side is (0.5–0.99). Calls are free and are the core of the take profile.
 */
export interface Call {
  questionId: string;
  side: Side;
  /** Probability the chosen side happens. */
  probability: number;
  madeAt: string;
}

/** A feed question that checks a claim, and which side of it means the claim is true. */
export interface ClaimCheck {
  questionId: string;
  side: Side;
}

/**
 * One of the parts a belief comes down to. A belief is only as likely as all
 * of its parts together, which is the point of breaking it down.
 */
export interface ThesisPremise {
  id: string;
  /** Short, plain claim: "Models keep getting better at long, real tasks". */
  claim: string;
  /** The first-principles case that it holds. */
  why: string;
  /** The strongest case against it. */
  against: string;
  check?: ClaimCheck;
}

/** Why a specific bet pays if the step it hangs off comes true. */
export interface ThesisBetLink {
  betId: string;
  /** The last link in the chain, from the world to this bet. No numbers: those come from code. */
  why: string;
}

/** A "which means…" step: what follows if the step before it is true. */
export interface ThesisStep {
  id: string;
  claim: string;
  /** The mechanism: why this follows from the step before. */
  because: string;
  /** The strongest case against this step. */
  against: string;
  check?: ClaimCheck;
  /** Bets that pay if the chain up to and including this step holds. */
  bets?: ThesisBetLink[];
  next?: ThesisStep[];
}

/**
 * A thesis tree: a big belief broken into the parts it depends on, then the
 * chains of consequences that follow if it's true or false, ending in bets.
 *
 * Written and reviewed by people (the "mechanism library" in
 * docs/STRATEGY.md). Every user who reaches a step sees the same bets.
 */
export interface ThesisTree {
  id: string;
  title: string;
  /** The question that opens it: "Do you believe in AI?" */
  hook: string;
  emoji: string;
  category: Category;
  /** The belief, stated as a claim that could turn out true or false. */
  belief: string;
  premises: ThesisPremise[];
  /** What follows if the belief is true. */
  ifTrue: ThesisStep[];
  /** What follows if it isn't. */
  ifFalse: ThesisStep[];
}

export type PositionSource =
  | { type: 'event'; eventId: string; side: Side }
  | { type: 'thesis'; thesisId: string; stepId: string }
  | { type: 'direct' };

export type LegAction = 'buy' | 'sell';

export interface PositionLeg {
  action: LegAction;
  type: OptionType;
  strike: number;
  symbol: string;
}

export interface Position {
  id: string;
  betId: string;
  underlying: string;
  kind: StructureKind;
  expiration: string;
  legs: PositionLeg[];
  contracts: number;
  /** Net debit paid per contract (already x100). Also the max loss per contract. */
  costPerContract: number;
  /** Max value per contract at expiry, or null when uncapped (long calls). */
  maxValuePerContract: number | null;
  breakeven: number;
  placedAt: string;
  /** The user's own "why" for the bet, in their words. */
  thesis: string;
  source: PositionSource;
  status: 'open' | 'closed';
}

export interface Profile {
  onboarded: boolean;
  /** Money the user is willing to lose on moonshots each month. */
  monthlyBudget: number;
  /** Largest share of the monthly budget allowed in one bet, 0..1. */
  maxPerBetPct: number;
  acceptedDisclaimerAt?: string;
}
