import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { bestMultiple, lossProbability } from '@/domain/payoff';
import type { Bet } from '@/domain/types';
import { formatMultiple, formatPercent } from '@/lib/format';
import { INSTRUMENT_LABELS } from '@/theme/categories';
import { spacing } from '@/theme/tokens';

export function instrumentLine(bet: Bet): string {
  const { instrument } = bet;
  const parts = [instrument.symbol, INSTRUMENT_LABELS[instrument.kind]];
  if (instrument.expiry) parts.push(instrument.expiry);
  return parts.join(' · ');
}

export function BetCard({ bet, onPress }: { bet: Bet; onPress: () => void }) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${bet.title}. ${bet.pitch}`}>
      <View style={styles.header}>
        <Text variant="heading" style={styles.title}>
          {bet.title}
        </Text>
        <Text variant="caption" tone="faint">
          {instrumentLine(bet)}
        </Text>
      </View>
      <Text tone="muted">{bet.pitch}</Text>
      <View style={styles.stats}>
        <MiniStat label="Worst case" value="Lose stake" tone="downside" />
        <MiniStat label="Best case" value={formatMultiple(bestMultiple(bet.scenarios))} tone="upside" />
        <MiniStat label="Chance of loss" value={formatPercent(lossProbability(bet.scenarios))} />
      </View>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'upside' | 'downside';
}) {
  return (
    <View style={styles.miniStat}>
      <Text variant="label" tone={tone}>
        {value}
      </Text>
      <Text variant="caption" tone="faint">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  title: { flexShrink: 1 },
  stats: { flexDirection: 'row', gap: spacing.md },
  miniStat: { flex: 1, gap: 2 },
});
