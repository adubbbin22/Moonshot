import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatPercent } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

/** How Moonshot users split on a yes/no question. */
export function CrowdBar({ yes }: { yes: number }) {
  return (
    <View style={styles.wrap} accessibilityLabel={`${formatPercent(yes)} of Moonshot users say yes`}>
      <View style={styles.bar}>
        <View style={[styles.segment, { flex: yes, backgroundColor: colors.yes }]} />
        <View style={[styles.segment, { flex: 1 - yes, backgroundColor: colors.no }]} />
      </View>
      <View style={styles.labels}>
        <Text variant="caption" style={{ color: colors.yes }}>
          {formatPercent(yes)} yes
        </Text>
        <Text variant="caption" tone="faint">
          Moonshot crowd
        </Text>
        <Text variant="caption" style={{ color: colors.no }}>
          {formatPercent(1 - yes)} no
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  bar: { flexDirection: 'row', height: 6, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  segment: { height: '100%' },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
