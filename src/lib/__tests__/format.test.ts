import { formatCompactMoney, formatCount, formatLongDate, formatPercentExact, formatSignedPercent } from '../format';

describe('format', () => {
  it('shortens big money', () => {
    expect(formatCompactMoney(4.4e12)).toBe('$4.4T');
    expect(formatCompactMoney(2.4e11)).toBe('$240B');
    expect(formatCompactMoney(1.26e9)).toBe('$1.3B');
    expect(formatCompactMoney(6.5e8)).toBe('$650M');
    expect(formatCompactMoney(-9e7)).toBe('-$90M');
    expect(formatCompactMoney(12_500)).toBe('$12.5K');
    expect(formatCompactMoney(950)).toBe('$950');
    expect(formatCompactMoney(0)).toBe('$0');
  });

  it('signs changes and shows small ratios exactly', () => {
    expect(formatSignedPercent(0.62)).toBe('+62%');
    expect(formatSignedPercent(-0.02)).toBe('-2%');
    expect(formatSignedPercent(0)).toBe('0%');
    expect(formatPercentExact(0.0035)).toBe('0.35%');
    expect(formatCount(42_000)).toBe('42,000');
  });

  it('spells out a date with its weekday', () => {
    expect(formatLongDate('2027-01-15')).toBe('Friday, January 15, 2027');
  });
});
