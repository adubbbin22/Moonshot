import { formatCompactMoney, formatPercent, formatSignedPercent } from '@/lib/format';

/** Figures for stat tiles: a dash when the source doesn't have one. */
export const money = (n?: number) => (n === undefined ? '—' : formatCompactMoney(n));
export const pct = (n?: number) => (n === undefined ? '—' : formatPercent(n));
export const change = (n?: number) => (n === undefined ? '—' : formatSignedPercent(n));
export const ratio = (n?: number) => (n === undefined ? '—' : n >= 100 ? String(Math.round(n)) : String(Number(n.toFixed(1))));
