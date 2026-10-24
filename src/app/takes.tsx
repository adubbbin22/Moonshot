import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { byExpiration, classifyExpression, viewsWithBets, type ExpressionStatus, type ViewWithBets } from '@/domain/expression';
import { maxStakePerBet, stakeCeiling } from '@/domain/sizing';
import { impliedOdds, type PricedStrategy } from '@/domain/strategy';
import type { Bet } from '@/domain/types';
import { usePricedBets } from '@/hooks/usePricedBet';
import { useTakeProfile } from '@/hooks/useTakeProfile';
import { formatDate, formatMoney, formatPercent } from '@/lib/format';
import { strikesLabel } from '@/lib/strategyText';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { colors, radius, spacing } from '@/theme/tokens';

/**
 * Ways to express your takes: for each call, the bets that pay if you're
 * right. Views are ordered by your own conviction; bets within a view are in
 * a fixed order and the same for anyone with that view.
 */
export default function TakesScreen() {
  const profile = useTakeProfile();
  const { profile: user, positions } = useAppState();
  const groups = viewsWithBets(profile.views, catalog.getEvent, catalog.getBet);
  const ceiling = stakeCeiling(user, positions, new Date());

  return (
    <Screen
      edges={['bottom']}
      title="Ways to express your takes"
      subtitle="For each call: the bets that pay if you’re right. Anyone with the same take sees the same list.">
      {groups.length === 0 ? (
        <Card>
          <Text variant="heading">No calls yet</Text>
          <Text tone="muted">Make a few calls and your takes will show up here.</Text>
          <Button label="Make calls" onPress={() => router.push('/calls')} />
        </Card>
      ) : (
        groups.map((group) => (
          <ViewExpressions key={group.question.id} group={group} ceiling={ceiling} cap={maxStakePerBet(user)} />
        ))
      )}
      {groups.length > 0 ? (
        <Button label="Make more calls" variant="secondary" onPress={() => router.push('/calls')} />
      ) : null}
    </Screen>
  );
}

const HIDDEN_REASONS: Record<Exclude<ExpressionStatus, 'ok'>, (n: number, cap: number) => string> = {
  'over-limit': (n, cap) => `${n} more ${n === 1 ? 'is' : 'are'} over your ${formatMoney(cap)} per-bet limit.`,
  'too-short': (n) => `${n} more ${n === 1 ? 'expires' : 'expire'} before this question resolves.`,
  'not-asymmetric': (n) => `${n} more ${n === 1 ? 'doesn’t' : 'don’t'} pay at least 3x at today’s prices.`,
};

function ViewExpressions({ group, ceiling, cap }: { group: ViewWithBets; ceiling: number; cap: number }) {
  const { view, question, bets, rationale } = group;
  const states = usePricedBets(
    bets.map((b) => b.id),
    question.id,
  );
  const sideColor = view.side === 'yes' ? colors.yes : colors.no;

  const loading = states.some((s) => s.status === 'loading');
  const priced = states.flatMap((state, i) =>
    state.status === 'ready'
      ? [{ bet: bets[i], priced: state.priced, status: classifyExpression(state.priced, { resolvesOn: question.resolution.resolvesOn, ceiling }) }]
      : [],
  );
  const visible = priced.filter((p) => p.status === 'ok').sort(byExpiration);
  const failed = states.filter((s) => s.status === 'error').length;
  const hidden = (Object.keys(HIDDEN_REASONS) as (keyof typeof HIDDEN_REASONS)[])
    .map((status) => ({ status, count: priced.filter((p) => p.status === status).length }))
    .filter((h) => h.count > 0);

  return (
    <Card>
      <Text variant="caption" tone="faint">
        {question.question}
      </Text>
      <Text variant="heading" style={{ color: sideColor }}>
        {formatPercent(view.probability)} {view.side === 'yes' ? 'Yes' : 'No'} · {view.stance}
      </Text>

      {bets.length === 0 ? <Text tone="muted">{rationale}</Text> : null}
      {bets.length > 0 && loading ? <ActivityIndicator color={colors.textFaint} style={styles.loading} /> : null}

      {visible.map(({ bet, priced: p }) => (
        <ExpressionRow key={bet.id} bet={bet} priced={p} questionId={question.id} side={view.side} />
      ))}

      {!loading && bets.length > 0 && visible.length === 0 ? (
        <Text tone="muted">No bet fits right now. Your call still counts toward your record.</Text>
      ) : null}
      {hidden.map(({ status, count }) => (
        <Text key={status} variant="caption" tone="faint">
          {HIDDEN_REASONS[status](count, cap)}
        </Text>
      ))}
      {failed > 0 ? (
        <Text variant="caption" tone="faint">
          {failed} couldn’t be priced right now.
        </Text>
      ) : null}
    </Card>
  );
}

function ExpressionRow({
  bet,
  priced,
  questionId,
  side,
}: {
  bet: Bet;
  priced: PricedStrategy;
  questionId: string;
  side: 'yes' | 'no';
}) {
  const odds = impliedOdds(priced);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/bet/[id]', params: { id: bet.id, eventId: questionId, side } })}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowHeader}>
        <Text variant="label" style={styles.rowTitle}>
          {bet.title}
        </Text>
        <Text variant="caption" tone="faint">
          ›
        </Text>
      </View>
      <Text variant="caption" tone="faint">
        {priced.underlying} {strikesLabel(priced.kind, priced.legs)} · {formatDate(priced.expiration)}
      </Text>
      <View style={styles.stats}>
        <Text variant="caption" tone="downside">
          Costs {formatMoney(priced.costPerContract)}
        </Text>
        <Text variant="caption" tone="upside">
          {priced.maxValuePerContract === null ? 'No cap' : `Pays up to ${formatMoney(priced.maxValuePerContract)}`}
        </Text>
        <Text variant="caption" tone="muted">
          Market ~{formatPercent(odds.value)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { alignSelf: 'flex-start' },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  rowPressed: { backgroundColor: colors.surfaceRaised },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  rowTitle: { flex: 1 },
  stats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
});
