import type { PredictionQuote, PredictionVenue, Side } from './types';

/**
 * Comparing odds across markets.
 *
 * Two different comparisons, kept apart on purpose:
 * - Between prediction venues on the same question: a real arbitrage when
 *   YES at one plus NO at the other costs less than a dollar, before fees.
 * - Between a prediction market and the options bet linked to a side: not
 *   the same claim. The event odds price "does it happen"; the options bet
 *   prices "does the stock move". What the pair tells you is how often the
 *   stock would have to follow the event for the options price to be fair.
 */

/** The crowd's probability for a side of the question. */
export function sideProbability(yes: number, side: Side): number {
  return side === 'yes' ? yes : 1 - yes;
}

/**
 * Rough round-trip cost of taking both sides across venues, per dollar of
 * payout: trading fees, withdrawal costs and the time your money is locked.
 * A gap smaller than this is noise, not an arbitrage.
 */
export const ESTIMATED_FEES = 0.03;

export interface VenueArbitrage {
  buyYesAt: PredictionVenue;
  yesPrice: number;
  buyNoAt: PredictionVenue;
  noPrice: number;
  /** What a dollar of guaranteed payout costs. */
  cost: number;
  /** Guaranteed profit per dollar of payout, before fees. Equals the gap between the venues. */
  edge: number;
  /** After `ESTIMATED_FEES`. Positive means an arbitrage worth the trouble. */
  netEdge: number;
}

/** Cheapest YES plus cheapest NO across venues. Any gap is an edge before fees; `netEdge` says if it survives them. */
export function venueArbitrage(quotes: Pick<PredictionQuote, 'venue' | 'yes'>[]): VenueArbitrage | null {
  if (quotes.length < 2) return null;
  const cheapestYes = quotes.reduce((a, b) => (b.yes < a.yes ? b : a));
  const cheapestNo = quotes.reduce((a, b) => (1 - b.yes < 1 - a.yes ? b : a));
  if (cheapestYes.venue === cheapestNo.venue) return null;
  const cost = cheapestYes.yes + (1 - cheapestNo.yes);
  return {
    buyYesAt: cheapestYes.venue,
    yesPrice: cheapestYes.yes,
    buyNoAt: cheapestNo.venue,
    noPrice: 1 - cheapestNo.yes,
    cost,
    edge: 1 - cost,
    netEdge: 1 - cost - ESTIMATED_FEES,
  };
}

/** Widest disagreement between venues on YES, in probability points. */
export function venueSpread(quotes: Pick<PredictionQuote, 'yes'>[]): number | null {
  if (quotes.length < 2) return null;
  const ys = quotes.map((q) => q.yes);
  return Math.max(...ys) - Math.min(...ys);
}

export interface EventVsOptions {
  /** The crowd's chance of this side of the question. */
  pEvent: number;
  /** What the options market charges for the linked bet (cost ÷ max payout, or model odds). */
  optionsOdds: number;
  /**
   * How often the stock would have to follow the event for the options price
   * to be fair, assuming the move only happens if the event does. Above 1
   * means the options market prices the move as likelier than the event.
   */
  breakEvenLink: number;
  verdict: 'options-cheaper' | 'move-priced-above-event' | 'close';
}

/** Puts the event odds and the options odds side by side. */
export function eventVsOptions(pEvent: number, optionsOdds: number): EventVsOptions {
  const breakEvenLink = pEvent > 0 ? optionsOdds / pEvent : Infinity;
  const verdict: EventVsOptions['verdict'] =
    breakEvenLink > 1 ? 'move-priced-above-event' : breakEvenLink < 0.9 ? 'options-cheaper' : 'close';
  return { pEvent, optionsOdds, breakEvenLink, verdict };
}

/** Your call against the crowd's number, in probability points (positive: you're more confident). */
export function edgeOverCrowd(yourProbability: number, pEvent: number): number {
  return yourProbability - pEvent;
}

export interface VenueStake {
  venue: PredictionVenue;
  side: Side;
  /** Price of one contract of this side, as a fraction of its $1 payout. */
  price: number;
  contracts: number;
  cost: number;
  /** Each contract pays $1 if the side resolves. */
  payout: number;
  multiple: number;
}

/**
 * The same dollars on the venue's contract for this side. Contracts pay $1
 * each and trade in whole numbers; before fees. Null when the side is priced
 * at a certainty or the stake doesn't buy one contract.
 */
export function venueStake(quote: Pick<PredictionQuote, 'venue' | 'yes'>, side: Side, stake: number): VenueStake | null {
  const price = sideProbability(quote.yes, side);
  if (price <= 0 || price >= 1 || stake <= 0) return null;
  const contracts = Math.floor(stake / price + 1e-9);
  if (contracts === 0) return null;
  return { venue: quote.venue, side, price, contracts, cost: contracts * price, payout: contracts, multiple: 1 / price };
}

