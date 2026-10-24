import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { OutcomeLadder } from '@/components/OutcomeLadder';
import { PayoffDiagram } from '@/components/PayoffDiagram';
import { RepeatBetCard } from '@/components/RepeatBetCard';
import { ShapeLadder } from '@/components/ShapeLadder';
import { WhatMovesIt } from '@/components/stock/WhatMovesIt';
import { ReasoningCard } from '@/components/thesis/ReasoningCard';
import { Button, Card, Chip, Screen, Stat, StatRow, Text } from '@/components/ui';
import { contractOptions, maxStakePerBet, stakeCeiling } from '@/domain/sizing';
import { impliedOdds, isAsymmetric, MIN_PAYOFF_MULTIPLE, type PricedStrategy } from '@/domain/strategy';
import type { Bet, PositionSource, Side } from '@/domain/types';
import { usePricedBet } from '@/hooks/usePricedBet';
import { useReasoning } from '@/hooks/useReasoning';
import { formatDate, formatMoney, formatPercent, formatPrice } from '@/lib/format';
import { positionLabel } from '@/lib/strategyText';
import { catalog } from '@/services/catalog';
import { marketData } from '@/services/pricing';
import { useAppState, usePlaceBet, type PlaceBetResult } from '@/state/store';
import { STRUCTURE_EXPLAINERS, STRUCTURE_LABELS } from '@/theme/categories';
import { colors, radius, spacing, type as typeScale } from '@/theme/tokens';

type Params = {
  id: string;
  eventId?: string;
  side?: Side;
  /** Opened from a thesis tree: which tree, and the step the bet hangs off. */
  thesisId?: string;
  stepId?: string;
};

function sourceFrom(params: Params): PositionSource {
  if (params.eventId && params.side) {
    return { type: 'event', eventId: params.eventId, side: params.side };
  }
  if (params.thesisId && params.stepId) return { type: 'thesis', thesisId: params.thesisId, stepId: params.stepId };
  return { type: 'direct' };
}

/** Bet detail: why it follows from your reasoning, the exact trade, its payoff, market odds, sizing and "your why". */
export default function BetScreen() {
  const params = useLocalSearchParams<Params>();
  const bet = catalog.getBet(params.id);
  const question = params.eventId ? catalog.getEvent(params.eventId) : undefined;
  const pricing = usePricedBet(bet, question);
  const reasoning = useReasoning(params.id, params.thesisId, params.stepId);
  const call = useAppState().calls.find((c) => c.questionId === params.eventId);
  // The user's own chance this bet pays: their chain through a thesis, or their call on the question.
  const yours =
    reasoning?.chain !== undefined
      ? { odds: reasoning.chain, label: 'your chain' }
      : call && params.side
        ? { odds: call.side === params.side ? call.probability : 1 - call.probability, label: 'your call' }
        : undefined;
  const [result, setResult] = useState<PlaceBetResult | null>(null);

  if (!bet) {
    return (
      <Screen edges={[]}>
        <Text>This bet is no longer available.</Text>
      </Screen>
    );
  }

  if (result?.ok) {
    const { position } = result;
    const max = position.maxValuePerContract;
    return (
      <Screen
        edges={['bottom']}
        footer={<Button label="See your bets" onPress={() => router.dismissTo('/portfolio')} />}>
        <View style={styles.success}>
          <Text variant="display">You’re in.</Text>
          <Text variant="heading">
            {position.contracts} × {positionLabel(position.underlying, position.kind, position.legs, position.expiration)}
          </Text>
          <Text tone="muted">
            You paid {formatMoney(position.costPerContract * position.contracts)}. That’s the most you can lose.
            {max === null
              ? ' There’s no cap on what it can be worth.'
              : ` At best it’s worth ${formatMoney(max * position.contracts)} at expiry.`}
          </Text>
          <Text tone="muted">Your why is saved with the bet, so you can check it against what actually happens.</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.header}>
        <Text variant="caption" tone="faint">
          {bet.strategy.underlyingName} ({bet.strategy.underlying}) · {STRUCTURE_LABELS[bet.strategy.kind]}
        </Text>
        <Text variant="title">{bet.title}</Text>
        <Text tone="muted">{bet.pitch}</Text>
      </View>

      {reasoning ? (
        <ReasoningCard
          reasoning={reasoning}
          marketOdds={pricing.status === 'ready' ? impliedOdds(pricing.priced).value : undefined}
        />
      ) : null}

      <ShapeLadder bet={bet} question={question} params={params} />
      <WhatMovesIt bet={bet} />

      {pricing.status === 'loading' ? (
        <Card style={styles.center}>
          <ActivityIndicator color={colors.textMuted} />
          <Text variant="caption" tone="faint">
            Getting the option chain from {marketData.label}…
          </Text>
        </Card>
      ) : null}

      {pricing.status === 'error' ? (
        <Card>
          <Text variant="heading">Couldn’t price this bet</Text>
          <Text tone="muted">{pricing.message}</Text>
          <Text variant="caption" tone="faint">
            Source: {marketData.label}
          </Text>
        </Card>
      ) : null}

      {pricing.status === 'ready' ? (
        <PricedBet
          bet={bet}
          priced={pricing.priced}
          params={params}
          reasoningText={reasoning?.text}
          killCriteria={reasoning?.killCriteria}
          yours={yours}
          onPlaced={setResult}
          lastResult={result}
        />
      ) : null}
    </Screen>
  );
}

function PricedBet({
  bet,
  priced,
  params,
  reasoningText,
  killCriteria,
  yours,
  onPlaced,
  lastResult,
}: {
  bet: Bet;
  priced: PricedStrategy;
  params: Params;
  /** The user's chain as a sentence, offered as a starting point for their why. */
  reasoningText?: string;
  /** Saved with the position so the user can check them later. */
  killCriteria?: string[];
  /** The user's own odds for this bet, for the repeat simulation. */
  yours?: { odds: number; label: string };
  onPlaced: (result: PlaceBetResult) => void;
  lastResult: PlaceBetResult | null;
}) {
  const { profile, positions } = useAppState();
  const placeBet = usePlaceBet();
  const now = new Date();
  const options = contractOptions(priced.costPerContract, profile, positions, now);
  const [contracts, setContracts] = useState(1);
  const [why, setWhy] = useState('');
  const [placing, setPlacing] = useState(false);
  const affordable = options.includes(contracts);

  const onPlace = async () => {
    setPlacing(true);
    const placed = await placeBet({
      betId: bet.id,
      priced,
      contracts,
      thesis: why,
      source: sourceFrom(params),
      killCriteria,
    });
    setPlacing(false);
    onPlaced(placed);
  };

  const total = priced.costPerContract * contracts;

  return (
    <>
      <Card>
        <Text variant="label" tone="muted">
          The trade
        </Text>
        <Text variant="heading">{positionLabel(priced.underlying, priced.kind, priced.legs, priced.expiration)}</Text>
        {priced.legs.map((leg) => (
          <View key={leg.symbol} style={styles.legRow}>
            <Text>
              {leg.action === 'buy' ? 'Buy' : 'Sell'} {formatPrice(leg.strike)} {leg.type}
            </Text>
            <Text tone="muted">{formatPrice(Math.round(leg.price * 100) / 100)}</Text>
          </View>
        ))}
        <Text variant="caption" tone="faint">
          {STRUCTURE_EXPLAINERS[priced.kind]} Expires {formatDate(priced.expiration)} ({priced.daysToExpiry} days).
        </Text>
        <Text variant="caption" tone="faint">
          Prices: {priced.source ?? marketData.label} · mid prices · as of {new Date(priced.asOf).toLocaleString()}
        </Text>
      </Card>

      <Card>
        <StatRow>
          <Stat label="Most you can lose" value={formatMoney(total)} tone="downside" />
          <Stat
            label="Most it can be worth"
            value={priced.maxValuePerContract === null ? 'No cap' : formatMoney(priced.maxValuePerContract * contracts)}
            tone="upside"
          />
          <Stat label="Market odds of profit" value={formatPercent(priced.probProfit)} />
        </StatRow>
        <PayoffDiagram priced={priced} contracts={contracts} />
      </Card>

      {!isAsymmetric(priced) ? (
        <Card style={styles.warning}>
          <Text variant="label">Not asymmetric enough today</Text>
          <Text tone="muted">
            At today’s prices this pays less than {MIN_PAYOFF_MULTIPLE}x what it costs. Moonshot normally wouldn’t
            show it.
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text variant="label" tone="muted">
          How many?
        </Text>
        {options.length > 0 ? (
          <View style={styles.chips}>
            {options.map((n) => (
              <Chip
                key={n}
                label={`${n} · ${formatMoney(priced.costPerContract * n)}`}
                selected={contracts === n}
                onPress={() => setContracts(n)}
              />
            ))}
          </View>
        ) : (
          <Text tone="muted">
            One contract costs {formatMoney(priced.costPerContract)}. Right now you can put up to{' '}
            {formatMoney(stakeCeiling(profile, positions, now))} into a single bet (
            {formatMoney(maxStakePerBet(profile))} per-bet limit). Options trade in whole contracts of 100 shares.
          </Text>
        )}
      </Card>

      <Card>
        <Text variant="label" tone="muted">
          Where {priced.underlying} could finish on {formatDate(priced.expiration)}
        </Text>
        <OutcomeLadder underlying={priced.underlying} outcomes={priced.outcomes} contracts={contracts} />
      </Card>

      <RepeatBetCard priced={priced} contracts={contracts} yours={yours} />

      <Card>
        <Text variant="label" tone="muted">
          What has to be true
        </Text>
        {bet.whatHasToBeTrue.map((item) => (
          <Text key={item}>• {item}</Text>
        ))}
        <Text variant="label" tone="muted" style={styles.spaced}>
          How you’ll know you’re wrong
        </Text>
        {bet.killCriteria.map((item) => (
          <Text key={item}>• {item}</Text>
        ))}
      </Card>

      <Card>
        <Text variant="label" tone="muted">
          Your why
        </Text>
        <Text variant="caption" tone="faint">
          Write down your thesis. Future you will want to know what you were thinking.
        </Text>
        <TextInput
          value={why}
          onChangeText={setWhy}
          placeholder="I think this pays off because…"
          placeholderTextColor={colors.textFaint}
          multiline
          style={styles.input}
        />
        {reasoningText && why !== reasoningText ? (
          <View style={styles.chips}>
            <Chip label="Use my reasoning" onPress={() => setWhy(reasoningText)} />
          </View>
        ) : null}
      </Card>

      <View style={styles.footer}>
        {lastResult && !lastResult.ok ? (
          <Text variant="caption" tone="downside">
            {lastResult.reason}
          </Text>
        ) : null}
        <Button
          label={
            affordable
              ? `Buy ${contracts} for ${formatMoney(total)} (paper)`
              : options.length === 0
                ? 'Over your per-bet limit'
                : 'Pick how many'
          }
          disabled={!affordable}
          loading={placing}
          onPress={onPlace}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  center: { alignItems: 'center' },
  legRow: { flexDirection: 'row', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spaced: { marginTop: spacing.sm },
  warning: { borderColor: colors.no },
  input: {
    ...typeScale.body,
    color: colors.text,
    minHeight: 88,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    textAlignVertical: 'top',
  },
  footer: { gap: spacing.sm },
  success: { gap: spacing.lg, paddingTop: spacing.xxl },
});
