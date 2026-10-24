export function formatMoney(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}$${Math.abs(rounded).toLocaleString('en-US')}`;
}

export function formatSignedMoney(amount: number): string {
  return amount > 0 ? `+${formatMoney(amount)}` : formatMoney(amount);
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

export function formatMultiple(multiple: number): string {
  if (multiple === 0) return '0x';
  return multiple < 10 ? `${Number(multiple.toFixed(1))}x` : `${Math.round(multiple)}x`;
}
