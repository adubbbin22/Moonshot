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
