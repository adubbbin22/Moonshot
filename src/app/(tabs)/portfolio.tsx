import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Stat, StatRow, Text } from '@/components/ui';
import { positionCost, positionMaxValue, summarizePortfolio } from '@/domain/portfolio';
import type { Position } from '@/domain/types';
import { formatMoney, formatPrice } from '@/lib/format';
import { positionLabel } from '@/lib/strategyText';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { spacing } from '@/theme/tokens';

/** The user's open bets, framed as a power-law portfolio. */
export default function PortfolioScreen() {
  const { positions } = useAppState();
  const summary = summarizePortfolio(positions);

  return (
    <Screen title="Your bets" subtitle="Expect most to expire worthless. Size them so that’s fine.">
      <Card>
        <StatRow>
          <Stat label="Max you can lose" value={formatMoney(summary.totalAtRisk)} tone="downside" />
          <Stat
            label="If your best one hits"
            value={summary.hasUncapped ? 'No cap' : formatMoney(summary.oneHitValue)}
            tone="upside"
          />
          <Stat label="Open bets" value={String(summary.openCount)} />
        </StatRow>
        {positions.length > 0 ? (
          <Button label="Simulate returns" variant="secondary" onPress={() => router.push('/simulate')} />
        ) : null}
      </Card>

      {positions.length === 0 ? (
        <Card style={styles.empty}>
          <Text variant="heading">No bets yet</Text>
          <Text tone="muted">
            Pick a question from the feed or build a thesis. Start small: the point is to take many
            cheap shots, not one big one.
          </Text>
          <Button label="Go to the feed" onPress={() => router.navigate('/')} />
        </Card>
      ) : (
        positions.map((position) => <PositionCard key={position.id} position={position} />)
      )}
    </Screen>
  );
}

function PositionCard({ position }: { position: Position }) {
  const bet = catalog.getBet(position.betId);
  const maxValue = positionMaxValue(position);

  return (
    <Card
      onPress={bet ? () => router.push({ pathname: '/bet/[id]', params: { id: bet.id } }) : undefined}>
      <View style={styles.positionHeader}>
        <View style={styles.positionTitle}>
          <Text variant="heading">{bet?.title ?? position.underlying}</Text>
          <Text variant="caption" tone="faint">
            {position.contracts} × {positionLabel(position.underlying, position.kind, position.legs, position.expiration)}
          </Text>
        </View>
        <View style={styles.positionStake}>
          <Text variant="heading">{formatMoney(positionCost(position))}</Text>
          <Text variant="caption" tone="upside">
            {maxValue === null ? 'no cap' : `up to ${formatMoney(maxValue)}`}
          </Text>
        </View>
      </View>
      {position.thesis ? (
        <Text tone="muted" numberOfLines={3}>
          “{position.thesis}”
        </Text>
      ) : null}
      {position.killCriteria ? (
        <View style={styles.watch}>
          <Text variant="caption" tone="faint">
            Watch for
          </Text>
          {position.killCriteria.map((signal) => (
            <Text key={signal} variant="caption" tone="muted">
              • {signal}
            </Text>
          ))}
        </View>
      ) : null}
      <Text variant="caption" tone="faint">
        Breakeven {formatPrice(Math.round(position.breakeven * 100) / 100)} · Placed{' '}
        {new Date(position.placedAt).toLocaleDateString()}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { gap: spacing.md },
  positionHeader: { flexDirection: 'row', gap: spacing.md },
  positionTitle: { flex: 1, gap: spacing.xs },
  positionStake: { alignItems: 'flex-end', gap: spacing.xs },
  watch: { gap: 2 },
});
