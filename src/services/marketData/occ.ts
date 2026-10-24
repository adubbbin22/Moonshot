import type { OptionType } from '@/domain/types';

/**
 * OCC option symbols: root (1-6 chars) + YYMMDD + C/P + strike x 1000 (8 digits).
 * Example: NVDA270115C00200000 = NVDA call, strike 200, expiring 2027-01-15.
 */
const OCC_PATTERN = /^([A-Z0-9.]{1,6})(\d{2})(\d{2})(\d{2})([CP])(\d{8})$/;

export interface OccParts {
  root: string;
  expiration: string;
  type: OptionType;
  strike: number;
}

export function parseOccSymbol(symbol: string): OccParts | null {
  const match = OCC_PATTERN.exec(symbol.replace(/^O:/, '').replace(/\s+/g, ''));
  if (!match) return null;
  const [, root, yy, mm, dd, cp, strike] = match;
  return {
    root,
    expiration: `20${yy}-${mm}-${dd}`,
    type: cp === 'C' ? 'call' : 'put',
    strike: Number(strike) / 1000,
  };
}

export function formatOccSymbol({ root, expiration, type, strike }: OccParts): string {
  const [yyyy, mm, dd] = expiration.split('-');
  const strikeDigits = String(Math.round(strike * 1000)).padStart(8, '0');
  return `${root}${yyyy.slice(2)}${mm}${dd}${type === 'call' ? 'C' : 'P'}${strikeDigits}`;
}
