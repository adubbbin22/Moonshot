import { pnlAtExpiry, type Leg } from './options';
import { normCdf, RISK_FREE_RATE } from './pricing';

/**
 * Simulated returns.
 *
 * Two tools, both plain arithmetic on the same odds the rest of the app
 * shows:
 * - `simulate`: Monte Carlo of a set of bets to expiry. Each underlying's
 *   price at expiry is drawn from the same lognormal distribution the
 *   options odds come from (its implied volatility), so the "market" mode
 *   reproduces the market's odds. "Yours" mode keeps the same price
 *   distribution but makes each bet land past breakeven as often as you
 *   say it will.
 * - `repeatBet`: the same bet many times, as a binomial: how often you'd
 *   hit, and what the run looks like.
 *
 * Deterministic for a given seed, so it can be tested and reproduced.
 */

/** Small, fast, seedable PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inverse of the standard normal CDF (Acklam's approximation, good to ~1e-9). */
export function inverseNormCdf(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export interface SimPosition {
  /** Legs with prices, so P&L is payoff minus what was paid. */
  legs: Leg[];
  contracts: number;
  spot: number;
  /** Annualized implied volatility. */
  vol: number;
  /** Years to expiry. */
  t: number;
  bullish: boolean;
  breakeven: number;
  /** Your own chance this bet ends past breakeven, for "yours" mode. Falls back to the market's. */
  yourOdds?: number;
}

export interface SimOptions {
  trials?: number;
  seed?: number;
  odds: 'market' | 'yours';
}

export interface Bucket {
  from: number;
  to: number;
  count: number;
}

export interface SimSummary {
  trials: number;
  totalCost: number;
  mean: number;
  median: number;
  p10: number;
  p90: number;
  worst: number;
  best: number;
  /** Every bet expires worthless. */
  pLoseAll: number;
  pProfit: number;
  /** You at least double your money. */
  pDouble: number;
  buckets: Bucket[];
}

const EPSILON = 1e-6;

/** The standard-normal draw at which the underlying lands on breakeven. */
function breakevenZ(p: SimPosition): number {
  const drift = (RISK_FREE_RATE - (p.vol * p.vol) / 2) * p.t;
  return (Math.log(p.breakeven / p.spot) - drift) / (p.vol * Math.sqrt(p.t));
}

function terminalPrice(p: SimPosition, z: number): number {
  const drift = (RISK_FREE_RATE - (p.vol * p.vol) / 2) * p.t;
  return p.spot * Math.exp(drift + p.vol * Math.sqrt(p.t) * z);
}

const clamp = (x: number) => Math.min(1 - EPSILON, Math.max(EPSILON, x));

/**
 * A draw for one position. In "yours" mode, the draw lands in the winning
 * region of the price distribution with the user's probability, and is
 * otherwise drawn from the same distribution restricted to that region.
 */
function draw(p: SimPosition, rng: () => number, odds: SimOptions['odds']): number {
  const u = rng();
  if (odds === 'market' || p.yourOdds === undefined) return terminalPrice(p, inverseNormCdf(clamp(u)));
  const zBe = breakevenZ(p);
  const cdfBe = clamp(normCdf(zBe));
  const win = rng() < p.yourOdds;
  // Winning region: above breakeven for bullish bets, below for bearish.
  const inUpper = p.bullish ? win : !win;
  const q = inUpper ? cdfBe + u * (1 - cdfBe) : u * cdfBe;
  return terminalPrice(p, inverseNormCdf(clamp(q)));
}

export function simulate(positions: SimPosition[], { trials = 5000, seed = 1, odds }: SimOptions): SimSummary {
  const rng = mulberry32(seed);
  const totalCost = positions.reduce((sum, p) => sum + -pnlAtExpiry(p.legs, p.bullish ? 0 : Number.MAX_SAFE_INTEGER) * p.contracts, 0);
  const results = new Float64Array(trials);
  for (let i = 0; i < trials; i++) {
    let pnl = 0;
    for (const p of positions) pnl += pnlAtExpiry(p.legs, draw(p, rng, odds)) * p.contracts;
    results[i] = pnl;
  }
  const sorted = Float64Array.from(results).sort();
  const at = (q: number) => sorted[Math.min(trials - 1, Math.max(0, Math.floor(q * trials)))];
  const count = (test: (x: number) => boolean) => {
    let n = 0;
    for (const x of results) if (test(x)) n++;
    return n / trials;
  };
  const worst = sorted[0];
  const best = sorted[trials - 1];
  const bucketCount = 10;
  const span = best - worst || 1;
  const buckets: Bucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    from: worst + (span * i) / bucketCount,
    to: worst + (span * (i + 1)) / bucketCount,
    count: 0,
  }));
  for (const x of results) buckets[Math.min(bucketCount - 1, Math.floor(((x - worst) / span) * bucketCount))].count++;
  let mean = 0;
  for (const x of results) mean += x / trials;

  return {
    trials,
    totalCost,
    mean,
    median: at(0.5),
    p10: at(0.1),
    p90: at(0.9),
    worst,
    best,
    pLoseAll: count((x) => x <= -totalCost + EPSILON),
    pProfit: count((x) => x > 0),
    pDouble: count((x) => x >= totalCost),
    buckets,
  };
}

export interface RepeatInput {
  /** Chance of the full payout on one bet. */
  probability: number;
  /** Payout as a multiple of cost when it hits. */
  multiple: number;
  cost: number;
  n: number;
}

export interface RepeatOutcome {
  hits: number;
  probability: number;
  pnl: number;
}

export interface RepeatSummary {
  n: number;
  expectedHits: number;
  expectedPnl: number;
  pNoHit: number;
  pAtLeastOne: number;
  pAtLeastTwo: number;
  /** Chance the run ends in profit. */
  pProfit: number;
  outcomes: RepeatOutcome[];
}

/** The same bet, n times, as a binomial: all-or-nothing on each. */
export function repeatBet({ probability: p, multiple, cost, n }: RepeatInput): RepeatSummary {
  const outcomes: RepeatOutcome[] = [];
  let choose = 1;
  for (let k = 0; k <= n; k++) {
    if (k > 0) choose = (choose * (n - k + 1)) / k;
    const probability = choose * p ** k * (1 - p) ** (n - k);
    outcomes.push({ hits: k, probability, pnl: k * cost * multiple - n * cost });
  }
  const sum = (test: (o: RepeatOutcome) => boolean) => outcomes.filter(test).reduce((s, o) => s + o.probability, 0);
  return {
    n,
    expectedHits: n * p,
    expectedPnl: n * cost * (p * multiple - 1),
    pNoHit: outcomes[0].probability,
    pAtLeastOne: 1 - outcomes[0].probability,
    pAtLeastTwo: sum((o) => o.hits >= 2),
    pProfit: sum((o) => o.pnl > 0),
    outcomes,
  };
}
