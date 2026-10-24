import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { instrumentLine } from '@/components/BetCard';
import { Button, Card, Screen, Stat, StatRow, Text } from '@/components/ui';
import { bestMultiple, summarizePortfolio } from '@/domain/payoff';
import type { Position } from '@/domain/types';
import { formatMoney } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { spacing } from '@/theme/tokens';

/** The user's open bets, framed as a power-law portfolio. */
export default function PortfolioScreen() {
  const { positions } = useAppState();
  const summary = summarizePortfolio(positions, catalog.getBet);

  return (
    <Screen title="Your bets" subtitle="Expect most to go to zero. You only need one to hit.">
      <Card>
        <StatRow>
          <Stat label="Max you can lose" value={formatMoney(summary.totalAtRisk)} tone="downside" />
          <Stat label="If your best one hits" value={formatMoney(summary.oneHitValue)} tone="upside" />
          <Stat label="Open bets" value={String(summary.openCount)} />
        </StatRow>
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
  if (!bet) return null;

  return (
    <Card onPress={() => router.push({ pathname: '/bet/[id]', params: { id: bet.id } })}>
      <View style={styles.positionHeader}>
        <View style={styles.positionTitle}>
          <Text variant="heading">{bet.title}</Text>
          <Text variant="caption" tone="faint">
            {instrumentLine(bet)}
          </Text>
        </View>
        <View style={styles.positionStake}>
          <Text variant="heading">{formatMoney(position.stake)}</Text>
          <Text variant="caption" tone="upside">
            up to {formatMoney(position.stake * bestMultiple(bet.scenarios))}
          </Text>
        </View>
      </View>
      {position.thesis ? (
        <Text tone="muted" numberOfLines={3}>
          “{position.thesis}”
        </Text>
      ) : null}
      <Text variant="caption" tone="faint">
        Placed {new Date(position.placedAt).toLocaleDateString()} · Check back by {bet.horizon}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { gap: spacing.md },
  positionHeader: { flexDirection: 'row', gap: spacing.md },
  positionTitle: { flex: 1, gap: spacing.xs },
  positionStake: { alignItems: 'flex-end', gap: spacing.xs },
});
