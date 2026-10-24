import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { maxStakePerBet, spentThisMonth } from '@/domain/sizing';
import type { Position, Profile } from '@/domain/types';
import { formatMoney } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

export function BudgetMeter({ profile, positions }: { profile: Profile; positions: Position[] }) {
  const spent = spentThisMonth(positions, new Date());
  const used = profile.monthlyBudget > 0 ? Math.min(1, spent / profile.monthlyBudget) : 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text variant="label">
          {formatMoney(spent)} of {formatMoney(profile.monthlyBudget)} used this month
        </Text>
        <Text variant="caption" tone="faint">
          {formatMoney(maxStakePerBet(profile))} max per bet
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${used * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.violet },
});
