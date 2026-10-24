import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { instrumentLine } from '@/components/BetCard';
import { OutcomeChart } from '@/components/OutcomeChart';
import { Button, Card, Chip, Screen, Stat, StatRow, Text } from '@/components/ui';
import { bestMultiple, lossProbability } from '@/domain/payoff';
import { checkStake, stakeOptions } from '@/domain/sizing';
import type { PositionSource, Side } from '@/domain/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { catalog } from '@/services/catalog';
import { useAppState, usePlaceBet, type PlaceBetResult } from '@/state/store';
import { colors, radius, spacing, type as typeScale } from '@/theme/tokens';

type Params = {
  id: string;
  eventId?: string;
  side?: Side;
  themeId?: string;
  thesis?: string;
};

function sourceFrom(params: Params): PositionSource {
  if (params.eventId && params.side) {
    return { type: 'event', eventId: params.eventId, side: params.side };
  }
  if (params.themeId) return { type: 'thesis', themeId: params.themeId };
  return { type: 'direct' };
}

/** Bet detail: see the payoff shape, choose a small stake, write down why, place it. */
export default function BetScreen() {
  const params = useLocalSearchParams<Params>();
  const bet = catalog.getBet(params.id);
  const { profile, positions } = useAppState();
  const placeBet = usePlaceBet();

  const options = stakeOptions(profile, positions, new Date());
  const [stake, setStake] = useState(() => options.filter((o) => o <= 25).at(-1) ?? options[0] ?? 0);
  const [why, setWhy] = useState(params.thesis ?? '');
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<PlaceBetResult | null>(null);

  if (!bet) {
    return (
      <Screen edges={[]}>
        <Text>This bet is no longer available.</Text>
      </Screen>
    );
  }

  const alreadyIn = positions
    .filter((p) => p.betId === bet.id && p.status === 'open')
    .reduce((sum, p) => sum + p.stake, 0);

  if (result?.ok) {
    return (
      <Screen
        edges={['bottom']}
        footer={<Button label="See your bets" onPress={() => router.dismissTo('/portfolio')} />}>
        <View style={styles.success}>
          <Text variant="display">You’re in.</Text>
          <Text variant="heading">
            {formatMoney(result.position.stake)} on “{bet.title}”.
          </Text>
          <Text tone="muted">
            Worst case you lose {formatMoney(result.position.stake)}. If you’re right, it could be worth{' '}
            {formatMoney(result.position.stake * bestMultiple(bet.scenarios))} by {bet.horizon}.
          </Text>
          <Text tone="muted">
            Your why is saved with the bet, so you can check it against what actually happens.
          </Text>
        </View>
      </Screen>
    );
  }

  const check = checkStake(stake, profile, positions, new Date());
  const onPlace = async () => {
    setPlacing(true);
    const placed = await placeBet({ betId: bet.id, stake, thesis: why, source: sourceFrom(params) });
    setPlacing(false);
    setResult(placed);
  };

  return (
    <Screen
      edges={['bottom']}
      footer={
        <View style={styles.footer}>
          {result && !result.ok ? (
            <Text variant="caption" tone="downside">
              {result.reason}
            </Text>
          ) : null}
          {!check.ok && options.length > 0 ? (
            <Text variant="caption" tone="downside">
              {check.reason}
            </Text>
          ) : null}
          <Button
            label={options.length === 0 ? 'Monthly budget used up' : `Place ${formatMoney(stake)} paper bet`}
            disabled={!check.ok}
            loading={placing}
            onPress={onPlace}
          />
        </View>
      }>
      <View style={styles.header}>
        <Text variant="caption" tone="faint">
          {instrumentLine(bet)} · {bet.instrument.name}
        </Text>
        <Text variant="title">{bet.title}</Text>
        <Text tone="muted">{bet.pitch}</Text>
        {bet.instrument.strikeDescription ? (
          <Text variant="caption" tone="faint">
            Strike {bet.instrument.strikeDescription}, expires {bet.instrument.expiry}.
          </Text>
        ) : null}
        {alreadyIn > 0 ? <Chip label={`You have ${formatMoney(alreadyIn)} on this`} color={colors.violet} /> : null}
      </View>

      <Card>
        <Text variant="label" tone="muted">
          How much?
        </Text>
        {options.length > 0 ? (
          <View style={styles.chips}>
            {options.map((amount) => (
              <Chip
                key={amount}
                label={formatMoney(amount)}
                selected={stake === amount}
                onPress={() => setStake(amount)}
              />
            ))}
          </View>
        ) : (
          <Text tone="muted">
            You’ve used this month’s moonshot budget. That’s the system working.
          </Text>
        )}
        <StatRow>
          <Stat label="Most you can lose" value={formatMoney(stake)} tone="downside" />
          <Stat label="Best case" value={formatMoney(stake * bestMultiple(bet.scenarios))} tone="upside" />
          <Stat label="Chance of loss" value={formatPercent(lossProbability(bet.scenarios))} />
        </StatRow>
      </Card>

      <Card>
        <Text variant="label" tone="muted">
          What {formatMoney(stake)} could become by {bet.horizon}
        </Text>
        <OutcomeChart stake={stake} scenarios={bet.scenarios} />
      </Card>

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
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spaced: { marginTop: spacing.sm },
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
