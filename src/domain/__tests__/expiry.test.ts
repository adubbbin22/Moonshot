import { daysBetween, earningsBeforeExpiry, isThirdFriday, laterExpirationFloors } from '../expiry';

describe('expiry', () => {
  it('counts whole days between dates', () => {
    expect(daysBetween('2027-06-30', '2027-08-20')).toBe(51);
    expect(daysBetween('2027-08-20', '2027-06-30')).toBe(-51);
    expect(daysBetween('2027-01-15', '2027-01-15')).toBe(0);
  });

  it('recognises standard monthly expirations', () => {
    expect(isThirdFriday('2027-01-15')).toBe(true);
    expect(isThirdFriday('2027-08-20')).toBe(true);
    expect(isThirdFriday('2027-01-22')).toBe(false); // fourth Friday
    expect(isThirdFriday('2027-01-14')).toBe(false); // a Thursday
  });

  it('says whether the next earnings report lands before expiry', () => {
    const now = new Date('2026-10-24T15:00:00.000Z');
    expect(earningsBeforeExpiry('2026-11-18', '2027-01-15', now)).toBe(true);
    expect(earningsBeforeExpiry('2027-02-24', '2027-01-15', now)).toBe(false);
    expect(earningsBeforeExpiry('2026-10-01', '2027-01-15', now)).toBe(false); // already happened
    expect(earningsBeforeExpiry(undefined, '2027-01-15', now)).toBeUndefined();
  });

  it('spreads the floors for later expirations out', () => {
    expect(laterExpirationFloors('2027-01-15')).toEqual(['2027-01-16', '2027-03-16', '2027-06-14']);
  });
});
