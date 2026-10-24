import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { repeatBet, type RepeatSummary } from '@/domain/simulate';
import type { PricedStrategy } from '@/domain/strategy';
import { formatMoney, formatMultiple, formatPercent } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

const N = 10;

export interface RepeatBetCardProps {
  priced: PricedStrategy;
  contracts: number;
  /** The user's own chance of the full payout, and where it came from. */
  yours?: { odds: number; label: string };
}

/**
 * The same bet ten times over. Moonshots are meant to be taken as a set:
 * most expire worthless and the set is judged by the run, not the one.
 */
export function RepeatBetCard({ priced, contracts, yours }: RepeatBetCardProps) {
  const top = priced.outcomes[priced.outcomes.length - 1];
  const multiple = priced.payoffMultiple ?? 3;
  const cost = priced.costPerContract * contracts;
  const market = repeatBet({ probability: top.probability, multiple, cost, n: N });
  const own = yours ? repeatBet({ probability: yours.odds, multiple, cost, n: N }) : undefined;

  return (
    <Card>
      <Text variant="label" tone="muted">
        If you made this bet {N} times
      </Text>
      <Text variant="caption" tone="faint">
        Each one pays {formatMultiple(multiple)} ({priced.payoffMultiple === null ? 'counting a triple as the win' : 'its max payout'}) or
        expires worthless. {formatMoney(cost)} a time, {formatMoney(cost * N)} in all.
      </Text>
      <Run title={`At the market’s odds (${formatPercent(top.probability)} a time)`} run={market} />
      {own && yours ? <Run title={`At ${yours.label} (${formatPercent(yours.odds)} a time)`} run={own} accent /> : null}
      <Text variant="caption" tone="faint">
        {yours?.label === 'your call' ? 'Your call is about the event; this assumes the stock follows it every time. ' : ''}
        Each bet counted as independent. Ten bets on the same story are not ten chances.
      </Text>
    </Card>
  );
}

function Run({ title, run, accent = false }: { title: string; run: RepeatSummary; accent?: boolean }) {
  return (
    <View style={styles.run}>
      <Text variant="label" style={accent ? styles.accent : undefined}>
        {title}
      </Text>
      <Text tone="muted">
        About {run.expectedHits.toFixed(1)} hits expected. {formatPercent(run.pNoHit)} chance of none at all,{' '}
        {formatPercent(run.pProfit)} chance the run ends in profit.
      </Text>
      <Text variant="label" tone={run.expectedPnl >= 0 ? 'upside' : 'downside'}>
        Average result {run.expectedPnl >= 0 ? '+' : ''}
        {formatMoney(run.expectedPnl)} on {formatMoney(run.n * (run.outcomes[0].pnl / -run.n))} risked
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  run: { gap: 2, paddingTop: spacing.xs },
  accent: { color: colors.violet },
});
