import { formatDate, formatPrice } from './format';
import type { OptionType, StructureKind } from '@/domain/types';
import { STRUCTURE_LABELS } from '@/theme/categories';

interface LegLike {
  action: 'buy' | 'sell';
  type: OptionType;
  strike: number;
}

/** "$235/$240 call spread" or "$115 call". */
export function strikesLabel(kind: StructureKind, legs: LegLike[]): string {
  const buy = legs.find((l) => l.action === 'buy');
  const sell = legs.find((l) => l.action === 'sell');
  if (!buy) return STRUCTURE_LABELS[kind];
  return sell
    ? `${formatPrice(buy.strike)}/${formatPrice(sell.strike)} ${buy.type} spread`
    : `${formatPrice(buy.strike)} ${buy.type}`;
}

/** "NVDA $235/$240 call spread · Jan 21, 2028" */
export function positionLabel(underlying: string, kind: StructureKind, legs: LegLike[], expiration: string): string {
  return `${underlying} ${strikesLabel(kind, legs)} · ${formatDate(expiration)}`;
}

/** "NVDA below $235", "NVDA $235–$240", "NVDA above $240" */
export function rangeLabel(underlying: string, lower: number | null, upper: number | null): string {
  if (lower === null && upper !== null) return `${underlying} below ${formatPrice(round2(upper))}`;
  if (upper === null && lower !== null) return `${underlying} above ${formatPrice(round2(lower))}`;
  return `${underlying} ${formatPrice(round2(lower ?? 0))}–${formatPrice(round2(upper ?? 0))}`;
}

const round2 = (x: number) => Math.round(x * 100) / 100;
