import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { carriedBelief, weakestLink, withCallRatings } from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { useTheses } from '@/hooks/useThesis';
import { formatPercent } from '@/lib/format';
import { thesisDrafter } from '@/services/intelligence/thesisDrafter';
import { useAppState } from '@/state/store';
import { colors, spacing } from '@/theme/tokens';

/** Entry point for reasoning from a belief, through its parts and consequences, to bets. */
export default function ThesesScreen() {
  const trees = useTheses();

  return (
    <Screen
      title="Build a thesis"
      subtitle="Break a belief into the parts it depends on, follow what it means, and see the bets that pay if you’re right.">
      {thesisDrafter.id !== 'off' ? (
        <Card onPress={() => router.push('/thesis/draft')} style={styles.own}>
          <Text style={styles.emoji}>💡</Text>
          <View style={styles.text}>
            <Text variant="heading">Start from your own belief</Text>
            <Text tone="muted">Type what you think happens. A model drafts the tree; you do the reasoning.</Text>
          </View>
        </Card>
      ) : null}
      {trees.map((tree) => (
        <TreeCard key={tree.id} tree={tree} />
      ))}
    </Screen>
  );
}

function TreeCard({ tree }: { tree: ThesisTree }) {
  const { thesisWork, calls } = useAppState();
  const work = thesisWork[tree.id];
  const { ratings } = withCallRatings(tree, work?.ratings ?? {}, calls);
  const belief = carriedBelief(tree, ratings, work?.blend);
  const weakest = weakestLink(tree, ratings);

  return (
    <Card
      onPress={() => router.push({ pathname: '/thesis/[id]', params: { id: tree.id } })}
      style={[styles.tree, belief !== undefined && styles.worked]}>
      <Text style={styles.emoji}>{tree.emoji}</Text>
      <View style={styles.text}>
        <Text variant="heading">{tree.hook}</Text>
        <Text tone="muted">{tree.belief}</Text>
        {tree.provenance ? (
          <Text variant="caption" tone="downside">
            Drafted by AI from “{tree.provenance.prompt}”
          </Text>
        ) : null}
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
}

const styles = StyleSheet.create({
  own: { flexDirection: 'row', alignItems: 'flex-start', borderColor: colors.accent },
  tree: { flexDirection: 'row', alignItems: 'flex-start' },
  worked: { borderColor: colors.violet },
  emoji: { fontSize: 32, lineHeight: 40 },
  text: { flex: 1, gap: spacing.xs },
  yours: { color: colors.violet },
});
