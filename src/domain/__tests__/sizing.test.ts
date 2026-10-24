import {
  barbellSplit,
  checkStake,
  maxStakePerBet,
  remainingBudget,
  stakeOptions,
} from '../sizing';
import type { Position, Profile } from '../types';

const profile: Profile = { onboarded: true, monthlyBudget: 100, maxPerBetPct: 0.25 };
const now = new Date('2026-10-23T12:00:00.000Z');

function position(stake: number, placedAt: string): Position {
  return {
    id: `${stake}-${placedAt}`,
    betId: 'x',
    stake,
    placedAt,
    thesis: '',
    source: { type: 'direct' },
    status: 'open',
  };
}

describe('budget', () => {
  it('derives the per-bet cap from the monthly budget', () => {
    expect(maxStakePerBet(profile)).toBe(25);
  });

  it('only counts bets placed this calendar month', () => {
    const positions = [
      position(20, '2026-10-02T00:00:00.000Z'),
      position(10, '2026-10-20T00:00:00.000Z'),
      position(50, '2026-09-30T00:00:00.000Z'),
    ];
    expect(remainingBudget(profile, positions, now)).toBe(70);
  });

  it('never reports a negative remaining budget', () => {
    expect(remainingBudget(profile, [position(150, '2026-10-01T00:00:00.000Z')], now)).toBe(0);
  });
});

describe('checkStake', () => {
  it('accepts a stake within every limit', () => {
    expect(checkStake(25, profile, [], now)).toEqual({ ok: true });
  });

  it('rejects stakes below the minimum', () => {
    expect(checkStake(1, profile, [], now)).toMatchObject({ ok: false });
  });

  it('rejects stakes over the per-bet cap', () => {
    const result = checkStake(30, profile, [], now);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.reason).toMatch(/\$25 per-bet limit/);
  });

  it('rejects stakes over what is left this month', () => {
    const spent = [position(90, '2026-10-05T00:00:00.000Z')];
    const result = checkStake(20, profile, spent, now);
    expect(!result.ok && result.reason).toMatch(/\$10 left/);
  });
});

describe('stakeOptions', () => {
  it('offers presets up to the per-bet cap', () => {
    expect(stakeOptions(profile, [], now)).toEqual([5, 10, 25]);
  });

  it('adds the exact ceiling when it falls between presets', () => {
    const spent = [position(82, '2026-10-05T00:00:00.000Z')];
    expect(stakeOptions(profile, spent, now)).toEqual([5, 10, 18]);
  });

  it('offers nothing once the month is spent', () => {
    const spent = [position(100, '2026-10-05T00:00:00.000Z')];
    expect(stakeOptions(profile, spent, now)).toEqual([]);
  });
});

describe('barbellSplit', () => {
  it('keeps most money safe by default', () => {
    expect(barbellSplit(10_000)).toEqual({ safe: 9_000, moonshot: 1_000 });
  });
});
