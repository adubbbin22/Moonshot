import { StyleSheet, View } from 'react-native';

import { Card, Chip, Text } from '@/components/ui';
import { daysBetween, earningsBeforeExpiry, isThirdFriday } from '@/domain/expiry';
import { RESOLUTION_BUFFER_DAYS } from '@/domain/horizon';
import type { PricedStrategy } from '@/domain/strategy';
import { formatDate, formatLongDate, formatMoney, formatMultiple } from '@/lib/format';
import { spacing } from '@/theme/tokens';

export interface ExpirationPickerProps {
  /** The bet as priced on the chosen expiration. */
  priced: PricedStrategy;
  /** The same bet on each expiration it can be taken at, earliest first. */
  options: PricedStrategy[];
  loading: boolean;
  onSelect: (expiration: string) => void;
  /** The question this bet is shown for, if any. */
  resolvesOn?: string;
  /** The company's next earnings date, if known. */
  nextEarnings?: string;
}

/**
 * The contract's expiration day: what it means, how it sits against the
 * question and the next earnings report, and the later expirations the
 * same bet can be taken on.
 */
export function ExpirationPicker({ priced, options, loading, onSelect, resolvesOn, nextEarnings }: ExpirationPickerProps) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const upcomingEarnings = nextEarnings && nextEarnings >= today ? nextEarnings : undefined;
  const earningsBefore = earningsBeforeExpiry(upcomingEarnings, priced.expiration, now);

  return (
    <Card>
      <Text variant="label" tone="muted">
        Expiration
      </Text>
      <Text variant="heading">{formatLongDate(priced.expiration)}</Text>
      <Text tone="muted">
        {priced.daysToExpiry} days away · {isThirdFriday(priced.expiration) ? 'standard monthly expiry' : 'non-standard expiry'}. The
        contract stops trading at the close that day, and where {priced.underlying} finishes decides the payout.
      </Text>
      {resolvesOn ? (
        <Text variant="caption" tone="faint">
          The question resolves {formatDate(resolvesOn)}. That leaves {daysBetween(resolvesOn, priced.expiration)} days for the
          market to react before the contract ends (Moonshot requires at least {RESOLUTION_BUFFER_DAYS}).
        </Text>
      ) : null}
      {upcomingEarnings ? (
        <Text variant="caption" tone="faint">
          {earningsBefore
            ? `Earnings on ${formatDate(upcomingEarnings)} land before this expires.`
            : `The next earnings report (${formatDate(upcomingEarnings)}) comes after this expires.`}
        </Text>
      ) : null}
      <View style={styles.chips}>
        {options.map((option) => (
          <Chip
            key={option.expiration}
            label={`${formatDate(option.expiration)} · ${formatMoney(option.costPerContract)} · ${
              option.payoffMultiple === null ? 'no cap' : formatMultiple(option.payoffMultiple)
            }`}
            selected={option.expiration === priced.expiration}
            onPress={() => onSelect(option.expiration)}
          />
        ))}
      </View>
      <Text variant="caption" tone="faint">
        {loading
          ? 'Looking for later expirations… '
          : options.length > 1
            ? 'Later expirations cost more and give the thesis more time. '
            : 'No later expiration is listed. '}
        {resolvesOn
          ? 'Earlier ones would end before the question resolves, so they aren’t offered.'
          : 'Earlier ones fall inside this bet’s minimum horizon, so they aren’t offered.'}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
