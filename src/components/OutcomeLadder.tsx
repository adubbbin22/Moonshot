import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { OutcomeRow } from '@/domain/strategy';
import { formatMoney, formatPercent } from '@/lib/format';
import { rangeLabel } from '@/lib/strategyText';
import { colors, radius, spacing } from '@/theme/tokens';

function valueLabel(row: OutcomeRow, contracts: number): string {
  const from = row.valueFrom * contracts;
  if (row.valueTo === null) return `${formatMoney(from)}+`;
  const to = row.valueTo * contracts;
  return Math.round(from) === Math.round(to) ? formatMoney(from) : `${formatMoney(from)}–${formatMoney(to)}`;
}

/**
 * Where the underlying could finish at expiry, what the bet is worth in each
 * case, and how likely the options market thinks each case is.
 */
export function OutcomeLadder({
  underlying,
  outcomes,
  contracts,
}: {
  underlying: string;
  outcomes: OutcomeRow[];
  contracts: number;
}) {
  return (
    <View style={styles.wrap}>
      {outcomes.map((row) => {
        const color = row.valueFrom > 0 ? colors.upside : colors.downside;
        return (
          <View
            key={row.label}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.label}: ${rangeLabel(underlying, row.lower, row.upper)}, worth ${valueLabel(row, contracts)}, ${formatPercent(row.probability)} market odds`}>
            <View style={styles.rowHeader}>
              <Text variant="label">{row.label}</Text>
              <Text variant="label" style={{ color }}>
                {valueLabel(row, contracts)}
              </Text>
            </View>
            <View style={styles.rowHeader}>
              <Text variant="caption" tone="faint">
                {rangeLabel(underlying, row.lower, row.upper)}
              </Text>
              <Text variant="caption" tone="muted">
                {formatPercent(row.probability)}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${Math.max(1, row.probability * 100)}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
      <Text variant="caption" tone="faint">
        Odds are implied by today’s option prices (risk-neutral). They show what the market is pricing,
        not a prediction.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  row: { gap: spacing.xs },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.pill },
});
