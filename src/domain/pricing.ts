/**
 * Black-Scholes pricing and options-implied probabilities.
 *
 * Used two ways: to generate synthetic option chains when no market data
 * provider is configured, and to turn real implied volatilities into the
 * "market odds" shown on every bet. Probabilities are risk-neutral: they are
 * what option prices imply, not a forecast.
 */

export type OptionType = 'call' | 'put';

/** Flat risk-free rate. Good enough for consumer-facing odds; refine with a curve later. */
export const RISK_FREE_RATE = 0.04;

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

/** Standard normal CDF (Abramowitz & Stegun 7.1.26, error < 1.5e-7). */
export function normCdf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
}

/** Years from `now` to the close of trading on an ISO expiration date (YYYY-MM-DD). */
export function yearsToExpiry(expiration: string, now: Date): number {
  // Options stop trading at 4pm New York time; 21:00 UTC is close enough year-round.
  const expiry = new Date(`${expiration}T21:00:00.000Z`);
  return Math.max(0, (expiry.getTime() - now.getTime()) / MS_PER_YEAR);
}

export function daysToExpiry(expiration: string, now: Date): number {
  return Math.round(yearsToExpiry(expiration, now) * 365);
}

export interface PricingInputs {
  spot: number;
  strike: number;
  /** Years to expiry. */
  t: number;
  /** Annualized volatility, e.g. 0.45 for 45%. */
  vol: number;
  rate?: number;
}

function d1d2({ spot, strike, t, vol, rate = RISK_FREE_RATE }: PricingInputs) {
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(spot / strike) + (rate + (vol * vol) / 2) * t) / (vol * sqrtT);
  return { d1, d2: d1 - vol * sqrtT };
}

export function intrinsic(type: OptionType, spot: number, strike: number): number {
  return type === 'call' ? Math.max(0, spot - strike) : Math.max(0, strike - spot);
}

export function blackScholes(type: OptionType, inputs: PricingInputs): number {
  const { spot, strike, t, vol, rate = RISK_FREE_RATE } = inputs;
  if (t <= 0 || vol <= 0) return intrinsic(type, spot, strike);
  const { d1, d2 } = d1d2(inputs);
  const discount = Math.exp(-rate * t);
  return type === 'call'
    ? spot * normCdf(d1) - strike * discount * normCdf(d2)
    : strike * discount * normCdf(-d2) - spot * normCdf(-d1);
}

/** Risk-neutral probability that the underlying finishes above `strike` at expiry. */
export function probabilityAbove(inputs: PricingInputs): number {
  const { spot, strike, t, vol } = inputs;
  if (strike <= 0) return 1;
  if (t <= 0 || vol <= 0) return spot > strike ? 1 : 0;
  return normCdf(d1d2(inputs).d2);
}

export function probabilityBetween(lower: number, upper: number | null, inputs: Omit<PricingInputs, 'strike'>): number {
  const above = (k: number) => probabilityAbove({ ...inputs, strike: k });
  return Math.max(0, above(lower) - (upper === null ? 0 : above(upper)));
}

/**
 * Volatility that reproduces `price`, by bisection. Returns null when the
 * price is outside what any volatility can produce (e.g. below intrinsic).
 */
export function impliedVolatility(
  type: OptionType,
  price: number,
  inputs: Omit<PricingInputs, 'vol'>,
): number | null {
  if (!(price > 0) || inputs.t <= 0) return null;
  let lo = 0.005;
  let hi = 5;
  const priceAt = (vol: number) => blackScholes(type, { ...inputs, vol });
  if (price < priceAt(lo) || price > priceAt(hi)) return null;
  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2;
    if (priceAt(mid) < price) lo = mid;
    else hi = mid;
    if (hi - lo < 1e-6) break;
  }
  return (lo + hi) / 2;
}
