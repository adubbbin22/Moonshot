import { minExpirationDate } from './strategy';

/**
 * Horizon guard: a bet linked to a question must still be open after the
 * question resolves, with a buffer for settlement. Otherwise a user can be
 * right about the world and still lose because the option expired first.
 */
export const RESOLUTION_BUFFER_DAYS = 30;

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Earliest acceptable expiration: the template's own minimum, pushed past the question if needed. */
export function earliestExpiration(minDays: number, now: Date, resolvesOn?: string): string {
  const own = minExpirationDate(minDays, now);
  if (!resolvesOn) return own;
  const guard = addDays(resolvesOn, RESOLUTION_BUFFER_DAYS);
  return guard > own ? guard : own;
}

export function outlivesQuestion(expiration: string, resolvesOn: string): boolean {
  return expiration >= addDays(resolvesOn, RESOLUTION_BUFFER_DAYS);
}
