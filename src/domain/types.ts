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

/**
 * The shapes one idea can take. A base template is written in one of them;
 * the others are derived (domain/structures.ts) so every idea offers a
 * capped spread, a further-out aggressive spread and an uncapped long option.
 */
export type ShapeId = 'capped' | 'aggressive' | 'uncapped';

export interface Bet {
  id: string;
  /** Set on derived shapes: which shape this is and the base template it came from. */
  shape?: { id: ShapeId; baseId: string };
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

export type PredictionVenue = 'kalshi' | 'polymarket';

/** A prediction-market contract that asks (close to) the same question. */
export interface PredictionMarketRef {
  venue: PredictionVenue;
  /** Kalshi ticker, or Polymarket market slug. */
  id: string;
  /** The venue's exact title, so a reader can see how closely it matches. */
  title: string;
  url: string;
}

/** The price of YES at a venue: the crowd's probability, as a fraction. */
export interface PredictionQuote extends PredictionMarketRef {
  yes: number;
  asOf: string;
  /** "live" from the venue, or a "sample" number for demos. */
  basis: 'live' | 'sample';
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
  /** Prediction markets on the same question, for comparing odds. */
  markets?: PredictionMarketRef[];
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

export type Direction = 'up' | 'down';

/** What kind of lever a catalyst pulls on the price. */
export type CatalystKind = 'demand' | 'pricing' | 'costs' | 'rates' | 'policy' | 'event' | 'competition' | 'sentiment';

/** Whether the price moves when the news lands, or as the results show up quarter by quarter. */
export type CatalystTiming = 'on-the-news' | 'over-quarters';

/**
 * One thing that moves a security's price, and how. The framework for a
 * stock is its catalyst map: every bet on it rides one of these.
 */
export interface Catalyst {
  id: string;
  label: string;
  /** What happens to the price if this fires. */
  direction: Direction;
  kind: CatalystKind;
  timing: CatalystTiming;
  /** The chain from the event to the price: revenue, margins, the multiple, or flows. No numbers. */
  why: string;
  /** Observable signs it's firing. */
  watch: string[];
  /** Feed questions that test it. */
  checks?: ClaimCheck[];
}

/** A security as the app understands it: what it is, and what moves it. */
export interface UnderlyingProfile {
  symbol: string;
  name: string;
  kind: 'stock' | 'etf' | 'commodity';
  /** For someone who has never heard of it. */
  whatItIs: string;
  /** What the price mostly responds to, in one line. */
  movesOn: string;
  catalysts: Catalyst[];
  /** Ways to lose even when the world goes your way. */
  risks: string[];
  provenance?: DraftProvenance;
}

/**
 * A security's background for digging in before a bet: what the company does
 * and how it is doing, or what a fund holds. A snapshot labelled with where
 * and when it came from; never a price feed (prices come from market data).
 */
export interface CompanySnapshot {
  symbol: string;
  name: string;
  /** When the figures were observed (ISO). */
  asOf: string;
  /** Sample figures are made up for demos and say so on screen. */
  basis: 'live' | 'sample';
  /** Where the figures came from, shown to users. */
  source: string;
  about: CompanyAbout;
  /** Operating companies. */
  financials?: CompanyFinancials;
  /** Funds: ETFs and commodity trusts. */
  fund?: FundFacts;
}

export interface CompanyAbout {
  /** What the business (or fund) does, in a paragraph. */
  description: string;
  sector?: string;
  industry?: string;
  /** "City, State" or "City, Country". */
  headquarters?: string;
  employees?: number;
  website?: string;
}

/** Trailing twelve months unless noted. Money in `currency`; ratios as fractions. */
export interface CompanyFinancials {
  currency: string;
  marketCap?: number;
  enterpriseValue?: number;
  revenue?: number;
  /** Year over year. */
  revenueGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  profitMargin?: number;
  netIncome?: number;
  freeCashFlow?: number;
  cash?: number;
  debt?: number;
  trailingPe?: number;
  forwardPe?: number;
  priceToSales?: number;
  /** Next earnings report (YYYY-MM-DD), and whether the date is still an estimate. */
  nextEarnings?: string;
  nextEarningsEstimated?: boolean;
}

export interface FundHolding {
  symbol: string;
  name: string;
  /** Share of the fund, as a fraction. */
  weight: number;
}

export interface FundFacts {
  family?: string;
  category?: string;
  /** Annual expense ratio as a fraction (0.0035 = 0.35%). */
  expenseRatio?: number;
  netAssets?: number;
  /** What the fund holds in one line, for funds of futures or bullion rather than stocks. */
  holds?: string;
  topHoldings: FundHolding[];
}

/** A catalyst on a specific security. */
export interface CatalystRef {
  symbol: string;
  catalyst: string;
}

/**
 * A curated link from the world to the market: something happening in the
 * world, and the catalysts it sets off. Code turns catalysts into bets
 * (direction on a symbol), so neither a thesis nor the LLM that drafts one
 * ever names a security. The mechanism library is the only way a thesis
 * reaches a bet.
 */
export interface Mechanism {
  id: string;
  label: string;
  /** What has to be happening in the world for this to fire. Written for whoever (or whatever) picks mechanisms. */
  description: string;
  catalysts: CatalystRef[];
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
  /** Mechanisms from the library that this step sets in motion. */
  mechanisms?: string[];
  /** Bets that pay if the chain up to and including this step holds. Derived from `mechanisms` by the catalog; content never sets it. */
  bets?: ThesisBetLink[];
  /**
   * Second-order effect: the response this step provokes that could undo it
   * before the bets expire (competitors pile in, supply catches up).
   * Required on every step with bets.
   */
  thenWhat?: string;
  next?: ThesisStep[];
}

/** A past case in the belief's reference class, and whether it went the way the belief says. */
export interface ReferenceCase {
  label: string;
  happened: boolean;
  /** One line on what actually happened. */
  note: string;
  /** Where to check it. Required on drafted cases, which drive a number without a human having read them. */
  source?: string;
}

/** The outside view: how cases like this one have gone before. */
export interface OutsideView {
  /** The reference class, as a question: "When … did it …?" */
  question: string;
  cases: ReferenceCase[];
}

/** Pre-mortem: one way the belief turns out wrong, the part it breaks, and the early sign to watch. */
export interface FailureStory {
  id: string;
  /** Told from the future, after the fact. */
  story: string;
  /** Id of the premise this story breaks. */
  breaks: string;
  /** An observable early warning: becomes a kill criterion if the user marks the story. */
  signal: string;
}

/** Where drafted content came from. Curated content has none. */
export interface DraftProvenance {
  kind: 'drafted';
  /** What the model was asked for: the belief in the user's own words, or a symbol. */
  prompt: string;
  model: string;
  draftedAt: string;
  /** What the review pass did: cases it dropped as disputed, and anything it flagged. */
  review?: { droppedCases: number; notes: string[] };
}

/**
 * A thesis tree: a big belief broken into the parts it depends on, then the
 * chains of consequences that follow if it's true or false, ending in bets.
 *
 * Curated trees are written and reviewed by people. Drafted trees come from
 * an LLM inside the firewall (see domain/thesisDraft.ts): it writes the
 * reasoning, picks mechanisms by id, and never names a security or a price.
 * Either way, every user who reaches a step sees the same bets.
 */
export interface ThesisTree {
  id: string;
  provenance?: DraftProvenance;
  title: string;
  /** The question that opens it: "Do you believe in AI?" */
  hook: string;
  emoji: string;
  category: Category;
  /** The belief, stated as a claim that could turn out true or false. */
  belief: string;
  /** When the belief is settled, for the pre-mortem: "the end of 2028". */
  settledBy: string;
  outsideView: OutsideView;
  premises: ThesisPremise[];
  premortem: FailureStory[];
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
  /** Warning signs the user picked in a pre-mortem: if one shows up, the reasoning is breaking. */
  killCriteria?: string[];
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
