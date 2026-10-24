import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { builtBelief, weakestLink, withCallRatings } from '@/domain/thesisTree';
import { formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { colors, spacing } from '@/theme/tokens';

/** Entry point for reasoning from a belief, through its parts and consequences, to bets. */
export default function ThesesScreen() {
  const { thesisWork, calls } = useAppState();

  return (
    <Screen
      title="Build a thesis"
      subtitle="Break a belief into the parts it depends on, follow what it means, and see the bets that pay if you’re right.">
      {catalog.listTheses().map((tree) => {
        const { ratings } = withCallRatings(tree, thesisWork[tree.id]?.ratings ?? {}, calls);
        const belief = builtBelief(tree, ratings);
        const weakest = weakestLink(tree, ratings);
        return (
          <Card
            key={tree.id}
            onPress={() => router.push({ pathname: '/thesis/[id]', params: { id: tree.id } })}
            style={[styles.tree, belief !== undefined && styles.worked]}>
            <Text style={styles.emoji}>{tree.emoji}</Text>
            <View style={styles.text}>
              <Text variant="heading">{tree.hook}</Text>
              <Text tone="muted">{tree.belief}</Text>
              {belief === undefined ? (
                <Text variant="caption" tone="faint">
                  {tree.title} · {tree.premises.length} parts to weigh
                </Text>
              ) : (
                <Text variant="caption" style={styles.yours}>
                  Your number: {formatPercent(belief)}
                  {weakest ? ` · weakest link: ${weakest.claim.toLowerCase()}` : ''}
                </Text>
              )}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tree: { flexDirection: 'row', alignItems: 'flex-start' },
  worked: { borderColor: colors.violet },
  emoji: { fontSize: 32, lineHeight: 40 },
  text: { flex: 1, gap: spacing.xs },
  yours: { color: colors.violet },
});
