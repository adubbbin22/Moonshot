import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { shapeTag } from '@/components/BetExpressions';
import { Card, Text } from '@/components/ui';
import { impliedOdds } from '@/domain/strategy';
import { SHAPES } from '@/domain/structures';
import type { Bet, EventQuestion } from '@/domain/types';
import { usePricedBets } from '@/hooks/usePricedBet';
import { formatMoney, formatPercent } from '@/lib/format';
import { strikesLabel } from '@/lib/strategyText';
import { catalog } from '@/services/catalog';
import { colors, radius, spacing } from '@/theme/tokens';

export interface ShapeLadderProps {
  bet: Bet;
  question?: EventQuestion;
  /** Route params to carry to a sibling shape (event, thesis), so its reasoning stays attached. */
  params: Record<string, string | undefined>;
}

/** On the bet screen: the same idea in its other shapes, priced, one tap away. */
export function ShapeLadder({ bet, question, params }: ShapeLadderProps) {
  const siblings = catalog.ladderFor(bet).filter((b) => b.id !== bet.id);
  const states = usePricedBets(
    siblings.map((b) => b.id),
    question?.id,
  );
  if (siblings.length === 0) return null;

  return (
    <Card>
      <Text variant="label" tone="muted">
        Other ways to take this bet
      </Text>
      <Text variant="caption" tone="faint">
        {SHAPES.map((s) => `${s.label}: ${s.description}`).join(' ')}
      </Text>
      {siblings.map((sibling, i) => {
        const state = states[i];
        return (
          <Pressable
            key={sibling.id}
            accessibilityRole="button"
            onPress={() => router.replace({ pathname: '/bet/[id]', params: { ...params, id: sibling.id } })}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            {state.status === 'loading' ? <ActivityIndicator color={colors.textFaint} /> : null}
            {state.status === 'error' ? (
              <Text variant="caption" tone="faint">
                Couldn’t price this shape right now.
              </Text>
            ) : null}
            {state.status === 'ready' ? (
              <>
                <View style={styles.rowHeader}>
                  <Text variant="label">{shapeTag(sibling, state.priced)}</Text>
                  <Text variant="caption" tone="faint">
                    ›
                  </Text>
                </View>
                <Text variant="caption" tone="faint">
                  {state.priced.underlying} {strikesLabel(state.priced.kind, state.priced.legs)}
                </Text>
                <View style={styles.stats}>
                  <Text variant="caption" tone="downside">
                    Costs {formatMoney(state.priced.costPerContract)}
                  </Text>
                  <Text variant="caption" tone="upside">
                    {state.priced.maxValuePerContract === null
                      ? 'No cap'
                      : `Pays up to ${formatMoney(state.priced.maxValuePerContract)}`}
                  </Text>
                  <Text variant="caption" tone="muted">
                    Market ~{formatPercent(impliedOdds(state.priced).value)}
                  </Text>
                </View>
              </>
            ) : null}
          </Pressable>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.bg },
  rowPressed: { backgroundColor: colors.surfaceRaised },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
});
