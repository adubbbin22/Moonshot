export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}$${Math.abs(rounded).toLocaleString('en-US')}`;
}

/** Prices and strikes: whole dollars when exact, otherwise cents. */
export function formatPrice(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

export function formatPercent(fraction: number): string {
  if (fraction > 0 && fraction < 0.01) return '<1%';
  return `${Math.round(fraction * 100)}%`;
}

export function formatMultiple(multiple: number): string {
  return multiple < 10 ? `${Number(multiple.toFixed(1))}x` : `${Math.round(multiple)}x`;
}

/** "Jan 21, 2028" from an ISO date. */
export function formatDate(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Big money in short form: $4.3T, $216B, $650M, $12K. Negatives keep the sign. */
export function formatCompactMoney(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const n = abs / size;
      return `${sign}$${n >= 100 ? Math.round(n) : Number(n.toFixed(1))}${suffix}`;
    }
  }
  return `${sign}$${Math.round(abs)}`;
}

/** Growth and changes: "+62%", "-3%", "0%". */
export function formatSignedPercent(fraction: number): string {
  const p = Math.round(fraction * 100);
  return `${p > 0 ? '+' : ''}${p}%`;
}

/** Small ratios like expense ratios: "0.35%". */
export function formatPercentExact(fraction: number, digits = 2): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatCount(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** "Friday, January 15, 2027" from an ISO date. */
export function formatLongDate(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T12:00:00.000Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

