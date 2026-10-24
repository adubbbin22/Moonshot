import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { Button, Card, Screen, Stat, StatRow, Text } from '@/components/ui';
import { isBullish } from '@/domain/options';
import { positionCost } from '@/domain/portfolio';
import { yearsToExpiry } from '@/domain/pricing';
import { simulate, type SimOptions, type SimPosition, type SimSummary } from '@/domain/simulate';
import { impliedOdds } from '@/domain/strategy';
import type { Position } from '@/domain/types';
import { usePricedBets } from '@/hooks/usePricedBet';
import { useYourOdds } from '@/hooks/useYourOdds';
import { formatMoney, formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { useAppState } from '@/state/store';
import { colors, radius, spacing } from '@/theme/tokens';

const TRIALS = 4000;

/**
 * Simulated returns on your open bets: thousands of runs to expiry, at the
 * market's odds or at yours. Most moonshots expire worthless; this shows
 * what the whole set looks like, not one bet at a time.
 */
export default function SimulateScreen() {
  const { positions } = useAppState();
  const open = positions.filter((p) => p.status === 'open');
  const yourOddsFor = useYourOdds();
  const [mode, setMode] = useState<SimOptions['odds']>('market');
  const states = usePricedBets(open.map((p) => p.betId));

  // Each position keeps its own legs and cost; today's chain supplies the price and volatility to simulate from.
  const now = new Date();
  const sims = open.flatMap((position, i): (SimPosition & { position: Position; marketOdds: number; yours?: { odds: number; label: string } })[] => {
    const state = states[i];
    if (state.status !== 'ready') return [];
    const yours = yourOddsFor(position);
    const debit = position.costPerContract / 100;
    return [
      {
        position,
        marketOdds: impliedOdds(state.priced).value,
        yours,
        legs: position.legs.map((leg) => ({ ...leg, price: leg.action === 'buy' ? debit : 0 })),
        contracts: position.contracts,
        spot: state.priced.spot,
        vol: state.priced.vol,
        t: Math.max(yearsToExpiry(position.expiration, now), 1 / 365),
        bullish: isBullish(position.kind),
        breakeven: position.breakeven,
        yourOdds: yours?.odds,
      },
    ];
  });
  const loading = states.some((s) => s.status === 'loading');
  // A few thousand draws is milliseconds; recomputing per render is simpler than caching.
  const summary = sims.length > 0 ? simulate(sims, { trials: TRIALS, seed: 1, odds: mode }) : undefined;
  const withViews = sims.filter((s) => s.yours).length;

  if (open.length === 0) {
    return (
      <Screen edges={['bottom']} title="Simulate returns">
        <Card>
          <Text variant="heading">No open bets</Text>
          <Text tone="muted">Place a bet or two, then come back to see how a set of them tends to play out.</Text>
          <Button label="Go to the feed" onPress={() => router.navigate('/')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['bottom']}
      title="Simulate returns"
      subtitle={`${TRIALS.toLocaleString()} runs of your ${open.length} open ${open.length === 1 ? 'bet' : 'bets'} to expiry.`}>
      <View style={styles.toggle} accessibilityRole="tablist">
        {(['market', 'yours'] as const).map((m) => {
          const selected = m === mode;
          return (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setMode(m)}
              style={[styles.toggleOption, selected && styles.toggleSelected]}>
              <Text variant="label" tone={selected ? 'onAccent' : 'muted'}>
                {m === 'market' ? 'At the market’s odds' : 'At your odds'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text variant="caption" tone="faint">
        {mode === 'market'
          ? 'Each stock’s price at expiry is drawn from the same distribution the options odds come from.'
          : `Same price distribution, but each bet lands past breakeven as often as you said it would. ${withViews} of ${sims.length} ${sims.length === 1 ? 'bet has' : 'bets have'} a view of yours; the rest use the market’s odds.`}
      </Text>

      {loading && !summary ? (
        <Card>
          <Text tone="muted">Pricing your bets…</Text>
        </Card>
      ) : null}

      {summary ? <Results summary={summary} /> : null}

      <Card>
        <Text variant="label" tone="muted">
          The bets in the run
        </Text>
        {sims.map(({ position, marketOdds, yours }) => (
          <View key={position.id} style={styles.betRow}>
            <View style={styles.betText}>
              <Text variant="label">{catalog.getBet(position.betId)?.title ?? position.underlying}</Text>
              <Text variant="caption" tone="faint">
                {position.contracts} × {position.underlying} · {formatMoney(positionCost(position))} at risk
              </Text>
            </View>
            <View style={styles.betOdds}>
              <Text variant="caption" tone="muted">
                Market ~{formatPercent(marketOdds)}
              </Text>
              <Text variant="caption" style={styles.yours}>
                {yours ? `${formatPercent(yours.odds)} ${yours.label}` : 'no view: market'}
              </Text>
            </View>
          </View>
        ))}
        <Text variant="caption" tone="faint">
          Bets are simulated as independent of each other, which flatters a set that all ride the same story.
        </Text>
      </Card>
    </Screen>
  );
}

function Results({ summary }: { summary: SimSummary }) {
  return (
    <>
      <Card>
        <StatRow>
          <Stat label="Lose it all" value={formatPercent(summary.pLoseAll)} tone="downside" />
          <Stat label="End in profit" value={formatPercent(summary.pProfit)} />
          <Stat label="At least double" value={formatPercent(summary.pDouble)} tone="upside" />
        </StatRow>
        <Histogram summary={summary} />
        <View style={styles.spread}>
          <Text variant="caption" tone="faint">
            Worst {formatMoney(summary.worst)}
          </Text>
          <Text variant="caption" tone="faint">
            Typical {formatMoney(summary.median)}
          </Text>
          <Text variant="caption" tone="faint">
            Best {formatMoney(summary.best)}
          </Text>
        </View>
      </Card>
      <Card>
        <StatRow>
          <Stat label="Average result" value={formatMoney(summary.mean)} tone={summary.mean >= 0 ? 'upside' : 'downside'} />
          <Stat label="1 in 10 worse than" value={formatMoney(summary.p10)} />
          <Stat label="1 in 10 better than" value={formatMoney(summary.p90)} />
        </StatRow>
        <Text variant="caption" tone="faint">
          You have {formatMoney(summary.totalCost)} at risk in total. That is the most you can lose.
        </Text>
      </Card>
    </>
  );
}

const WIDTH = 320;
const HEIGHT = 120;

/** Where the runs land: one bar per slice of the P&L range, with zero marked. */
function Histogram({ summary }: { summary: SimSummary }) {
  const max = Math.max(...summary.buckets.map((b) => b.count), 1);
  const span = summary.best - summary.worst || 1;
  const zeroX = ((0 - summary.worst) / span) * WIDTH;
  const barWidth = WIDTH / summary.buckets.length;
  return (
    <View accessibilityLabel="Distribution of simulated results">
      <Svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {summary.buckets.map((b, i) => {
          const h = (b.count / max) * (HEIGHT - 8);
          const mid = (b.from + b.to) / 2;
          return (
            <Rect
              key={i}
              x={i * barWidth + 1}
              y={HEIGHT - h}
              width={barWidth - 2}
              height={h}
              rx={2}
              fill={mid >= 0 ? colors.upside : colors.downside}
              opacity={0.85}
            />
          );
        })}
        {zeroX >= 0 && zeroX <= WIDTH ? (
          <Line x1={zeroX} y1={0} x2={zeroX} y2={HEIGHT} stroke={colors.textFaint} strokeWidth={1} strokeDasharray="4 4" />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  toggleOption: { flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  toggleSelected: { backgroundColor: colors.accent },
  spread: { flexDirection: 'row', justifyContent: 'space-between' },
  betRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  betText: { flex: 1, gap: 2 },
  betOdds: { alignItems: 'flex-end', gap: 2 },
  yours: { color: colors.violet },
});
