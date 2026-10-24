import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { Bet, EventQuestion } from '@/domain/types';
import { usePricedBet } from '@/hooks/usePricedBet';
import { formatMoney, formatPercent } from '@/lib/format';
import { STRUCTURE_LABELS } from '@/theme/categories';
import { colors, spacing } from '@/theme/tokens';

export interface BetCardProps {
  bet: Bet;
  /** The question this bet is shown for, so it's priced past the question's resolution. */
  question?: EventQuestion;
  onPress: () => void;
}

export function BetCard({ bet, question, onPress }: BetCardProps) {
  const state = usePricedBet(bet, question);
  const { strategy } = bet;

  return (
    <Card onPress={onPress} accessibilityLabel={`${bet.title}. ${bet.pitch}`}>
      <View style={styles.header}>
        <Text variant="heading">{bet.title}</Text>
        <Text variant="caption" tone="faint">
          {strategy.underlying} · {STRUCTURE_LABELS[strategy.kind]}
          {state.status === 'ready' ? ` · ${state.priced.daysToExpiry} days` : ''}
        </Text>
      </View>
      <Text tone="muted">{bet.pitch}</Text>
      {state.status === 'loading' ? <ActivityIndicator color={colors.textFaint} style={styles.loading} /> : null}
      {state.status === 'error' ? (
        <Text variant="caption" tone="downside">
          Couldn’t price this right now.
        </Text>
      ) : null}
      {state.status === 'ready' ? (
        <View style={styles.stats}>
          <MiniStat label="Costs" value={formatMoney(state.priced.costPerContract)} tone="downside" />
          <MiniStat
            label="Pays up to"
            value={
              state.priced.maxValuePerContract === null
                ? 'No cap'
                : formatMoney(state.priced.maxValuePerContract)
            }
            tone="upside"
          />
          <MiniStat label="Market odds" value={formatPercent(state.priced.probProfit)} />
        </View>
      ) : null}
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
  stats: { flexDirection: 'row', gap: spacing.md },
  miniStat: { flex: 1, gap: 2 },
  loading: { alignSelf: 'flex-start' },
});
