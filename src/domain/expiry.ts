import { addDays } from './horizon';

/**
 * Facts about a contract's expiration day, for the expiration picker.
 * Dates are YYYY-MM-DD strings, compared as strings.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function utc(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00.000Z`);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((utc(to).getTime() - utc(from).getTime()) / DAY_MS);
}

/** Standard monthly expirations fall on the third Friday; everything else is a weekly or quarterly listing. */
export function isThirdFriday(isoDate: string): boolean {
  const d = utc(isoDate);
  return d.getUTCDay() === 5 && d.getUTCDate() >= 15 && d.getUTCDate() <= 21;
}

/**
 * Whether the next earnings report lands between now and the expiration.
 * Undefined when the date isn't known.
 */
export function earningsBeforeExpiry(nextEarnings: string | undefined, expiration: string, now: Date): boolean | undefined {
  if (!nextEarnings) return undefined;
  const today = now.toISOString().slice(0, 10);
  return nextEarnings >= today && nextEarnings <= expiration;
}

/**
 * The floors to ask the market for later expirations: the next listed one
 * after the current, then ones at least two and five months further out,
 * so the choices are spread rather than three consecutive weeks.
 */
export const LATER_EXPIRY_GAPS_DAYS = [1, 60, 150];

export function laterExpirationFloors(expiration: string, gaps: number[] = LATER_EXPIRY_GAPS_DAYS): string[] {
  return gaps.map((gap) => addDays(expiration, gap));
}
