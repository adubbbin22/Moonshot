import {
  barbellSplit,
  checkStake,
  contractOptions,
  maxStakePerBet,
  MAX_CONTRACTS,
  remainingBudget,
} from '../sizing';
import type { Profile } from '../types';
import { makePosition } from '@/test/fixtures';

const profile: Profile = { onboarded: true, monthlyBudget: 500, maxPerBetPct: 0.3 };
const now = new Date('2026-10-23T12:00:00.000Z');

const spent = (cost: number, placedAt: string) =>
  makePosition({ id: `${cost}-${placedAt}`, costPerContract: cost, contracts: 1, placedAt });

describe('budget', () => {
  it('derives the per-bet cap from the monthly budget', () => {
    expect(maxStakePerBet(profile)).toBe(150);
  });

  it('only counts bets placed this calendar month, at contracts x cost', () => {
    const positions = [
      makePosition({ costPerContract: 60, contracts: 2, placedAt: '2026-10-02T00:00:00.000Z' }),
      spent(100, '2026-10-20T00:00:00.000Z'),
      spent(300, '2026-09-30T00:00:00.000Z'),
    ];
    expect(remainingBudget(profile, positions, now)).toBe(280);
  });

  it('never reports a negative remaining budget', () => {
    expect(remainingBudget(profile, [spent(900, '2026-10-01T00:00:00.000Z')], now)).toBe(0);
  });
});

describe('checkStake', () => {
  it('accepts a stake within every limit', () => {
    expect(checkStake(120, profile, [], now)).toEqual({ ok: true });
  });

  it('rejects an empty stake', () => {
    expect(checkStake(0, profile, [], now)).toMatchObject({ ok: false });
  });

  it('rejects stakes over the per-bet cap', () => {
    const result = checkStake(200, profile, [], now);
    expect(!result.ok && result.reason).toMatch(/\$150 per-bet limit/);
  });

  it('rejects stakes over what is left this month', () => {
    const result = checkStake(120, profile, [spent(420, '2026-10-05T00:00:00.000Z')], now);
    expect(!result.ok && result.reason).toMatch(/\$80 left/);
  });
});

describe('contractOptions', () => {
  it('offers as many whole contracts as fit under the ceiling', () => {
    expect(contractOptions(45, profile, [], now)).toEqual([1, 2, 3]);
  });

  it('offers nothing when one contract is over the ceiling', () => {
    expect(contractOptions(184, profile, [], now)).toEqual([]);
  });

  it('shrinks as the monthly budget gets used', () => {
    expect(contractOptions(45, profile, [spent(400, '2026-10-05T00:00:00.000Z')], now)).toEqual([1, 2]);
  });

  it('caps the count for very cheap contracts', () => {
    expect(contractOptions(1, profile, [], now)).toHaveLength(MAX_CONTRACTS);
  });

  it('rejects non-positive costs', () => {
    expect(contractOptions(0, profile, [], now)).toEqual([]);
  });
});

describe('barbellSplit', () => {
  it('keeps most money safe by default', () => {
    expect(barbellSplit(10_000)).toEqual({ safe: 9_000, moonshot: 1_000 });
  });
});
