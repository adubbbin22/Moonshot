import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { outcomeTable } from '@/domain/payoff';
import type { Scenario } from '@/domain/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * What your stake turns into in each scenario. Bar length is the ending
 * value, so the lopsided shape of an asymmetric bet is visible at a glance.
 */
export function OutcomeChart({ stake, scenarios }: { stake: number; scenarios: Scenario[] }) {
  const rows = outcomeTable(stake, scenarios);
  const maxValue = Math.max(...rows.map((r) => r.value), stake);

  return (
    <View style={styles.wrap}>
      {rows.map((row) => {
        const gain = row.value >= stake;
        const color = gain ? colors.upside : colors.downside;
        return (
          <View
            key={row.label}
            style={styles.row}
            accessible
            accessibilityLabel={`${row.label}: ${formatPercent(row.probability)} chance, ${formatMoney(stake)} becomes ${formatMoney(row.value)}`}>
            <View style={styles.rowHeader}>
              <Text variant="label">{row.label}</Text>
              <Text variant="caption" tone="faint">
                {formatPercent(row.probability)} chance
              </Text>
            </View>
            <View style={styles.barLine}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.bar,
                    { width: `${Math.max(2, (row.value / maxValue) * 100)}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text variant="label" style={[styles.value, { color }]}>
                {formatMoney(row.value)}
              </Text>
            </View>
          </View>
        );
      })}
      <Text variant="caption" tone="faint">
        Odds are illustrative estimates, not predictions.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  row: { gap: spacing.xs },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  barLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: radius.pill },
  value: { minWidth: 64, textAlign: 'right' },
});
