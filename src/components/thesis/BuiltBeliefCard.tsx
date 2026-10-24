import { StyleSheet } from 'react-native';

import { Card, Text } from '@/components/ui';
import { builtBelief, gutCheck, weakestLink, type Ratings } from '@/domain/thesisTree';
import type { ThesisTree } from '@/domain/types';
import { formatPercent } from '@/lib/format';
import { colors } from '@/theme/tokens';

const VERDICTS = {
  lower:
    'Every part has to hold, so the whole is less likely than it feels. People do this all the time: a story with several parts feels more likely than any one part, but it’s less likely.',
  higher: 'Your parts add up to more than your gut. Either a part is rated too high, or your gut is missing something.',
  close: 'Your parts agree with your gut.',
} as const;

/** What the parts multiply out to, set against the gut number. */
export function BuiltBeliefCard({ tree, ratings, gut }: { tree: ThesisTree; ratings: Ratings; gut?: number }) {
  const belief = builtBelief(tree, ratings);
  const total = tree.premises.length;

  if (belief === undefined) {
    const rated = tree.premises.filter((p) => ratings[p.id] !== undefined).length;
    return (
      <Card>
        <Text tone="muted">
          Rate all {total} parts to see what they add up to. {rated} of {total} done.
        </Text>
      </Card>
    );
  }

  const weakest = weakestLink(tree, ratings);
  return (
    <Card style={styles.card}>
      <Text variant="label" tone="muted">
        Your belief, built from its parts
      </Text>
      <Text variant="display">{formatPercent(belief)}</Text>
      <Text variant="caption" tone="faint">
        {tree.premises.map((p) => formatPercent(ratings[p.id])).join(' × ')} = {formatPercent(belief)}
      </Text>
      {gut !== undefined ? (
        <Text>
          Your gut said {formatPercent(gut)}. {VERDICTS[gutCheck(gut, belief)]}
        </Text>
      ) : null}
      {weakest ? (
        <Text tone="muted">
          Weakest link: “{weakest.claim}” at {formatPercent(ratings[weakest.id])}. Your belief can’t be more likely
          than its weakest part.
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: colors.violet },
});
