import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Chip, Text } from '@/components/ui';
import { byExpiration, classifyExpression, type ExpressionStatus } from '@/domain/expression';
import { maxStakePerBet, stakeCeiling } from '@/domain/sizing';
import { impliedOdds, type PricedStrategy } from '@/domain/strategy';
import { SHAPE_LABELS, shapeOf } from '@/domain/structures';
import type { Bet, EventQuestion } from '@/domain/types';
import { usePricedBets } from '@/hooks/usePricedBet';
import { formatDate, formatMoney, formatMultiple, formatPercent } from '@/lib/format';
import { strikesLabel } from '@/lib/strategyText';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { colors, radius, spacing } from '@/theme/tokens';

export interface BetExpressionItem {
  bet: Bet;
  /** Why this bet pays if the view behind it is right. */
  why?: string;
}

export interface BetExpressionsProps {
  items: BetExpressionItem[];
  /** The question these bets are shown for: prices past its resolution and applies the horizon guard. */
  question?: EventQuestion;
  /** The user's own chance for the reasoning behind these bets, shown next to the market's number. */
  chain?: number;
  /** Shown when there are bets but none fits right now. */
  noFitText: string;
  /** Show every shape of each idea (default), or only the ideas as written. */
  shapes?: boolean;
  onOpen: (bet: Bet) => void;
}

const HIDDEN_REASONS: Record<Exclude<ExpressionStatus, 'ok'>, (n: number, cap: number) => string> = {
  'over-limit': (n, cap) => `${n} more ${n === 1 ? 'is' : 'are'} over your ${formatMoney(cap)} per-bet limit.`,
  'too-short': (n) => `${n} more ${n === 1 ? 'expires' : 'expire'} before this question resolves.`,
  'not-asymmetric': (n) => `${n} more ${n === 1 ? 'doesn’t' : 'don’t'} pay at least 3x at today’s prices.`,
};

/**
 * The bets that express a view, priced live, each idea in every shape it
 * comes in (capped, aggressive, uncapped). Same bets in the same order for
 * everyone with that view: soonest expiry first, then the idea, then its
 * shapes. Budget, asymmetry and the horizon guard filter but never rank,
 * and what's filtered out is counted.
 */
export function BetExpressions({ items, question, chain, noFitText, shapes = true, onOpen }: BetExpressionsProps) {
  const { profile, positions } = useAppState();
  const ceiling = stakeCeiling(profile, positions, new Date());

  const seen = new Set<string>();
  const expanded = items
    .flatMap((item) => (shapes ? catalog.ladderFor(item.bet) : [item.bet]).map((bet) => ({ bet, why: item.why })))
    .filter(({ bet }) => !seen.has(bet.id) && seen.add(bet.id));
  const states = usePricedBets(
    expanded.map((i) => i.bet.id),
    question?.id,
  );

  const loading = states.some((s) => s.status === 'loading');
  const priced = states.flatMap((state, i) =>
    state.status === 'ready'
      ? [
          {
            ...expanded[i],
            priced: state.priced,
            status: classifyExpression(state.priced, { resolvesOn: question?.resolution.resolvesOn, ceiling }),
          },
        ]
      : [],
  );
  const visible = priced.filter((p) => p.status === 'ok').sort(byExpiration);
  const failed = states.filter((s) => s.status === 'error').length;
  const hidden = (Object.keys(HIDDEN_REASONS) as (keyof typeof HIDDEN_REASONS)[])
    .map((status) => ({ status, count: priced.filter((p) => p.status === status).length }))
    .filter((h) => h.count > 0);

  if (items.length === 0) return null;

  return (
    <View style={styles.list}>
      {loading ? <ActivityIndicator color={colors.textFaint} style={styles.loading} /> : null}
      {visible.map((item) => (
        <ExpressionRow key={item.bet.id} {...item} chain={chain} onPress={() => onOpen(item.bet)} />
      ))}
      {!loading && visible.length === 0 ? <Text tone="muted">{noFitText}</Text> : null}
      {hidden.map(({ status, count }) => (
        <Text key={status} variant="caption" tone="faint">
          {HIDDEN_REASONS[status](count, maxStakePerBet(profile))}
        </Text>
      ))}
      {failed > 0 ? (
        <Text variant="caption" tone="faint">
          {failed} couldn’t be priced right now.
        </Text>
      ) : null}
    </View>
  );
}

/** "Capped · 3.6x", "Aggressive · 8x", "No cap". */
export function shapeTag(bet: Bet, priced: Pick<PricedStrategy, 'payoffMultiple'>): string {
  const label = SHAPE_LABELS[bet.shape?.id ?? shapeOf(bet.strategy)];
  return priced.payoffMultiple === null ? label : `${label} · ${formatMultiple(priced.payoffMultiple)}`;
}

function ExpressionRow({
  bet,
  why,
  priced,
  chain,
  onPress,
}: BetExpressionItem & { priced: PricedStrategy; chain?: number; onPress: () => void }) {
  const odds = impliedOdds(priced);
  const showWhy = why && !bet.shape; // the idea's why once, on its base shape
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowHeader}>
        <Text variant="label" style={styles.rowTitle}>
          {bet.title}
        </Text>
        <Chip label={shapeTag(bet, priced)} color={bet.shape ? colors.textMuted : colors.accent} />
      </View>
      <Text variant="caption" tone="faint">
        {priced.underlying} {strikesLabel(priced.kind, priced.legs)} · {formatDate(priced.expiration)}
      </Text>
      {showWhy ? <Text tone="muted">{why}</Text> : null}
      <View style={styles.stats}>
        <Text variant="caption" tone="downside">
          Costs {formatMoney(priced.costPerContract)}
        </Text>
        <Text variant="caption" tone="upside">
          {priced.maxValuePerContract === null ? 'No cap' : `Pays up to ${formatMoney(priced.maxValuePerContract)}`}
        </Text>
        {chain === undefined ? (
          <Text variant="caption" tone="muted">
            Market ~{formatPercent(odds.value)}
          </Text>
        ) : null}
      </View>
      {chain !== undefined ? (
        <View style={styles.stats}>
          <Text variant="label" style={styles.chain}>
            Your chain {formatPercent(chain)}
          </Text>
          <Text variant="label" tone="muted">
            Market ~{formatPercent(odds.value)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  loading: { alignSelf: 'flex-start' },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  rowPressed: { backgroundColor: colors.surfaceRaised },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  rowTitle: { flex: 1 },
  stats: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  chain: { color: colors.violet },
});
